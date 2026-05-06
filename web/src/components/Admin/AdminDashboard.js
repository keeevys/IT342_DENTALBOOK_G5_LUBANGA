import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments } from '../../lib/appointmentsStore';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const latestAppointment = appointments[0] || null;

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      navigate('/login');
      return;
    }

    if (!isAdminUser(storedUser)) {
      navigate('/dashboard');
      return;
    }

    setAdmin(storedUser);
    setAppointments(sortAppointments(readAppointments()));
  }, [navigate]);

  const metrics = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'PENDING').length;
    const approved = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED').length;
    const rejected = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'REJECTED').length;

    return { total, pending, approved, rejected };
  }, [appointments]);

  const handleLogout = () => {
    clearStoredUser();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-page admin-control-room">
      <div className="admin-dashboard-halo admin-halo-left" />
      <div className="admin-dashboard-halo admin-halo-right" />

      <header className="admin-dashboard-header admin-shell">
        <div className="admin-dashboard-hero">
          <p className="admin-dashboard-eyebrow">clinic command center</p>
          <h1>Admin Control Room</h1>
        </div>

        <div className="admin-dashboard-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/appointments')}>
            Open Record Vault
          </button>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-dashboard-content admin-shell">
        <section className="admin-dashboard-summary summary-grid">
          <div className="summary-card summary-card-total">
            <span>Total Requests</span>
            <strong>{metrics.total}</strong>
          </div>
          <div className="summary-card">
            <span>Pending</span>
            <strong>{metrics.pending}</strong>
          </div>
          <div className="summary-card">
            <span>Approved</span>
            <strong>{metrics.approved}</strong>
          </div>
          <div className="summary-card">
            <span>Rejected</span>
            <strong>{metrics.rejected}</strong>
          </div>
        </section>

        <section className="admin-dashboard-grid">
          <article className="admin-dashboard-card admin-dashboard-card-primary admin-feature-card">
            <div>
              <p className="feature-eyebrow">today's focus</p>
              <h2>Appointment Record</h2>
            </div>
            <button type="button" className="btn-primary" onClick={() => navigate('/admin/appointments')}>
              Review Appointments
            </button>
          </article>

          <article className="admin-dashboard-card admin-insight-card">
            <p className="feature-eyebrow">live queue</p>
            <h2>Record Snapshot</h2>
            <p>
              {latestAppointment
                ? `${latestAppointment.userName || 'A patient'} is currently ${String(latestAppointment.status || 'PENDING').toLowerCase()} for ${latestAppointment.service || 'a service'}.`
                : 'No appointments have been created yet.'}
            </p>
          </article>

          <article className="admin-dashboard-card admin-insight-card">
            <p className="feature-eyebrow">clinic status</p>
            <h2>Schedule Health</h2>
            <p>Use the vault to spot conflicts, attach notes, and preserve a clean record of every decision.</p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;