import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Check, Zap, Shield, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

// ============================================================
// LANDING
// ============================================================
export function LandingPage() {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();
  const PLANS = [
    { id: 'starter', name: 'Starter', price: 299, priceYear: 2699, color: '#3B82F6', popular: false, vehicles: 10, users: 2, features: ['10 véhicules', '2 utilisateurs', 'Réservations & Contrats', 'Facturation de base', 'Support email'] },
    { id: 'pro', name: 'Pro', price: 599, priceYear: 5399, color: '#F59E0B', popular: true, vehicles: 50, users: 10, features: ['50 véhicules', '10 utilisateurs', 'Tout Starter +', 'Maintenance & Alertes', 'Rapports avancés', 'Support prioritaire'] },
    { id: 'enterprise', name: 'Enterprise', price: 1299, priceYear: 11699, color: '#8B5CF6', popular: false, vehicles: 999, users: 999, features: ['Véhicules illimités', 'Utilisateurs illimités', 'Tout Pro +', 'Multi-agences', 'SLA 99.9%', 'Account manager dédié'] },
  ];

  return (
    <div className="min-h-screen bg-navy">
      {/* NAV */}
      <nav className="flex items-center justify-between px-16 py-5 border-b border-navy-mid sticky top-0 bg-navy z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-brand to-purple-600 rounded-xl flex items-center justify-center"><Car size={18} className="text-white" /></div>
          <span className="font-display font-bold text-xl">AutoLoc<span className="text-brand">Pro</span></span>
        </div>
        <div className="flex gap-8 text-slate text-sm">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary text-sm py-2">Connexion</Link>
          <Link to="/register" className="btn-primary text-sm py-2">Essai gratuit</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-navy-mid border border-navy-light rounded-full px-4 py-2 mb-8 text-xs text-slate">
          <Zap size={12} className="text-amber-400" /> La plateforme N°1 pour les agences au Maroc
        </div>
        <h1 className="font-display text-6xl font-bold leading-none mb-6 tracking-tight">
          Gérez votre agence de<br />
          location <span className="bg-gradient-to-r from-brand to-purple-500 bg-clip-text text-transparent">de A à Z</span>
        </h1>
        <p className="text-lg text-slate max-w-xl mx-auto mb-10 leading-relaxed">
          Voitures, clients, réservations, contrats, maintenance, facturation — tout centralisé dans une plateforme puissante.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-4">Démarrer gratuitement →</Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-4">Voir la démo</Link>
        </div>
      </div>

      {/* STATS */}
      <div className="bg-navy-mid border-y border-navy-light py-8 px-16 flex justify-around flex-wrap gap-8">
        {[['500+', 'Agences actives'], ['25 000+', 'Contrats générés'], ['99.9%', 'Disponibilité SLA'], ['4.9/5', 'Satisfaction']].map(([v, l]) => (
          <div key={l} className="text-center">
            <div className="font-display text-3xl font-bold text-brand">{v}</div>
            <div className="text-sm text-slate mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div id="features" className="px-16 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-slate text-lg">Une suite complète pensée pour les professionnels</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { color: '#3B82F6', emoji: '🚗', title: 'Parc automobile', desc: 'Gestion complète de votre flotte avec disponibilités en temps réel.' },
            { color: '#10B981', emoji: '👥', title: 'Clients', desc: 'Base clients avec CIN, permis, historique et fidélité.' },
            { color: '#F59E0B', emoji: '📅', title: 'Réservations', desc: 'Calendrier interactif et confirmation automatique.' },
            { color: '#8B5CF6', emoji: '📄', title: 'Contrats', desc: 'Génération et archivage automatique des contrats.' },
            { color: '#EF4444', emoji: '🔧', title: 'Maintenance', desc: 'Alertes et planification des entretiens.' },
            { color: '#F59E0B', emoji: '🧾', title: 'Facturation', desc: 'Factures, règlements et suivi des impayés.' },
            { color: '#10B981', emoji: '💰', title: 'Règlements', desc: 'Tous les modes de paiement, historique complet.' },
            { color: '#3B82F6', emoji: '📊', title: 'Rapports', desc: 'KPIs et analyses de performance avancées.' },
          ].map(f => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl mb-4">{f.emoji}</div>
              <h3 className="font-display font-bold text-base mb-2">{f.title}</h3>
              <p className="text-slate text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" className="bg-[#080F1C] px-16 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold mb-4">Choisissez votre formule</h2>
          <p className="text-slate mb-8">Sans engagement, résiliable à tout moment</p>
          <div className="inline-flex bg-navy-mid border border-navy-light rounded-xl p-1">
            <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${!annual ? 'bg-brand text-white' : 'text-slate'}`}>Mensuel</button>
            <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${annual ? 'bg-brand text-white' : 'text-slate'}`}>
              Annuel <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">-25%</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map(plan => (
            <div key={plan.id} className={`card p-8 relative transition-transform ${plan.popular ? 'scale-105 border-amber-500/50' : 'hover:scale-102'}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full">Populaire</div>}
              <div className="mb-6">
                <div className="text-sm font-bold mb-2" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold">{annual ? Math.round(plan.priceYear / 12) : plan.price}</span>
                  <span className="text-slate text-sm">MAD/mois</span>
                </div>
                {annual && <div className="text-xs text-slate mt-1">Facturé {plan.priceYear.toLocaleString('fr')} MAD/an</div>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2.5 text-sm text-slate">
                    <Check size={15} style={{ color: plan.color }} className="shrink-0" />{feat}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary w-full justify-center" style={{ background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}99)` : undefined }}>
                {plan.popular ? 'Commencer maintenant' : 'Choisir ce plan'}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-16 py-10 border-t border-navy-mid flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-brand to-purple-600 rounded-lg flex items-center justify-center"><Car size={14} className="text-white" /></div>
          <span className="font-display font-bold">AutoLocPro</span>
        </div>
        <div className="text-slate text-sm">© {new Date().getFullYear()} AutoLocPro. Tous droits réservés.</div>
      </footer>
    </div>
  );
}

// ============================================================
// LOGIN
// ============================================================
export function LoginPage() {
  const [email, setEmail] = useState('demo@autoloc.ma');
  const [password, setPassword] = useState('Demo1234!');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
      toast.success('Connexion réussie !');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-slate text-sm mb-8 flex items-center gap-2 hover:text-white">← Retour</Link>
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-brand to-purple-600 rounded-xl flex items-center justify-center"><Car size={20} className="text-white" /></div>
            <span className="font-display font-bold text-2xl">AutoLoc<span className="text-brand">Pro</span></span>
          </div>
          <h2 className="font-display text-3xl font-bold mb-2">Bon retour 👋</h2>
          <p className="text-slate mb-8">Connectez-vous à votre espace</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 text-base mt-2">
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <div className="mt-5 p-4 bg-navy-mid rounded-xl text-sm text-slate">
            <span className="font-semibold text-slate-300">Démo : </span>demo@autoloc.ma / Demo1234!
          </div>
          <p className="mt-6 text-sm text-slate text-center">Pas encore de compte ? <Link to="/register" className="text-brand hover:underline">S'inscrire</Link></p>
        </div>
      </div>
      <div className="flex-1 bg-gradient-to-br from-navy-mid to-navy flex items-center justify-center p-10">
        <div className="text-center">
          <div className="text-8xl mb-6">🚗</div>
          <h3 className="font-display text-3xl font-bold mb-4">Votre agence,<br />digitalisée</h3>
          <p className="text-slate max-w-xs">Gérez toute votre activité depuis un seul tableau de bord intelligent.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REGISTER
// ============================================================
export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ agencyName: '', email: '', phone: '', city: '', password: '', plan: 'pro' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const f = k => v => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    try {
      await register(form);
      toast.success('Compte créé avec succès !');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-6">
      <div className="w-full max-w-lg">
        <Link to="/" className="text-slate text-sm mb-8 flex items-center gap-2 hover:text-white">← Retour</Link>
        <div className="flex items-center gap-2 mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-brand to-purple-600 rounded-xl flex items-center justify-center"><Car size={20} className="text-white" /></div>
            <span className="font-display font-bold text-xl">AutoLoc<span className="text-brand">Pro</span></span>
          </div>
        </div>

        <div className="flex gap-2 mb-10 items-center">
          {[1,2].map(s => (
            <><div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${s <= step ? 'bg-brand border-brand text-white' : 'border-navy-light text-slate'}`}>{s < step ? <Check size={14}/> : s}</div>
            {s < 2 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-brand' : 'bg-navy-light'}`} />}</>
          ))}
        </div>

        {step === 1 ? (
          <div>
            <h2 className="font-display text-2xl font-bold mb-1">Créer votre compte</h2>
            <p className="text-slate mb-6">Informations de votre agence</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nom de l'agence *</label>
                <input value={form.agencyName} onChange={e => f('agencyName')(e.target.value)} placeholder="Location Premium Tanger" className="input" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => f('email')(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input value={form.phone} onChange={e => f('phone')(e.target.value)} placeholder="+212 5XX-XXXXXX" className="input" />
              </div>
              <div>
                <label className="label">Ville</label>
                <input value={form.city} onChange={e => f('city')(e.target.value)} placeholder="Tanger" className="input" />
              </div>
              <div>
                <label className="label">Mot de passe *</label>
                <input type="password" value={form.password} onChange={e => f('password')(e.target.value)} className="input" />
              </div>
            </div>
            <button className="btn-primary w-full justify-center py-3 mt-6" onClick={() => setStep(2)}>Continuer →</button>
            <p className="mt-4 text-sm text-slate text-center">Déjà inscrit ? <Link to="/login" className="text-brand hover:underline">Se connecter</Link></p>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl font-bold mb-1">Choisissez votre plan</h2>
            <p className="text-slate mb-6">Modifiable à tout moment</p>
            {[{ id: 'starter', label: 'Starter', price: '299 MAD/mois', desc: '10 véhicules · 2 utilisateurs' }, { id: 'pro', label: 'Pro', price: '599 MAD/mois', desc: '50 véhicules · 10 utilisateurs', popular: true }, { id: 'enterprise', label: 'Enterprise', price: '1 299 MAD/mois', desc: 'Illimité' }].map(p => (
              <div key={p.id} onClick={() => f('plan')(p.id)} className={`border-2 rounded-xl p-4 mb-3 cursor-pointer flex items-center gap-4 transition-colors ${form.plan === p.id ? 'border-brand bg-brand/10' : 'border-navy-light hover:border-slate bg-navy-mid'}`}>
                <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${form.plan === p.id ? 'border-brand bg-brand' : 'border-slate'}`} />
                <div className="flex-1">
                  <div className="font-semibold">{p.label}{p.popular && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Populaire</span>}</div>
                  <div className="text-sm text-slate">{p.desc}</div>
                </div>
                <div className="font-bold text-sm">{p.price}</div>
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1" onClick={() => setStep(1)}>← Retour</button>
              <button className="btn-primary flex-[2] justify-center py-3" onClick={handleRegister} disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer mon compte'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
