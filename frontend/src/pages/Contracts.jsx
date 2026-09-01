import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, CheckSquare, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { contractsAPI, reservationsAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, EmptyState, Spinner, formatCurrency, formatDate, calcDays } from '../components/shared';

export default function ContractsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showClose, setShowClose] = useState(null);
  const [form, setForm] = useState({ reservation_id: '', start_mileage: 0, fuel_level_start: 'full', damages_start: '' });
  const [closeForm, setCloseForm] = useState({ end_mileage: 0, fuel_level_end: 'full', damages_end: '' });

  const { data: contracts = [], isLoading } = useQuery({ queryKey: ['contracts'], queryFn: contractsAPI.getAll });
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations-confirmed'], queryFn: () => reservationsAPI.getAll({ status: 'confirmed' }) });

  const createMut = useMutation({ mutationFn: contractsAPI.create, onSuccess: () => { qc.invalidateQueries(['contracts']); setShowCreate(false); toast.success('Contrat créé !'); }, onError: e => toast.error(e.message) });
  const closeMut = useMutation({ mutationFn: ({ id, data }) => contractsAPI.close(id, data), onSuccess: () => { qc.invalidateQueries(['contracts']); setShowClose(null); toast.success('Contrat clôturé !'); }, onError: e => toast.error(e.message) });
  const [downloadingId, setDownloadingId] = useState(null);
  const handleDownload = async (c) => {
    setDownloadingId(c.id);
    try {
      await contractsAPI.downloadPdf(c.id, c.contract_number);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const f = k => v => setForm(p => ({ ...p, [k]: v }));
  const cf = k => v => setCloseForm(p => ({ ...p, [k]: v }));
  const fuelOpts = ['full', 'three_quarter', 'half', 'quarter', 'empty'].map(v => ({
    value: v, label: { full: 'Plein', three_quarter: '3/4', half: '1/2', quarter: '1/4', empty: 'Vide' }[v]
  }));

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Contrats" subtitle="Gestion des contrats de location">
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Créer un contrat</button>
      </PageHeader>

      {isLoading ? <Spinner /> : contracts.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun contrat" description="Confirmez une réservation puis créez son contrat" />
      ) : (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className="card p-5 flex gap-5 items-center flex-wrap">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: c.status === 'closed' ? '#64748B20' : '#3B82F620' }}>
                <FileText size={20} style={{ color: c.status === 'closed' ? '#64748B' : '#3B82F6' }} />
              </div>
              <div className="flex-1 min-w-[180px]">
                <div className="font-bold">{c.contract_number}</div>
                <div className="text-sm text-slate">{c.first_name} {c.last_name} · {c.brand} {c.model} ({c.plate})</div>
              </div>
              <div className="text-sm text-slate">{formatDate(c.start_date)} → {formatDate(c.end_date)}</div>
              <div className="font-semibold">{formatCurrency(c.daily_rate * calcDays(c.start_date, c.end_date))}</div>
              <Badge status={c.status} />
              <button onClick={() => handleDownload(c)} disabled={downloadingId === c.id} className="btn-secondary text-xs py-2">
                <Download size={14} /> {downloadingId === c.id ? 'Génération...' : 'PDF'}
              </button>
              {c.status === 'signed' && (
                <button onClick={() => { setShowClose(c); setCloseForm({ end_mileage: c.start_mileage || 0, fuel_level_end: 'full', damages_end: '' }); }}
                  className="btn-primary text-xs py-2">
                  <CheckSquare size={14} /> Clôturer
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nouveau contrat">
        <Field label="Réservation confirmée" value={form.reservation_id} onChange={f('reservation_id')} required
          options={reservations.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name} — ${r.brand} ${r.model} (${formatDate(r.start_date)})` }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kilométrage départ" value={form.start_mileage} onChange={f('start_mileage')} type="number" />
          <Field label="Niveau carburant départ" value={form.fuel_level_start} onChange={f('fuel_level_start')} options={fuelOpts} />
        </div>
        <Field label="État / Dommages au départ" value={form.damages_start} onChange={f('damages_start')} type="textarea" placeholder="RAS / Rayure portière AV gauche..." />
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Créer et signer</button>
        </div>
      </Modal>

      <Modal open={!!showClose} onClose={() => setShowClose(null)} title="Clôturer le contrat">
        {showClose && (
          <>
            <div className="bg-navy rounded-xl p-4 mb-4 text-sm text-slate">Contrat : <span className="font-bold text-slate-100">{showClose.contract_number}</span></div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Kilométrage retour" value={closeForm.end_mileage} onChange={cf('end_mileage')} type="number" />
              <Field label="Niveau carburant retour" value={closeForm.fuel_level_end} onChange={cf('fuel_level_end')} options={fuelOpts} />
            </div>
            <Field label="État / Dommages au retour" value={closeForm.damages_end} onChange={cf('damages_end')} type="textarea" placeholder="RAS..." />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowClose(null)}>Annuler</button>
              <button className="btn-primary flex-[2]" onClick={() => closeMut.mutate({ id: showClose.id, data: closeForm })} disabled={closeMut.isPending}>Clôturer le contrat</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
