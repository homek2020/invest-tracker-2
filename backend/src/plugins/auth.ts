import fastifyPlugin from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Environment } from '../config/environment.js';

export interface AuthPluginOptions {
  env: Environment;
}

export default fastifyPlugin<AuthPluginOptions>(async (fastify: FastifyInstance, options) => {
  fastify.register(fastifyJwt, {
    secret: options.env.jwtSecret,
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      reply.send(error);
    }
  });
});
