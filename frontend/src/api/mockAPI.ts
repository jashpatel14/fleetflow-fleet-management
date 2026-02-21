// Mock API — returns fake data with realistic delays
// Activated when VITE_USE_MOCK=true

import {
  MOCK_USERS, MOCK_VEHICLES, MOCK_DRIVERS,
  MOCK_TRIPS, MOCK_MAINTENANCE, MOCK_FUEL,
} from './mockData';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));
const ok = (data: any) => ({ data });

// ── Helpers ──────────────────────────────────────────────────────────────────
const paginate = (arr: any[], page = 1, limit = 10) => {
  const p = parseInt(String(page)); const l = parseInt(String(limit));
  const slice = arr.slice((p - 1) * l, p * l);
  return { total: arr.length, page: p, limit: l, totalPages: Math.ceil(arr.length / l), data: slice };
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const mockAuthAPI = {
  login: async ({ email, password }: any) => {
    await delay();
    const user = MOCK_USERS[email];
    if (!user || user.password !== password) throw { response: { data: { error: 'Invalid email or password.' } } };
    const token = btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name }));
    return ok({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  },
  register: async () => { await delay(); return ok({ message: 'Mock: Registration skipped in demo mode.' }); },
  me: async () => { await delay(); return ok({ user: Object.values(MOCK_USERS)[0] }); },
};

// ── Vehicles ──────────────────────────────────────────────────────────────────
export const mockVehiclesAPI = {
  getAll: async ({ status, search, page = 1, limit = 10 }: any = {}) => {
    await delay();
    let list = [...MOCK_VEHICLES];
    if (status) list = list.filter(v => v.status === status);
    if (search) list = list.filter(v => [v.licensePlate, v.make, v.model].some(f => f.toLowerCase().includes(search.toLowerCase())));
    const { data: vehicles, ...meta } = paginate(list, page, limit);
    return ok({ vehicles, ...meta });
  },
  getStats: async () => {
    await delay(100);
    const s = MOCK_VEHICLES.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {} as any);
    return ok({ total: MOCK_VEHICLES.length, available: s.AVAILABLE || 0, onTrip: s.ON_TRIP || 0, inShop: s.IN_SHOP || 0, retired: s.RETIRED || 0 });
  },
  getById: async (id: string) => {
    await delay();
    const v = MOCK_VEHICLES.find(v => v.id === id);
    if (!v) throw { response: { status: 404, data: { error: 'Vehicle not found.' } } };
    return ok({ vehicle: { ...v, trips: MOCK_TRIPS.filter(t => t.vehicleId === id).slice(0, 5), maintenanceLogs: [], fuelLogs: [] } });
  },
  create: async (data: any) => {
    await delay(400);
    const existing = MOCK_VEHICLES.find(v => v.licensePlate === data.licensePlate);
    if (existing) throw { response: { data: { error: 'License plate already registered.' } } };
    const v = { ...data, id: 'v' + Date.now(), status: 'AVAILABLE', createdAt: new Date().toISOString(), _count: { trips: 0, maintenanceLogs: 0 } };
    MOCK_VEHICLES.push(v);
    return ok({ message: 'Vehicle registered.', vehicle: v });
  },
  update: async (id: string, data: any) => {
    await delay(400);
    const idx = MOCK_VEHICLES.findIndex(v => v.id === id);
    if (idx === -1) throw { response: { data: { error: 'Vehicle not found.' } } };
    MOCK_VEHICLES[idx] = { ...MOCK_VEHICLES[idx], ...data };
    return ok({ message: 'Vehicle updated.', vehicle: MOCK_VEHICLES[idx] });
  },
  changeStatus: async (id: string, status: string) => {
    await delay(400);
    const VALID: Record<string, string[]> = { AVAILABLE: ['ON_TRIP','IN_SHOP','RETIRED'], ON_TRIP: [], IN_SHOP: ['AVAILABLE'], RETIRED: [] };
    const v = MOCK_VEHICLES.find(v => v.id === id);
    if (!v) throw { response: { data: { error: 'Not found.' } } };
    if (!VALID[v.status].includes(status)) throw { response: { data: { error: `Invalid transition: ${v.status} → ${status}.` } } };
    v.status = status;
    return ok({ vehicle: v });
  },
};

// ── Drivers ───────────────────────────────────────────────────────────────────
export const mockDriversAPI = {
  getAll: async ({ status, search, page = 1, limit = 10 }: any = {}) => {
    await delay();
    let list = [...MOCK_DRIVERS];
    if (status) list = list.filter(d => d.status === status);
    if (search) list = list.filter(d => [d.name, d.licenseNumber, d.phone].some(f => f.toLowerCase().includes(search.toLowerCase())));
    const { data: drivers, ...meta } = paginate(list, page, limit);
    return ok({ drivers, ...meta });
  },
  getStats: async () => {
    await delay(100);
    const s = MOCK_DRIVERS.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {} as any);
    const expiring = MOCK_DRIVERS.filter(d => !d.isLicenseExpired && d.licenseExpiresInDays < 30).length;
    return ok({ total: MOCK_DRIVERS.length, onDuty: s.ON_DUTY || 0, offDuty: s.OFF_DUTY || 0, suspended: s.SUSPENDED || 0, expiringLicenses: expiring });
  },
  getById: async (id: string) => {
    await delay();
    const d = MOCK_DRIVERS.find(d => d.id === id);
    if (!d) throw { response: { status: 404, data: { error: 'Driver not found.' } } };
    return ok({ driver: { ...d, trips: [], totalTrips: d._count.trips, completedTrips: Math.floor(d._count.trips * 0.7), completionRate: 70 } });
  },
  create: async (data: any) => {
    await delay(400);
    const d = { ...data, id: 'd' + Date.now(), status: 'OFF_DUTY', safetyScore: 100, isLicenseExpired: false, licenseExpiresInDays: 999, _count: { trips: 0 } };
    MOCK_DRIVERS.push(d);
    return ok({ driver: d });
  },
  update: async (id: string, data: any) => {
    await delay(400);
    const idx = MOCK_DRIVERS.findIndex(d => d.id === id);
    if (idx === -1) throw { response: { data: { error: 'Driver not found.' } } };
    MOCK_DRIVERS[idx] = { ...MOCK_DRIVERS[idx], ...data };
    return ok({ driver: MOCK_DRIVERS[idx] });
  },
  changeStatus: async (id: string, status: string) => {
    await delay(400);
    const d = MOCK_DRIVERS.find(d => d.id === id);
    if (!d) throw { response: { data: { error: 'Not found.' } } };
    d.status = status;
    return ok({ driver: d });
  },
};

// ── Trips ─────────────────────────────────────────────────────────────────────
export const mockTripsAPI = {
  getAll: async ({ status, search, page = 1, limit = 10 }: any = {}) => {
    await delay();
    let list = [...MOCK_TRIPS].reverse();
    if (status) list = list.filter(t => t.status === status);
    if (search) list = list.filter(t => [t.tripNumber, t.origin, t.destination].some(f => f.toLowerCase().includes(search.toLowerCase())));
    const { data: trips, ...meta } = paginate(list, page, limit);
    return ok({ trips, ...meta });
  },
  getStats: async () => {
    await delay(100);
    const s = MOCK_TRIPS.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {} as any);
    const totalRevenue = MOCK_TRIPS.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.revenue, 0);
    return ok({ total: MOCK_TRIPS.length, draft: s.DRAFT||0, submitted: s.SUBMITTED||0, approved: s.APPROVED||0, dispatched: s.DISPATCHED||0, completed: s.COMPLETED||0, cancelled: s.CANCELLED||0, totalRevenue, totalExpenses: 0 });
  },
  getById: async (id: string) => {
    await delay();
    const t = MOCK_TRIPS.find(t => t.id === id);
    if (!t) throw { response: { status: 404, data: { error: 'Trip not found.' } } };
    return ok({ trip: { ...t, fuelLogs: MOCK_FUEL.filter(f => f.tripId === id) } });
  },
  create: async (data: any) => {
    await delay(500);
    const vehicle = MOCK_VEHICLES.find(v => v.id === data.vehicleId);
    const driver  = MOCK_DRIVERS.find(d => d.id === data.driverId);
    if (!vehicle) throw { response: { data: { error: 'Vehicle not found.' } } };
    if (!driver)  throw { response: { data: { error: 'Driver not found.' } } };
    if (parseFloat(data.cargoWeightTons) > vehicle.capacityTons)
      throw { response: { data: { error: `Cargo exceeds vehicle capacity (${vehicle.capacityTons}t).` } } };
    if (vehicle.status !== 'AVAILABLE') throw { response: { data: { error: 'Vehicle is not available.' } } };
    if (driver.status !== 'OFF_DUTY')   throw { response: { data: { error: 'Driver is not available.' } } };
    const trip = {
      ...data, id: 't' + Date.now(), status: 'DRAFT',
      tripNumber: `TRP-2026-${String(MOCK_TRIPS.length + 1).padStart(4, '0')}`,
      cargoWeightTons: parseFloat(data.cargoWeightTons), revenue: parseFloat(data.revenue || 0),
      startOdometer: null, endOdometer: null, miscExpenses: 0,
      submittedAt: null, approvedAt: null, dispatchedAt: null, completedAt: null, cancelledAt: null,
      createdAt: new Date().toISOString(), vehicle, driver, _count: { fuelLogs: 0 },
    };
    MOCK_TRIPS.push(trip);
    return ok({ trip });
  },
  advance: async (id: string, status: string, extra: any) => {
    await delay(500);
    const NOW = new Date().toISOString();
    const VALID: Record<string, string[]> = { DRAFT: ['SUBMITTED','CANCELLED'], SUBMITTED: ['APPROVED','CANCELLED'], APPROVED: ['DISPATCHED','CANCELLED'], DISPATCHED: ['COMPLETED'], COMPLETED: [], CANCELLED: [] };
    const trip = MOCK_TRIPS.find(t => t.id === id);
    if (!trip) throw { response: { data: { error: 'Trip not found.' } } };
    if (!VALID[trip.status].includes(status)) throw { response: { data: { error: `Invalid transition: ${trip.status} → ${status}.` } } };

    if (status === 'DISPATCHED') {
      const v = MOCK_VEHICLES.find(v => v.id === trip.vehicleId);
      const d = MOCK_DRIVERS.find(d => d.id === trip.driverId);
      if (v && v.status !== 'AVAILABLE') throw { response: { data: { error: `Vehicle is ${v.status}, must be AVAILABLE.` } } };
      if (v) v.status = 'ON_TRIP';
      if (d) d.status = 'ON_DUTY';
      trip.startOdometer = v?.currentOdometer || 0;
      trip.dispatchedAt = NOW;
    } else if (status === 'COMPLETED') {
      if (!extra.endOdometer) throw { response: { data: { error: 'End odometer is required.' } } };
      if (parseFloat(extra.endOdometer) <= (trip.startOdometer || 0)) throw { response: { data: { error: 'End odometer must be greater than start odometer.' } } };
      const v = MOCK_VEHICLES.find(v => v.id === trip.vehicleId);
      const d = MOCK_DRIVERS.find(d => d.id === trip.driverId);
      if (v) { v.status = 'AVAILABLE'; v.currentOdometer = parseFloat(extra.endOdometer); }
      if (d) d.status = 'OFF_DUTY';
      trip.endOdometer = parseFloat(extra.endOdometer);
      trip.revenue = parseFloat(extra.revenue ?? trip.revenue);
      trip.miscExpenses = parseFloat(extra.miscExpenses ?? trip.miscExpenses);
      trip.completedAt = NOW;
    } else if (status === 'CANCELLED') {
      if (trip.status === 'DISPATCHED') {
        const v = MOCK_VEHICLES.find(v => v.id === trip.vehicleId);
        const d = MOCK_DRIVERS.find(d => d.id === trip.driverId);
        if (v) v.status = 'AVAILABLE';
        if (d) d.status = 'OFF_DUTY';
      }
      trip.cancelledAt = NOW;
    } else {
      if (status === 'SUBMITTED') trip.submittedAt = NOW;
      if (status === 'APPROVED')  trip.approvedAt  = NOW;
    }
    trip.status = status;
    return ok({ trip });
  },
};

// ── Maintenance ────────────────────────────────────────────────────────────────
export const mockMaintenanceAPI = {
  getAll: async ({ status, page = 1, limit = 10 }: any = {}) => {
    await delay();
    let list = [...MOCK_MAINTENANCE].reverse();
    if (status) list = list.filter(m => m.status === status);
    const { data: logs, ...meta } = paginate(list, page, limit);
    return ok({ logs, ...meta });
  },
  getStats: async () => {
    await delay(100);
    const open   = MOCK_MAINTENANCE.filter(m => m.status === 'OPEN').length;
    const closed = MOCK_MAINTENANCE.filter(m => m.status === 'CLOSED').length;
    const total  = MOCK_MAINTENANCE.reduce((s, m) => s + m.cost, 0);
    return ok({ total: MOCK_MAINTENANCE.length, open, closed, totalCost: total });
  },
  create: async (data: any) => {
    await delay(500);
    const v = MOCK_VEHICLES.find(v => v.id === data.vehicleId);
    if (!v) throw { response: { data: { error: 'Vehicle not found.' } } };
    if (v.status === 'ON_TRIP') throw { response: { data: { error: 'Cannot start maintenance while vehicle is on a trip.' } } };
    const existing = MOCK_MAINTENANCE.find(m => m.vehicleId === data.vehicleId && m.status === 'OPEN');
    if (existing) throw { response: { data: { error: 'Vehicle already has an open maintenance record.' } } };
    v.status = 'IN_SHOP';
    const log = { ...data, id: 'm' + Date.now(), status: 'OPEN', openedAt: new Date().toISOString(), closedAt: null, createdAt: new Date().toISOString(), cost: parseFloat(data.cost || 0), vehicle: { id: v.id, licensePlate: v.licensePlate, make: v.make, model: v.model } };
    MOCK_MAINTENANCE.push(log);
    return ok({ log });
  },
  close: async (id: string, data: any) => {
    await delay(500);
    const m = MOCK_MAINTENANCE.find(m => m.id === id);
    if (!m) throw { response: { data: { error: 'Not found.' } } };
    if (m.status === 'CLOSED') throw { response: { data: { error: 'Already closed.' } } };
    const v = MOCK_VEHICLES.find(v => v.id === m.vehicleId);
    if (v) v.status = 'AVAILABLE';
    m.status = 'CLOSED';
    if (data.cost) m.cost = parseFloat(data.cost);
    m.closedAt = new Date().toISOString();
    return ok({ log: m });
  },
};

// ── Fuel ──────────────────────────────────────────────────────────────────────
export const mockFuelAPI = {
  getAll: async ({ page = 1, limit = 10 }: any = {}) => {
    await delay();
    const list = [...MOCK_FUEL].reverse();
    const { data: logs, ...meta } = paginate(list, page, limit);
    return ok({ logs, ...meta });
  },
  log: async (data: any) => {
    await delay(400);
    const l = parseFloat(data.liters); const c = parseFloat(data.costPerLiter);
    if (l <= 0 || c <= 0) throw { response: { data: { error: 'Liters and cost must be > 0.' } } };
    const v = MOCK_VEHICLES.find(v => v.id === data.vehicleId);
    const log = { ...data, id: 'f' + Date.now(), totalCost: l * c, loggedAt: new Date().toISOString(), createdAt: new Date().toISOString(), vehicle: { licensePlate: v?.licensePlate || '', make: v?.make || '' }, trip: null };
    MOCK_FUEL.push(log);
    return ok({ log });
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const mockReportsAPI = {
  dashboard: async () => {
    await delay(200);
    const vs = MOCK_VEHICLES.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {} as any);
    const expiring = MOCK_DRIVERS.filter(d => !d.isLicenseExpired && d.licenseExpiresInDays < 30).length;
    const maintenanceOpen = MOCK_MAINTENANCE.filter(m => m.status === 'OPEN').length;
    const totalRevenue = MOCK_TRIPS.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + t.revenue, 0);
    return ok({ summary: { vehicles: { total: MOCK_VEHICLES.length, available: vs.AVAILABLE||0, onTrip: vs.ON_TRIP||0, inShop: vs.IN_SHOP||0, retired: vs.RETIRED||0 }, activeTrips: MOCK_TRIPS.filter(t => t.status === 'DISPATCHED').length, maintenanceOpen, expiringLicenses: expiring, totalRevenue } });
  },
  monthly: async (year: number) => {
    await delay(300);
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      revenue: [45000, 62000, 38000, 71000, 55000, 48000, 83000, 67000, 52000, 75000, 91000, 58000][i],
      fuelCost: [12000, 18000, 11000, 21000, 16000, 14000, 24000, 19000, 15000, 22000, 27000, 17000][i],
      maintCost: [5000, 0, 7500, 0, 4500, 0, 18000, 0, 5000, 0, 4500, 7500][i],
      trips: [2, 3, 2, 4, 3, 2, 5, 4, 3, 4, 6, 3][i],
      netPL: 0,
    }));
    months.forEach(m => { m.netPL = m.revenue - m.fuelCost - m.maintCost; });
    return ok({ report: { year, months } });
  },
  vehicleReport: async (vehicleId: string) => {
    await delay(300);
    const v = MOCK_VEHICLES.find(v => v.id === vehicleId);
    if (!v) throw { response: { status: 404, data: { error: 'Not found.' } } };
    const trips = MOCK_TRIPS.filter(t => t.vehicleId === vehicleId && t.status === 'COMPLETED');
    const totalRevenue = trips.reduce((s, t) => s + t.revenue, 0);
    const totalFuelCost = MOCK_FUEL.filter(f => f.vehicleId === vehicleId).reduce((s, f) => s + f.totalCost, 0);
    const totalMaintCost = MOCK_MAINTENANCE.filter(m => m.vehicleId === vehicleId && m.status === 'CLOSED').reduce((s, m) => s + m.cost, 0);
    const totalDistance = trips.reduce((s, t) => s + ((t.endOdometer || 0) - (t.startOdometer || 0)), 0);
    return ok({ report: { vehicle: { id: v.id, licensePlate: v.licensePlate, make: v.make, model: v.model }, completedTrips: trips.length, totalDistance, totalRevenue, totalFuelCost, totalMaintCost, totalCost: totalFuelCost + totalMaintCost, profit: totalRevenue - totalFuelCost - totalMaintCost, costPerKm: totalDistance > 0 ? Math.round((totalFuelCost + totalMaintCost) / totalDistance * 100) / 100 : 0, fuelEfficiency: 4.2 } });
  },
};
