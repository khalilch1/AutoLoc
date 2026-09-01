import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Plus, Check, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { maintenanceAPI, carsAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, EmptyState, Spinner, formatCurrency, formatDate } from '../components/shared';

const MAINTENANCE_TYPES = ['Vidange', 'Révision complète', 'Contrôle technique', 'Pneus', 'Freins', 'Climatisation', 'Carrosserie', 'Électricité', 'Batterie', 'Courroie', 'Autre'];

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ car_id: '', type: 'Vidange', description: '', garage: '', scheduled_date: '', cost: 0, notes: '' });

  const { data: maint = [], isLoading } = useQuery({ queryKey: ['maintenance'], queryFn: () => maintenanceAPI.getAll() });
  const { data: cars = [] } = useQuery({ queryKey: ['all-cars'], queryFn: () => carsAPI.getAll() });

  const createMut = useMutation({ mutationFn: maintenanceAPI.create, onSuccess: () => { qc.invalidateQueries(['maintenance']); setShowAdd(false); toast.success('Entretien planifié !'); }, onError: e => toast.error(e.message) });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => maintenanceAPI.update(id, data), onSuccess: () => { qc.invalidateQueries(['maintenance']); toast.success('Statut mis à jour'); }, onError: e => toast.error(e.message) });

  const f = k => v => setForm(p => ({ ...p, [k]: v }));
  const upcoming = maint.filter(m => m.status === 'scheduled' && new Date(m.scheduled_date) <= new Date(Date.now() + 7 * 86400000));

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Maintenance" subtitle="Suivi des entretiens de votre flotte">
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Planifier entretien</button>
      </PageHeader>

      {upcoming.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex gap-3 items-center">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div>
            <div className="font-semibold text-amber-400 text-sm">{upcoming.length} entretien(s) dans les 7 prochains jours</div>
            <div className="text-xs text-slate mt-0.5">{upcoming.map(m => `${m.brand} ${m.model} — ${m.type}`).join(' · ')}</div>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : maint.length === 0 ? (
        <EmptyState icon={Wrench} title="Aucun entretien" description="Planifiez le premier entretien de votre flotte"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Planifier</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {maint.map(m => (
            <div key={m.id} className="card p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-slate mb-1">{m.id?.slice(-8)}</div>
                  <div className="font-display font-bold text-base">{m.type}</div>
                </div>
                <Badge status={m.status} />
              </div>
              <div className="text-sm text-slate mb-4">{m.description || '—'}</div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[['Véhicule', `${m.brand} ${m.model}`], ['Date', formatDate(m.scheduled_date)], ['Garage', m.garage || '—'], ['Coût', formatCurrency(m.cost)]].map(([k, v]) => (
                  <div key={k} className="bg-navy rounded-lg p-2.5">
                    <div className="text-xs text-slate mb-0.5">{k}</div>
                    <div className="text-xs font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              {['scheduled', 'in_progress'].includes(m.status) && (
                <button onClick={() => updateMut.mutate({ id: m.id, data: { status: 'completed', completed_date: new Date().toISOString().split('T')[0] } })}
                  className="w-full btn-primary justify-center text-sm py-2">
                  <Check size={14} /> Marquer terminé
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Planifier un entretien">
        <Field label="Véhicule" value={form.car_id} onChange={f('car_id')} required
          options={cars.map(c => ({ value: c.id, label: `${c.brand} ${c.model} (${c.plate})` }))} />
        <Field label="Type d'entretien" value={form.type} onChange={f('type')} options={MAINTENANCE_TYPES} />
        <Field label="Description" value={form.description} onChange={f('description')} placeholder="Détails..." />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date prévue" value={form.scheduled_date} onChange={f('scheduled_date')} type="date" />
          <Field label="Coût estimé (MAD)" value={form.cost} onChange={f('cost')} type="number" />
        </div>
        <Field label="Garage / Prestataire" value={form.garage} onChange={f('garage')} placeholder="Nom du garage..." />
        <Field label="Notes" value={form.notes} onChange={f('notes')} type="textarea" />
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Planifier</button>
        </div>
      </Modal>
    </div>
  );
}
