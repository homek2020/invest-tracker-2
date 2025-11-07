import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MongoStoreService } from '../services/mongoStore';

export async function registerDashboardRoutes(fastify: FastifyInstance, store: MongoStoreService) {
  fastify.get('/dashboard/monthly', { preHandler: fastify.authenticate }, async (request) => {
    const userId = request.user.sub;
    const querySchema = z.object({ year: z.coerce.number(), month: z.coerce.number().min(1).max(12) });
    const query = querySchema.parse(request.query);
    return store.computeMonthlyDashboard(userId, query.year, query.month);
  });
}
