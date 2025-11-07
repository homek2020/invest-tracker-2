import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { getCollection, toObjectId } from '../services/mongo';

type ProviderCode = 'FINAM' | 'TRADEREPUBLIC' | 'BYBIT' | 'BCS' | 'IBKR';

type BaseCurrency = 'USD' | 'EUR' | 'RUB' | 'GBP';

const PROVIDERS: ProviderCode[] = ['FINAM', 'TRADEREPUBLIC', 'BYBIT', 'BCS', 'IBKR'];
const CURRENCIES: BaseCurrency[] = ['USD', 'EUR', 'RUB', 'GBP'];

interface AccountDocument {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  provider: ProviderCode;
  baseCurrency: BaseCurrency;
  active: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const router = Router();

function toProvider(value: unknown): ProviderCode {
  if (typeof value === 'string' && PROVIDERS.includes(value as ProviderCode)) {
    return value as ProviderCode;
  }
  return 'FINAM';
}

function toCurrency(value: unknown): BaseCurrency {
  if (typeof value === 'string' && CURRENCIES.includes(value as BaseCurrency)) {
    return value as BaseCurrency;
  }
  return 'USD';
}

router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = toObjectId(req.userId!);
  const accounts = await getCollection<AccountDocument>('accounts')
    .find({ userId })
    .sort({ createdAt: 1 })
    .toArray();

  const items = accounts.map((account) => ({
    id: account._id.toHexString(),
    name: account.name,
    provider: account.provider,
    baseCurrency: account.baseCurrency,
    active: account.active,
    note: account.note ?? null,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }));

  res.json({ items });
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const { name, provider, baseCurrency, note, active } = req.body as Partial<AccountDocument> & { name?: string };
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'Account name is required' });
  }

  const providerCode = toProvider(provider);
  const currency = toCurrency(baseCurrency);
  const now = new Date();

  const result = await getCollection<AccountDocument>('accounts').insertOne({
    userId: toObjectId(req.userId!),
    name,
    provider: providerCode,
    baseCurrency: currency,
    active: typeof active === 'boolean' ? active : true,
    note,
    createdAt: now,
    updatedAt: now,
  } as AccountDocument);

  res.status(201).json({ id: result.insertedId.toHexString() });
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const accountId = req.params.id;
  const update: Partial<AccountDocument> = {};
  const payload = req.body as Partial<AccountDocument>;

  if (typeof payload.name === 'string') {
    update.name = payload.name;
  }
  if (typeof payload.note === 'string' || payload.note === null) {
    update.note = payload.note ?? undefined;
  }
  if (payload.provider) {
    update.provider = toProvider(payload.provider);
  }
  if (payload.baseCurrency) {
    update.baseCurrency = toCurrency(payload.baseCurrency);
  }
  if (typeof payload.active === 'boolean') {
    update.active = payload.active;
  }

  update.updatedAt = new Date();

  const result = await getCollection<AccountDocument>('accounts').findOneAndUpdate(
    { _id: toObjectId(accountId), userId: toObjectId(req.userId!) },
    { $set: update },
    { returnDocument: 'after' },
  );

  if (!result.value) {
    return res.status(404).json({ message: 'Account not found' });
  }

  res.json({
    id: result.value._id.toHexString(),
    name: result.value.name,
    provider: result.value.provider,
    baseCurrency: result.value.baseCurrency,
    active: result.value.active,
    note: result.value.note ?? null,
    updatedAt: result.value.updatedAt,
  });
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const accountId = toObjectId(req.params.id);
  const userId = toObjectId(req.userId!);

  const balanceCount = await getCollection('balances').countDocuments({ accountId, userId });
  if (balanceCount > 0) {
    return res.status(400).json({ message: 'Cannot delete account with balances' });
  }

  const result = await getCollection<AccountDocument>('accounts').deleteOne({ _id: accountId, userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Account not found' });
  }

  res.status(204).send();
});

export default router;
