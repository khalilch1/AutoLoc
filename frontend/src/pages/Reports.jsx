import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Car, Users } from 'lucide-react';
import { dashboardAPI } from '../utils/api';
import { PageHeader, StatCard, Spinner, formatCurrency } from '../components/shared';

export default function ReportsPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardAPI.getStats });
  const { data: revenue } = useQuery({ queryKey: ['revenue'], queryFn: () => dashboardAPI.getRevenue() });

  if (isLoading) return <Spinner size={40} />;

  const revenueData = stats?.revenueByMonth?.map(r => ({ month: r.month?.slice(5), revenue: r.revenue, count: r.count })) || [];
  const topCarsData = stats?.topCars || [];

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Rapports & KPIs" subtitle="Analyses de performance de votre agence" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Véhicules actifs" value={stats?.totalCars || 0} icon={Car} color="#3B82F6" />
        <StatCard label="Total clients" value={stats?.totalClients || 0} icon={Users} color="#10B981" />
        <StatCard label="CA ce mois" value={formatCurrency(stats?.monthRevenue)} icon={TrendingUp} color="#F59E0B" />
        <StatCard label="Réservations actives" value={stats?.activeReservations || 0} icon={BarChart3} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-5">Revenus mensuels (MAD)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [formatCurrency(v), 'Revenus']} />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-5">Réservations par mois</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} name="Réservations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-5">Top véhicules les plus loués</h3>
          {topCarsData.length > 0 ? (
            <div className="space-y-3">
              {topCarsData.map((car, i) => (
                <div key={car.plate} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-lg bg-brand/20 text-brand text-xs font-bold flex items-center justify-center">{i+1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{car.brand} {car.model}</div>
                    <div className="text-xs text-slate">{car.plate}</div>
                  </div>
                  <div className="text-sm font-bold">{car.rentals} location{car.rentals > 1 ? 's' : ''}</div>
                  <div className="w-24 bg-navy-light rounded-full h-1.5">
                    <div className="bg-brand h-1.5 rounded-full" style={{ width: `${(car.rentals / (topCarsData[0]?.rentals || 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-slate text-sm">Aucune donnée disponible</div>}
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-5">KPIs clés</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Taux d\'occupation', `${stats?.totalCars ? Math.round((stats.totalCars - stats.availableCars) / stats.totalCars * 100) : 0}%`, '#3B82F6'],
              ['Impayés', formatCurrency(stats?.pendingAmount), '#EF4444'],
              ['Alertes maint.', stats?.upcomingMaint || 0, '#F59E0B'],
              ['Dispo flotte', `${stats?.availableCars || 0} véh.`, '#10B981'],
            ].map(([label, val, color]) => (
              <div key={label} className="bg-navy rounded-xl p-4 text-center">
                <div className="font-display text-2xl font-bold mb-1" style={{ color }}>{val}</div>
                <div className="text-xs text-slate">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
