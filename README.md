# 🚗 AutoLoc Pro — SaaS Gestion Location de Voitures

Plateforme complète de gestion pour agences de location au Maroc.  
Stack : **React 18 + Vite + TailwindCSS** (frontend) · **Node.js + Express + SQLite** (backend)

---

## 🚀 Lancement rapide

### Prérequis
- Node.js 18+ installé

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed      # Injecte les données de démo
npm run dev       # Démarre sur http://localhost:5000
```

### 2. Frontend (nouveau terminal)

```bash
cd frontend
npm install
npm run dev       # Démarre sur http://localhost:3000
```

Ouvrir **http://localhost:3000**

---

## 🔑 Accès démo

| Champ | Valeur |
|---|---|
| Email | demo@autoloc.ma |
| Mot de passe | Demo1234! |

---

## 📦 Modules inclus

| Module | Description |
|---|---|
| 🏠 Dashboard | KPIs, revenus, alertes maintenance |
| 🚗 Parc automobile | CRUD véhicules, statuts, filtres |
| 👥 Clients | Fiche client, CIN, permis, historique |
| 📅 Réservations | Création, confirmation, calcul TTC |
| 📄 Contrats | Création, clôture avec km/carburant |
| 🔧 Maintenance | Planification, alertes 7 jours |
| 🧾 Facturation | HT/TVA/TTC, statuts |
| 💰 Règlements | Paiements multi-modes |
| 📊 Rapports | Graphiques, top véhicules, KPIs |

---

## 🏗️ Architecture

```
autoloc-pro/
├── backend/
│   ├── src/
│   │   ├── server.js          # Point d'entrée Express
│   │   ├── config/database.js # SQLite (better-sqlite3)
│   │   ├── middleware/auth.js  # JWT middleware
│   │   ├── controllers/       # Auth, Cars, Clients, Reservations...
│   │   ├── routes/index.js    # Toutes les routes REST /api/*
│   │   └── utils/seed.js      # Données de démonstration
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Routes + QueryClient
    │   ├── main.jsx             # Entry point React
    │   ├── context/authStore.js # Zustand (auth persistée)
    │   ├── utils/api.js         # Axios + helpers API
    │   ├── styles/globals.css   # Tailwind + CSS vars
    │   ├── components/shared/   # Badge, Modal, StatCard...
    │   └── pages/               # Dashboard, Cars, Clients...
    ├── vite.config.js           # Proxy /api → port 5000
    ├── tailwind.config.js
    └── package.json
```

---

## 🔌 API REST

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me

GET    /api/dashboard/stats
GET    /api/reports/revenue

GET|POST        /api/cars
GET|PUT|DELETE  /api/cars/:id

GET|POST        /api/clients
GET|PUT|DELETE  /api/clients/:id

GET|POST        /api/reservations
GET|PUT|DELETE  /api/reservations/:id
GET             /api/reservations/availability

GET|POST        /api/contracts
PUT             /api/contracts/:id/close

GET|POST        /api/invoices
PUT             /api/invoices/:id

GET|POST        /api/payments

GET|POST        /api/maintenance
PUT             /api/maintenance/:id
```

---

## 🎨 Design

- Palette : Navy `#0F172A` + Electric Blue `#3B82F6` + Gold `#F59E0B`
- Typo : **Syne** (titres) + **Inter** (corps)
- Dark mode natif, sidebar collapsible

---

## 📋 Plans tarifaires

| Plan | Prix | Véhicules | Utilisateurs |
|---|---|---|---|
| Starter | 299 MAD/mois | 10 | 2 |
| Pro | 599 MAD/mois | 50 | 10 |
| Enterprise | 1 299 MAD/mois | Illimité | Illimité |

---

*Développé avec ❤️ pour les agences marocaines*
