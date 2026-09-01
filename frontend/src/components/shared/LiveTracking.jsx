import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Gauge, Fuel, Navigation2, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// A closed loop of waypoints around central Tanger, used to simulate a live GPS trace.
const TANGER_ROUTE = [
  [35.7595, -5.8340],
  [35.7638, -5.8285],
  [35.7695, -5.8225],
  [35.7732, -5.8155],
  [35.7708, -5.8065],
  [35.7655, -5.8020],
  [35.7590, -5.8045],
  [35.7532, -5.8090],
  [35.7498, -5.8175],
  [35.7520, -5.8260],
  [35.7560, -5.8310],
  [35.7595, -5.8340],
];

function carIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="background:#3B82F6;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(59,130,246,0.25);border:2px solid white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 17h14M5 17a2 2 0 104 0M15 17a2 2 0 104 0M5 17V9l2-4h10l2 4v8"/></svg>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function interpolate(route, t) {
  // t in [0, route.length - 1)
  const i = Math.floor(t);
  const frac = t - i;
  const [lat1, lng1] = route[i];
  const [lat2, lng2] = route[(i + 1) % route.length];
  return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LiveTracking({ car, client, pickup, dropoff }) {
  const [position, setPosition] = useState(TANGER_ROUTE[0]);
  const [speed, setSpeed] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const tRef = useRef(0);
  const lastPosRef = useRef(TANGER_ROUTE[0]);

  const totalRouteKm = useMemo(() => {
    let d = 0;
    for (let i = 0; i < TANGER_ROUTE.length - 1; i++) d += haversine(TANGER_ROUTE[i], TANGER_ROUTE[i + 1]);
    return d;
  }, []);

  useEffect(() => {
    const stepsPerLoop = (TANGER_ROUTE.length - 1) * 40; // smoothness
    const interval = setInterval(() => {
      tRef.current += (TANGER_ROUTE.length - 1) / stepsPerLoop;
      if (tRef.current >= TANGER_ROUTE.length - 1) tRef.current = 0;
      const next = interpolate(TANGER_ROUTE, tRef.current);
      const stepKm = haversine(lastPosRef.current, next);
      lastPosRef.current = next;
      setPosition(next);
      setDistanceKm(d => d + stepKm);
      // Simulated speed: distance per tick, scaled to look like km/h in city traffic
      setSpeed(35 + Math.round(Math.sin(tRef.current * 3) * 15) + Math.round(Math.random() * 6));
    }, 350);
    return () => clearInterval(interval);
  }, []);

  const eta = Math.max(1, Math.round((totalRouteKm - distanceKm % totalRouteKm) / (speed || 40) * 60));

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-navy rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate mb-1"><Gauge size={13} /> Vitesse</div>
          <div className="font-bold text-sm">{speed} km/h</div>
        </div>
        <div className="bg-navy rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate mb-1"><Navigation2 size={13} /> Parcouru</div>
          <div className="font-bold text-sm">{distanceKm.toFixed(1)} km</div>
        </div>
        <div className="bg-navy rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate mb-1"><Clock size={13} /> ETA prochain arrêt</div>
          <div className="font-bold text-sm">{eta} min</div>
        </div>
        <div className="bg-navy rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate mb-1"><Fuel size={13} /> Carburant estimé</div>
          <div className="font-bold text-sm">{Math.max(15, 100 - Math.round(distanceKm * 1.8))}%</div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-navy-light" style={{ height: 360 }}>
        <MapContainer center={TANGER_ROUTE[0]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={TANGER_ROUTE} pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.5, dashArray: '6 6' }} />
          <Marker position={position} icon={carIcon()}>
            <Popup>
              <div style={{ fontSize: 12 }}>
                <strong>{car?.brand} {car?.model}</strong><br />
                {car?.plate}<br />
                Client : {client}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="text-xs text-slate mt-3 text-center">
        Position simulée en temps réel — {pickup || 'Agence'} → {dropoff || 'Agence'}
      </div>
    </div>
  );
}
