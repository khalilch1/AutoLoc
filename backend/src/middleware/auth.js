const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const user = db.prepare('SELECT u.*, t.name as tenant_name, t.plan, t.is_active as tenant_active FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ? AND u.is_active = 1').get(decoded.userId);

    if (!user || !user.tenant_active) {
      return res.status(401).json({ error: 'Utilisateur introuvable ou désactivé' });
    }

    req.user = user;
    req.tenantId = user.tenant_id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Permissions insuffisantes' });
  }
  next();
};

module.exports = { auth, requireRole };
