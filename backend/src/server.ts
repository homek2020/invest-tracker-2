import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectMongo } from './services/mongo';
import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes';
import balanceRoutes from './routes/balanceRoutes';
import fxRoutes from './routes/fxRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { requireAuth } from './middleware/requireAuth';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/accounts', requireAuth, accountRoutes);
app.use('/api/v1/balances', requireAuth, balanceRoutes);
app.use('/api/v1/fx', requireAuth, fxRoutes);
app.use('/api/v1/dashboard', requireAuth, dashboardRoutes);

const port = Number(process.env.PORT ?? 4000);

async function start() {
  await connectMongo();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

void start();

export default app;
