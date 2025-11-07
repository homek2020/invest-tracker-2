import { Router } from 'express';
import { Decimal128, ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { decimalToNumber, getCollection, toDecimal } from '../services/mongo';

interface FxRateDocument {
  _id: ObjectId;
  date: string;
  base: string;
  rates: Record<string, Decimal128>;
  fetchedAt: Date;
}

const router = Router();

router.get('/rates', async (_req: AuthenticatedRequest, res) => {
  const { date } = _req.query as { date?: string };
  const query = date ? { date } : {};
  const rates = await getCollection<FxRateDocument>('fx_rates').find(query).sort({ date: -1 }).limit(1).toArray();
  if (rates.length === 0) {
    return res.status(404).json({ message: 'Rates not found' });
  }
  const rate = rates[0];
  const formatted = Object.fromEntries(
    Object.entries(rate.rates).map(([key, value]) => [key, decimalToNumber(value)]),
  );
  res.json({
    date: rate.date,
    base: rate.base,
    rates: formatted,
    fetchedAt: rate.fetchedAt,
  });
});

router.get('/history', async (req: AuthenticatedRequest, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const filter: Record<string, unknown> = {};
  if (from && to) {
    filter.date = { $gte: from, $lte: to };
  } else if (from) {
    filter.date = { $gte: from };
  } else if (to) {
    filter.date = { $lte: to };
  }

  const rates = await getCollection<FxRateDocument>('fx_rates')
    .find(filter)
    .sort({ date: 1 })
    .toArray();

  const items = rates.map((rate) => ({
    date: rate.date,
    base: rate.base,
    rates: Object.fromEntries(
      Object.entries(rate.rates).map(([key, value]) => [key, decimalToNumber(value)]),
    ),
    fetchedAt: rate.fetchedAt,
  }));

  res.json({ items });
});

router.post('/update', async (req: AuthenticatedRequest, res) => {
  const { date, base, rates } = req.body as {
    date?: string;
    base?: string;
    rates?: Record<string, number>;
  };

  if (!date || !rates) {
    return res.status(400).json({ message: 'date and rates are required' });
  }

  const preparedRates = Object.fromEntries(
    Object.entries(rates).map(([currency, value]) => [currency, toDecimal(value)]),
  );

  await getCollection<FxRateDocument>('fx_rates').updateOne(
    { date },
    {
      $set: {
        base: base ?? 'USD',
        rates: preparedRates,
        fetchedAt: new Date(),
      },
    },
    { upsert: true },
  );

  res.status(204).send();
});

router.get('/usd-view', async (req: AuthenticatedRequest, res) => {
  const { amount, from, date } = req.query as { amount?: string; from?: string; date?: string };
  if (!amount || !from) {
    return res.status(400).json({ message: 'amount and from are required' });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return res.status(400).json({ message: 'amount must be a number' });
  }

  const query = date ? { date } : {};
  const latest = await getCollection<FxRateDocument>('fx_rates')
    .find(query)
    .sort({ date: -1 })
    .limit(1)
    .toArray();

  if (latest.length === 0) {
    return res.status(404).json({ message: 'Rates not found' });
  }

  const rateDoc = latest[0];
  const rateValue = rateDoc.rates[from] ?? rateDoc.rates[from.toUpperCase()];
  if (!rateValue) {
    return res.status(400).json({ message: `Rate for ${from} not found` });
  }

  const usdAmount = numericAmount / decimalToNumber(rateValue);
  res.json({ amount: usdAmount });
});

export default router;
