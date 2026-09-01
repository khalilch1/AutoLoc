import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Car, Eye, Edit, Trash2, Camera, X, Star, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { carsAPI } from '../utils/api';
import { Badge, Modal, Field, PageHeader, SearchBar, EmptyState, Spinner, formatCurrency } from '../components/shared';

const STATUS_OPTS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'available', label: 'Disponibles' },
  { value: 'rented', label: 'Loués' },
  { value: 'maintenance', label: 'En maintenance' },
];

const CATEGORY_OPTS = ['Citadine', 'Berline', 'SUV', 'SUV Premium', 'Utilitaire', 'Luxe', 'Cabriolet'];
const FUEL_OPTS = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
const TRANS_OPTS = ['Manuelle', 'Automatique'];

const emptyForm = {
  brand: '', model: '', year: new Date().getFullYear(), plate: '',
  category: 'Berline', color: '', fuel: 'Essence', seats: 5,
  transmission: 'Manuelle', daily_rate: '', deposit: 0, mileage: 0,
  next_maintenance_date: '', insurance_expiry: '', vignette_expiry: '',
  visite_expiry: '', notes: ''
};

// ── Photo gallery manager (for existing cars) ──────────────────────────────
function PhotoGallery({ car }) {
  const qc = useQueryClient();
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const { data: photos = [] } = useQuery({
    queryKey: ['car-photos', car.id],
    queryFn: () => carsAPI.getPhotos(car.id),
  });

  const handleFiles = async (files) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of arr) {
      try {
        await carsAPI.addPhoto(car.id, file);
        ok++;
      } catch (e) {
        toast.error(`${file.name} : ${e.message}`);
      }
    }
    qc.invalidateQueries(['car-photos', car.id]);
    qc.invalidateQueries(['cars']);
    setUploading(false);
    if (ok > 0) toast.success(`${ok} photo${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''} !`);
  };

  const deleteMut = useMutation({
    mutationFn: (photoId) => carsAPI.deletePhoto(car.id, photoId),
    onSuccess: () => { qc.invalidateQueries(['car-photos', car.id]); qc.invalidateQueries(['cars']); toast.success('Photo supprimée'); },
    onError: e => toast.error(e.message),
  });

  const primaryMut = useMutation({
    mutationFn: (photoId) => carsAPI.setPrimary(car.id, photoId),
    onSuccess: () => { qc.invalidateQueries(['car-photos', car.id]); qc.invalidateQueries(['cars']); toast.success('Photo principale mise à jour'); },
    onError: e => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="label mb-0">Photos ({photos.length})</label>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-primary text-xs py-1.5 px-3">
          {uploading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          ) : <><Upload size={12} /> Ajouter</>}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone when empty */}
      {photos.length === 0 ? (
        <div
          className="border-2 border-dashed border-navy-light rounded-xl h-36 flex flex-col items-center justify-center gap-2 text-slate cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
          <Camera size={24} />
          <span className="text-sm">Cliquer ou glisser des photos ici</span>
          <span className="text-xs text-slate-600">JPG, PNG, WebP — max 5 Mo par photo</span>
        </div>
      ) : (
        <div
          className="grid grid-cols-3 gap-2"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square bg-navy-mid">
              <img
                src={photo.url}
                alt=""
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setLightbox(photo.url)}
              />
              {photo.is_primary === 1 && (
                <div className="absolute top-1.5 left-1.5 bg-amber-500 rounded-full p-1" title="Photo principale">
                  <Star size={10} className="text-white fill-white" />
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {photo.is_primary !== 1 && (
                  <button
                    onClick={() => primaryMut.mutate(photo.id)}
                    className="w-7 h-7 bg-amber-500/80 hover:bg-amber-500 rounded-lg flex items-center justify-center"
                    title="Définir comme principale">
                    <Star size={13} className="text-white" />
                  </button>
                )}
                <button
                  onClick={() => { if (confirm('Supprimer cette photo ?')) deleteMut.mutate(photo.id); }}
                  className="w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center"
                  title="Supprimer">
                  <Trash2 size={13} className="text-white" />
                </button>
              </div>
            </div>
          ))}
          {/* Add more tile */}
          <div
            className="rounded-xl border-2 border-dashed border-navy-light aspect-square flex flex-col items-center justify-center gap-1 text-slate cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors"
            onClick={() => inputRef.current?.click()}>
            <Plus size={18} />
            <span className="text-xs">Ajouter</span>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white">
            <X size={20} />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── New car: local preview before upload ────────────────────────────────────
function NewCarPhotoPicker({ onChange }) {
  const inputRef = useRef();
  const [previews, setPreviews] = useState([]);

  const handleFiles = (files) => {
    const arr = Array.from(files);
    arr.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviews(p => [...p, { url, file }]);
    });
    onChange(prev => [...prev, ...arr]);
  };

  const remove = (idx) => {
    setPreviews(p => p.filter((_, i) => i !== idx));
    onChange(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">Photos</label>
        {previews.length > 0 && (
          <button onClick={() => inputRef.current?.click()} className="btn-secondary text-xs py-1 px-2">
            <Plus size={12} /> Ajouter
          </button>
        )}
      </div>

      {previews.length === 0 ? (
        <div
          className="border-2 border-dashed border-navy-light rounded-xl h-32 flex flex-col items-center justify-center gap-2 text-slate cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
          <Camera size={22} />
          <span className="text-sm">Cliquer ou glisser des photos</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
          {previews.map((p, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-navy-mid">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-amber-500 rounded-full p-0.5" title="Principale">
                  <Star size={9} className="text-white fill-white" />
                </div>
              )}
              <button
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
          <div
            className="rounded-xl border-2 border-dashed border-navy-light aspect-square flex items-center justify-center text-slate cursor-pointer hover:border-brand hover:bg-brand/5 transition-colors"
            onClick={() => inputRef.current?.click()}>
            <Plus size={18} />
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
        onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CarsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showEdit, setShowEdit] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars', statusFilter],
    queryFn: () => carsAPI.getAll(statusFilter ? { status: statusFilter } : {}),
  });

  const createMut = useMutation({
    mutationFn: carsAPI.create,
    onSuccess: async (car) => {
      for (const file of pendingPhotos) {
        try { await carsAPI.addPhoto(car.id, file); } catch {}
      }
      qc.invalidateQueries(['cars']);
      setShowAdd(false);
      setForm(emptyForm);
      setPendingPhotos([]);
      toast.success('Véhicule ajouté !');
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => carsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['cars']); setShowEdit(null); toast.success('Véhicule modifié !'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: carsAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['cars']); toast.success('Véhicule archivé'); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = cars.filter(c =>
    `${c.brand} ${c.model} ${c.plate} ${c.category}`.toLowerCase().includes(search.toLowerCase())
  );

  const f = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));

  const CarFormFields = () => (
    <div className="grid grid-cols-2 gap-x-4">
      <Field label="Marque" value={form.brand} onChange={f('brand')} placeholder="BMW" required />
      <Field label="Modèle" value={form.model} onChange={f('model')} placeholder="320i" required />
      <Field label="Année" value={form.year} onChange={f('year')} type="number" />
      <Field label="Immatriculation" value={form.plate} onChange={f('plate')} placeholder="12345-A-7" required />
      <Field label="Catégorie" value={form.category} onChange={f('category')} options={CATEGORY_OPTS} />
      <Field label="Couleur" value={form.color} onChange={f('color')} placeholder="Noir, Blanc..." />
      <Field label="Carburant" value={form.fuel} onChange={f('fuel')} options={FUEL_OPTS} />
      <Field label="Transmission" value={form.transmission} onChange={f('transmission')} options={TRANS_OPTS} />
      <Field label="Places" value={form.seats} onChange={f('seats')} type="number" />
      <Field label="Kilométrage" value={form.mileage} onChange={f('mileage')} type="number" />
      <Field label="Tarif / jour (MAD)" value={form.daily_rate} onChange={f('daily_rate')} type="number" required />
      <Field label="Caution (MAD)" value={form.deposit} onChange={f('deposit')} type="number" />
      <Field label="Prochain entretien" value={form.next_maintenance_date} onChange={f('next_maintenance_date')} type="date" />
      <Field label="Assurance expire le" value={form.insurance_expiry} onChange={f('insurance_expiry')} type="date" />
      <Field label="Vignette expire le" value={form.vignette_expiry} onChange={f('vignette_expiry')} type="date" />
      <Field label="Visite technique expire" value={form.visite_expiry} onChange={f('visite_expiry')} type="date" />
      <div className="col-span-2"><Field label="Notes" value={form.notes} onChange={f('notes')} type="textarea" /></div>
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-8">
      <PageHeader title="Parc automobile" subtitle={`${cars.length} véhicules enregistrés`}>
        <button className="btn-primary" onClick={() => { setForm(emptyForm); setPendingPhotos([]); setShowAdd(true); }}>
          <Plus size={16} /> Ajouter un véhicule
        </button>
      </PageHeader>

      <div className="flex gap-3 mb-6 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher marque, modèle, plaque..." />
        <div className="flex gap-2">
          {STATUS_OPTS.map(o => (
            <button key={o.value} onClick={() => setStatusFilter(o.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${statusFilter === o.value ? 'bg-brand border-brand text-white' : 'bg-navy-mid border-navy-light text-slate hover:border-slate'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon={Car} title="Aucun véhicule" description="Ajoutez votre premier véhicule pour démarrer"
          action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Ajouter</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(car => (
            <div key={car.id} className="card overflow-hidden hover:shadow-lg transition-all">
              {/* Primary photo */}
              <div className="relative h-44 bg-gradient-to-br from-navy to-navy-mid overflow-hidden">
                {car.image_url ? (
                  <img src={car.image_url} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <span className="text-5xl">🚗</span>
                  </div>
                )}
                <div className="absolute top-3 right-3"><Badge status={car.status} /></div>
                {/* Camera shortcut */}
                <button
                  onClick={() => { setForm({ ...emptyForm, ...car }); setShowEdit(car); }}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-lg flex items-center justify-center text-white transition-colors"
                  title="Gérer les photos">
                  <Camera size={15} />
                </button>
              </div>

              <div className="p-5">
                <div className="mb-3">
                  <div className="font-display font-bold text-lg leading-tight">{car.brand} {car.model}</div>
                  <div className="text-slate text-sm">{car.year} · {car.plate}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[['Catégorie', car.category], ['Carburant', car.fuel],
                    ['Kilométrage', `${(car.mileage||0).toLocaleString('fr')} km`],
                    ['Tarif/jour', formatCurrency(car.daily_rate)]].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-slate mb-0.5">{k}</div>
                      <div className="text-sm font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowDetail(car)} className="btn-secondary flex-1 justify-center text-xs py-2">
                    <Eye size={13} /> Détails
                  </button>
                  <button onClick={() => { setForm({...emptyForm, ...car}); setShowEdit(car); }} className="btn-secondary flex-1 justify-center text-xs py-2">
                    <Edit size={13} /> Modifier
                  </button>
                  <button onClick={() => { if(confirm('Archiver ce véhicule ?')) deleteMut.mutate(car.id); }} className="btn-danger justify-center text-xs py-2 px-3">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add tile */}
          <div onClick={() => { setForm(emptyForm); setPendingPhotos([]); setShowAdd(true); }}
            className="card border-dashed border-2 flex flex-col items-center justify-center p-10 cursor-pointer hover:border-brand hover:bg-brand/5 transition-all min-h-[240px]">
            <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mb-4">
              <Plus size={24} className="text-brand" />
            </div>
            <div className="font-display font-bold text-base mb-1">Ajouter un véhicule</div>
            <div className="text-sm text-slate">Enregistrer un nouveau véhicule</div>
          </div>
        </div>
      )}

      {/* ── Modal: Nouveau véhicule ── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setPendingPhotos([]); }} title="Nouveau véhicule" size="lg">
        <NewCarPhotoPicker onChange={setPendingPhotos} />
        <CarFormFields />
        <div className="flex gap-3 mt-2">
          <button className="btn-secondary flex-1" onClick={() => { setShowAdd(false); setPendingPhotos([]); }}>Annuler</button>
          <button className="btn-primary flex-[2]" onClick={() => createMut.mutate(form)} disabled={createMut.isPending}>
            {createMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* ── Modal: Modifier véhicule ── */}
      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title={showEdit ? `Modifier — ${showEdit.brand} ${showEdit.model}` : ''} size="lg">
        {showEdit && (
          <>
            <PhotoGallery car={showEdit} />
            <div className="mt-5">
              <CarFormFields />
            </div>
            <div className="flex gap-3 mt-2">
              <button className="btn-secondary flex-1" onClick={() => setShowEdit(null)}>Annuler</button>
              <button className="btn-primary flex-[2]" onClick={() => updateMut.mutate({ id: showEdit.id, data: form })} disabled={updateMut.isPending}>
                {updateMut.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Modal: Détail véhicule ── */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail ? `${showDetail.brand} ${showDetail.model}` : ''} size="lg">
        {showDetail && (
          <div>
            {/* Photo gallery in detail view */}
            <PhotoGallery car={showDetail} />
            <div className="grid grid-cols-3 gap-3 mt-5 mb-3">
              {[
                ['Immatriculation', showDetail.plate],
                ['Année', showDetail.year],
                ['Catégorie', showDetail.category],
                ['Couleur', showDetail.color || '—'],
                ['Carburant', showDetail.fuel],
                ['Transmission', showDetail.transmission],
                ['Places', showDetail.seats],
                ['Kilométrage', `${(showDetail.mileage||0).toLocaleString('fr')} km`],
                ['Tarif / jour', formatCurrency(showDetail.daily_rate)],
                ['Caution', formatCurrency(showDetail.deposit)],
                ['Prochain entretien', showDetail.next_maintenance_date || '—'],
                ['Assurance expire', showDetail.insurance_expiry || '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-navy rounded-xl p-3">
                  <div className="text-xs text-slate mb-1">{k}</div>
                  <div className="text-sm font-semibold">{v}</div>
                </div>
              ))}
            </div>
            {showDetail.notes && (
              <div className="bg-navy rounded-xl p-4">
                <div className="text-xs text-slate mb-1">Notes</div>
                <div className="text-sm">{showDetail.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
