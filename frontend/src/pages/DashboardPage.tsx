import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Card } from '../components/Card';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { api } from '../api/client';

interface DashboardResponse {
  totalClosing: string;
  accounts: number;
}

function useDashboardData() {
  const now = dayjs();
  return useQuery({
    queryKey: ['dashboard', now.year(), now.month() + 1],
    queryFn: async () => {
      const response = await api.get<DashboardResponse>('/dashboard/monthly', {
        params: { year: now.year(), month: now.month() + 1 },
      });
      return response.data;
    },
  });
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData();

  return (
    <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <Card title="Total Balance" description="Aggregated closing balances in USD">
        {isLoading ? (
          <LoadingOverlay message="Loading totals" />
        ) : (
          <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>${data?.totalClosing ?? '0.00'}</div>
        )}
      </Card>
      <Card title="Tracked Accounts" description="Active accounts in current month">
        {isLoading ? (
          <LoadingOverlay message="Loading accounts" />
        ) : (
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>{data?.accounts ?? 0}</div>
        )}
      </Card>
      <Card title="Performance" description="Coming soon">
        <p style={{ color: 'var(--color-text-muted)' }}>
          Placeholder charts. Integrate recharts to visualise monthly yields and cumulative growth.
        </p>
      </Card>
    </div>
  );
}
