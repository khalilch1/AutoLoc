const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

const CARS = [
  { brand: 'Dacia', model: 'Logan', year: 2022, category: 'Économique', color: 'Blanc', fuel: 'Essence', seats: 5, trans: 'Manuelle', rate: 250, deposit: 1500, mileage: 24000, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/2021_Dacia_Logan_III_%28front%29.jpg/960px-2021_Dacia_Logan_III_%28front%29.jpg' },
  { brand: 'Renault', model: 'Clio 5', year: 2023, category: 'Citadine', color: 'Rouge', fuel: 'Essence', seats: 5, trans: 'Manuelle', rate: 300, deposit: 1500, mileage: 15200, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2019_Renault_Clio_Iconic_Front.jpg/960px-2019_Renault_Clio_Iconic_Front.jpg' },
  { brand: 'Peugeot', model: '208', year: 2022, category: 'Citadine', color: 'Gris', fuel: 'Essence', seats: 5, trans: 'Automatique', rate: 320, deposit: 1800, mileage: 19800, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/2020_Peugeot_208_GT_Line_Front.jpg/960px-2020_Peugeot_208_GT_Line_Front.jpg' },
  { brand: 'Volkswagen', model: 'Golf 8', year: 2022, category: 'Compacte', color: 'Noir', fuel: 'Diesel', seats: 5, trans: 'Automatique', rate: 450, deposit: 2500, mileage: 28700, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/2020_Volkswagen_Golf_Style_1.5_Front.jpg/960px-2020_Volkswagen_Golf_Style_1.5_Front.jpg' },
  { brand: 'Hyundai', model: 'Tucson', year: 2023, category: 'SUV', color: 'Blanc', fuel: 'Essence', seats: 5, trans: 'Automatique', rate: 600, deposit: 2500, mileage: 12300, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Hyundai_Tucson_NX4_1.6_GLS_HEV_Pine_Green_Matte_-_front.jpg/960px-Hyundai_Tucson_NX4_1.6_GLS_HEV_Pine_Green_Matte_-_front.jpg' },
  { brand: 'Toyota', model: 'Corolla', year: 2022, category: 'Berline', color: 'Gris', fuel: 'Hybride', seats: 5, trans: 'Automatique', rate: 500, deposit: 2000, mileage: 16400, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/2019_Toyota_Corolla_Altis_%28front%29.jpg/960px-2019_Toyota_Corolla_Altis_%28front%29.jpg' },
  { brand: 'Dacia', model: 'Duster', year: 2023, category: 'SUV', color: 'Marron', fuel: 'Diesel', seats: 5, trans: 'Manuelle', rate: 400, deposit: 2000, mileage: 15600, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Dacia_Duster_III_IMG_8961.jpg/960px-Dacia_Duster_III_IMG_8961.jpg' },
  { brand: 'Mercedes-Benz', model: 'Classe C', year: 2022, category: 'Berline Premium', color: 'Noir', fuel: 'Diesel', seats: 5, trans: 'Automatique', rate: 750, deposit: 3500, mileage: 32100, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Mercedes-Benz_C_200_4MATIC_AVANTGARDE_%28W206%29_front.jpg/960px-Mercedes-Benz_C_200_4MATIC_AVANTGARDE_%28W206%29_front.jpg' },
  { brand: 'BMW', model: 'Série 3', year: 2023, category: 'Berline Premium', color: 'Bleu', fuel: 'Essence', seats: 5, trans: 'Automatique', rate: 700, deposit: 3000, mileage: 18500, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/2019_BMW_320d_xDrive_M_Sport_2.0_Front.jpg/960px-2019_BMW_320d_xDrive_M_Sport_2.0_Front.jpg' },
  { brand: 'Range Rover', model: 'Evoque', year: 2023, category: 'SUV Premium', color: 'Rouge', fuel: 'Essence', seats: 5, trans: 'Automatique', rate: 1200, deposit: 5000, mileage: 5400, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/2019_Land_Rover_Range_Rover_Evoque_First_Edition_D180_Automatic_2.0_Front.jpg/960px-2019_Land_Rover_Range_Rover_Evoque_First_Edition_D180_Automatic_2.0_Front.jpg' },
  { brand: 'Kia', model: 'Sportage', year: 2023, category: 'SUV', color: 'Gris', fuel: 'Essence', seats: 5, trans: 'Automatique', rate: 550, deposit: 2500, mileage: 9200, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/2023_Kia_Sportage_X-Line_AWD%2C_front_right.jpg/960px-2023_Kia_Sportage_X-Line_AWD%2C_front_right.jpg' },
  { brand: 'Ford', model: 'Fiesta', year: 2021, category: 'Citadine', color: 'Blanc', fuel: 'Essence', seats: 5, trans: 'Manuelle', rate: 280, deposit: 1500, mileage: 33400, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/2019_Ford_Fiesta_Active_X_Turbo_1.0_Front.jpg/960px-2019_Ford_Fiesta_Active_X_Turbo_1.0_Front.jpg' },
];

const CLIENTS = [
  { fn: 'Mohammed', ln: 'El Fassi', email: 'melfassi@gmail.com', phone: '+212 661-234567', cin: 'BE123456', lic: 'AB-12345', licExp: '2027-05-15', city: 'Casablanca', status: 'vip', nat: 'Marocaine' },
  { fn: 'Sarah', ln: 'Benali', email: 'sarah.benali@outlook.com', phone: '+212 662-345678', cin: 'CD789012', lic: 'CD-67890', licExp: '2026-11-20', city: 'Rabat', status: 'active', nat: 'Marocaine' },
  { fn: 'Youssef', ln: 'Alaoui', email: 'yalaoui@gmail.com', phone: '+212 663-456789', cin: 'EF345678', lic: 'EF-11111', licExp: '2027-08-10', city: 'Tanger', status: 'vip', nat: 'Marocaine' },
  { fn: 'Fatima', ln: 'Zahra', email: 'fzahra@hotmail.com', phone: '+212 664-567890', cin: 'GH678901', lic: 'GH-22222', licExp: '2028-03-25', city: 'Marrakech', status: 'active', nat: 'Marocaine' },
  { fn: 'Karim', ln: 'Mansouri', email: 'kmansouri@gmail.com', phone: '+212 665-678901', cin: 'IJ901234', lic: 'IJ-33333', licExp: '2026-07-15', city: 'Fès', status: 'active', nat: 'Marocaine' },
  { fn: 'Nadia', ln: 'Chraibi', email: 'nchraibi@gmail.com', phone: '+212 666-789012', cin: 'KL234567', lic: 'KL-44444', licExp: '2027-12-01', city: 'Tanger', status: 'active', nat: 'Marocaine' },
  { fn: 'Omar', ln: 'Berrada', email: 'oberrada@yahoo.fr', phone: '+212 667-890123', cin: 'MN567890', lic: 'MN-55555', licExp: '2027-04-20', city: 'Agadir', status: 'active', nat: 'Marocaine' },
  { fn: 'Leila', ln: 'Tahiri', email: 'ltahiri@gmail.com', phone: '+212 668-901234', cin: 'OP123456', lic: 'OP-66666', licExp: '2028-01-10', city: 'Tanger', status: 'active', nat: 'Marocaine' },
  { fn: 'Hassan', ln: 'El Idrissi', email: 'helidrissi@hotmail.com', phone: '+212 669-012345', cin: 'QR789012', lic: 'QR-88888', licExp: '2027-06-30', city: 'Tétouan', status: 'active', nat: 'Marocaine' },
  { fn: 'Ahmed', ln: 'Bouazza', email: 'abouazza@gmail.com', phone: '+212 660-123456', cin: 'ST345678', lic: 'ST-00001', licExp: '2028-02-28', city: 'Tanger', status: 'vip', nat: 'Marocaine' },
];

const seedDemoData = (req, res) => {
  const db = getDB();
  const tenantId = req.tenantId;

  const insertTx = db.transaction(() => {
    const carIds = [];
    for (const c of CARS) {
      const id = uuidv4();
      carIds.push(id);
      db.prepare(`INSERT INTO cars (id,tenant_id,brand,model,year,plate,category,color,fuel,seats,transmission,daily_rate,deposit,mileage,status,next_maintenance_date,insurance_expiry,vignette_expiry,visite_expiry,image_url)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, tenantId, c.brand, c.model, c.year,
        `${Math.floor(10000 + Math.random() * 89999)}-${String.fromCharCode(65 + carIds.length)}-7`,
        c.category, c.color, c.fuel, c.seats, c.trans, c.rate, c.deposit, c.mileage, 'available',
        daysFromNow(30), daysFromNow(200), daysFromNow(300), daysFromNow(150), c.photo
      );
      db.prepare('INSERT INTO car_photos (id,car_id,tenant_id,url,is_primary) VALUES (?,?,?,?,1)')
        .run(uuidv4(), id, tenantId, c.photo);
    }

    const clientIds = [];
    for (const c of CLIENTS) {
      const id = uuidv4();
      clientIds.push(id);
      db.prepare(`INSERT INTO clients (id,tenant_id,first_name,last_name,email,phone,cin,license_number,license_expiry,city,status,nationality)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        id, tenantId, c.fn, c.ln, c.email, c.phone, c.cin, c.lic, c.licExp, c.city, c.status, c.nat
      );
    }

    const resInsert = db.prepare(`INSERT INTO reservations
      (id,tenant_id,client_id,car_id,start_date,end_date,daily_rate,status,pickup_location,return_location,deposit_amount,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const ctrInsert = db.prepare(`INSERT INTO contracts
      (id,tenant_id,reservation_id,contract_number,start_mileage,fuel_level_start,fuel_level_end,end_mileage,damages_start,damages_end,status,signed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const invInsert = db.prepare(`INSERT INTO invoices
      (id,tenant_id,reservation_id,client_id,invoice_number,issue_date,due_date,subtotal,tax_rate,tax_amount,discount,total,status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const lineInsert = db.prepare(`INSERT INTO invoice_lines (id,invoice_id,description,quantity,unit_price,total) VALUES (?,?,?,?,?,?)`);
    const payInsert = db.prepare(`INSERT INTO payments (id,tenant_id,invoice_id,amount,method,payment_date) VALUES (?,?,?,?,?,?)`);

    const existingCtr = db.prepare('SELECT COUNT(*) as c FROM contracts WHERE tenant_id = ?').get(tenantId).c;
    const existingInv = db.prepare('SELECT COUNT(*) as c FROM invoices WHERE tenant_id = ?').get(tenantId).c;
    let ctrCounter = existingCtr + 1;
    let invCounter = existingInv + 1;
    const year = new Date().getFullYear();

    function makeReservation({ clientIdx, carIdx, startDay, endDay, status, paid = false, method = 'cash', createdDaysAgo = 0 }) {
      const clientId = clientIds[clientIdx];
      const carId = carIds[carIdx];
      const car = CARS[carIdx];
      const start = daysAgo(startDay);
      const end = startDay > endDay ? daysAgo(endDay) : daysFromNow(-endDay);
      const nights = Math.max(1, Math.abs(startDay - endDay));
      const subtotal = car.rate * nights;
      const tax = subtotal * 0.2;
      const total = subtotal + tax;

      const resId = uuidv4();
      const ctrId = uuidv4();
      const invId = uuidv4();
      const ctrNum = `CTR-${year}-${String(ctrCounter++).padStart(4, '0')}`;
      const invNum = `FAC-${year}-${String(invCounter++).padStart(4, '0')}`;
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - createdDaysAgo);

      resInsert.run(resId, tenantId, clientId, carId, start, end, car.rate, status, 'Agence', 'Agence', car.deposit, createdAt.toISOString());

      if (['active', 'completed'].includes(status)) {
        ctrInsert.run(ctrId, tenantId, resId, ctrNum, car.mileage - 400, 'full',
          status === 'completed' ? 'full' : null,
          status === 'completed' ? car.mileage : null,
          'RAS', status === 'completed' ? 'RAS' : null,
          status === 'completed' ? 'closed' : 'signed', start + 'T09:00:00');
      }

      invInsert.run(invId, tenantId, resId, clientId, invNum, start, end, subtotal, 20, tax, 0, total, paid ? 'paid' : 'pending');
      lineInsert.run(uuidv4(), invId, `Location ${car.brand} ${car.model} — ${nights} jour(s)`, nights, car.rate, subtotal);
      if (paid) payInsert.run(uuidv4(), tenantId, invId, total, method, start);
    }

    // Réservations terminées (payées)
    makeReservation({ clientIdx: 0, carIdx: 1, startDay: 60, endDay: 55, status: 'completed', paid: true, method: 'card', createdDaysAgo: 61 });
    makeReservation({ clientIdx: 2, carIdx: 4, startDay: 50, endDay: 45, status: 'completed', paid: true, method: 'transfer', createdDaysAgo: 51 });
    makeReservation({ clientIdx: 8, carIdx: 0, startDay: 40, endDay: 37, status: 'completed', paid: true, method: 'cash', createdDaysAgo: 41 });
    makeReservation({ clientIdx: 1, carIdx: 7, startDay: 32, endDay: 28, status: 'completed', paid: true, method: 'card', createdDaysAgo: 33 });
    makeReservation({ clientIdx: 9, carIdx: 9, startDay: 20, endDay: 15, status: 'completed', paid: true, method: 'transfer', createdDaysAgo: 21 });
    makeReservation({ clientIdx: 3, carIdx: 5, startDay: 12, endDay: 9, status: 'completed', paid: true, method: 'cash', createdDaysAgo: 13 });

    // Réservations actives
    makeReservation({ clientIdx: 4, carIdx: 7, startDay: 2, endDay: -3, status: 'active', paid: false, createdDaysAgo: 3 });
    makeReservation({ clientIdx: 6, carIdx: 10, startDay: 1, endDay: -2, status: 'active', paid: false, createdDaysAgo: 2 });

    // Réservations confirmées / à venir
    makeReservation({ clientIdx: 5, carIdx: 8, startDay: -3, endDay: -8, status: 'confirmed', paid: false, createdDaysAgo: 1 });
    makeReservation({ clientIdx: 7, carIdx: 2, startDay: -5, endDay: -9, status: 'confirmed', paid: false, createdDaysAgo: 1 });

    // Réservations en attente
    makeReservation({ clientIdx: 0, carIdx: 6, startDay: -7, endDay: -11, status: 'pending', paid: false, createdDaysAgo: 0 });

    db.prepare("UPDATE cars SET status='rented' WHERE id IN (?,?,?,?)").run(carIds[7], carIds[10], carIds[8], carIds[2]);
  });

  insertTx();

  res.status(201).json({
    message: 'Données de démo créées avec succès',
    cars: CARS.length,
    clients: CLIENTS.length,
  });
};

module.exports = { seedDemoData };
