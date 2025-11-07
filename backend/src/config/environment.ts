export interface Environment {
  jwtSecret: string;
  serverPort: number;
  serverHost: string;
  serverTimezone: string;
}

export function loadEnvironment(): Environment {
  const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret';
  const serverPort = Number.parseInt(process.env.PORT ?? '3000', 10);
  const serverHost = process.env.HOST ?? '0.0.0.0';
  const serverTimezone = process.env.SERVER_TZ ?? 'Europe/Moscow';

  return {
    jwtSecret,
    serverPort,
    serverHost,
    serverTimezone,
  };
}
