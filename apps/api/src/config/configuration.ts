export default () => ({
  api: {
    // Heroku sets PORT — keep it first so deploys "just work".
    port: parseInt(process.env.PORT ?? process.env.API_PORT ?? '3001', 10),
    host: process.env.API_HOST ?? '0.0.0.0',
    maxBodySize: process.env.MAX_BODY_SIZE ?? '10mb',
  },
  mongo: {
    // MONGODB_URI is a common name (e.g. Heroku Mongo add-on, tutorials); MONGO_URI matches this repo.
    uri: (() => {
      const a = process.env.MONGO_URI?.trim();
      const b = process.env.MONGODB_URI?.trim();
      if (a) return a;
      if (b) return b;
      return 'mongodb://localhost:27017/';
    })(),
    dbName: process.env.DATA_BASE_NAME?.trim() ?? 'xranalizer',
  },
});
