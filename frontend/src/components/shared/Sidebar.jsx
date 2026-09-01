import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, Users, Calendar, FileText, Wrench, Receipt, DollarSign, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import useAuthStore from '../../context/authStore';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/cars', icon: Car, label: 'Parc automobile' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/reservations', icon: Calendar, label: 'Réservations' },
  { to: '/contracts', icon: FileText, label: 'Contrats' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/invoices', icon: Receipt, label: 'Facturation' },
  { to: '/payments', icon: DollarSign, label: 'Règlements' },
  { to: '/reports', icon: BarChart3, label: 'Rapports' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-60'} bg-[#080F1C] border-r border-navy-mid flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 ${collapsed ? 'px-4 py-6 justify-center' : 'px-5 py-6'} border-b border-navy-mid`}>
        <div className="w-9 h-9 bg-gradient-to-br from-brand to-purple-600 rounded-xl flex items-center justify-center shrink-0">
          <Car size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg leading-none">
            AutoLoc<span className="text-brand">Pro</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-btn ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-navy-mid space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`sidebar-btn ${collapsed ? 'justify-center px-0' : ''} text-slate`}
          title={collapsed ? 'Agrandir' : 'Réduire'}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Réduire</span></>}
        </button>

        {!collapsed && user && (
          <div className="bg-navy-mid rounded-xl px-3 py-2.5 my-1">
            <div className="text-sm font-semibold text-slate-100 truncate">{user.tenantName}</div>
            <div className="text-xs text-slate mt-0.5">Plan {user.plan?.toUpperCase()}</div>
          </div>
        )}

        <button
          onClick={logout}
          className={`sidebar-btn text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : ''}`}
          title="Déconnexion"
        >
          <LogOut size={16} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
