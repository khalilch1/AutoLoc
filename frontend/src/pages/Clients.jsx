import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Eye, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, SearchBar, EmptyState, Spinner, formatCurrency, formatDate } from '../components/shared';

const emptyClient = {
  first_name: '', last_name: '', email: '', phone: '', cin: '', passport: '',
  license_number: '', license_expiry: '', license_country: 'Maroc',
  birth_date: '', nationality: 'Marocaine', address: '', city: '', country: 'Maroc',
  client_type: 'individual', company_name: '', notes: ''
};

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(emptyClient);

  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: () => clientsAPI.getAll() });

  const createMut = useMutation({
    mutationFn: clientsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['clients']); setShowAdd(false); setForm(emptyClient); toast.success('Client ajouté !'); },
    onError: e => toast.error(e.message),
  });

  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const filtered = clients.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email || ''} ${c.cin || ''} ${c.phone || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Clients" subtitle={`${clients.length} clients dans votre base`}>
        <button className="btn-primary" onClick={() => { setForm(emptyClient); setShowAdd(true); }}>
          <Plus size={16} /> Nouveau client
        </button>
      </PageHeader>

      <div className="flex gap-3 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Nom, email, CIN, téléphone..." />
      </div>

      {isLoading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-navy/60">
              <tr>{['Client', 'Contact', 'CIN / Permis', 'Ville', 'Locations', 'Total dépensé', 'Statut', ''].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-navy/30 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                        style={{ background: `hsl(${c.first_name.charCodeAt(0) * 13 % 360}, 50%, 30%)` }}>
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{c.first_name} {c.last_name}
                          {c.status === 'vip' && <Star size={12} className="inline ml-1 text-amber-400 fill-amber-400" />}
                        </div>
                        <div className="text-xs text-slate">Depuis {formatDate(c.created_at)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="text-sm">{c.email || '—'}</div>
                    <div className="text-xs text-slate">{c.phone || '—'}</div>
                  </td>
                  <td className="table-td text-sm">
                    <div>{c.cin || c.passport || '—'}</div>
                    <div className="text-xs text-slate">{c.license_number || '—'}</div>
                  </td>
                  <td className="table-td text-slate text-sm">{c.city || '—'}</td>
                  <td className="table-td font-bold text-center">{c.total_rentals || 0}</td>
                  <td className="table-td font-semibold">{formatCurrency(c.total_spent)}</td>
                  <td className="table-td"><Badge status={c.status} /></td>
                  <td className="table-td">
                    <button onClick={() => setShowDetail(c)} className="btn-secondary text-xs py-1.5 px-3"><Eye size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={Users} title="Aucun client" description="Créez votre premier client" />}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouveau client" size="lg">
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Prénom" value={form.first_name} onChange={f('first_name')} required />
          <Field label="Nom" value={form.last_name} onChange={f('last_name')} required />
          <Field label="Email" value={form.email} onChange={f('email')} type="email" />
          <Field label="Téléphone" value={form.phone} onChange={f('phone')} placeholder="+212 6XX-XXXXXX" />
          <Field label="CIN" value={form.cin} onChange={f('cin')} />
          <Field label="Passeport" value={form.passport} onChange={f('passport')} />
          <Field label="N° Permis" value={form.license_number} onChange={f('license_number')} />
          <Field label="Expiration permis" value={form.license_expiry} onChange={f('license_expiry')} type="date" />
          <Field label="Date de naissance" value={form.birth_date} onChange={f('birth_date')} type="date" />
          <Field label="Nationalité" value={form.nationality} onChange={f('nationality')} />
          <Field label="Ville" value={form.city} onChange={f('city')} />
          <Field label="Type" value={form.client_type} onChange={f('client_type')}
            options={[{ value: 'individual', label: 'Particulier' }, { value: 'company', label: 'Entreprise' }]} />
          {form.client_type === 'company' && <Field label="Raison sociale" value={form.company_name} onChange={f('company_name')} className="col-span-2" />}
          <div className="col-span-2"><Field label="Adresse" value={form.address} onChange={f('address')} /></div>
          <div className="col-span-2"><Field label="Notes" value={form.notes} onChange={f('notes')} type="textarea" /></div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>Enregistrer</button>
        </div>
      </Modal>

      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail ? `${showDetail.first_name} ${showDetail.last_name}` : ''} size="lg">
        {showDetail && (
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Email', showDetail.email || '—'],
              ['Téléphone', showDetail.phone || '—'],
              ['Ville', showDetail.city || '—'],
              ['CIN', showDetail.cin || '—'],
              ['Permis', showDetail.license_number || '—'],
              ['Exp. permis', formatDate(showDetail.license_expiry)],
              ['Naissance', formatDate(showDetail.birth_date)],
              ['Nationalité', showDetail.nationality || '—'],
              ['Type', showDetail.client_type === 'company' ? 'Entreprise' : 'Particulier'],
              ['Total locations', showDetail.total_rentals || 0],
              ['Total dépensé', formatCurrency(showDetail.total_spent)],
              ['Client depuis', formatDate(showDetail.created_at)],
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
