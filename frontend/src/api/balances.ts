import { api } from './client';

export interface Balance {
  id: string;
  accountId: string;
  year: number;
  month: number;
  opening: string;
  inflow: string;
  outflow: string;
  closing: string;
  difference: string;
  status: 'OPEN' | 'CLOSED';
  usdEquivalent: string;
  provider?: string;
  currency?: string;
}

export interface BulkUpdatePayload {
  year: number;
  month: number;
  items: Array<{
    accountId: string;
    inflow: string;
    outflow: string;
    closing: string;
  }>;
}

export async function listBalances(year: number, month: number): Promise<Balance[]> {
  const response = await api.get<Balance[]>('/balances', { params: { year, month } });
  return response.data;
}

export async function updateBalances(payload: BulkUpdatePayload): Promise<Balance[]> {
  const response = await api.post<Balance[]>('/balances/bulk', payload);
  return response.data;
}

export async function closeBalance(id: string): Promise<Balance> {
  const response = await api.post<Balance>(`/balances/${id}/close`);
  return response.data;
}

export async function reopenBalance(id: string): Promise<Balance> {
  const response = await api.post<Balance>(`/balances/${id}/reopen`);
  return response.data;
}
