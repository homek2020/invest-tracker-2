import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Card } from '../components/Card';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { listAccounts } from '../api/accounts';
import { closeBalance, listBalances, reopenBalance, updateBalances } from '../api/balances';
import type { Balance } from '../api/balances';

function useCurrentPeriod() {
  const now = dayjs();
  return { year: now.year(), month: now.month() + 1 };
}

export default function BalancesPage() {
  const { year, month } = useCurrentPeriod();
  const queryClient = useQueryClient();
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });
  const balancesQuery = useQuery({
    queryKey: ['balances', year, month],
    queryFn: () => listBalances(year, month),
  });
  const [formState, setFormState] = useState<Record<string, Partial<Balance>>>({});

  const updateMutation = useMutation({
    mutationFn: updateBalances,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['balances', year, month] }),
  });
  const closeMutation = useMutation({
    mutationFn: closeBalance,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['balances', year, month] }),
  });
  const reopenMutation = useMutation({
    mutationFn: reopenBalance,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['balances', year, month] }),
  });

  const mergedBalances = useMemo(() => {
    const balances = balancesQuery.data ?? [];
    const accounts = accountsQuery.data ?? [];
    return accounts.map((account) => {
      const existing = balances.find((balance) => balance.accountId === account.id);
      return (
        existing ?? {
          id: `${account.id}-${year}-${month}`,
          accountId: account.id,
          year,
          month,
          opening: '0',
          inflow: '0',
          outflow: '0',
          closing: '0',
          difference: '0',
          status: 'OPEN',
          usdEquivalent: '0',
          provider: account.provider,
          currency: account.baseCurrency,
        }
      );
    });
  }, [accountsQuery.data, balancesQuery.data, month, year]);

  const hasChanges = Object.values(formState).some((state) => state.inflow || state.outflow || state.closing);

  return (
    <Card
      title="Monthly Balances"
      description="Track inflows, outflows and closing balances"
      action={
        <button
          className="button-primary"
          disabled={!hasChanges}
          onClick={() =>
            updateMutation.mutate({
              year,
              month,
              items: Object.entries(formState).map(([accountId, values]) => ({
                accountId,
                inflow: values.inflow ?? '0',
                outflow: values.outflow ?? '0',
                closing: values.closing ?? '0',
              })),
            })
          }
        >
          Submit changes
        </button>
      }
    >
      {balancesQuery.isLoading ? (
        <LoadingOverlay message="Loading balances" />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Opening</th>
              <th>Inflow</th>
              <th>Outflow</th>
              <th>Closing</th>
              <th>Difference</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mergedBalances.map((balance) => {
              const temp = formState[balance.accountId] ?? {};
              const inflow = temp.inflow ?? balance.inflow;
              const outflow = temp.outflow ?? balance.outflow;
              const closing = temp.closing ?? balance.closing;
              const difference = Number.parseFloat(closing) - Number.parseFloat(balance.opening);
              const differenceClass = difference > 0 ? 'tag-success' : difference < 0 ? 'tag-danger' : '';
              const isClosed = balance.status === 'CLOSED';

              return (
                <tr key={balance.accountId} className="table-row">
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{balance.provider}</strong>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{balance.currency}</span>
                    </div>
                  </td>
                  <td>${balance.opening}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={inflow}
                      disabled={isClosed}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          [balance.accountId]: { ...prev[balance.accountId], inflow: event.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={outflow}
                      disabled={isClosed}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          [balance.accountId]: { ...prev[balance.accountId], outflow: event.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={closing}
                      disabled={isClosed}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          [balance.accountId]: { ...prev[balance.accountId], closing: event.target.value },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <span className={differenceClass}>${difference.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className="badge">{balance.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="button-primary"
                        style={{ padding: '0.35rem 0.75rem' }}
                        disabled={isClosed}
                        onClick={() => closeMutation.mutate(balance.id)}
                      >
                        Close
                      </button>
                      <button
                        className="button-primary"
                        style={{ padding: '0.35rem 0.75rem' }}
                        disabled={!isClosed}
                        onClick={() => reopenMutation.mutate(balance.id)}
                      >
                        Reopen
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
