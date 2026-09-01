const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

const getAll = (req, res) => {
  const db = getDB();
  const { status, client_id, car_id } = req.query;
  let query = `
    SELECT r.*,
      c.first_name, c.last_name, c.phone as client_phone, c.cin,
      ca.brand, ca.model, ca.plate, ca.category, ca.color
    FROM reservations r
    JOIN clients c ON r.client_id = c.id
    JOIN cars ca ON r.car_id = ca.id
    WHERE r.tenant_id = ?
  `;
  const params = [req.tenantId];
  if (status) { query += ' AND r.status = ?'; params.push(status); }
  if (client_id) { query += ' AND r.client_id = ?'; params.push(client_id); }
  if (car_id) { query += ' AND r.car_id = ?'; params.push(car_id); }
  query += ' ORDER BY r.start_date DESC';
  res.json(db.prepare(query).all(...params));
};

const getOne = (req, res) => {
  const db = getDB();
  const res_ = db.prepare(`
    SELECT r.*, c.first_name, c.last_name, c.phone as client_phone, c.cin, c.license_number,
      ca.brand, ca.model, ca.plate, ca.category, ca.color, ca.daily_rate as car_rate
    FROM reservations r
    JOIN clients c ON r.client_id = c.id
    JOIN cars ca ON r.car_id = ca.id
    WHERE r.id = ? AND r.tenant_id = ?
  `).get(req.params.id, req.tenantId);
  if (!res_) return res.status(404).json({ error: 'Réservation introuvable' });
  const contract = db.prepare('SELECT * FROM contracts WHERE reservation_id = ?').get(req.params.id);
  const invoices = db.prepare('SELECT * FROM invoices WHERE reservation_id = ?').all(req.params.id);
  res.json({ ...res_, contract, invoices });
};

const create = (req, res) => {
  const db = getDB();
  const { client_id, car_id, start_date, end_date, pickup_location, return_location, daily_rate, deposit_amount, discount, extra_options, notes } = req.body;
  if (!client_id || !car_id || !start_date || !end_date) return res.status(400).json({ error: 'Champs obligatoires manquants' });

  // Check car availability
  const conflict = db.prepare(`
    SELECT id FROM reservations WHERE car_id = ? AND tenant_id = ? AND status IN ('confirmed','active')
    AND NOT (end_date <= ? OR start_date >= ?)
  `).get(car_id, req.tenantId, start_date, end_date);
  if (conflict) return res.status(409).json({ error: 'Véhicule non disponible pour ces dates' });

  const car = db.prepare('SELECT daily_rate FROM cars WHERE id = ?').get(car_id);
  const id = uuidv4();
  db.prepare(`INSERT INTO reservations (id,tenant_id,client_id,car_id,start_date,end_date,pickup_location,return_location,daily_rate,deposit_amount,discount,extra_options,notes,status,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',?)`).run(
    id, req.tenantId, client_id, car_id, start_date, end_date,
    pickup_location, return_location, daily_rate || car?.daily_rate,
    deposit_amount||0, discount||0, JSON.stringify(extra_options||[]), notes, req.user.id
  );
  res.status(201).json(db.prepare('SELECT * FROM reservations WHERE id = ?').get(id));
};

const update = (req, res) => {
  const db = getDB();
  const existing = db.prepare('SELECT id FROM reservations WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Réservation introuvable' });
  const fields = ['client_id','car_id','start_date','end_date','pickup_location','return_location','daily_rate','deposit_amount','discount','status','notes'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Aucun champ' });
  updates.push('updated_at = datetime("now")');
  params.push(req.params.id);
  db.prepare(`UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  // Update car status if reservation status changes
  const updated = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (req.body.status === 'active') {
    db.prepare('UPDATE cars SET status = ? WHERE id = ?').run('rented', updated.car_id);
  } else if (['completed','cancelled'].includes(req.body.status)) {
    db.prepare('UPDATE cars SET status = ? WHERE id = ?').run('available', updated.car_id);
  }
  res.json(updated);
};

const remove = (req, res) => {
  const db = getDB();
  const res_ = db.prepare('SELECT id FROM reservations WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!res_) return res.status(404).json({ error: 'Réservation introuvable' });
  db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  res.json({ message: 'Réservation annulée' });
};

const checkAvailability = (req, res) => {
  const db = getDB();
  const { car_id, start_date, end_date, exclude_id } = req.query;
  let query = `SELECT id FROM reservations WHERE car_id = ? AND tenant_id = ? AND status IN ('confirmed','active') AND NOT (end_date <= ? OR start_date >= ?)`;
  const params = [car_id, req.tenantId, start_date, end_date];
  if (exclude_id) { query += ' AND id != ?'; params.push(exclude_id); }
  const conflict = db.prepare(query).get(...params);
  res.json({ available: !conflict });
};

module.exports = { getAll, getOne, create, update, remove, checkAvailability };
