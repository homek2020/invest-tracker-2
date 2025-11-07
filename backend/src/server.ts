import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifySensible from '@fastify/sensible';
import { loadEnvironment } from './config/environment.js';
import { createStore, StoreService } from './services/inMemoryStore.js';
import { AuthService } from './services/authService.js';
import { registerAuthRoutes } from './routes/authRoutes.js';
import { registerAccountRoutes } from './routes/accountRoutes.js';
import { registerBalanceRoutes } from './routes/balanceRoutes.js';
import { registerFxRoutes } from './routes/fxRoutes.js';
import { registerDashboardRoutes } from './routes/dashboardRoutes.js';
import authPlugin from './plugins/auth.js';

async function bootstrap() {
  const env = loadEnvironment();
  const store = new StoreService(createStore());
  const authService = new AuthService(env, store);

  const fastify = Fastify({ logger: true });
  await fastify.register(fastifyCors, { origin: true, credentials: true });
  await fastify.register(fastifyCookie);
  await fastify.register(fastifySensible);
  await fastify.register(authPlugin, { env });

  await registerAuthRoutes(fastify, authService);
  await registerAccountRoutes(fastify, store);
  await registerBalanceRoutes(fastify, store);
  await registerFxRoutes(fastify, store);
  await registerDashboardRoutes(fastify, store);

  const { serverHost, serverPort } = env;
  await fastify.listen({ host: serverHost, port: serverPort });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
