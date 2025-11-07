import { api } from './client';

export interface Account {
  id: string;
  name: string;
  provider: string;
  baseCurrency: string;
  active: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export async function listAccounts(): Promise<Account[]> {
  const response = await api.get<Account[]>('/accounts');
  return response.data;
}

export async function createAccount(payload: Partial<Account>): Promise<Account> {
  const response = await api.post<Account>('/accounts', payload);
  return response.data;
}

export async function updateAccount(id: string, payload: Partial<Account>): Promise<Account> {
  const response = await api.patch<Account>(`/accounts/${id}`, payload);
  return response.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}
