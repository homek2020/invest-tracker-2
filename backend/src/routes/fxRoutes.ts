import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { StoreService } from '../services/inMemoryStore.js';

export async function registerFxRoutes(fastify: FastifyInstance, store: StoreService) {
  fastify.get('/fx/rates', { preHandler: fastify.authenticate }, async (request) => {
    const querySchema = z.object({ date: z.string().optional(), from: z.string().optional(), to: z.string().optional() });
    const query = querySchema.parse(request.query);
    if (query.date) {
      return store.getFxRate(query.date);
    }
    return store.listFxRates(query.from, query.to);
  });

  fastify.post('/fx/update', { preHandler: fastify.authenticate }, async (request) => {
    const bodySchema = z.object({
      date: z.string(),
      base: z.enum(['USD']),
      rates: z.record(z.string()),
    });
    const body = bodySchema.parse(request.body);
    const rate = store.upsertFxRate({
      id: `${body.base}-${body.date}`,
      date: body.date,
      base: body.base,
      rates: body.rates,
      source: 'CBR_T+1',
      fetchedAt: new Date().toISOString(),
    });
    return rate;
  });

  fastify.get('/fx/usd-view', { preHandler: fastify.authenticate }, async (request) => {
    const querySchema = z.object({ date: z.string(), amount: z.string(), from: z.string() });
    const query = querySchema.parse(request.query);
    const rate = store.getFxRate(query.date);
    if (!rate) {
      throw new Error('Rate not found');
    }
    const fx = rate.rates[query.from];
    const amount = Number.parseFloat(query.amount);
    if (!fx || Number.isNaN(amount)) {
      throw new Error('Invalid parameters');
    }
    return { usd: (amount / Number.parseFloat(fx)).toFixed(2) };
  });
}
