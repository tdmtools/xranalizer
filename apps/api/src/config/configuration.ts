export default () => ({
  api: {
    port: parseInt(process.env.API_PORT ?? '3001', 10),
    host: process.env.API_HOST ?? '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    maxBodySize: process.env.MAX_BODY_SIZE ?? '10mb',
  },
  mongo: {
    uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/',
    dbName: process.env.DATA_BASE_NAME ?? 'xranalizer',
  },
});
