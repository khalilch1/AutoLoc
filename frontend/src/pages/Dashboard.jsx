import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Users, Calendar, DollarSign, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI, demoAPI } from '../utils/api';
import { StatCard, Spinner, formatCurrency, formatDate } from '../components/shared';
import { Badge } from '../components/shared';
import useAuthStore from '../context/authStore';

const STATUS_COLORS = { available: '#10B981', rented: '#3B82F6', maintenance: '#F59E0B', retired: '#64748B' };

export default function Dashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardAPI.getStats, refetchInterval: 30000 });

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const result = await demoAPI.seed();
      toast.success(`Données de démo créées : ${result.cars} véhicules, ${result.clients} clients !`);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) return <Spinner size={40} />;

  const revenueData = stats?.revenueByMonth?.map(r => ({
    month: r.month?.slice(5) || r.month,
    revenue: r.revenue,
    count: r.count,
  })) || [];

  const fleetData = stats?.carsByStatus?.map(s => ({
    name: s.status === 'available' ? 'Disponible' : s.status === 'rented' ? 'Loué' : s.status === 'maintenance' ? 'Maintenance' : 'Autre',
    value: s.count,
    color: STATUS_COLORS[s.status] || '#64748B',
  })) || [];

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1">
          Bonjour, {user?.firstName} 👋
        </h1>
        <p className="text-slate text-sm">{user?.tenantName} — Plan {user?.plan?.toUpperCase()}</p>
      </div>

      {(stats?.totalCars || 0) === 0 && (
        <div className="mb-6 bg-brand/10 border border-brand/30 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <Sparkles size={20} className="text-brand shrink-0" />
          <div className="flex-1 min-w-[220px]">
            <div className="font-semibold text-sm">Compte tout neuf — envie de le remplir pour une démo ?</div>
            <div className="text-xs text-slate mt-0.5">Génère un parc de 12 véhicules réels, 10 clients et un historique de réservations en un clic.</div>
          </div>
          <button className="btn-primary text-xs py-2" onClick={handleSeedDemo} disabled={seeding}>
            {seeding ? 'Génération...' : 'Charger des données de démo'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Véhicules disponibles" value={`${stats?.availableCars || 0}/${stats?.totalCars || 0}`} icon={Car} color="#3B82F6" trend={8} />
        <StatCard label="Réservations actives" value={stats?.activeReservations || 0} icon={Calendar} color="#10B981" trend={12} />
        <StatCard label="CA ce mois" value={formatCurrency(stats?.monthRevenue)} icon={DollarSign} color="#F59E0B" trend={7} />
        <StatCard label="Impayés en cours" value={formatCurrency(stats?.pendingAmount)} icon={TrendingUp} color="#EF4444" sub={stats?.pendingAmount > 0 ? 'À relancer' : 'Tout à jour ✓'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg">Revenus mensuels</h3>
            <span className="text-xs text-slate bg-navy-light/50 px-3 py-1 rounded-lg">6 derniers mois</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }}
                formatter={v => [formatCurrency(v), 'Revenus']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Statut du parc</h3>
          {fleetData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={fleetData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {fleetData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {fleetData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="text-slate">{s.name}</span>
                    </div>
                    <span className="font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-slate text-sm text-center py-8">Aucune donnée</div>
          )}
        </div>
      </div>

      {stats?.upcomingMaint > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div>
            <div className="font-semibold text-amber-400 text-sm">{stats.upcomingMaint} entretien(s) dans les 7 prochains jours</div>
            <div className="text-xs text-slate mt-0.5">Vérifiez le module Maintenance pour planifier</div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-navy-light">
          <h3 className="font-display font-bold text-lg">Réservations récentes</h3>
        </div>
        <table className="w-full">
          <thead className="bg-navy/60">
            <tr>
              {['Réf.', 'Client', 'Véhicule', 'Période', 'Montant', 'Statut'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(stats?.recentReservations || []).map(r => {
              const days = Math.max(1, Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000));
              return (
                <tr key={r.id} className="hover:bg-navy/30 transition-colors">
                  <td className="table-td text-brand font-semibold text-xs">{r.id?.slice(-8)}</td>
                  <td className="table-td font-medium">{r.first_name} {r.last_name}</td>
                  <td className="table-td text-slate">{r.brand} {r.model}</td>
                  <td className="table-td text-slate text-xs">{formatDate(r.start_date)} → {formatDate(r.end_date)}</td>
                  <td className="table-td font-semibold">{formatCurrency(r.daily_rate * days)}</td>
                  <td className="table-td"><Badge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
