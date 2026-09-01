import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI, invoicesAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, EmptyState, Spinner, formatCurrency, formatDate } from '../components/shared';

const PAYMENT_METHODS = ['Espèces', 'Virement', 'Carte bancaire', 'Chèque', 'Mobile payment'];

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ invoice_id: '', amount: 0, payment_method: 'Espèces', payment_date: new Date().toISOString().split('T')[0], reference: '', notes: '' });

  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: () => paymentsAPI.getAll() });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices-unpaid'], queryFn: () => invoicesAPI.getAll({ status: 'unpaid' }) });

  const createMut = useMutation({
    mutationFn: paymentsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['payments']); qc.invalidateQueries(['invoices']); setShowAdd(false); toast.success('Paiement enregistré !'); },
    onError: e => toast.error(e.message),
  });

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const totals = payments.reduce((acc, p) => ({ count: acc.count + 1, amount: acc.amount + (p.amount || 0) }), { count: 0, amount: 0 });

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Paiements" subtitle="Suivi des encaissements">
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Enregistrer paiement</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total encaissé', value: formatCurrency(totals.amount), color: 'text-emerald-400' },
          { label: 'Transactions', value: totals.count, color: 'text-brand' },
          { label: 'Factures en attente', value: invoices.length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <div className="text-xs text-slate mb-1">{label}</div>
            <div className={`font-display font-bold text-2xl ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {isLoading ? <Spinner /> : payments.length === 0 ? (
        <EmptyState icon={DollarSign} title="Aucun paiement" description="Enregistrez le premier paiement"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Enregistrer</button>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/60">
              <tr>{['Date', 'Facture', 'Client', 'Méthode', 'Référence', 'Montant', ''].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-navy/30 transition-colors">
                  <td className="table-td text-sm">{formatDate(p.payment_date)}</td>
                  <td className="table-td text-sm text-brand font-mono">{p.invoice_number}</td>
                  <td className="table-td text-sm">{p.first_name} {p.last_name}</td>
                  <td className="table-td text-sm">{p.payment_method}</td>
                  <td className="table-td text-sm text-slate">{p.reference || '—'}</td>
                  <td className="table-td font-display font-bold text-emerald-400">{formatCurrency(p.amount)}</td>
                  <td className="table-td"><Check size={14} className="text-emerald-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Enregistrer un paiement">
        <Field label="Facture" value={form.invoice_id} onChange={f('invoice_id')} required
          options={invoices.map(i => ({ value: i.id, label: `${i.invoice_number} — ${i.first_name} ${i.last_name} (${formatCurrency(i.total_amount)})` }))} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Montant (MAD)" value={form.amount} onChange={f('amount')} type="number" required />
          <Field label="Date de paiement" value={form.payment_date} onChange={f('payment_date')} type="date" required />
          <Field label="Méthode" value={form.payment_method} onChange={f('payment_method')} options={PAYMENT_METHODS} />
          <Field label="Référence" value={form.reference} onChange={f('reference')} placeholder="N° chèque, virement..." />
        </div>
        <Field label="Notes" value={form.notes} onChange={f('notes')} type="textarea" />
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  );
}
