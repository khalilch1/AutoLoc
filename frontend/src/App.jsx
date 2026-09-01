import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import Sidebar from './components/shared/Sidebar';
import Dashboard from './pages/Dashboard';
import CarsPage from './pages/Cars';
import ClientsPage from './pages/Clients';
import ReservationsPage from './pages/Reservations';
import ContractsPage from './pages/Contracts';
import MaintenancePage from './pages/Maintenance';
import InvoicesPage from './pages/Invoices';
import PaymentsPage from './pages/Payments';
import ReportsPage from './pages/Reports';
import { LandingPage, LoginPage, RegisterPage } from './pages/AuthPages';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } }
});

function AppLayout() {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-navy">
        <Outlet />
      </main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#10B981', secondary: '#F8FAFC' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#F8FAFC' } },
        }}
      />
    </QueryClientProvider>
  );
}
