import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MongoStoreService } from '../services/mongoStore.js';

const accountSchema = z.object({
  name: z.string(),
  provider: z.enum(['FINAM', 'TRADEREPUBLIC', 'BYBIT', 'BCS', 'IBKR']),
  baseCurrency: z.enum(['USD', 'EUR', 'RUB', 'GBP']),
  active: z.boolean().optional(),
  note: z.string().optional(),
});

export async function registerAccountRoutes(fastify: FastifyInstance, store: MongoStoreService) {
  fastify.get('/accounts', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    return store.listAccounts(userId);
  });

  fastify.post('/accounts', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const body = accountSchema.parse(request.body);
    return store.createAccount(userId, body);
  });

  fastify.patch('/accounts/:id', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const paramsSchema = z.object({ id: z.string() });
    const { id } = paramsSchema.parse(request.params);
    const body = accountSchema.partial().parse(request.body);
    return store.updateAccount(userId, id, body);
  });

  fastify.delete('/accounts/:id', { preHandler: fastify.authenticate }, async (request, reply) => {
    const userId = request.user.sub;
    const paramsSchema = z.object({ id: z.string() });
    const { id } = paramsSchema.parse(request.params);
    await store.deleteAccount(userId, id);
    reply.code(204);
  });
}
