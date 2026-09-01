const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const db = getDB();
  const user = db.prepare(`
    SELECT u.*, t.name as tenant_name, t.plan, t.city as tenant_city, t.phone as tenant_phone, t.ice
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = ? AND u.is_active = 1 AND t.is_active = 1
  `).get(email.toLowerCase().trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  const token = jwt.sign({ userId: user.id, tenantId: user.tenant_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      plan: user.plan,
      city: user.tenant_city,
    }
  });
};

const register = (req, res) => {
  const { agencyName, email, password, phone, city, ice } = req.body;
  if (!agencyName || !email || !password) return res.status(400).json({ error: 'Champs obligatoires manquants' });
  if (password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (min 8 caractères)' });

  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

  const tenantId = uuidv4();
  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  const planExpires = new Date();
  planExpires.setDate(planExpires.getDate() + 14); // 14 days trial

  db.prepare(`INSERT INTO tenants (id,name,email,phone,city,ice,plan,plan_expires_at) VALUES (?,?,?,?,?,?,?,?)`).run(
    tenantId, agencyName, email.toLowerCase().trim(), phone, city, ice, 'starter', planExpires.toISOString()
  );
  db.prepare(`INSERT INTO users (id,tenant_id,first_name,last_name,email,password_hash,role) VALUES (?,?,?,?,?,?,?)`).run(
    userId, tenantId, 'Admin', agencyName, email.toLowerCase().trim(), passwordHash, 'admin'
  );
  db.prepare(`INSERT INTO subscriptions (id,tenant_id,plan,billing_cycle,price,started_at,expires_at,status) VALUES (?,?,?,?,?,datetime('now'),?,?)`).run(
    uuidv4(), tenantId, 'starter', 'monthly', 0, planExpires.toISOString(), 'trial'
  );

  const token = jwt.sign({ userId, tenantId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: userId, firstName: 'Admin', lastName: agencyName, email, role: 'admin', tenantId, tenantName: agencyName, plan: 'starter' } });
};

const me = (req, res) => {
  const u = req.user;
  res.json({ id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email, role: u.role, tenantId: u.tenant_id, tenantName: u.tenant_name, plan: u.plan });
};

module.exports = { login, register, me };
