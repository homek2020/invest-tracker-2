import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/requireAuth';
import { decimalToNumber, getCollection, toObjectId } from '../services/mongo';
import { Decimal128, ObjectId } from 'mongodb';

interface BalanceDocument {
  _id: ObjectId;
  userId: ObjectId;
  accountId: ObjectId;
  year: number;
  month: number;
  closing: Decimal128;
  difference: Decimal128;
}

const router = Router();

router.get('/summary', async (req: AuthenticatedRequest, res) => {
  const userId = toObjectId(req.userId!);
  const { year, month } = req.query as { year?: string; month?: string };
  const filter: Record<string, unknown> = { userId };
  if (year) {
    filter.year = Number(year);
  }
  if (month) {
    filter.month = Number(month);
  }

  const balances = await getCollection<BalanceDocument>('balances').find(filter).toArray();
  const totalClosing = balances.reduce((sum, doc) => sum + decimalToNumber(doc.closing), 0);
  const totalDifference = balances.reduce((sum, doc) => sum + decimalToNumber(doc.difference), 0);

  res.json({
    totals: {
      closing: totalClosing,
      difference: totalDifference,
    },
    entries: balances.map((doc) => ({
      accountId: doc.accountId.toHexString(),
      closing: decimalToNumber(doc.closing),
      difference: decimalToNumber(doc.difference),
      year: doc.year,
      month: doc.month,
    })),
  });
});

export default router;
