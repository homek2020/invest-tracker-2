import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getCollection } from '../services/mongo';
import { WithId } from 'mongodb';

interface User {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const router = Router();

router.post('/login', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Email is required' });
  }

  const users = getCollection<User>('users');
  const now = new Date();
  let existing = await users.findOne({ email });

  if (!existing) {
    const insertResult = await users.insertOne({
      email,
      createdAt: now,
      updatedAt: now,
    });
    existing = { _id: insertResult.insertedId, email, createdAt: now, updatedAt: now } as WithId<User>;
  } else {
    await users.updateOne({ _id: existing._id }, { $set: { updatedAt: now } });
  }

  const token = jwt.sign(
    { sub: existing._id.toHexString(), email: existing.email },
    process.env.JWT_SECRET ?? 'dev-secret',
    { expiresIn: '12h' },
  );

  return res.json({
    token,
    user: {
      id: existing._id.toHexString(),
      email: existing.email,
    },
  });
});

export default router;
