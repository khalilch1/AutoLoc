const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');
const { generateContractPdf } = require('../utils/contractPdf');

// ============================================================
// CONTRACTS
// ============================================================
const contractsGetAll = (req, res) => {
  const db = getDB();
  const contracts = db.prepare(`
    SELECT ct.*, r.start_date, r.end_date, r.daily_rate,
      c.first_name, c.last_name, c.cin,
      ca.brand, ca.model, ca.plate
    FROM contracts ct
    JOIN reservations r ON ct.reservation_id = r.id
    JOIN clients c ON r.client_id = c.id
    JOIN cars ca ON r.car_id = ca.id
    WHERE ct.tenant_id = ? ORDER BY ct.created_at DESC
  `).all(req.tenantId);
  res.json(contracts);
};

const contractsCreate = (req, res) => {
  const db = getDB();
  const { reservation_id, start_mileage, fuel_level_start, damages_start } = req.body;
  if (!reservation_id) return res.status(400).json({ error: 'reservation_id requis' });
  const existing = db.prepare('SELECT id FROM contracts WHERE reservation_id = ?').get(reservation_id);
  if (existing) return res.status(409).json({ error: 'Contrat déjà créé pour cette réservation' });

  const count = db.prepare('SELECT COUNT(*) as c FROM contracts WHERE tenant_id = ?').get(req.tenantId).c;
  const contractNumber = `CTR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  const id = uuidv4();
  db.prepare(`INSERT INTO contracts (id,tenant_id,reservation_id,contract_number,start_mileage,fuel_level_start,damages_start,status,signed_at)
    VALUES (?,?,?,?,?,?,?,'signed',datetime('now'))`).run(
    id, req.tenantId, reservation_id, contractNumber, start_mileage||0, fuel_level_start||'full', damages_start||''
  );
  db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run('active', reservation_id);
  const res_ = db.prepare('SELECT car_id FROM reservations WHERE id = ?').get(reservation_id);
  if (res_) db.prepare('UPDATE cars SET status = ? WHERE id = ?').run('rented', res_.car_id);
  res.status(201).json(db.prepare('SELECT * FROM contracts WHERE id = ?').get(id));
};

const contractsClose = (req, res) => {
  const db = getDB();
  const { end_mileage, fuel_level_end, damages_end } = req.body;
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!contract) return res.status(404).json({ error: 'Contrat introuvable' });
  const extra_km = end_mileage && contract.start_mileage ? Math.max(0, end_mileage - contract.start_mileage - 300) : 0;
  db.prepare('UPDATE contracts SET status=?,end_mileage=?,fuel_level_end=?,damages_end=?,extra_km=? WHERE id=?').run(
    'closed', end_mileage, fuel_level_end||'full', damages_end||'', extra_km, req.params.id
  );
  const res_ = db.prepare('SELECT car_id FROM reservations WHERE id = ?').get(contract.reservation_id);
  if (res_) {
    db.prepare('UPDATE cars SET status=?, mileage=? WHERE id=?').run('available', end_mileage||0, res_.car_id);
    db.prepare('UPDATE reservations SET status=? WHERE id=?').run('completed', contract.reservation_id);
  }
  res.json(db.prepare('SELECT * FROM contracts WHERE id=?').get(req.params.id));
};

const contractPdf = (req, res) => {
  const db = getDB();
  const contract = db.prepare(`
    SELECT ct.*, r.start_date as reservation_start, r.end_date as reservation_end, r.daily_rate,
      r.pickup_location, r.return_location
    FROM contracts ct
    JOIN reservations r ON ct.reservation_id = r.id
    WHERE ct.id = ? AND ct.tenant_id = ?
  `).get(req.params.id, req.tenantId);
  if (!contract) return res.status(404).json({ error: 'Contrat introuvable' });

  const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(contract.reservation_id);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(reservation.client_id);
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(reservation.car_id);
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.tenantId);

  const days = Math.max(1, Math.ceil((new Date(reservation.end_date) - new Date(reservation.start_date)) / 86400000));
  contract.total_price = reservation.daily_rate * days;
  contract.included_km = 300 * days;

  generateContractPdf(res, { contract, client, car, tenant });
};

// ============================================================
// INVOICES
// ============================================================
const invoicesGetAll = (req, res) => {
  const db = getDB();
  const invoices = db.prepare(`
    SELECT i.*, c.first_name, c.last_name,
      COALESCE(SUM(p.amount),0) as paid_amount
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    LEFT JOIN payments p ON p.invoice_id = i.id
    WHERE i.tenant_id = ?
    GROUP BY i.id ORDER BY i.issue_date DESC
  `).all(req.tenantId);
  res.json(invoices);
};

const invoicesCreate = (req, res) => {
  const db = getDB();
  const { reservation_id, client_id, lines, tax_rate, discount, due_date, notes } = req.body;
  if (!client_id || !lines?.length) return res.status(400).json({ error: 'client_id et lignes requis' });
  const subtotal = lines.reduce((s, l) => s + (l.quantity * l.unit_price), 0);
  const taxRate = tax_rate ?? 20;
  const discountAmount = discount || 0;
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;
  const count = db.prepare('SELECT COUNT(*) as c FROM invoices WHERE tenant_id = ?').get(req.tenantId).c;
  const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  const id = uuidv4();
  db.prepare(`INSERT INTO invoices (id,tenant_id,reservation_id,client_id,invoice_number,issue_date,due_date,subtotal,tax_rate,tax_amount,discount,total,status,notes)
    VALUES (?,?,?,?,?,date('now'),?,?,?,?,?,?,'pending',?)`).run(
    id, req.tenantId, reservation_id, client_id, invoiceNumber, due_date, subtotal, taxRate, taxAmount, discountAmount, total, notes
  );
  for (const l of lines) {
    db.prepare(`INSERT INTO invoice_lines (id,invoice_id,description,quantity,unit_price,total) VALUES (?,?,?,?,?,?)`).run(
      uuidv4(), id, l.description, l.quantity||1, l.unit_price, l.quantity * l.unit_price
    );
  }
  res.status(201).json({ ...db.prepare('SELECT * FROM invoices WHERE id=?').get(id), lines: db.prepare('SELECT * FROM invoice_lines WHERE invoice_id=?').all(id) });
};

const invoicesUpdate = (req, res) => {
  const db = getDB();
  const inv = db.prepare('SELECT id FROM invoices WHERE id=? AND tenant_id=?').get(req.params.id, req.tenantId);
  if (!inv) return res.status(404).json({ error: 'Facture introuvable' });
  const { status, due_date, notes } = req.body;
  const updates = [];
  const params = [];
  if (status) { updates.push('status=?'); params.push(status); }
  if (due_date) { updates.push('due_date=?'); params.push(due_date); }
  if (notes !== undefined) { updates.push('notes=?'); params.push(notes); }
  if (updates.length) { params.push(req.params.id); db.prepare(`UPDATE invoices SET ${updates.join(',')} WHERE id=?`).run(...params); }
  res.json(db.prepare('SELECT * FROM invoices WHERE id=?').get(req.params.id));
};

// ============================================================
// PAYMENTS
// ============================================================
const paymentsGetAll = (req, res) => {
  const db = getDB();
  const payments = db.prepare(`
    SELECT p.*, i.invoice_number, i.total as invoice_total,
      c.first_name, c.last_name
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN clients c ON i.client_id = c.id
    WHERE p.tenant_id = ? ORDER BY p.payment_date DESC
  `).all(req.tenantId);
  res.json(payments);
};

const paymentsCreate = (req, res) => {
  const db = getDB();
  const { invoice_id, amount, method, reference, payment_date, notes } = req.body;
  if (!invoice_id || !amount) return res.status(400).json({ error: 'invoice_id et montant requis' });
  const invoice = db.prepare('SELECT * FROM invoices WHERE id=? AND tenant_id=?').get(invoice_id, req.tenantId);
  if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });
  const id = uuidv4();
  db.prepare(`INSERT INTO payments (id,tenant_id,invoice_id,amount,method,reference,payment_date,notes) VALUES (?,?,?,?,?,?,?,?)`).run(
    id, req.tenantId, invoice_id, amount, method||'cash', reference, payment_date||new Date().toISOString().split('T')[0], notes
  );
  const totalPaid = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE invoice_id=?').get(invoice_id).total;
  if (totalPaid >= invoice.total) db.prepare('UPDATE invoices SET status=? WHERE id=?').run('paid', invoice_id);
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id=?').get(id));
};

// ============================================================
// MAINTENANCE
// ============================================================
const maintenanceGetAll = (req, res) => {
  const db = getDB();
  const { car_id, status } = req.query;
  let query = `SELECT m.*, ca.brand, ca.model, ca.plate FROM maintenance m JOIN cars ca ON m.car_id = ca.id WHERE m.tenant_id = ?`;
  const params = [req.tenantId];
  if (car_id) { query += ' AND m.car_id=?'; params.push(car_id); }
  if (status) { query += ' AND m.status=?'; params.push(status); }
  query += ' ORDER BY m.scheduled_date DESC';
  res.json(db.prepare(query).all(...params));
};

const maintenanceCreate = (req, res) => {
  const db = getDB();
  const { car_id, type, description, garage, scheduled_date, cost, notes } = req.body;
  if (!car_id || !type) return res.status(400).json({ error: 'car_id et type requis' });
  const car = db.prepare('SELECT id,mileage FROM cars WHERE id=? AND tenant_id=?').get(car_id, req.tenantId);
  if (!car) return res.status(404).json({ error: 'Véhicule introuvable' });
  const id = uuidv4();
  db.prepare(`INSERT INTO maintenance (id,tenant_id,car_id,type,description,garage,scheduled_date,mileage_at,cost,notes) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    id, req.tenantId, car_id, type, description, garage, scheduled_date, car.mileage, cost||0, notes
  );
  res.status(201).json(db.prepare('SELECT * FROM maintenance WHERE id=?').get(id));
};

const maintenanceUpdate = (req, res) => {
  const db = getDB();
  const m = db.prepare('SELECT id,car_id FROM maintenance WHERE id=? AND tenant_id=?').get(req.params.id, req.tenantId);
  if (!m) return res.status(404).json({ error: 'Entretien introuvable' });
  const fields = ['type','description','garage','scheduled_date','completed_date','cost','status','notes','invoice_ref'];
  const updates = [];
  const params = [];
  for (const f of fields) { if (req.body[f] !== undefined) { updates.push(`${f}=?`); params.push(req.body[f]); } }
  if (updates.length) { params.push(req.params.id); db.prepare(`UPDATE maintenance SET ${updates.join(',')} WHERE id=?`).run(...params); }
  if (req.body.status === 'completed') db.prepare('UPDATE cars SET status=? WHERE id=?').run('available', m.car_id);
  res.json(db.prepare('SELECT * FROM maintenance WHERE id=?').get(req.params.id));
};

// ============================================================
// REPORTS / DASHBOARD
// ============================================================
const dashboardStats = (req, res) => {
  const db = getDB();
  const tid = req.tenantId;
  const month = new Date().toISOString().slice(0, 7);

  const totalCars = db.prepare('SELECT COUNT(*) as c FROM cars WHERE tenant_id=? AND status != "retired"').get(tid).c;
  const availableCars = db.prepare('SELECT COUNT(*) as c FROM cars WHERE tenant_id=? AND status="available"').get(tid).c;
  const totalClients = db.prepare('SELECT COUNT(*) as c FROM clients WHERE tenant_id=? AND status != "inactive"').get(tid).c;
  const activeReservations = db.prepare(`SELECT COUNT(*) as c FROM reservations WHERE tenant_id=? AND status IN ('active','confirmed')`).get(tid).c;
  const monthRevenue = db.prepare(`SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE tenant_id=? AND status='paid' AND issue_date LIKE ?`).get(tid, `${month}%`).total;
  const pendingAmount = db.prepare(`SELECT COALESCE(SUM(total),0) as total FROM invoices WHERE tenant_id=? AND status='pending'`).get(tid).total;
  const upcomingMaint = db.prepare(`SELECT COUNT(*) as c FROM maintenance WHERE tenant_id=? AND status='scheduled' AND scheduled_date <= date('now','+7 days')`).get(tid).c;

  const revenueByMonth = db.prepare(`
    SELECT strftime('%Y-%m',issue_date) as month, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
    FROM invoices WHERE tenant_id=? AND status='paid' AND issue_date >= date('now','-6 months')
    GROUP BY month ORDER BY month
  `).all(tid);

  const recentReservations = db.prepare(`
    SELECT r.*, c.first_name, c.last_name, ca.brand, ca.model, ca.plate
    FROM reservations r JOIN clients c ON r.client_id=c.id JOIN cars ca ON r.car_id=ca.id
    WHERE r.tenant_id=? ORDER BY r.created_at DESC LIMIT 5
  `).all(tid);

  const carsByStatus = db.prepare('SELECT status, COUNT(*) as count FROM cars WHERE tenant_id=? AND status != "retired" GROUP BY status').all(tid);
  const topCars = db.prepare(`SELECT ca.brand, ca.model, ca.plate, COUNT(r.id) as rentals FROM cars ca LEFT JOIN reservations r ON ca.id=r.car_id WHERE ca.tenant_id=? GROUP BY ca.id ORDER BY rentals DESC LIMIT 5`).all(tid);

  res.json({ totalCars, availableCars, totalClients, activeReservations, monthRevenue, pendingAmount, upcomingMaint, revenueByMonth, recentReservations, carsByStatus, topCars });
};

const revenueReport = (req, res) => {
  const db = getDB();
  const { from, to } = req.query;
  const dateFilter = from && to ? `AND issue_date BETWEEN '${from}' AND '${to}'` : `AND issue_date >= date('now','-12 months')`;
  const revenue = db.prepare(`SELECT strftime('%Y-%m',issue_date) as month, SUM(total) as revenue, SUM(tax_amount) as taxes, COUNT(*) as invoices FROM invoices WHERE tenant_id=? AND status='paid' ${dateFilter} GROUP BY month ORDER BY month`).all(req.tenantId);
  const byClient = db.prepare(`SELECT c.first_name, c.last_name, SUM(i.total) as total, COUNT(i.id) as invoices FROM invoices i JOIN clients c ON i.client_id=c.id WHERE i.tenant_id=? AND i.status='paid' ${dateFilter} GROUP BY c.id ORDER BY total DESC LIMIT 10`).all(req.tenantId);
  res.json({ revenue, byClient });
};

module.exports = {
  contractsGetAll, contractsCreate, contractsClose, contractPdf,
  invoicesGetAll, invoicesCreate, invoicesUpdate,
  paymentsGetAll, paymentsCreate,
  maintenanceGetAll, maintenanceCreate, maintenanceUpdate,
  dashboardStats, revenueReport
};
