// Environment for the e2e suites. They need a real MongoDB; point
// E2E_MONGO_URL at one (e.g. `docker run -p 27017:27017 mongo:7`).
const mongoUrl = process.env.E2E_MONGO_URL || 'mongodb://localhost:27017';
const dbName = `inventors_e2e_${process.pid}`;

process.env.NODE_ENV = 'test';
process.env.APP_DATABASE_URL = `${mongoUrl}/${dbName}`;
process.env.LOG_DATABASE_URL = `${mongoUrl}/${dbName}_logs`;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-secret';
process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';
process.env.RATE_LIMIT_TTL = '60000';
process.env.RATE_LIMIT_REQUEST_SIZE = '10000';
