import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import fastifySensible from '@fastify/sensible';
import { loadEnvironment } from './config/environment';
import { connectToDatabase, MongoStoreService } from './services/mongoStore';
import { AuthService } from './services/authService';
import { registerAuthRoutes } from './routes/authRoutes';
import { registerAccountRoutes } from './routes/accountRoutes';
import { registerBalanceRoutes } from './routes/balanceRoutes';
import { registerFxRoutes } from './routes/fxRoutes';
import { registerDashboardRoutes } from './routes/dashboardRoutes';
import authPlugin from './plugins/auth';

async function bootstrap() {
  const env = loadEnvironment();
  const { client, collections } = await connectToDatabase(env);
  const store = new MongoStoreService(collections);
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

  fastify.addHook('onClose', async () => {
    await client.close();
  });

  const { serverHost, serverPort } = env;
  await fastify.listen({ host: serverHost, port: serverPort });

  const closeGracefully = async () => {
    try {
      await fastify.close();
    } catch (error) {
      fastify.log.error(error);
    }
  };

  process.on('SIGINT', closeGracefully);
  process.on('SIGTERM', closeGracefully);
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
