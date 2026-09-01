const PDFDocument = require('pdfkit');

const FUEL_LABELS = { full: 'Plein', three_quarter: '3/4', half: '1/2', quarter: '1/4', empty: 'Vide' };
const FUEL_RATIO = { empty: 0, quarter: 0.25, half: 0.5, three_quarter: 0.75, full: 1 };

function drawCarTopSchema(doc, x, y, w, h) {
  const cx = x + w / 2;
  const bodyTop = y + 20;
  const bodyBottom = y + h - 20;
  const bodyW = w * 0.42;

  doc.save();
  doc.lineWidth(1.2).strokeColor('#334155');

  // outer body outline (rounded rectangle silhouette, top-down view)
  doc.roundedRect(cx - bodyW / 2, bodyTop, bodyW, bodyBottom - bodyTop, bodyW * 0.16).stroke();

  // windshield + rear window lines
  const windTop = bodyTop + (bodyBottom - bodyTop) * 0.22;
  const windBottom = bodyTop + (bodyBottom - bodyTop) * 0.62;
  doc.moveTo(cx - bodyW / 2 + 4, windTop).lineTo(cx + bodyW / 2 - 4, windTop).stroke();
  doc.moveTo(cx - bodyW / 2 + 4, windBottom).lineTo(cx + bodyW / 2 - 4, windBottom).stroke();
  // roof center line
  doc.dash(2, { space: 2 });
  doc.moveTo(cx, windTop).lineTo(cx, windBottom).stroke();
  doc.undash();

  // 4 wheels as small rectangles on the sides
  const wheelW = 7, wheelH = 22;
  const wheelYFront = bodyTop + (bodyBottom - bodyTop) * 0.18;
  const wheelYRear = bodyBottom - (bodyBottom - bodyTop) * 0.18 - wheelH;
  [wheelYFront, wheelYRear].forEach((wy) => {
    doc.rect(cx - bodyW / 2 - wheelW + 2, wy, wheelW, wheelH).fillAndStroke('#334155', '#334155');
    doc.rect(cx + bodyW / 2 - 2, wy, wheelW, wheelH).fillAndStroke('#334155', '#334155');
  });

  // side mirrors
  doc.circle(cx - bodyW / 2 - 2, windTop - 2, 2.5).fillAndStroke('#334155', '#334155');
  doc.circle(cx + bodyW / 2 + 2, windTop - 2, 2.5).fillAndStroke('#334155', '#334155');

  doc.fillColor('#334155');

  // "AVANT" label rotated on the left, "ARRIERE" rotated on the right (like the paper template)
  doc.fontSize(7).font('Helvetica-Bold');
  doc.save();
  doc.rotate(-90, { origin: [x + 8, y + h / 2] });
  doc.text('AVANT', x + 8 - 20, y + h / 2 - 4, { width: 40, align: 'center' });
  doc.restore();

  doc.save();
  doc.rotate(-90, { origin: [x + w - 8, y + h / 2] });
  doc.text('ARRIERE', x + w - 8 - 20, y + h / 2 - 4, { width: 40, align: 'center' });
  doc.restore();

  doc.restore();
}

function drawFuelGauge(doc, x, y, radius, level) {
  const ratio = FUEL_RATIO[level] ?? 1;
  const startAngle = Math.PI; // left
  const endAngle = 0; // right
  const angle = startAngle + (endAngle - startAngle) * ratio;

  doc.save();
  doc.lineWidth(1).strokeColor('#334155');
  doc.path(describeArc(x, y, radius, startAngle, endAngle)).stroke();

  // ticks: 0, 1/4, 1/2, 3/4, plein
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labels = ['0', '1/4', '1/2', '3/4', 'plein'];
  doc.fontSize(6).font('Helvetica');
  ticks.forEach((t, i) => {
    const a = startAngle + (endAngle - startAngle) * t;
    const tx1 = x + Math.cos(a) * radius;
    const ty1 = y - Math.sin(a) * radius;
    const tx2 = x + Math.cos(a) * (radius + 4);
    const ty2 = y - Math.sin(a) * (radius + 4);
    doc.moveTo(tx1, ty1).lineTo(tx2, ty2).stroke();
    const lx = x + Math.cos(a) * (radius + 12);
    const ly = y - Math.sin(a) * (radius + 12);
    doc.fillColor(t === 0 || t === 0.25 ? '#DC2626' : '#334155');
    doc.text(labels[i], lx - 8, ly - 4, { width: 16, align: 'center' });
  });

  // needle
  const nx = x + Math.cos(angle) * (radius - 4);
  const ny = y - Math.sin(angle) * (radius - 4);
  doc.lineWidth(1.5).strokeColor('#DC2626');
  doc.moveTo(x, y).lineTo(nx, ny).stroke();
  doc.circle(x, y, 2).fillColor('#334155').fill();
  doc.restore();
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const steps = 24;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + (endAngle - startAngle) * (i / steps);
    const px = cx + Math.cos(a) * r;
    const py = cy - Math.sin(a) * r;
    d += (i === 0 ? 'M' : 'L') + px + ',' + py + ' ';
  }
  return d.trim();
}

function checkbox(doc, x, y, checked, size = 8) {
  doc.lineWidth(0.8).strokeColor('#334155').rect(x, y, size, size).stroke();
  if (checked) {
    doc.moveTo(x + 1, y + size / 2).lineTo(x + size / 2, y + size - 1).lineTo(x + size - 1, y + 1).stroke();
  }
}

function fmtDate(d) {
  if (!d) return '..........................';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

function line(doc, x1, y, x2) {
  doc.moveTo(x1, y).lineTo(x2, y).dash(1, { space: 1.5 }).stroke().undash();
}

function generateContractPdf(res, data) {
  const { contract, client, car, tenant } = data;
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${contract.contract_number}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width;
  const marginX = 36;
  const colW = (pageW - marginX * 2 - 20) / 2;

  // ---------- Header ----------
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#0EA5E9').text(tenant?.name || 'AutoLoc Pro', marginX, 36, { width: pageW - marginX * 2 });
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B')
    .text('Contrat de location de véhicule entre particuliers', marginX, 58, { width: pageW - marginX * 2 });
  doc.moveTo(marginX, 78).lineTo(pageW - marginX, 78).strokeColor('#CBD5E1').lineWidth(1).stroke();

  let y = 88;

  // ---------- Locataire / Propriétaire ----------
  const colStart = y;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('Le locataire', marginX, y);
  doc.fontSize(10).font('Helvetica-Bold').text('Le Propriétaire', marginX + colW + 20, y);
  y += 16;

  const leftField = (label, value) => {
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`${label} :`, marginX, y, { continued: false });
    doc.font('Helvetica-Bold').text(value || '..........................', marginX + 90, y, { width: colW - 90 });
    y += 14;
  };
  const rightField = (label, value, yy) => {
    doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text(`${label} :`, marginX + colW + 20, yy);
    doc.font('Helvetica-Bold').text(value || '..........................', marginX + colW + 20 + 100, yy, { width: colW - 100 });
  };

  const rowY0 = y;
  leftField('Prénom et Nom', `${client?.first_name || ''} ${client?.last_name || ''}`.trim());
  leftField('Téléphone', client?.phone);
  leftField('Adresse', client?.address);
  leftField('CIN / Permis n°', client?.cin || client?.license_number);
  leftField('Date obtention permis', client?.license_expiry ? '' : undefined);
  const leftBottom = y;

  rightField('Prénom et Nom', tenant?.name, rowY0);
  rightField('Téléphone(s)', tenant?.phone, rowY0 + 14);
  rightField('Marque et modèle', `${car?.brand || ''} ${car?.model || ''}`.trim(), rowY0 + 28);
  rightField('Immatriculation', car?.plate, rowY0 + 42);
  rightField("Date 1ère mise en circ.", car?.year ? String(car.year) : undefined, rowY0 + 56);

  y = Math.max(leftBottom, rowY0 + 70) + 8;
  doc.moveTo(marginX, y).lineTo(pageW - marginX, y).strokeColor('#E2E8F0').stroke();
  y += 10;

  // ---------- Assurance / dépôt ----------
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('Assurance, Assistance, dépôt de garantie', marginX, y);
  y += 16;
  doc.fontSize(8.5).font('Helvetica').fillColor('#334155')
    .text(`Dépôt de garantie : ${car?.deposit ? car.deposit + ' DH' : '..............'}`, marginX, y);
  y += 16;

  // ---------- La location ----------
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('La Location', marginX, y);
  y += 16;
  const locRowY = y;
  doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('Date et heure début :', marginX, locRowY);
  doc.font('Helvetica-Bold').text(fmtDate(contract.reservation_start || contract.start_date), marginX + 110, locRowY);
  doc.font('Helvetica').text('Date et heure fin :', marginX + colW + 20, locRowY);
  doc.font('Helvetica-Bold').text(fmtDate(contract.reservation_end || contract.end_date), marginX + colW + 20 + 110, locRowY);
  y += 16;
  doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('Kilométrage pré-payé :', marginX, y);
  doc.font('Helvetica-Bold').text(contract.included_km ? `${contract.included_km} km` : '300 km/jour', marginX + 110, y);
  doc.font('Helvetica').text('Prix de la location :', marginX + colW + 20, y);
  doc.font('Helvetica-Bold').text(contract.total_price ? `${contract.total_price} DH` : '..............', marginX + colW + 20 + 110, y);
  y += 22;

  // ---------- Etat du vehicule avant la location ----------
  doc.moveTo(marginX, y).lineTo(pageW - marginX, y).strokeColor('#CBD5E1').stroke();
  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('État du véhicule avant la location', marginX, y);
  y += 14;

  const schemaX = marginX, schemaY = y, schemaW = 160, schemaH = 140;
  doc.rect(schemaX, schemaY, schemaW, schemaH).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
  drawCarTopSchema(doc, schemaX, schemaY, schemaW, schemaH);
  doc.fontSize(7).font('Helvetica-Oblique').fillColor('#64748B')
    .text('Noter sur ce schéma les accrocs sur la carrosserie', schemaX, schemaY + schemaH + 4, { width: schemaW, align: 'center' });

  const infoX = schemaX + schemaW + 20;
  const infoW = pageW - marginX - infoX;
  let iy = schemaY;
  doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('Compteur km au départ :', infoX, iy);
  doc.font('Helvetica-Bold').text(contract.start_mileage != null ? `${contract.start_mileage} km` : '.........', infoX + 130, iy);
  iy += 16;
  doc.font('Helvetica').text('Carburant :', infoX, iy);
  drawFuelGauge(doc, infoX + 200, iy + 18, 26, contract.fuel_level_start || 'full');
  iy += 50;

  doc.font('Helvetica-Bold').text('État extérieur :', infoX, iy);
  iy += 12;
  doc.font('Helvetica').fillColor('#1E293B')
    .text(contract.damages_start || 'RAS', infoX, iy, { width: infoW });
  iy += 40;

  doc.font('Helvetica-Bold').fillColor('#334155').text('État intérieur :', infoX, iy);
  iy += 12;
  line(doc, infoX, iy + 8, infoX + infoW);
  line(doc, infoX, iy + 22, infoX + infoW);

  y = schemaY + schemaH + 24;

  // ---------- Clauses + Signatures ----------
  checkbox(doc, marginX, y, true);
  doc.fontSize(8).font('Helvetica').fillColor('#334155')
    .text('Les clauses de location détaillées applicables au présent contrat sont acceptées par les deux parties.', marginX + 14, y - 1, { width: pageW - marginX * 2 - 14 });
  y += 26;

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E293B').text('Signature du locataire :', marginX, y);
  doc.text('Signature du propriétaire :', marginX + colW + 20, y);
  y += 50;

  // ---------- Retour section ----------
  doc.moveTo(marginX, y).lineTo(pageW - marginX, y).strokeColor('#CBD5E1').stroke();
  y += 10;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B').text('Remplir au retour', marginX, y);
  y += 16;

  doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('Date et heure réelles de fin de location :', marginX, y);
  doc.font('Helvetica-Bold').text(fmtDate(contract.status === 'closed' ? contract.updated_at : null), marginX + 200, y);
  y += 16;

  doc.font('Helvetica').text('Compteur km au retour :', marginX, y);
  doc.font('Helvetica-Bold').text(contract.end_mileage != null ? `${contract.end_mileage} km` : '.........', marginX + 150, y);
  doc.font('Helvetica').text('Carburant au retour :', marginX + colW + 20, y);
  doc.font('Helvetica-Bold').text(contract.fuel_level_end ? FUEL_LABELS[contract.fuel_level_end] : '.........', marginX + colW + 20 + 120, y);
  y += 16;

  doc.font('Helvetica').text('Kilométrage parcouru :', marginX, y);
  const parcouru = contract.start_mileage != null && contract.end_mileage != null ? contract.end_mileage - contract.start_mileage : null;
  doc.font('Helvetica-Bold').text(parcouru != null ? `${parcouru} km` : '.........', marginX + 150, y);
  doc.font('Helvetica').text('Km supplémentaires facturés :', marginX + colW + 20, y);
  doc.font('Helvetica-Bold').text(contract.extra_km != null ? `${contract.extra_km} km` : '0 km', marginX + colW + 20 + 150, y);
  y += 20;

  doc.font('Helvetica-Bold').fillColor('#1E293B').text('État au retour :', marginX, y);
  y += 12;
  doc.font('Helvetica').fillColor('#1E293B').text(contract.damages_end || (contract.status === 'closed' ? 'RAS' : 'À compléter au retour'), marginX, y, { width: pageW - marginX * 2 });
  y += 30;

  const compte = contract.damages_end && contract.damages_end.trim() && contract.damages_end.trim().toLowerCase() !== 'ras' ? 'damaged' : 'clean';
  checkbox(doc, marginX, y, contract.status === 'closed' && compte === 'clean');
  doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('Aucun dommage - dépôt de garantie restitué', marginX + 14, y - 1);
  y += 16;
  checkbox(doc, marginX, y, contract.status === 'closed' && compte === 'damaged');
  doc.text('Dommages constatés - voir état au retour ci-dessus', marginX + 14, y - 1);

  const footerY = Math.min(y + 16, doc.page.height - doc.page.margins.bottom - 14);
  doc.fontSize(7).font('Helvetica-Oblique').fillColor('#94A3B8')
    .text(`Contrat ${contract.contract_number} — généré le ${new Date().toLocaleDateString('fr-FR')}`, marginX, footerY, { width: pageW - marginX * 2, align: 'center', lineBreak: false });

  doc.end();
}

module.exports = { generateContractPdf };
