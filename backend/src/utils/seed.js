require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDB, initDB } = require('../config/database');

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

async function seed() {
  console.log('🌱 Seeding demo database...');
  initDB();
  const db = getDB();

  db.exec(`
    DELETE FROM payments; DELETE FROM invoice_lines; DELETE FROM invoices;
    DELETE FROM maintenance; DELETE FROM contracts; DELETE FROM reservations;
    DELETE FROM clients; DELETE FROM cars; DELETE FROM users;
    DELETE FROM subscriptions; DELETE FROM tenants;
  `);

  // ── TENANT ────────────────────────────────────────────────
  const tenantId = uuidv4();
  const userId   = uuidv4();
  const pw       = bcrypt.hashSync('Demo1234!', 10);

  db.prepare(`INSERT INTO tenants (id,name,email,phone,address,city,plan,plan_expires_at,ice,is_active)
    VALUES (?,?,?,?,?,?,?,?,?,1)`).run(
    tenantId, 'Location Premium Tanger', 'demo@autoloc.ma',
    '+212 539-123456', '45 Boulevard Mohammed V', 'Tanger', 'pro',
    '2026-12-31', '001234567000089'
  );
  db.prepare(`INSERT INTO users (id,tenant_id,first_name,last_name,email,password_hash,role) VALUES (?,?,?,?,?,?,?)`).run(
    userId, tenantId, 'Khalil', 'El Amrani', 'demo@autoloc.ma', pw, 'admin'
  );
  db.prepare(`INSERT INTO subscriptions (id,tenant_id,plan,billing_cycle,price,started_at,expires_at,status) VALUES (?,?,?,?,?,?,?,?)`).run(
    uuidv4(), tenantId, 'pro', 'monthly', 599, '2024-01-01', '2026-12-31', 'active'
  );

  // ── CARS ──────────────────────────────────────────────────
  const carsData = [
    { brand:'BMW',        model:'320i',      year:2023, plate:'12345-A-7', cat:'Berline',      color:'Noir',    fuel:'Essence', seats:5, trans:'Automatique', rate:650,  deposit:3000, mileage:18500, status:'available',    ins:'2026-06-01', vig:'2026-12-31', vis:'2026-03-01' },
    { brand:'Mercedes',   model:'C200',      year:2022, plate:'67890-B-7', cat:'Berline',      color:'Blanc',   fuel:'Diesel',  seats:5, trans:'Automatique', rate:750,  deposit:3500, mileage:32100, status:'rented',       ins:'2026-05-15', vig:'2026-12-31', vis:'2026-04-01' },
    { brand:'Toyota',     model:'RAV4',      year:2023, plate:'11111-C-7', cat:'SUV',          color:'Gris',    fuel:'Hybride', seats:5, trans:'Automatique', rate:700,  deposit:3000, mileage:8900,  status:'available',    ins:'2026-07-01', vig:'2026-12-31', vis:'2026-06-01' },
    { brand:'Audi',       model:'A4',        year:2021, plate:'22222-D-7', cat:'Berline',      color:'Bleu',    fuel:'Diesel',  seats:5, trans:'Automatique', rate:600,  deposit:3000, mileage:54200, status:'maintenance',  ins:'2026-04-01', vig:'2026-12-31', vis:'2025-11-01' },
    { brand:'Range Rover',model:'Evoque',    year:2023, plate:'33333-E-7', cat:'SUV Premium',  color:'Rouge',   fuel:'Essence', seats:5, trans:'Automatique', rate:1200, deposit:5000, mileage:5400,  status:'available',    ins:'2026-08-01', vig:'2026-12-31', vis:'2026-07-01' },
    { brand:'Renault',    model:'Clio',      year:2022, plate:'44444-F-7', cat:'Citadine',     color:'Blanc',   fuel:'Essence', seats:5, trans:'Manuelle',    rate:300,  deposit:1500, mileage:28700, status:'available',    ins:'2026-05-01', vig:'2026-12-31', vis:'2026-02-01' },
    { brand:'Volkswagen', model:'Passat',    year:2022, plate:'55555-G-7', cat:'Berline',      color:'Gris',    fuel:'Diesel',  seats:5, trans:'Automatique', rate:550,  deposit:2500, mileage:41200, status:'available',    ins:'2026-06-15', vig:'2026-12-31', vis:'2026-05-01' },
    { brand:'Dacia',      model:'Duster',    year:2023, plate:'66666-H-7', cat:'SUV',          color:'Marron',  fuel:'Diesel',  seats:5, trans:'Manuelle',    rate:400,  deposit:2000, mileage:15600, status:'available',    ins:'2026-07-15', vig:'2026-12-31', vis:'2026-06-15' },
    { brand:'Hyundai',    model:'Tucson',    year:2023, plate:'77777-I-7', cat:'SUV',          color:'Blanc',   fuel:'Essence', seats:5, trans:'Automatique', rate:600,  deposit:2500, mileage:12300, status:'available',    ins:'2026-08-15', vig:'2026-12-31', vis:'2026-07-15' },
    { brand:'Peugeot',    model:'508',       year:2022, plate:'88888-J-7', cat:'Berline',      color:'Noir',    fuel:'Diesel',  seats:5, trans:'Automatique', rate:500,  deposit:2500, mileage:36800, status:'rented',       ins:'2026-05-01', vig:'2026-12-31', vis:'2026-04-01' },
    { brand:'Ford',       model:'Explorer',  year:2023, plate:'99999-K-7', cat:'SUV Premium',  color:'Gris',    fuel:'Essence', seats:7, trans:'Automatique', rate:900,  deposit:4000, mileage:7200,  status:'available',    ins:'2026-09-01', vig:'2026-12-31', vis:'2026-08-01' },
    { brand:'Kia',        model:'Sportage',  year:2022, plate:'10101-L-7', cat:'SUV',          color:'Bleu',    fuel:'Essence', seats:5, trans:'Automatique', rate:520,  deposit:2500, mileage:22400, status:'available',    ins:'2026-06-01', vig:'2026-12-31', vis:'2026-05-01' },
  ];
  const carIds = [];
  for (const c of carsData) {
    const id = uuidv4(); carIds.push(id);
    db.prepare(`INSERT INTO cars (id,tenant_id,brand,model,year,plate,category,color,fuel,seats,transmission,daily_rate,deposit,mileage,status,next_maintenance_date,insurance_expiry,vignette_expiry,visite_expiry)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, tenantId, c.brand, c.model, c.year, c.plate,
      c.cat, c.color, c.fuel, c.seats, c.trans, c.rate, c.deposit, c.mileage, c.status,
      daysFromNow(30), c.ins, c.vig, c.vis
    );
  }

  // ── CLIENTS ───────────────────────────────────────────────
  const clientsData = [
    { fn:'Mohammed', ln:'El Fassi',  email:'melfassi@gmail.com',        phone:'+212 661-234567', cin:'BE123456', lic:'AB-12345', licExp:'2026-05-15', city:'Casablanca', status:'vip',       nat:'Marocaine' },
    { fn:'Sarah',    ln:'Benali',    email:'sarah.benali@outlook.com',   phone:'+212 662-345678', cin:'CD789012', lic:'CD-67890', licExp:'2025-11-20', city:'Rabat',      status:'active',    nat:'Marocaine' },
    { fn:'Youssef',  ln:'Alaoui',    email:'yalaoui@gmail.com',          phone:'+212 663-456789', cin:'EF345678', lic:'EF-11111', licExp:'2026-08-10', city:'Tanger',     status:'vip',       nat:'Marocaine' },
    { fn:'Fatima',   ln:'Zahra',     email:'fzahra@hotmail.com',         phone:'+212 664-567890', cin:'GH678901', lic:'GH-22222', licExp:'2027-03-25', city:'Marrakech',  status:'active',    nat:'Marocaine' },
    { fn:'Karim',    ln:'Mansouri',  email:'kmansouri@gmail.com',        phone:'+212 665-678901', cin:'IJ901234', lic:'IJ-33333', licExp:'2025-07-15', city:'Fès',        status:'active',    nat:'Marocaine' },
    { fn:'Nadia',    ln:'Chraibi',   email:'nchraibi@gmail.com',         phone:'+212 666-789012', cin:'KL234567', lic:'KL-44444', licExp:'2026-12-01', city:'Tanger',     status:'active',    nat:'Marocaine' },
    { fn:'Omar',     ln:'Berrada',   email:'oberrada@yahoo.fr',          phone:'+212 667-890123', cin:'MN567890', lic:'MN-55555', licExp:'2026-04-20', city:'Agadir',     status:'active',    nat:'Marocaine' },
    { fn:'Leila',    ln:'Tahiri',    email:'ltahiri@gmail.com',          phone:'+212 668-901234', cin:'OP123456', lic:'OP-66666', licExp:'2027-01-10', city:'Tanger',     status:'active',    nat:'Marocaine' },
    { fn:'Pierre',   ln:'Dupont',    email:'pierre.dupont@gmail.com',    phone:'+33 6 12-345678', cin:'',         lic:'FR-77777', licExp:'2026-09-15', city:'Paris',      status:'active',    nat:'Française' },
    { fn:'Hassan',   ln:'El Idrissi',email:'helidrissi@hotmail.com',     phone:'+212 669-012345', cin:'QR789012', lic:'QR-88888', licExp:'2026-06-30', city:'Tétouan',    status:'active',    nat:'Marocaine' },
    { fn:'Sofia',    ln:'Martini',   email:'sofia.martini@gmail.com',    phone:'+39 333-1234567', cin:'',         lic:'IT-99999', licExp:'2026-11-20', city:'Milan',      status:'active',    nat:'Italienne' },
    { fn:'Ahmed',    ln:'Bouazza',   email:'abouazza@gmail.com',         phone:'+212 660-123456', cin:'ST345678', lic:'ST-00001', licExp:'2027-02-28', city:'Tanger',     status:'vip',       nat:'Marocaine' },
  ];
  const clientIds = [];
  for (const c of clientsData) {
    const id = uuidv4(); clientIds.push(id);
    db.prepare(`INSERT INTO clients (id,tenant_id,first_name,last_name,email,phone,cin,license_number,license_expiry,city,status,nationality)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, tenantId, c.fn, c.ln, c.email, c.phone, c.cin, c.lic, c.licExp, c.city, c.status, c.nat
    );
  }

  // ── RESERVATIONS + CONTRACTS + INVOICES + PAYMENTS ────────
  const resInsert = db.prepare(`INSERT INTO reservations
    (id,tenant_id,client_id,car_id,start_date,end_date,daily_rate,status,pickup_location,return_location,deposit_amount,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);

  const ctrInsert = db.prepare(`INSERT INTO contracts
    (id,tenant_id,reservation_id,contract_number,start_mileage,fuel_level_start,fuel_level_end,end_mileage,status,signed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);

  const invInsert = db.prepare(`INSERT INTO invoices
    (id,tenant_id,reservation_id,client_id,invoice_number,issue_date,due_date,subtotal,tax_rate,tax_amount,discount,total,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);

  const lineInsert = db.prepare(`INSERT INTO invoice_lines (id,invoice_id,description,quantity,unit_price,total) VALUES (?,?,?,?,?,?)`);
  const payInsert  = db.prepare(`INSERT INTO payments (id,tenant_id,invoice_id,amount,method,payment_date) VALUES (?,?,?,?,?,?)`);

  let ctrCounter = 1;
  let invCounter = 1;

  function makeReservation({ clientIdx, carIdx, startDay, endDay, status, paid = false, method = 'cash', createdDaysAgo = 0 }) {
    const clientId = clientIds[clientIdx];
    const carId    = carIds[carIdx];
    const car      = carsData[carIdx];
    const start    = daysAgo(startDay);
    const end      = startDay > endDay ? daysAgo(endDay) : daysFromNow(endDay);
    const nights   = Math.max(1, Math.abs(startDay - endDay));
    const subtotal = car.rate * nights;
    const tax      = subtotal * 0.2;
    const total    = subtotal + tax;

    const resId = uuidv4();
    const ctrId = uuidv4();
    const invId = uuidv4();
    const ctrNum = `CTR-2025-${String(ctrCounter++).padStart(4,'0')}`;
    const invNum = `FAC-2025-${String(invCounter++).padStart(4,'0')}`;
    const createdAt = new Date(); createdAt.setDate(createdAt.getDate() - createdDaysAgo);

    resInsert.run(resId, tenantId, clientId, carId, start, end, car.rate, status, 'Agence Tanger', 'Agence Tanger', car.deposit, createdAt.toISOString());

    if (['active','completed'].includes(status)) {
      ctrInsert.run(ctrId, tenantId, resId, ctrNum, carsData[carIdx].mileage - 500, 'full',
        status === 'completed' ? 'full' : null,
        status === 'completed' ? carsData[carIdx].mileage : null,
        status === 'completed' ? 'closed' : 'signed', start + 'T08:00:00');
    }

    const invStatus = paid ? 'paid' : (status === 'completed' ? 'pending' : 'pending');
    invInsert.run(invId, tenantId, resId, clientId, invNum, start,
      end, subtotal, 20, tax, 0, total, invStatus);
    lineInsert.run(uuidv4(), invId, `Location ${car.brand} ${car.model} — ${nights} jour(s)`, nights, car.rate, subtotal);

    if (paid) {
      payInsert.run(uuidv4(), tenantId, invId, total, method, start);
    }

    return { resId, total };
  }

  // Réservations PASSÉES (complètes + payées) — derniers 6 mois
  makeReservation({ clientIdx:0,  carIdx:1,  startDay:180, endDay:175, status:'completed', paid:true, method:'card',     createdDaysAgo:182 });
  makeReservation({ clientIdx:2,  carIdx:4,  startDay:160, endDay:154, status:'completed', paid:true, method:'transfer',  createdDaysAgo:162 });
  makeReservation({ clientIdx:8,  carIdx:0,  startDay:145, endDay:141, status:'completed', paid:true, method:'cash',      createdDaysAgo:146 });
  makeReservation({ clientIdx:1,  carIdx:6,  startDay:130, endDay:127, status:'completed', paid:true, method:'card',      createdDaysAgo:131 });
  makeReservation({ clientIdx:11, carIdx:4,  startDay:120, endDay:115, status:'completed', paid:true, method:'transfer',  createdDaysAgo:122 });
  makeReservation({ clientIdx:3,  carIdx:8,  startDay:110, endDay:106, status:'completed', paid:true, method:'cash',      createdDaysAgo:112 });
  makeReservation({ clientIdx:6,  carIdx:2,  startDay:100, endDay:97,  status:'completed', paid:true, method:'card',      createdDaysAgo:102 });
  makeReservation({ clientIdx:9,  carIdx:5,  startDay:90,  endDay:87,  status:'completed', paid:true, method:'cash',      createdDaysAgo:91  });
  makeReservation({ clientIdx:4,  carIdx:10, startDay:80,  endDay:76,  status:'completed', paid:true, method:'transfer',  createdDaysAgo:82  });
  makeReservation({ clientIdx:7,  carIdx:0,  startDay:70,  endDay:67,  status:'completed', paid:true, method:'card',      createdDaysAgo:72  });
  makeReservation({ clientIdx:10, carIdx:6,  startDay:60,  endDay:57,  status:'completed', paid:true, method:'cash',      createdDaysAgo:62  });
  makeReservation({ clientIdx:5,  carIdx:3,  startDay:50,  endDay:47,  status:'completed', paid:true, method:'card',      createdDaysAgo:52  });
  makeReservation({ clientIdx:0,  carIdx:11, startDay:42,  endDay:39,  status:'completed', paid:true, method:'card',      createdDaysAgo:43  });
  makeReservation({ clientIdx:2,  carIdx:8,  startDay:35,  endDay:31,  status:'completed', paid:true, method:'transfer',  createdDaysAgo:36  });
  makeReservation({ clientIdx:11, carIdx:0,  startDay:28,  endDay:24,  status:'completed', paid:true, method:'card',      createdDaysAgo:30  });
  makeReservation({ clientIdx:3,  carIdx:6,  startDay:21,  endDay:18,  status:'completed', paid:true, method:'cash',      createdDaysAgo:22  });
  makeReservation({ clientIdx:8,  carIdx:4,  startDay:14,  endDay:11,  status:'completed', paid:true, method:'card',      createdDaysAgo:15  });
  makeReservation({ clientIdx:6,  carIdx:11, startDay:10,  endDay:7,   status:'completed', paid:true, method:'transfer',  createdDaysAgo:11  });

  // Réservations EN COURS (actives)
  makeReservation({ clientIdx:1,  carIdx:1,  startDay:3,   endDay:-4,  status:'active',    paid:false, createdDaysAgo:4  }); // Mercedes C200
  makeReservation({ clientIdx:9,  carIdx:9,  startDay:5,   endDay:-3,  status:'active',    paid:false, createdDaysAgo:6  }); // Peugeot 508

  // Réservations À VENIR (confirmées)
  makeReservation({ clientIdx:4,  carIdx:2,  startDay:-2,  endDay:-7,  status:'confirmed', paid:false, createdDaysAgo:1  });
  makeReservation({ clientIdx:7,  carIdx:4,  startDay:-3,  endDay:-8,  status:'confirmed', paid:false, createdDaysAgo:2  });
  makeReservation({ clientIdx:5,  carIdx:10, startDay:-5,  endDay:-10, status:'confirmed', paid:false, createdDaysAgo:3  });

  // Réservations EN ATTENTE
  makeReservation({ clientIdx:0,  carIdx:8,  startDay:-7,  endDay:-12, status:'pending',   paid:false, createdDaysAgo:0  });
  makeReservation({ clientIdx:3,  carIdx:5,  startDay:-10, endDay:-14, status:'pending',   paid:false, createdDaysAgo:1  });

  // ── MAINTENANCE ───────────────────────────────────────────
  const maintData = [
    { carIdx:3,  type:'Vidange',             desc:'Vidange huile + filtre air',            garage:'Garage Al Amal Tanger',      date:daysFromNow(5),   cost:450,  status:'scheduled'   },
    { carIdx:1,  type:'Contrôle technique',  desc:'Visite technique annuelle obligatoire', garage:'Centre Technique Auto',       date:daysFromNow(12),  cost:250,  status:'scheduled'   },
    { carIdx:2,  type:'Révision complète',   desc:'Révision 20 000 km — Toyota',           garage:'Toyota Service Tanger',       date:daysFromNow(20),  cost:1200, status:'scheduled'   },
    { carIdx:6,  type:'Pneus',               desc:'Remplacement 2 pneus avant Michelin',   garage:'Pneus Pro Tanger',            date:daysFromNow(3),   cost:800,  status:'scheduled'   },
    { carIdx:0,  type:'Pneus',               desc:'Remplacement 4 pneus Bridgestone',      garage:'Pneus Pro Tanger',            date:daysAgo(30),      cost:1800, status:'completed'   },
    { carIdx:4,  type:'Révision complète',   desc:'Révision 5 000 km Range Rover',         garage:'Land Rover Service',          date:daysAgo(45),      cost:2200, status:'completed'   },
    { carIdx:5,  type:'Vidange',             desc:'Vidange huile moteur Renault Clio',      garage:'Garage El Mechkor',           date:daysAgo(20),      cost:320,  status:'completed'   },
    { carIdx:9,  type:'Freins',              desc:'Remplacement plaquettes frein avant',    garage:'Garage Al Amal Tanger',      date:daysAgo(10),      cost:580,  status:'completed'   },
    { carIdx:11, type:'Climatisation',       desc:'Recharge gaz climatisation',             garage:'Auto Clim Tanger',            date:daysFromNow(8),   cost:350,  status:'scheduled'   },
    { carIdx:7,  type:'Batterie',            desc:'Remplacement batterie 70Ah',             garage:'Garage El Mechkor',           date:daysAgo(5),       cost:480,  status:'completed'   },
  ];

  for (const m of maintData) {
    db.prepare(`INSERT INTO maintenance (id,tenant_id,car_id,type,description,garage,scheduled_date,cost,status,mileage_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
      uuidv4(), tenantId, carIds[m.carIdx], m.type, m.desc, m.garage, m.date, m.cost, m.status, carsData[m.carIdx].mileage
    );
    if (m.status === 'completed') {
      db.prepare("UPDATE maintenance SET completed_date=? WHERE scheduled_date=? AND car_id=?").run(m.date, m.date, carIds[m.carIdx]);
    }
  }

  // Mettre à jour status des voitures en maintenance
  db.prepare("UPDATE cars SET status='maintenance' WHERE id=?").run(carIds[3]);

  console.log('✅ Base de données peuplée avec succès !');
  console.log('');
  console.log('📧  Login: demo@autoloc.ma');
  console.log('🔑  Mot de passe: Demo1234!');
  console.log('');
  console.log('📊  Résumé:');
  console.log(`    🚗  ${carsData.length} véhicules`);
  console.log(`    👥  ${clientsData.length} clients`);
  console.log(`    📅  25 réservations (18 terminées, 2 actives, 5 à venir)`);
  console.log(`    🔧  ${maintData.length} entretiens`);

  db.close();
}

seed().catch(console.error);
