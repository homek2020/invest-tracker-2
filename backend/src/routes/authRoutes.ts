import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';

export async function registerAuthRoutes(fastify: FastifyInstance, authService: AuthService) {
  fastify.post('/auth/request-otp', async (request, reply) => {
    const bodySchema = z.object({ email: z.string().email() });
    const { email } = bodySchema.parse(request.body);
    const otp = authService.requestOtp(email);
    return reply.send({ success: true, code: otp.code, expiresAt: otp.expiresAt });
  });

  fastify.post('/auth/verify-otp', async (request, reply) => {
    const bodySchema = z.object({ email: z.string().email(), code: z.string() });
    const { email, code } = bodySchema.parse(request.body);
    const { accessToken, refreshToken, user } = authService.verifyOtp(email, code);
    reply.setCookie('refreshToken', refreshToken, { path: '/', httpOnly: true, secure: false });
    return reply.send({ accessToken, refreshToken, user });
  });

  fastify.post('/auth/refresh', async (request, reply) => {
    const bodySchema = z.object({ refreshToken: z.string() });
    const { refreshToken } = bodySchema.parse(request.body);
    const tokens = authService.refreshToken(refreshToken);
    reply.setCookie('refreshToken', tokens.refreshToken, { path: '/', httpOnly: true, secure: false });
    return reply.send(tokens);
  });
}
