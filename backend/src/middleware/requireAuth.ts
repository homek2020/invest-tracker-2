import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret');
    if (typeof payload === 'string' || !('sub' in payload)) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.userId = String(payload.sub);
    if ('email' in payload && typeof payload.email === 'string') {
      req.userEmail = payload.email;
    }

    next();
  } catch (error) {
    console.error('Auth error', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}
