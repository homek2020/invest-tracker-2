import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MongoStoreService } from '../services/mongoStore';

const monthQuerySchema = z.object({
  year: z.coerce.number(),
  month: z.coerce.number().min(1).max(12),
});

export async function registerBalanceRoutes(fastify: FastifyInstance, store: MongoStoreService) {
  fastify.get('/balances', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const query = monthQuerySchema.parse(request.query);
    return store.listBalances(userId, query.year, query.month);
  });

  fastify.get('/balances/series', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const querySchema = z.object({ from: z.string(), to: z.string() });
    const query = querySchema.parse(request.query);
    return store.listBalanceSeries(userId, query.from, query.to);
  });

  fastify.post('/balances/bulk', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const bodySchema = z.object({
      year: z.coerce.number(),
      month: z.coerce.number().min(1).max(12),
      items: z.array(
        z.object({
          accountId: z.string(),
          inflow: z.string(),
          outflow: z.string(),
          closing: z.string(),
        }),
      ),
    });
    const body = bodySchema.parse(request.body);
    return store.updateBulkBalances(userId, body.year, body.month, body.items);
  });

  fastify.post('/balances/:id/close', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const paramsSchema = z.object({ id: z.string() });
    const { id } = paramsSchema.parse(request.params);
    return store.closeBalance(userId, id);
  });

  fastify.post('/balances/:id/reopen', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const paramsSchema = z.object({ id: z.string() });
    const { id } = paramsSchema.parse(request.params);
    return store.reopenBalance(userId, id);
  });
}
