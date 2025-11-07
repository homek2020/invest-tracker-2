import { NavLink, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ProvidersLegend } from './components/ProvidersLegend';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const BalancesPage = lazy(() => import('./pages/BalancesPage'));
const FxPage = lazy(() => import('./pages/FxPage'));

function AppShell() {
  return (
    <div className="main-shell">
      <aside className="sidebar">
        <h1>Invest Tracker</h1>
        <ProvidersLegend />
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/accounts">
          Accounts
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/balances">
          Balances
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/fx">
          FX Rates
        </NavLink>
      </aside>
      <main className="content">
        <Suspense fallback={<LoadingOverlay message="Loading view" />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/balances" element={<BalancesPage />} />
            <Route path="/fx" element={<FxPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  useAuth();
  return <AppShell />;
}
