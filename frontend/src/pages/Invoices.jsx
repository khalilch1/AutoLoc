import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Plus, Download, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoicesAPI, clientsAPI, reservationsAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, StatCard, EmptyState, Spinner, formatCurrency, formatDate } from '../components/shared';

export default function InvoicesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ client_id: '', reservation_id: '', description: '', quantity: 1, unit_price: '', tax_rate: 18, due_date: '' });

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: invoicesAPI.getAll });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAPI.getAll() });
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: () => reservationsAPI.getAll() });

  const createMut = useMutation({
    mutationFn: ({ client_id, reservation_id, description, quantity, unit_price, tax_rate, due_date }) =>
      invoicesAPI.create({ client_id, reservation_id, tax_rate, due_date, lines: [{ description, quantity: parseFloat(quantity), unit_price: parseFloat(unit_price) }] }),
    onSuccess: () => { qc.invalidateQueries(['invoices']); setShowAdd(false); toast.success('Facture créée !'); },
    onError: e => toast.error(e.message),
  });

  const markPaidMut = useMutation({
    mutationFn: (id) => invoicesAPI.update(id, { status: 'paid' }),
    onSuccess: () => { qc.invalidateQueries(['invoices']); toast.success('Facture marquée payée'); },
    onError: e => toast.error(e.message),
  });

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0);

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Facturation" subtitle="Gestion des factures">
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Nouvelle facture</button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-6">
        <StatCard label="Total encaissé" value={formatCurrency(totalPaid)} icon={CheckCircle} color="#10B981" />
        <StatCard label="En attente" value={formatCurrency(totalPending)} icon={Receipt} color="#F59E0B" sub={`${invoices.filter(i => i.status === 'pending').length} facture(s)`} />
        <StatCard label="Total factures" value={invoices.length} icon={Receipt} color="#3B82F6" />
      </div>

      {isLoading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/60">
              <tr>{['Facture', 'Client', 'Réservation', 'Date', 'Montant HT', 'TVA', 'Total TTC', 'Statut', ''].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-navy/30 transition-colors">
                  <td className="table-td text-brand font-bold text-xs">{inv.invoice_number}</td>
                  <td className="table-td font-semibold text-sm">{inv.first_name} {inv.last_name}</td>
                  <td className="table-td text-slate text-xs">{inv.reservation_id?.slice(-8) || '—'}</td>
                  <td className="table-td text-slate text-xs">{formatDate(inv.issue_date)}</td>
                  <td className="table-td text-sm">{formatCurrency(inv.subtotal)}</td>
                  <td className="table-td text-slate text-sm">{formatCurrency(inv.tax_amount)}</td>
                  <td className="table-td font-bold">{formatCurrency(inv.total)}</td>
                  <td className="table-td"><Badge status={inv.status} /></td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs py-1.5 px-3"><Download size={13} /></button>
                      {inv.status === 'pending' && (
                        <button onClick={() => markPaidMut.mutate(inv.id)} className="btn-primary text-xs py-1.5 px-3">Payé ✓</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && <EmptyState icon={Receipt} title="Aucune facture" description="Créez votre première facture" />}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouvelle facture">
        <Field label="Client" value={form.client_id} onChange={f('client_id')} required
          options={clients.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))} />
        <Field label="Réservation (optionnel)" value={form.reservation_id} onChange={f('reservation_id')}
          options={reservations.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name} — ${r.brand} ${r.model} (${formatDate(r.start_date)})` }))} />
        <Field label="Description" value={form.description} onChange={f('description')} placeholder="Location BMW 320i — 4 jours" required />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Quantité" value={form.quantity} onChange={f('quantity')} type="number" />
          <Field label="Prix unitaire (MAD)" value={form.unit_price} onChange={f('unit_price')} type="number" required />
          <Field label="TVA (%)" value={form.tax_rate} onChange={f('tax_rate')} type="number" />
        </div>
        <Field label="Date d'échéance" value={form.due_date} onChange={f('due_date')} type="date" />
        {form.quantity && form.unit_price && (
          <div className="bg-navy rounded-xl p-4 mb-4 text-sm">
            <div className="flex justify-between mb-2 text-slate"><span>{form.quantity} x {formatCurrency(form.unit_price)}</span><span className="text-slate-100 font-semibold">{formatCurrency(form.quantity * form.unit_price)}</span></div>
            <div className="flex justify-between mb-3 text-slate"><span>TVA {form.tax_rate}%</span><span>{formatCurrency(form.quantity * form.unit_price * (form.tax_rate / 100))}</span></div>
            <div className="flex justify-between font-display font-bold text-lg border-t border-navy-light pt-3"><span>Total TTC</span><span className="text-brand">{formatCurrency(form.quantity * form.unit_price * (1 + form.tax_rate / 100))}</span></div>
          </div>
        )}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Créer la facture</button>
        </div>
      </Modal>
    </div>
  );
}
