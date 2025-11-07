import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyLike = Decimal | number | string;

export function toDecimal(value: MoneyLike): Decimal {
  if (Decimal.isDecimal(value)) {
    return value as Decimal;
  }
  return new Decimal(value);
}

export function formatMoney(value: MoneyLike): string {
  return toDecimal(value).toFixed(2);
}

export function sum(values: MoneyLike[]): Decimal {
  return values.reduce((acc, current) => acc.add(toDecimal(current)), new Decimal(0));
}

export function difference(a: MoneyLike, b: MoneyLike): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function isPositive(value: MoneyLike): boolean {
  return toDecimal(value).greaterThan(0);
}

export function isNegative(value: MoneyLike): boolean {
  return toDecimal(value).lessThan(0);
}

export function clampTwoDecimals(value: MoneyLike): Decimal {
  return toDecimal(value).toDecimalPlaces(2);
}
