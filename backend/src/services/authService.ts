import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import type { Environment } from '../config/environment';
import type { User } from '../domain/users/user';
import { MongoStoreService } from './mongoStore';

interface OtpEntry {
  email: string;
  code: string;
  expiresAt: string;
}

export class AuthService {
  private readonly otps = new Map<string, OtpEntry>();

  constructor(
    private readonly env: Environment,
    private readonly store: MongoStoreService,
  ) {}

  requestOtp(email: string): OtpEntry {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = dayjs().add(10, 'minute').toISOString();
    const entry: OtpEntry = { email, code, expiresAt };
    this.otps.set(email, entry);
    return entry;
  }

  async verifyOtp(email: string, code: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const entry = this.otps.get(email);
    if (!entry || entry.code !== code || dayjs().isAfter(dayjs(entry.expiresAt))) {
      throw new Error('Invalid OTP');
    }
    this.otps.delete(email);
    const user = await this.store.seedUser(email);
    const payload = { sub: user.id, email: user.email };
    const accessToken = jwt.sign(payload, this.env.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, this.env.jwtSecret, { expiresIn: '30d' });
    return { accessToken, refreshToken, user };
  }

  refreshToken(token: string): { accessToken: string; refreshToken: string } {
    const decoded = jwt.verify(token, this.env.jwtSecret) as { sub: string; email: string; type?: string };
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }
    const payload = { sub: decoded.sub, email: decoded.email };
    const accessToken = jwt.sign(payload, this.env.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, this.env.jwtSecret, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }
}
