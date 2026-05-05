import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments } from '../../lib/appointmentsStore';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [appointments, setAppointments] = useState([]);

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
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-dashboard-eyebrow">admin/dashboard</p>
          <h1>Admin Dashboard</h1>
          <p className="admin-dashboard-subtitle">
            Monitor the clinic queue and jump to the appointment review board.
          </p>
          {admin && <p className="admin-dashboard-meta">Logged in as {admin.fullName} ({admin.email})</p>}
        </div>

        <div className="admin-dashboard-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/appointments')}>
            Go to Appointments
          </button>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-dashboard-content">
        <section className="admin-dashboard-summary">
          <div className="summary-card">
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
          <article className="admin-dashboard-card admin-dashboard-card-primary">
            <h2>Appointment Review</h2>
            <p>Open the appointments page to accept or reject plotted bookings by schedule.</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/admin/appointments')}>
              Review Appointments
            </button>
          </article>

          <article className="admin-dashboard-card">
            <h2>Calendar Status</h2>
            <p>Use the appointment queue to spot conflicts and keep the clinic schedule organized.</p>
          </article>

          <article className="admin-dashboard-card">
            <h2>Access</h2>
            <p>This area is reserved for admin users only.</p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;