export interface Environment {
  jwtSecret: string;
  serverPort: number;
  serverHost: string;
  serverTimezone: string;
  mongoUri: string;
  mongoDbName: string;
}

export function loadEnvironment(): Environment {
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret';
  const serverPort = Number.parseInt(process.env.PORT ?? '3000', 10);
  const serverHost = process.env.HOST ?? '0.0.0.0';
  const serverTimezone = process.env.SERVER_TZ ?? 'Europe/Moscow';
  const mongoUri = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017';
  const mongoDbName = process.env.MONGO_DB_NAME ?? 'invest_tracker';

  return {
    jwtSecret,
    serverPort,
    serverHost,
    serverTimezone,
    mongoUri,
    mongoDbName,
  };
}
