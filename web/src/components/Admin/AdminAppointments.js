import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments, writeAppointments } from '../../lib/appointmentsStore';
import './AdminAppointments.css';

function AdminAppointments() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  const scheduleGroups = useMemo(() => {
    const groups = appointments.reduce((accumulator, appointment) => {
      const slotKey = `${appointment.date || 'Unscheduled'} ${appointment.time || ''}`.trim();

      if (!accumulator[slotKey]) {
        accumulator[slotKey] = [];
      }

      accumulator[slotKey].push(appointment);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([leftSlot], [rightSlot]) => leftSlot.localeCompare(rightSlot));
  }, [appointments]);

  const updateAppointment = (appointmentId, nextStatus) => {
    const nextAppointments = appointments.map((appointment) => {
      if (appointment.id !== appointmentId) {
        return appointment;
      }

      return {
        ...appointment,
        status: nextStatus,
        reviewedBy: admin?.email,
        reviewedAt: new Date().toISOString(),
      };
    });

    const sortedAppointments = sortAppointments(nextAppointments);
    writeAppointments(sortedAppointments);
    setAppointments(sortedAppointments);
    setMessage(`Appointment ${nextStatus.toLowerCase()}.`);
    setError('');
  };

  const handleApprove = (appointmentId) => {
    const currentAppointment = appointments.find((appointment) => appointment.id === appointmentId);
    if (!currentAppointment) {
      return;
    }

    const hasApprovedInSlot = appointments.some(
      (appointment) =>
        appointment.id !== appointmentId &&
        appointment.date === currentAppointment.date &&
        appointment.time === currentAppointment.time &&
        appointment.status === 'APPROVED'
    );

    if (hasApprovedInSlot) {
      setError('This time slot already has an approved appointment.');
      setMessage('');
      return;
    }

    updateAppointment(appointmentId, 'APPROVED');
  };

  const handleReject = (appointmentId) => {
    updateAppointment(appointmentId, 'REJECTED');
  };

  const handleLogout = () => {
    clearStoredUser();
    navigate('/login');
  };

  const goToDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">admin/appointments</p>
          <h1>Appointment Review Board</h1>
          <p className="admin-subtitle">
            Approve or reject plotted appointments, one schedule slot at a time.
          </p>
          {admin && <p className="admin-meta">Logged in as {admin.fullName} ({admin.email})</p>}
        </div>

        <div className="admin-header-actions">
          <button type="button" className="btn-secondary" onClick={goToDashboard}>
            Back to Dashboard
          </button>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-content">
        <section className="admin-summary">
          <div className="summary-card">
            <span>Total Requests</span>
            <strong>{appointments.length}</strong>
          </div>
          <div className="summary-card">
            <span>Pending</span>
            <strong>{appointments.filter((appointment) => appointment.status === 'PENDING').length}</strong>
          </div>
          <div className="summary-card">
            <span>Approved</span>
            <strong>{appointments.filter((appointment) => appointment.status === 'APPROVED').length}</strong>
          </div>
          <div className="summary-card">
            <span>Rejected</span>
            <strong>{appointments.filter((appointment) => appointment.status === 'REJECTED').length}</strong>
          </div>
        </section>

        {message && <div className="status-banner success">{message}</div>}
        {error && <div className="status-banner error">{error}</div>}

        <section className="schedule-board">
          <div className="section-title">
            <h2>Plotted Schedules</h2>
            <p>Appointments are grouped by date and time so conflicts are easy to spot.</p>
          </div>

          {scheduleGroups.length === 0 ? (
            <div className="empty-state">No appointments submitted yet.</div>
          ) : (
            scheduleGroups.map(([slotKey, slotAppointments]) => {
              const hasConflict = slotAppointments.length > 1;
              const hasApproved = slotAppointments.some((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED');

              return (
                <article key={slotKey} className={`slot-group ${hasConflict ? 'slot-conflict' : ''}`}>
                  <div className="slot-header">
                    <div>
                      <h3>{slotKey}</h3>
                      <p>{slotAppointments.length} appointment{slotAppointments.length > 1 ? 's' : ''} plotted here</p>
                    </div>
                    <span className={`slot-badge ${hasConflict ? 'badge-conflict' : 'badge-clear'}`}>
                      {hasConflict ? 'Conflict' : 'Clear'}
                    </span>
                  </div>

                  <div className="slot-cards">
                    {slotAppointments.map((appointment) => {
                      const status = String(appointment.status || 'PENDING').toUpperCase();
                      const canApprove = status === 'PENDING' && !hasApproved;

                      return (
                        <div key={appointment.id} className="appointment-review-card">
                          <div className="review-card-top">
                            <div>
                              <h4>{appointment.userName || 'Patient'}</h4>
                              <p>{appointment.userEmail || 'No email on file'}</p>
                            </div>
                            <span className={`status-pill status-${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </div>

                          <div className="review-details">
                            <p><strong>Service:</strong> {appointment.service}</p>
                            <p><strong>Date:</strong> {appointment.date || 'Unscheduled'}</p>
                            <p><strong>Time:</strong> {appointment.time || 'Unscheduled'}</p>
                            {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                          </div>

                          <div className="review-actions">
                            <button
                              type="button"
                              className="btn-approve"
                              disabled={!canApprove}
                              onClick={() => handleApprove(appointment.id)}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn-reject"
                              onClick={() => handleReject(appointment.id)}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminAppointments;