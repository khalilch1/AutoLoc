const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

const getAll = (req, res) => {
  const db = getDB();
  const { status, search } = req.query;
  let query = `SELECT c.*, 
    COUNT(DISTINCT r.id) as total_rentals,
    COALESCE(SUM(i.total), 0) as total_spent
    FROM clients c
    LEFT JOIN reservations r ON r.client_id = c.id
    LEFT JOIN invoices i ON i.client_id = c.id AND i.status = 'paid'
    WHERE c.tenant_id = ?`;
  const params = [req.tenantId];
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (search) { query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.cin LIKE ? OR c.phone LIKE ?)'; params.push(...Array(5).fill(`%${search}%`)); }
  query += ' GROUP BY c.id ORDER BY c.last_name, c.first_name';
  res.json(db.prepare(query).all(...params));
};

const getOne = (req, res) => {
  const db = getDB();
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!client) return res.status(404).json({ error: 'Client introuvable' });
  const reservations = db.prepare(`
    SELECT r.*, ca.brand, ca.model, ca.plate FROM reservations r
    JOIN cars ca ON r.car_id = ca.id
    WHERE r.client_id = ? ORDER BY r.start_date DESC
  `).all(req.params.id);
  const invoices = db.prepare('SELECT * FROM invoices WHERE client_id = ? ORDER BY issue_date DESC').all(req.params.id);
  res.json({ ...client, reservations, invoices });
};

const create = (req, res) => {
  const db = getDB();
  const { first_name, last_name, email, phone, cin, passport, license_number, license_expiry, license_country, birth_date, nationality, address, city, country, client_type, company_name, company_ice, notes } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ error: 'Nom et prénom obligatoires' });
  const id = uuidv4();
  db.prepare(`INSERT INTO clients (id,tenant_id,first_name,last_name,email,phone,cin,passport,license_number,license_expiry,license_country,birth_date,nationality,address,city,country,client_type,company_name,company_ice,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, req.tenantId, first_name, last_name, email, phone, cin, passport,
    license_number, license_expiry, license_country||'Maroc', birth_date,
    nationality||'Marocaine', address, city, country||'Maroc',
    client_type||'individual', company_name, company_ice, notes
  );
  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
};

const update = (req, res) => {
  const db = getDB();
  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!client) return res.status(404).json({ error: 'Client introuvable' });
  const fields = ['first_name','last_name','email','phone','cin','passport','license_number','license_expiry','license_country','birth_date','nationality','address','city','country','client_type','company_name','company_ice','status','notes'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Aucun champ' });
  updates.push('updated_at = datetime("now")');
  params.push(req.params.id);
  db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
};

const remove = (req, res) => {
  const db = getDB();
  const client = db.prepare('SELECT id FROM clients WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!client) return res.status(404).json({ error: 'Client introuvable' });
  db.prepare('UPDATE clients SET status = ? WHERE id = ?').run('inactive', req.params.id);
  res.json({ message: 'Client archivé' });
};

module.exports = { getAll, getOne, create, update, remove };
