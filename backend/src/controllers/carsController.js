const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getDB } = require('../config/database');

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `car_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Seules les images JPEG/PNG/WebP sont acceptées'));
  },
});

// GET /cars/:id/photos
const getPhotos = (req, res) => {
  const db = getDB();
  const car = db.prepare('SELECT id FROM cars WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!car) return res.status(404).json({ error: 'Véhicule introuvable' });
  const photos = db.prepare('SELECT * FROM car_photos WHERE car_id = ? ORDER BY is_primary DESC, created_at ASC').all(req.params.id);
  res.json(photos);
};

// POST /cars/:id/photos  (upload one photo)
const addPhoto = [
  upload.single('photo'),
  (req, res) => {
    const db = getDB();
    const car = db.prepare('SELECT id FROM cars WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
    if (!car) return res.status(404).json({ error: 'Véhicule introuvable' });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    const url = `/uploads/${req.file.filename}`;
    const id = uuidv4();
    const existingCount = db.prepare('SELECT COUNT(*) as c FROM car_photos WHERE car_id = ?').get(req.params.id).c;
    const isPrimary = existingCount === 0 ? 1 : 0;

    db.prepare('INSERT INTO car_photos (id, car_id, tenant_id, url, is_primary) VALUES (?,?,?,?,?)')
      .run(id, req.params.id, req.tenantId, url, isPrimary);

    // Keep image_url on car in sync with primary photo
    if (isPrimary) {
      db.prepare("UPDATE cars SET image_url = ?, updated_at = datetime('now') WHERE id = ?").run(url, req.params.id);
    }

    res.status(201).json(db.prepare('SELECT * FROM car_photos WHERE id = ?').get(id));
  },
];

// DELETE /cars/:id/photos/:photoId
const deletePhoto = (req, res) => {
  const db = getDB();
  const photo = db.prepare('SELECT * FROM car_photos WHERE id = ? AND car_id = ?').get(req.params.photoId, req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable' });

  // Delete file
  const filePath = path.join(UPLOADS_DIR, path.basename(photo.url));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM car_photos WHERE id = ?').run(photo.id);

  // If was primary, promote next photo
  if (photo.is_primary) {
    const next = db.prepare('SELECT * FROM car_photos WHERE car_id = ? ORDER BY created_at ASC LIMIT 1').get(req.params.id);
    if (next) {
      db.prepare('UPDATE car_photos SET is_primary = 1 WHERE id = ?').run(next.id);
      db.prepare("UPDATE cars SET image_url = ?, updated_at = datetime('now') WHERE id = ?").run(next.url, req.params.id);
    } else {
      db.prepare("UPDATE cars SET image_url = NULL, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    }
  }

  res.json({ message: 'Photo supprimée' });
};

// PUT /cars/:id/photos/:photoId/primary
const setPrimary = (req, res) => {
  const db = getDB();
  const photo = db.prepare('SELECT * FROM car_photos WHERE id = ? AND car_id = ?').get(req.params.photoId, req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable' });

  db.prepare('UPDATE car_photos SET is_primary = 0 WHERE car_id = ?').run(req.params.id);
  db.prepare('UPDATE car_photos SET is_primary = 1 WHERE id = ?').run(photo.id);
  db.prepare("UPDATE cars SET image_url = ?, updated_at = datetime('now') WHERE id = ?").run(photo.url, req.params.id);

  res.json({ message: 'Photo principale mise à jour' });
};

// Legacy single-photo upload kept for compatibility
const uploadPhoto = addPhoto;

const getAll = (req, res) => {
  const db = getDB();
  const { status, category, search } = req.query;
  let query = 'SELECT * FROM cars WHERE tenant_id = ?';
  const params = [req.tenantId];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (brand LIKE ? OR model LIKE ? OR plate LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY brand, model';
  res.json(db.prepare(query).all(...params));
};

const getOne = (req, res) => {
  const db = getDB();
  const car = db.prepare('SELECT * FROM cars WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!car) return res.status(404).json({ error: 'Véhicule introuvable' });
  const maintenance = db.prepare('SELECT * FROM maintenance WHERE car_id = ? ORDER BY scheduled_date DESC LIMIT 10').all(req.params.id);
  const reservations = db.prepare(`
    SELECT r.*, c.first_name, c.last_name FROM reservations r
    JOIN clients c ON r.client_id = c.id
    WHERE r.car_id = ? ORDER BY r.start_date DESC LIMIT 10
  `).all(req.params.id);
  res.json({ ...car, maintenance, reservations });
};

const create = (req, res) => {
  const db = getDB();
  const { brand, model, year, plate, category, color, fuel, seats, transmission, daily_rate, deposit, mileage, next_maintenance_date, insurance_expiry, vignette_expiry, visite_expiry, notes } = req.body;
  if (!brand || !model || !plate || !daily_rate) return res.status(400).json({ error: 'Champs obligatoires manquants' });
  const id = uuidv4();
  db.prepare(`INSERT INTO cars (id,tenant_id,brand,model,year,plate,category,color,fuel,seats,transmission,daily_rate,deposit,mileage,next_maintenance_date,insurance_expiry,vignette_expiry,visite_expiry,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, req.tenantId, brand, model, year, plate, category||'Berline', color, fuel||'Essence', seats||5, transmission||'Manuelle',
    daily_rate, deposit||0, mileage||0, next_maintenance_date, insurance_expiry, vignette_expiry, visite_expiry, notes
  );
  res.status(201).json(db.prepare('SELECT * FROM cars WHERE id = ?').get(id));
};

const update = (req, res) => {
  const db = getDB();
  const car = db.prepare('SELECT id FROM cars WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!car) return res.status(404).json({ error: 'Véhicule introuvable' });
  const fields = ['brand','model','year','plate','category','color','fuel','seats','transmission','daily_rate','deposit','mileage','status','next_maintenance_date','insurance_expiry','vignette_expiry','visite_expiry','notes'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (!updates.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  updates.push('updated_at = datetime("now")');
  params.push(req.params.id);
  db.prepare(`UPDATE cars SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json(db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id));
};

const remove = (req, res) => {
  const db = getDB();
  const car = db.prepare('SELECT id FROM cars WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!car) return res.status(404).json({ error: 'Véhicule introuvable' });
  db.prepare('UPDATE cars SET status = ? WHERE id = ?').run('retired', req.params.id);
  res.json({ message: 'Véhicule archivé' });
};

const getStats = (req, res) => {
  const db = getDB();
  const total = db.prepare('SELECT COUNT(*) as count FROM cars WHERE tenant_id = ?').get(req.tenantId).count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM cars WHERE tenant_id = ? GROUP BY status').all(req.tenantId);
  const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM cars WHERE tenant_id = ? GROUP BY category').all(req.tenantId);
  res.json({ total, byStatus, byCategory });
};

module.exports = { getAll, getOne, create, update, remove, getStats, uploadPhoto, getPhotos, addPhoto, deletePhoto, setPrimary };
