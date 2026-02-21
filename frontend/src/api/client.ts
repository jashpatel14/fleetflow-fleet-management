import axios from 'axios';
import {
  mockAuthAPI, mockVehiclesAPI, mockDriversAPI,
  mockTripsAPI, mockMaintenanceAPI, mockFuelAPI, mockReportsAPI,
} from './mockAPI';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ── Real Axios client (used when IS_MOCK = false) ───────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('ff_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = IS_MOCK ? mockAuthAPI : {
  login:    (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me:       ()          => api.get('/auth/me'),
};

// ── Vehicles ─────────────────────────────────────────────────────────────────
export const vehiclesAPI = IS_MOCK ? mockVehiclesAPI : {
  getAll:       (params?: any)           => api.get('/vehicles', { params }),
  getStats:     ()                       => api.get('/vehicles/stats'),
  getById:      (id: string)             => api.get(`/vehicles/${id}`),
  create:       (data: any)              => api.post('/vehicles', data),
  update:       (id: string, data: any)  => api.patch(`/vehicles/${id}`, data),
  changeStatus: (id: string, status: string) => api.patch(`/vehicles/${id}/status`, { status }),
};

// ── Drivers ──────────────────────────────────────────────────────────────────
export const driversAPI = IS_MOCK ? mockDriversAPI : {
  getAll:       (params?: any)           => api.get('/drivers', { params }),
  getStats:     ()                       => api.get('/drivers/stats'),
  getById:      (id: string)             => api.get(`/drivers/${id}`),
  create:       (data: any)              => api.post('/drivers', data),
  update:       (id: string, data: any)  => api.patch(`/drivers/${id}`, data),
  changeStatus: (id: string, status: string) => api.patch(`/drivers/${id}/status`, { status }),
};

// ── Trips ────────────────────────────────────────────────────────────────────
export const tripsAPI = IS_MOCK ? mockTripsAPI : {
  getAll:   (params?: any)                          => api.get('/trips', { params }),
  getStats: ()                                      => api.get('/trips/stats'),
  getById:  (id: string)                            => api.get(`/trips/${id}`),
  create:   (data: any)                             => api.post('/trips', data),
  advance:  (id: string, status: string, extra: any) => api.patch(`/trips/${id}/status`, { status, ...extra }),
};

// ── Maintenance ──────────────────────────────────────────────────────────────
export const maintenanceAPI = IS_MOCK ? mockMaintenanceAPI : {
  getAll:   (params?: any)              => api.get('/maintenance', { params }),
  getStats: ()                          => api.get('/maintenance/stats'),
  create:   (data: any)                 => api.post('/maintenance', data),
  close:    (id: string, data: any)     => api.patch(`/maintenance/${id}/close`, data),
};

// ── Fuel ─────────────────────────────────────────────────────────────────────
export const fuelAPI = IS_MOCK ? mockFuelAPI : {
  getAll: (params?: any) => api.get('/fuel', { params }),
  log:    (data: any)    => api.post('/fuel', data),
};

// ── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = IS_MOCK ? mockReportsAPI : {
  dashboard:      ()                 => api.get('/reports/dashboard'),
  monthly:        (year?: number)    => api.get('/reports/monthly', { params: { year } }),
  vehicleReport:  (vehicleId: string) => api.get(`/reports/vehicle/${vehicleId}`),
};
