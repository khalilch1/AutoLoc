import { X } from 'lucide-react';

// ============================================================
// BADGE
// ============================================================
export const Badge = ({ status }) => {
  const configs = {
    available: { label: 'Disponible', cls: 'bg-emerald-500/15 text-emerald-400' },
    rented: { label: 'Loué', cls: 'bg-blue-500/15 text-blue-400' },
    maintenance: { label: 'Maintenance', cls: 'bg-amber-500/15 text-amber-400' },
    retired: { label: 'Archivé', cls: 'bg-slate-500/15 text-slate-400' },
    active: { label: 'Actif', cls: 'bg-emerald-500/15 text-emerald-400' },
    confirmed: { label: 'Confirmé', cls: 'bg-blue-500/15 text-blue-400' },
    completed: { label: 'Terminé', cls: 'bg-slate-500/15 text-slate-400' },
    pending: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-400' },
    cancelled: { label: 'Annulé', cls: 'bg-red-500/15 text-red-400' },
    paid: { label: 'Payé', cls: 'bg-emerald-500/15 text-emerald-400' },
    overdue: { label: 'En retard', cls: 'bg-red-500/15 text-red-400' },
    draft: { label: 'Brouillon', cls: 'bg-slate-500/15 text-slate-400' },
    vip: { label: 'VIP', cls: 'bg-purple-500/15 text-purple-400' },
    blacklisted: { label: 'Blacklist', cls: 'bg-red-500/15 text-red-400' },
    signed: { label: 'Signé', cls: 'bg-blue-500/15 text-blue-400' },
    closed: { label: 'Clôturé', cls: 'bg-slate-500/15 text-slate-400' },
    scheduled: { label: 'Planifié', cls: 'bg-blue-500/15 text-blue-400' },
    in_progress: { label: 'En cours', cls: 'bg-amber-500/15 text-amber-400' },
  };
  const cfg = configs[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
};

// ============================================================
// MODAL
// ============================================================
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box w-full ${sizes[size]}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-navy-light">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate hover:text-slate-200 p-1"><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================
export const StatCard = ({ label, value, sub, icon: Icon, color = '#3B82F6', trend }) => (
  <div className="stat-card">
    <div className="flex justify-between items-start mb-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
        <Icon size={20} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="font-display text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm text-slate">{label}</div>
    {sub && <div className="text-xs text-brand mt-1">{sub}</div>}
  </div>
);

// ============================================================
// FORM FIELD
// ============================================================
export const Field = ({ label, name, value, onChange, type = 'text', options, placeholder, required, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    <label className="label">{label}{required && ' *'}</label>
    {options ? (
      <select name={name} value={value} onChange={e => onChange(e.target.value, e)} className="input">
        <option value="">-- Sélectionner --</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    ) : type === 'textarea' ? (
      <textarea name={name} value={value} onChange={e => onChange(e.target.value, e)} placeholder={placeholder} rows={3} className="input resize-none" />
    ) : (
      <input name={name} type={type} value={value} onChange={e => onChange(e.target.value, e)} placeholder={placeholder} className="input" />
    )}
  </div>
);

// ============================================================
// SEARCH BAR
// ============================================================
export const SearchBar = ({ value, onChange, placeholder = 'Rechercher...' }) => (
  <div className="flex items-center gap-2 bg-navy-mid border border-navy-light rounded-xl px-4 py-2.5 flex-1 min-w-0">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate shrink-0">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-transparent border-none text-sm text-slate-100 outline-none flex-1 placeholder-slate-600" />
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-navy-light/50 rounded-2xl flex items-center justify-center mb-5">
      <Icon size={28} className="text-slate" />
    </div>
    <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
    <p className="text-slate text-sm mb-6 max-w-xs">{description}</p>
    {action}
  </div>
);

// ============================================================
// PAGE HEADER
// ============================================================
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-slate text-sm mt-0.5">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">{children}</div>
  </div>
);

// ============================================================
// LOADING SPINNER
// ============================================================
export const Spinner = ({ size = 24 }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full border-2 border-navy-light border-t-brand" style={{ width: size, height: size }} />
  </div>
);

// ============================================================
// FORMAT HELPERS
// ============================================================
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const calcDays = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
};
