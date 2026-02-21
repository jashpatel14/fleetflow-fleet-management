import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layout/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import ReportsPage from './pages/ReportsPage';

import './styles/theme.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected — wrapped in layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vehicles" element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'DISPATCHER']}>
                <VehiclesPage />
              </ProtectedRoute>
            } />
            <Route path="/drivers" element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'SAFETY_OFFICER']}>
                <DriversPage />
              </ProtectedRoute>
            } />
            <Route path="/trips" element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'DISPATCHER']}>
                <TripsPage />
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER']}>
                <MaintenancePage />
              </ProtectedRoute>
            } />
            <Route path="/fuel" element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'DISPATCHER']}>
                <FuelPage />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'FINANCIAL_ANALYST']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
