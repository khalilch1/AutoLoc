const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    -- TENANTS (Agences abonnées)
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      plan TEXT DEFAULT 'starter' CHECK(plan IN ('starter','pro','enterprise')),
      plan_expires_at TEXT,
      logo_url TEXT,
      ice TEXT,
      rc TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- USERS (employés de l'agence)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'agent' CHECK(role IN ('admin','manager','agent')),
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      UNIQUE(email, tenant_id)
    );

    -- CARS
    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER,
      plate TEXT NOT NULL,
      category TEXT DEFAULT 'Berline',
      color TEXT,
      fuel TEXT DEFAULT 'Essence',
      seats INTEGER DEFAULT 5,
      transmission TEXT DEFAULT 'Manuelle',
      daily_rate REAL NOT NULL,
      deposit REAL DEFAULT 0,
      mileage INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available' CHECK(status IN ('available','rented','maintenance','retired')),
      next_maintenance_date TEXT,
      next_maintenance_km INTEGER,
      insurance_expiry TEXT,
      vignette_expiry TEXT,
      visite_expiry TEXT,
      notes TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- CLIENTS
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      cin TEXT,
      passport TEXT,
      license_number TEXT,
      license_expiry TEXT,
      license_country TEXT DEFAULT 'Maroc',
      birth_date TEXT,
      nationality TEXT DEFAULT 'Marocaine',
      address TEXT,
      city TEXT,
      country TEXT DEFAULT 'Maroc',
      client_type TEXT DEFAULT 'individual' CHECK(client_type IN ('individual','company')),
      company_name TEXT,
      company_ice TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','vip','blacklisted','inactive')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- RESERVATIONS
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      car_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      pickup_location TEXT,
      return_location TEXT,
      daily_rate REAL NOT NULL,
      extra_km_rate REAL DEFAULT 0,
      fuel_policy TEXT DEFAULT 'full_to_full',
      deposit_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      extra_options TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','active','completed','cancelled')),
      notes TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (car_id) REFERENCES cars(id)
    );

    -- CONTRACTS
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      reservation_id TEXT NOT NULL,
      contract_number TEXT NOT NULL,
      signed_at TEXT,
      start_mileage INTEGER,
      fuel_level_start TEXT DEFAULT 'full',
      fuel_level_end TEXT,
      end_mileage INTEGER,
      extra_km INTEGER DEFAULT 0,
      damages_start TEXT,
      damages_end TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','signed','closed')),
      pdf_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    );

    -- INVOICES
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      reservation_id TEXT,
      client_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      subtotal REAL NOT NULL,
      tax_rate REAL DEFAULT 20,
      tax_amount REAL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('draft','pending','paid','overdue','cancelled')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    -- INVOICE LINES
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    -- PAYMENTS
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT DEFAULT 'cash' CHECK(method IN ('cash','card','transfer','check','mobile')),
      reference TEXT,
      payment_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    -- MAINTENANCE
    CREATE TABLE IF NOT EXISTS maintenance (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      car_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      garage TEXT,
      scheduled_date TEXT,
      completed_date TEXT,
      mileage_at INTEGER,
      cost REAL DEFAULT 0,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','completed','cancelled')),
      notes TEXT,
      invoice_ref TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (car_id) REFERENCES cars(id)
    );

    -- CAR PHOTOS
    CREATE TABLE IF NOT EXISTS car_photos (
      id TEXT PRIMARY KEY,
      car_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- SUBSCRIPTION PLANS
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',
      price REAL NOT NULL,
      started_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      payment_ref TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
  `);

  console.log('✅ Database initialized successfully');
  return db;
}

module.exports = { getDB, initDB };
