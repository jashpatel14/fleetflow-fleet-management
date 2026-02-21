// Mock data store — mirrors seed.js data exactly
// Used when VITE_USE_MOCK=true in .env.local

const now = new Date();
const d = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();

// ── Users ────────────────────────────────────────────────────────────────────
export const MOCK_USERS: Record<string, any> = {
  'manager@fleetflow.com':    { id: 'u1', name: 'Admin Manager',       email: 'manager@fleetflow.com',    role: 'FLEET_MANAGER',     password: 'FleetFlow@123' },
  'dispatcher@fleetflow.com': { id: 'u2', name: 'Ravi Dispatcher',     email: 'dispatcher@fleetflow.com', role: 'DISPATCHER',        password: 'FleetFlow@123' },
  'safety@fleetflow.com':     { id: 'u3', name: 'Neha Safety Officer', email: 'safety@fleetflow.com',     role: 'SAFETY_OFFICER',    password: 'FleetFlow@123' },
  'analyst@fleetflow.com':    { id: 'u4', name: 'Priya Analyst',       email: 'analyst@fleetflow.com',    role: 'FINANCIAL_ANALYST', password: 'FleetFlow@123' },
};

// ── Vehicles ─────────────────────────────────────────────────────────────────
export let MOCK_VEHICLES: any[] = [
  { id: 'v1', licensePlate: 'MH-12-AB-1234', make: 'TATA',          model: 'LPT 1615',   year: 2020, type: 'TRUCK',      capacityTons: 10, currentOdometer: 45000,  status: 'AVAILABLE', acquisitionCost: 1800000, _count: { trips: 4, maintenanceLogs: 1 } },
  { id: 'v2', licensePlate: 'MH-14-GH-5678', make: 'Ashok Leyland', model: '2518',       year: 2019, type: 'TRAILER',    capacityTons: 20, currentOdometer: 78000,  status: 'ON_TRIP',   acquisitionCost: 3200000, _count: { trips: 8, maintenanceLogs: 2 } },
  { id: 'v3', licensePlate: 'GJ-01-CD-9012', make: 'TATA',          model: 'Ultra 1012', year: 2021, type: 'MINI_TRUCK', capacityTons: 5,  currentOdometer: 22000,  status: 'IN_SHOP',   acquisitionCost: 900000,  _count: { trips: 2, maintenanceLogs: 1 } },
  { id: 'v4', licensePlate: 'DL-05-EF-3456', make: 'Mahindra',      model: 'Blazo 31',   year: 2018, type: 'TRUCK',      capacityTons: 12, currentOdometer: 112000, status: 'AVAILABLE', acquisitionCost: 2100000, _count: { trips: 12, maintenanceLogs: 3 } },
  { id: 'v5', licensePlate: 'KA-09-IJ-7890', make: 'TATA',          model: 'Signa 4825', year: 2017, type: 'CONTAINER',  capacityTons: 25, currentOdometer: 198000, status: 'RETIRED',   acquisitionCost: 4500000, _count: { trips: 22, maintenanceLogs: 6 } },
];

// ── Drivers ───────────────────────────────────────────────────────────────────
export let MOCK_DRIVERS: any[] = [
  { id: 'd1', name: 'John Sharma',  phone: '9876543210', licenseNumber: 'MH2020123456', licenseExpiry: d(730),  vehicleCategory: 'TRUCK',      status: 'ON_DUTY',   safetyScore: 92, isLicenseExpired: false, licenseExpiresInDays: 730, _count: { trips: 6 } },
  { id: 'd2', name: 'Raju Verma',   phone: '9876543211', licenseNumber: 'MH2019234567', licenseExpiry: d(365),  vehicleCategory: 'TRAILER',    status: 'ON_DUTY',   safetyScore: 85, isLicenseExpired: false, licenseExpiresInDays: 365, _count: { trips: 9 } },
  { id: 'd3', name: 'Suresh Patel', phone: '9876543212', licenseNumber: 'GJ2021345678', licenseExpiry: d(500),  vehicleCategory: 'MINI_TRUCK', status: 'OFF_DUTY',  safetyScore: 96, isLicenseExpired: false, licenseExpiresInDays: 500, _count: { trips: 3 } },
  { id: 'd4', name: 'Mahesh Singh', phone: '9876543213', licenseNumber: 'DL2018456789', licenseExpiry: d(20),   vehicleCategory: 'TRUCK',      status: 'OFF_DUTY',  safetyScore: 78, isLicenseExpired: false, licenseExpiresInDays: 20,  _count: { trips: 14 } },
  { id: 'd5', name: 'Ajay Kumar',   phone: '9876543214', licenseNumber: 'KA2020567890', licenseExpiry: d(-60),  vehicleCategory: 'CONTAINER',  status: 'SUSPENDED', safetyScore: 55, isLicenseExpired: true,  licenseExpiresInDays: -60, _count: { trips: 4 } },
];

// ── Trips ─────────────────────────────────────────────────────────────────────
export let MOCK_TRIPS: any[] = [
  { id: 't1', tripNumber: 'TRP-2026-0001', vehicleId: 'v4', driverId: 'd4', origin: 'Mumbai',    destination: 'Pune',       cargoDescription: 'Electronics', cargoWeightTons: 8,  startOdometer: 111000, endOdometer: 112000, revenue: 45000, miscExpenses: 2000,  status: 'COMPLETED',  submittedAt: d(-5), approvedAt: d(-4), dispatchedAt: d(-3), completedAt: d(-1), cancelledAt: null, createdAt: d(-6), vehicle: { id: 'v4', licensePlate: 'DL-05-EF-3456', make: 'Mahindra', model: 'Blazo 31', type: 'TRUCK' }, driver: { id: 'd4', name: 'Mahesh Singh', phone: '9876543213',  licenseNumber: 'DL2018456789' }, _count: { fuelLogs: 1 } },
  { id: 't2', tripNumber: 'TRP-2026-0002', vehicleId: 'v2', driverId: 'd2', origin: 'Delhi',     destination: 'Jaipur',     cargoDescription: 'Furniture',   cargoWeightTons: 15, startOdometer: 78000,  endOdometer: null,   revenue: 75000, miscExpenses: 0,     status: 'DISPATCHED', submittedAt: d(-2), approvedAt: d(-1), dispatchedAt: d(-0.25), completedAt: null, cancelledAt: null, createdAt: d(-3), vehicle: { id: 'v2', licensePlate: 'MH-14-GH-5678', make: 'Ashok Leyland', model: '2518', type: 'TRAILER' }, driver: { id: 'd2', name: 'Raju Verma', phone: '9876543211', licenseNumber: 'MH2019234567' }, _count: { fuelLogs: 1 } },
  { id: 't3', tripNumber: 'TRP-2026-0003', vehicleId: 'v1', driverId: 'd1', origin: 'Surat',     destination: 'Ahmedabad',  cargoDescription: 'Textiles',    cargoWeightTons: 7,  startOdometer: null,   endOdometer: null,   revenue: 28000, miscExpenses: 0,     status: 'DRAFT',      submittedAt: null, approvedAt: null, dispatchedAt: null, completedAt: null, cancelledAt: null, createdAt: d(-1), vehicle: { id: 'v1', licensePlate: 'MH-12-AB-1234', make: 'TATA', model: 'LPT 1615', type: 'TRUCK' }, driver: { id: 'd1', name: 'John Sharma', phone: '9876543210', licenseNumber: 'MH2020123456' }, _count: { fuelLogs: 0 } },
  { id: 't4', tripNumber: 'TRP-2026-0004', vehicleId: 'v1', driverId: 'd3', origin: 'Chennai',   destination: 'Bangalore',  cargoDescription: 'Auto Parts',  cargoWeightTons: 4,  startOdometer: null,   endOdometer: null,   revenue: 32000, miscExpenses: 0,     status: 'SUBMITTED',  submittedAt: d(-0.5), approvedAt: null, dispatchedAt: null, completedAt: null, cancelledAt: null, createdAt: d(-1), vehicle: { id: 'v1', licensePlate: 'MH-12-AB-1234', make: 'TATA', model: 'LPT 1615', type: 'TRUCK' }, driver: { id: 'd3', name: 'Suresh Patel', phone: '9876543212', licenseNumber: 'GJ2021345678' }, _count: { fuelLogs: 0 } },
  { id: 't5', tripNumber: 'TRP-2026-0005', vehicleId: 'v4', driverId: 'd1', origin: 'Kolkata',   destination: 'Patna',      cargoDescription: 'Rice',        cargoWeightTons: 10, startOdometer: null,   endOdometer: null,   revenue: 38000, miscExpenses: 0,     status: 'APPROVED',   submittedAt: d(-1), approvedAt: d(-0.25), dispatchedAt: null, completedAt: null, cancelledAt: null, createdAt: d(-2), vehicle: { id: 'v4', licensePlate: 'DL-05-EF-3456', make: 'Mahindra', model: 'Blazo 31', type: 'TRUCK' }, driver: { id: 'd1', name: 'John Sharma', phone: '9876543210', licenseNumber: 'MH2020123456' }, _count: { fuelLogs: 0 } },
];

// ── Maintenance ────────────────────────────────────────────────────────────────
export let MOCK_MAINTENANCE: any[] = [
  { id: 'm1', vehicleId: 'v3', type: 'CORRECTIVE', status: 'OPEN',   description: 'Engine oil leak and brake pad replacement', cost: 18000, openedAt: d(-2),  closedAt: null, createdAt: d(-2), vehicle: { id: 'v3', licensePlate: 'GJ-01-CD-9012', make: 'TATA', model: 'Ultra 1012' } },
  { id: 'm2', vehicleId: 'v1', type: 'PREVENTIVE', status: 'CLOSED', description: 'Scheduled 45,000km service — oil change, filter replacement', cost: 7500, openedAt: d(-10), closedAt: d(-8), createdAt: d(-10), vehicle: { id: 'v1', licensePlate: 'MH-12-AB-1234', make: 'TATA', model: 'LPT 1615' } },
  { id: 'm3', vehicleId: 'v4', type: 'PREVENTIVE', status: 'CLOSED', description: 'Tyre rotation and wheel alignment', cost: 4500, openedAt: d(-20), closedAt: d(-18), createdAt: d(-20), vehicle: { id: 'v4', licensePlate: 'DL-05-EF-3456', make: 'Mahindra', model: 'Blazo 31' } },
];

// ── Fuel Logs ──────────────────────────────────────────────────────────────────
export let MOCK_FUEL: any[] = [
  { id: 'f1', vehicleId: 'v4', tripId: 't1', liters: 180, costPerLiter: 95.5, totalCost: 17190, loggedAt: d(-2), createdAt: d(-2), vehicle: { licensePlate: 'DL-05-EF-3456', make: 'Mahindra' }, trip: { tripNumber: 'TRP-2026-0001', origin: 'Mumbai', destination: 'Pune' } },
  { id: 'f2', vehicleId: 'v2', tripId: 't2', liters: 220, costPerLiter: 96.0, totalCost: 21120, loggedAt: d(-0.25), createdAt: d(-0.25), vehicle: { licensePlate: 'MH-14-GH-5678', make: 'Ashok Leyland' }, trip: { tripNumber: 'TRP-2026-0002', origin: 'Delhi', destination: 'Jaipur' } },
  { id: 'f3', vehicleId: 'v1', tripId: null, liters: 100, costPerLiter: 95.0, totalCost: 9500,  loggedAt: d(-5),  createdAt: d(-5), vehicle: { licensePlate: 'MH-12-AB-1234', make: 'TATA' }, trip: null },
];
