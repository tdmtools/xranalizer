# XRAnalizer

A webhook request analyzer — create webhooks per company and inspect every incoming HTTP request in real time, RequestBin/Postman-style.

## Stack

- **API:** NestJS 11, Mongoose, Socket.io
- **Web:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Socket.io client
- **DB:** MongoDB
- **Monorepo:** npm workspaces

## Layout

```
XRAnalizer/
├── apps/
│   ├── api/   # NestJS backend
│   └── web/   # Next.js frontend
└── package.json
```

## Setup

1. Copy `.env.example` to `apps/api/.env` and `apps/web/.env.local`, adjust as needed.
2. Make sure MongoDB is running and reachable via `MONGO_URI`.
3. Install dependencies from the repo root:

```bash
npm install
```

4. Run both apps in dev:

```bash
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## Webhook URL pattern

```
http://<api-host>:<api-port>/<company-slug>/<webhook-path>
```

Example:
```
http://localhost:3001/mean-consultor/webhook1
http://localhost:3001/warner/webhook1
```

Each webhook can be configured with:
- Allowed HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Custom response (status code, headers, body)

Every incoming request is captured fully (method, URL, headers, query, body, IP, user-agent, timing) and broadcast over Socket.io to the frontend.
