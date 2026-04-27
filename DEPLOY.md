# Deployment guide

This monorepo deploys the **API to Heroku** and the **Web to Vercel** from the same GitHub repo.

```
GitHub: tdmtools/xranalizer
 ├── Heroku app  ←  apps/api  (NestJS + Mongo + Socket.io)
 └── Vercel app  ←  apps/web  (Next.js)
```

The web talks to the API via `NEXT_PUBLIC_API_URL`. Socket.io connects to `NEXT_PUBLIC_SOCKET_URL` (usually the same URL).

---

## 1. MongoDB

Heroku dynos cannot reach `localhost:27017`. Use a hosted Mongo (MongoDB Atlas free tier is fine). You'll need a connection string like:

```
mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
```

Whitelist `0.0.0.0/0` in Atlas Network Access (Heroku dynos use dynamic IPs) or use Atlas's Heroku integration.

---

## 2. Deploy the API to Heroku

The whole repo is pushed to Heroku; only `apps/api` is built and run (`apps/web` is excluded via `.slugignore`).

### Files involved
- `Procfile` — `web: node apps/api/dist/main.js`
- `package.json` — `engines.node`, `heroku-postbuild`, `start`
- `.slugignore` — skips `apps/web`
- `apps/api/src/config/configuration.ts` — reads `PORT` (Heroku-injected) first

### Create the app

```bash
heroku login
heroku create xranalizer-api          # or your preferred name
heroku stack:set heroku-24 -a xranalizer-api
```

### Set config vars

```bash
heroku config:set -a xranalizer-api \
  MONGO_URI="mongodb+srv://USER:PASS@cluster.mongodb.net/?retryWrites=true&w=majority" \
  DATA_BASE_NAME="xranalizer" \
  CORS_ALLOW_ALL="false" \
  CORS_ORIGIN="https://xranalizer.vercel.app" \
  MAX_BODY_SIZE="10mb" \
  NPM_CONFIG_PRODUCTION="false"
```

> `NPM_CONFIG_PRODUCTION=false` keeps devDependencies during `npm install` so `nest build` is available. After `heroku-postbuild`, Heroku still prunes them.

> CORS: set `CORS_ALLOW_ALL=false` and a comma‑separated `CORS_ORIGIN` with your Vercel origin(s), or `CORS_ALLOW_ALL=true` to allow any (only if you accept the risk on a public API). Legacy: `CORS_ORIGIN=*` still maps to “allow all” when `CORS_ALLOW_ALL` is unset.

### Deploy

```bash
heroku git:remote -a xranalizer-api
git push heroku main
```

Watch logs:

```bash
heroku logs --tail -a xranalizer-api
```

You should see CORS mode and `[XRAnalizer API] listening on http://0.0.0.0:<port>`.

Test:

```bash
curl https://xranalizer-api.herokuapp.com/api/companies
```

> WebSockets work on Heroku without extra config. Idle connections may close after 55s — `socket.io-client` reconnects automatically.

---

## 3. Deploy the Web to Vercel

`vercel.json` at the repo root tells Vercel to install at root (so npm workspaces resolve) and build only the web workspace.

### Via the dashboard

1. Go to https://vercel.com/new
2. Import the GitHub repo `tdmtools/xranalizer`
3. **Leave Root Directory empty** (use repo root). Vercel reads `vercel.json` automatically.
4. Add env vars (Production + Preview):
   - `NEXT_PUBLIC_API_URL` = `https://xranalizer-api.herokuapp.com`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://xranalizer-api.herokuapp.com`
5. Deploy.

### Via CLI

```bash
npm i -g vercel
vercel login
vercel link            # link the directory to the Vercel project
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SOCKET_URL production
vercel --prod
```

After first deploy, copy the production URL (e.g. `https://xranalizer.vercel.app`) and, if the API is not in “allow all” mode, set the allowlist:

```bash
heroku config:set -a xranalizer-api CORS_ALLOW_ALL=false CORS_ORIGIN="https://xranalizer.vercel.app"
```

---

## 4. Verify end-to-end

1. Open the Vercel URL in your browser.
2. Create a company, then a webhook.
3. POST to the webhook URL — but note: the displayed URL shows `NEXT_PUBLIC_API_URL`, so it's your Heroku URL. Example:

```bash
curl -X POST https://xranalizer-api.herokuapp.com/mean-consultor/webhook1 \
  -H "Content-Type: application/json" \
  -d '{"hello":"world"}'
```

4. The request should appear instantly in the live viewer (Socket.io).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Heroku H10 "App crashed" at boot | Check `heroku logs --tail`. Most common: bad `MONGO_URI`, or whitelist missing in Atlas. |
| `nest: not found` on Heroku | `NPM_CONFIG_PRODUCTION=false` not set. |
| CORS error in browser | Use `CORS_ALLOW_ALL=false` and an exact (no trailing slash) `CORS_ORIGIN` allowlist, or `CORS_ALLOW_ALL=true` only if intended. |
| Socket disconnects every minute | Heroku H15 idle timeout. Already handled by reconnection — no fix needed. |
| Vercel build fails on shadcn imports | Make sure you used the root-level `vercel.json` and didn't set "Root Directory" to `apps/web`. |
| `MongoServerSelectionError` on Heroku | Add `0.0.0.0/0` to Atlas Network Access. |
