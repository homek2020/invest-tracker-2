import 'fastify';
import '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: import('@fastify/jwt').FastifyJWT['user'];
  }
}
