import { Router } from 'express';
import { Decimal128, ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { decimalToNumber, getCollection, toDecimal, toObjectId } from '../services/mongo';

interface BalanceDocument {
  _id: ObjectId;
  userId: ObjectId;
  accountId: ObjectId;
  year: number;
  month: number;
  status: 'OPEN' | 'CLOSED';
  opening: Decimal128;
  inflow: Decimal128;
  outflow: Decimal128;
  closing: Decimal128;
  difference: Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

const router = Router();

function formatBalance(doc: BalanceDocument) {
  return {
    id: doc._id.toHexString(),
    accountId: doc.accountId.toHexString(),
    year: doc.year,
    month: doc.month,
    status: doc.status,
    opening: decimalToNumber(doc.opening),
    inflow: decimalToNumber(doc.inflow),
    outflow: decimalToNumber(doc.outflow),
    closing: decimalToNumber(doc.closing),
    difference: decimalToNumber(doc.difference),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = toObjectId(req.userId!);
  const year = req.query.year ? Number(req.query.year) : undefined;
  const month = req.query.month ? Number(req.query.month) : undefined;
  const filter: Record<string, unknown> = { userId };
  if (Number.isInteger(year)) {
    filter.year = year;
  }
  if (Number.isInteger(month)) {
    filter.month = month;
  }

  const balances = await getCollection<BalanceDocument>('balances').find(filter).toArray();
  res.json({ items: balances.map((doc) => formatBalance(doc)) });
});

router.post('/bulk', async (req: AuthenticatedRequest, res) => {
  const { year, month, items } = req.body as {
    year: number;
    month: number;
    items: Array<{
      accountId: string;
      opening?: number;
      inflow?: number;
      outflow?: number;
      closing?: number;
    }>;
  };

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return res.status(400).json({ message: 'Year and month are required' });
  }

  const userId = toObjectId(req.userId!);
  const balancesCollection = getCollection<BalanceDocument>('balances');

  for (const item of items ?? []) {
    const accountId = toObjectId(item.accountId);
    const opening = toDecimal(item.opening ?? 0);
    const inflow = toDecimal(item.inflow ?? 0);
    const outflow = toDecimal(item.outflow ?? 0);
    const closing = toDecimal(item.closing ?? 0);

    const openingNumber = decimalToNumber(opening);
    const closingNumber = decimalToNumber(closing);
    const difference = toDecimal(closingNumber - openingNumber);
    const now = new Date();

    await balancesCollection.updateOne(
      { userId, accountId, year, month },
      {
        $set: {
          opening,
          inflow,
          outflow,
          closing,
          difference,
          status: 'OPEN',
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  const updated = await balancesCollection
    .find({ userId, year, month })
    .sort({ accountId: 1 })
    .toArray();

  res.json({ items: updated.map((doc) => formatBalance(doc)) });
});

router.post('/:id/close', async (req: AuthenticatedRequest, res) => {
  const balanceId = toObjectId(req.params.id);
  const userId = toObjectId(req.userId!);
  const balances = getCollection<BalanceDocument>('balances');
  const balance = await balances.findOne({ _id: balanceId, userId });

  if (!balance) {
    return res.status(404).json({ message: 'Balance not found' });
  }

  await balances.updateOne({ _id: balanceId }, { $set: { status: 'CLOSED', updatedAt: new Date() } });

  const nextMonth = balance.month === 12 ? 1 : balance.month + 1;
  const nextYear = balance.month === 12 ? balance.year + 1 : balance.year;

  const closingNumber = decimalToNumber(balance.closing);
  const opening = toDecimal(closingNumber);
  const now = new Date();

  await balances.updateOne(
    { userId, accountId: balance.accountId, year: nextYear, month: nextMonth },
    {
      $setOnInsert: {
        createdAt: now,
      },
      $set: {
        status: 'OPEN',
        opening,
        inflow: toDecimal(0),
        outflow: toDecimal(0),
        closing: opening,
        difference: toDecimal(0),
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  const fresh = await balances.findOne({ _id: balanceId });
  res.json({ item: formatBalance(fresh as BalanceDocument) });
});

router.post('/:id/reopen', async (req: AuthenticatedRequest, res) => {
  const balanceId = toObjectId(req.params.id);
  const userId = toObjectId(req.userId!);
  const balances = getCollection<BalanceDocument>('balances');
  const result = await balances.findOneAndUpdate(
    { _id: balanceId, userId },
    { $set: { status: 'OPEN', updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!result.value) {
    return res.status(404).json({ message: 'Balance not found' });
  }

  res.json({ item: formatBalance(result.value) });
});

router.get('/series', async (req: AuthenticatedRequest, res) => {
  const userId = toObjectId(req.userId!);
  const { from, to } = req.query as { from?: string; to?: string };

  const fromKey = from ? parseInt(from.replace('-', ''), 10) : undefined;
  const toKey = to ? parseInt(to.replace('-', ''), 10) : undefined;

  const balances = await getCollection<BalanceDocument>('balances')
    .find({ userId })
    .sort({ year: 1, month: 1 })
    .toArray();

  const filtered = balances.filter((doc) => {
    const key = doc.year * 100 + doc.month;
    if (fromKey && key < fromKey) {
      return false;
    }
    if (toKey && key > toKey) {
      return false;
    }
    return true;
  });

  res.json({ items: filtered.map((doc) => formatBalance(doc)) });
});

export default router;
