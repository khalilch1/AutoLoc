import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationsAPI, carsAPI, clientsAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, SearchBar, EmptyState, Spinner, formatCurrency, formatDate, calcDays } from '../components/shared';

export default function ReservationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ client_id: '', car_id: '', start_date: '', end_date: '', pickup_location: '', return_location: '', deposit_amount: 0, notes: '' });

  const { data: reservations = [], isLoading } = useQuery({ queryKey: ['reservations', statusFilter], queryFn: () => reservationsAPI.getAll(statusFilter ? { status: statusFilter } : {}) });
  const { data: cars = [] } = useQuery({ queryKey: ['cars-avail'], queryFn: () => carsAPI.getAll({ status: 'available' }) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAPI.getAll() });

  const createMut = useMutation({
    mutationFn: reservationsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['reservations']); setShowAdd(false); toast.success('Réservation créée !'); },
    onError: e => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => reservationsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['reservations']); toast.success('Statut mis à jour'); },
    onError: e => toast.error(e.message),
  });

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const selectedCar = cars.find(c => c.id === form.car_id);
  const days = calcDays(form.start_date, form.end_date);
  const subtotal = (selectedCar?.daily_rate || 0) * days;
  const total = subtotal * 1.18;

  const filtered = reservations.filter(r =>
    `${r.first_name} ${r.last_name} ${r.brand} ${r.model} ${r.plate}`.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_OPTS = [
    { value: '', label: 'Tous' }, { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmées' }, { value: 'active', label: 'Actives' },
    { value: 'completed', label: 'Terminées' }, { value: 'cancelled', label: 'Annulées' },
  ];

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Réservations" subtitle={`${reservations.length} réservations`}>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Nouvelle réservation
        </button>
      </PageHeader>

      <div className="flex gap-3 mb-6 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Client, véhicule, plaque..." />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.map(o => (
            <button key={o.value} onClick={() => setStatusFilter(o.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${statusFilter === o.value ? 'bg-brand border-brand text-white' : 'bg-navy-mid border-navy-light text-slate'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <EmptyState icon={Calendar} title="Aucune réservation" description="Créez votre première réservation"
              action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Créer</button>} />
          ) : filtered.map(r => {
            const d = calcDays(r.start_date, r.end_date);
            return (
              <div key={r.id} className="card p-5 flex gap-5 items-center flex-wrap hover:border-slate transition-colors">
                <div className="min-w-[70px]">
                  <div className="text-xs text-slate mb-1">Réf.</div>
                  <div className="text-brand font-bold text-xs">{r.id?.slice(-8)}</div>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <div className="font-semibold text-sm">{r.first_name} {r.last_name}</div>
                  <div className="text-xs text-slate">{r.client_phone}</div>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <div className="font-semibold text-sm">{r.brand} {r.model}</div>
                  <div className="text-xs text-slate">{r.plate}</div>
                </div>
                <div className="min-w-[140px]">
                  <div className="text-xs text-slate mb-0.5">{formatDate(r.start_date)} → {formatDate(r.end_date)}</div>
                  <div className="text-xs text-amber-400 font-semibold">{d} jour{d > 1 ? 's' : ''}</div>
                </div>
                <div className="text-right min-w-[90px]">
                  <div className="font-display font-bold text-lg">{formatCurrency(r.daily_rate * d)}</div>
                  <div className="text-xs text-slate">HT</div>
                </div>
                <Badge status={r.status} />
                <div className="flex gap-2">
                  <button onClick={() => setShowDetail(r)} className="btn-secondary text-xs py-1.5 px-3"><Eye size={13} /></button>
                  {r.status === 'pending' && (
                    <button onClick={() => updateMut.mutate({ id: r.id, data: { status: 'confirmed' } })} className="btn-primary text-xs py-1.5 px-3">Confirmer</button>
                  )}
                  {['pending', 'confirmed'].includes(r.status) && (
                    <button onClick={() => { if (confirm('Annuler ?')) updateMut.mutate({ id: r.id, data: { status: 'cancelled' } }); }} className="btn-danger text-xs py-1.5 px-3"><X size={13} /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouvelle réservation" size="lg">
        <Field label="Client" value={form.client_id} onChange={f('client_id')} required
          options={clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name} — ${c.cin || c.phone || ''}` }))} />
        <Field label="Véhicule disponible" value={form.car_id} onChange={f('car_id')} required
          options={cars.map(c => ({ value: c.id, label: `${c.brand} ${c.model} (${c.plate}) — ${c.daily_rate} MAD/j` }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date de départ" value={form.start_date} onChange={f('start_date')} type="date" required />
          <Field label="Date de retour" value={form.end_date} onChange={f('end_date')} type="date" required />
          <Field label="Lieu de prise en charge" value={form.pickup_location} onChange={f('pickup_location')} placeholder="Agence, Aéroport..." />
          <Field label="Lieu de retour" value={form.return_location} onChange={f('return_location')} placeholder="Agence, Aéroport..." />
          <Field label="Caution (MAD)" value={form.deposit_amount} onChange={f('deposit_amount')} type="number" />
        </div>
        <Field label="Notes" value={form.notes} onChange={f('notes')} type="textarea" />
        {form.start_date && form.end_date && selectedCar && (
          <div className="bg-navy rounded-xl p-4 mb-4 text-sm">
            <div className="flex justify-between mb-2 text-slate"><span>{days} jours x {formatCurrency(selectedCar.daily_rate)}</span><span className="font-semibold text-slate-100">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between mb-3 text-slate"><span>TVA 18%</span><span>{formatCurrency(subtotal * 0.18)}</span></div>
            <div className="flex justify-between font-display font-bold text-lg border-t border-navy-light pt-3"><span>Total TTC</span><span className="text-brand">{formatCurrency(total)}</span></div>
          </div>
        )}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Créer la réservation</button>
        </div>
      </Modal>

      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={`Réservation — ${showDetail?.first_name || ''} ${showDetail?.last_name || ''}`} size="lg">
        {showDetail && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Client', `${showDetail.first_name} ${showDetail.last_name}`],
              ['Véhicule', `${showDetail.brand} ${showDetail.model} (${showDetail.plate})`],
              ['Départ', formatDate(showDetail.start_date)],
              ['Retour', formatDate(showDetail.end_date)],
              ['Durée', `${calcDays(showDetail.start_date, showDetail.end_date)} jours`],
              ['Tarif/jour', formatCurrency(showDetail.daily_rate)],
              ['Total HT', formatCurrency(showDetail.daily_rate * calcDays(showDetail.start_date, showDetail.end_date))],
              ['Statut', <Badge key="s" status={showDetail.status} />],
              ['Lieu départ', showDetail.pickup_location || '—'],
              ['Lieu retour', showDetail.return_location || '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-navy rounded-xl p-3">
                <div className="text-xs text-slate mb-1">{k}</div>
                <div className="text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
