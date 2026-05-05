import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register/Register';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import BookingPage from './components/Booking/BookingPage';
import PatientAppointments from './components/Patient/PatientAppointments';
import PatientRecords from './components/Patient/PatientRecords';
import PatientSettings from './components/Patient/PatientSettings';
import PatientProfile from './components/Patient/PatientProfile';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminAppointments from './components/Admin/AdminAppointments';
import { supabaseConfigError } from './lib/supabaseClient';
import { getStoredUser, isAdminUser } from './lib/accessControl';
import './App.css';

function renderPatientRoute(storedUser, hasAdminAccess, element) {
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  if (hasAdminAccess) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return element;
}

function renderAdminRoute(storedUser, hasAdminAccess, element) {
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAdminAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

function renderAdminEntryRoute(storedUser, hasAdminAccess) {
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  return hasAdminAccess ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />;
}

function App() {
  const storedUser = getStoredUser();
  const hasAdminAccess = isAdminUser(storedUser);

  if (supabaseConfigError) {
    return (
      <div className="App" style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto', textAlign: 'left' }}>
        <h1>DentalBook Setup Required</h1>
        <p>{supabaseConfigError}</p>
        <p>
          Create a file named <strong>.env</strong> in the <strong>web</strong> folder with:
        </p>
        <pre style={{ background: '#f5f5f5', padding: '1rem', overflowX: 'auto' }}>
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
        </pre>
        <p>After saving, restart the frontend dev server.</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={renderPatientRoute(storedUser, hasAdminAccess, <Dashboard />)} />
          <Route path="/book" element={renderPatientRoute(storedUser, hasAdminAccess, <BookingPage />)} />
          <Route path="/appointments" element={renderPatientRoute(storedUser, hasAdminAccess, <PatientAppointments />)} />
          <Route path="/records" element={renderPatientRoute(storedUser, hasAdminAccess, <PatientRecords />)} />
          <Route path="/settings" element={renderPatientRoute(storedUser, hasAdminAccess, <PatientSettings />)} />
          <Route path="/profile" element={renderPatientRoute(storedUser, hasAdminAccess, <PatientProfile />)} />
          <Route path="/admin" element={renderAdminEntryRoute(storedUser, hasAdminAccess)} />
          <Route path="/admin/dashboard" element={renderAdminRoute(storedUser, hasAdminAccess, <AdminDashboard />)} />
          <Route path="/admin/appointments" element={renderAdminRoute(storedUser, hasAdminAccess, <AdminAppointments />)} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
