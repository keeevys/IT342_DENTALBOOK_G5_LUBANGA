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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recordDrafts, setRecordDrafts] = useState({});

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
    const filteredAppointments = appointments.filter((appointment) => {
      const haystack = `${appointment.userName || ''} ${appointment.userEmail || ''} ${appointment.service || ''} ${appointment.notes || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || String(appointment.status || '').toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });

    const groups = filteredAppointments.reduce((accumulator, appointment) => {
      const slotKey = `${appointment.date || 'Unscheduled'} ${appointment.time || ''}`.trim();

      if (!accumulator[slotKey]) {
        accumulator[slotKey] = [];
      }

      accumulator[slotKey].push(appointment);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([leftSlot], [rightSlot]) => leftSlot.localeCompare(rightSlot));
  }, [appointments, searchTerm, statusFilter]);

  const groupBySlot = (list) => {
    const groups = list.reduce((accumulator, appointment) => {
      const slotKey = `${appointment.date || 'Unscheduled'} ${appointment.time || ''}`.trim();

      if (!accumulator[slotKey]) {
        accumulator[slotKey] = [];
      }

      accumulator[slotKey].push(appointment);
      return accumulator;
    }, {});

    return Object.entries(groups).sort(([leftSlot], [rightSlot]) => leftSlot.localeCompare(rightSlot));
  };

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'PENDING').length;
    const approved = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED').length;
    const rejected = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'REJECTED').length;
    const completed = appointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'COMPLETED').length;

    return { total, pending, approved, rejected, completed };
  }, [appointments]);

  const updateAppointmentRecord = (appointmentId, updater) => {
    const nextAppointments = appointments.map((appointment) => {
      if (appointment.id !== appointmentId) {
        return appointment;
      }

      return updater(appointment);
    });

    const sortedAppointments = sortAppointments(nextAppointments);
    writeAppointments(sortedAppointments);
    setAppointments(sortedAppointments);
  };

  const handleRecordDraftChange = (appointmentId, value) => {
    setRecordDrafts((previous) => ({
      ...previous,
      [appointmentId]: value,
    }));
  };

  const handleSaveRecord = (appointmentId) => {
    const recordNote = (recordDrafts[appointmentId] || '').trim();

    updateAppointmentRecord(appointmentId, (appointment) => ({
      ...appointment,
      adminNotes: recordNote,
      reviewedBy: admin?.email,
      reviewedAt: new Date().toISOString(),
      recordUpdatedAt: new Date().toISOString(),
    }));

    setMessage('Appointment record saved.');
    setError('');
  };

  const updateAppointment = (appointmentId, nextStatus) => {
    updateAppointmentRecord(appointmentId, (appointment) => ({
      ...appointment,
      status: nextStatus,
      reviewedBy: admin?.email,
      reviewedAt: new Date().toISOString(),
      recordUpdatedAt: new Date().toISOString(),
    }));

    setMessage(
      nextStatus === 'APPROVED'
        ? 'Appointment accepted and stored in records.'
        : `Appointment ${nextStatus.toLowerCase()}.`
    );
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
    const currentAppointment = appointments.find((appointment) => appointment.id === appointmentId);

    if (!currentAppointment) {
      return;
    }

    const currentStatus = String(currentAppointment.status || 'PENDING').toUpperCase();
    if (currentStatus !== 'PENDING') {
      setError('Accepted appointments are locked in records and cannot be rejected.');
      setMessage('');
      return;
    }

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
    <div className="admin-page admin-appointments-page">
      <div className="admin-hero-glow admin-glow-left" />
      <div className="admin-hero-glow admin-glow-right" />

      <header className="admin-header admin-shell">
        <div className="admin-title-block">
          <p className="admin-eyebrow">dentist control room</p>
          <h1>Appointment Record</h1>
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

      <main className="admin-content admin-shell">
        <section className="admin-summary summary-grid">
          <div className="summary-card summary-card-total">
            <span>Total Requests</span>
            <strong>{appointmentStats.total}</strong>
          </div>
          <div className="summary-card">
            <span>Pending</span>
            <strong>{appointmentStats.pending}</strong>
          </div>
          <div className="summary-card">
            <span>Approved</span>
            <strong>{appointmentStats.approved}</strong>
          </div>
          <div className="summary-card">
            <span>Completed</span>
            <strong>{appointmentStats.completed}</strong>
          </div>
          <div className="summary-card">
            <span>Rejected</span>
            <strong>{appointmentStats.rejected}</strong>
          </div>
        </section>

        <section className="admin-toolbar">
          <div className="toolbar-card toolbar-search">
            <label htmlFor="admin-appointment-search">Search records</label>
            <input
              id="admin-appointment-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Patient, service, note, or email"
            />
          </div>

          <div className="toolbar-card toolbar-filter">
            <label htmlFor="admin-appointment-status">Status filter</label>
            <select id="admin-appointment-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="toolbar-card toolbar-legend">
            <span>Record behavior</span>
            <p>Save a note before or after review. Each save updates the audit trail stored in local storage.</p>
          </div>
        </section>

        {message && <div className="status-banner success">{message}</div>}
        {error && <div className="status-banner error">{error}</div>}

        <section className="schedule-board admin-ledger-layout">
          <div className="ledger-main">
            <div className="section-title">
              <h2>Appointment Records</h2>
              <p>Grouped by schedule so conflicts are easy to spot, while notes keep each patient visit documented.</p>
            </div>

            {/* Pending requests first for transparency */}
            <h3 className="records-section-title">Pending Requests</h3>
            {(() => {
              const pending = appointments.filter((a) => String(a.status || 'PENDING').toUpperCase() === 'PENDING');
              const pendingGroups = groupBySlot(pending);

              if (pendingGroups.length === 0) {
                return <div className="empty-state">No pending requests.</div>;
              }

              return pendingGroups.map(([slotKey, slotAppointments]) => {
                const hasConflict = slotAppointments.length > 1;
                const hasApproved = slotAppointments.some((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED');

                return (
                  <article key={`pending-${slotKey}`} className={`slot-group ${hasConflict ? 'slot-conflict' : ''}`}>
                    <div className="slot-header">
                      <div>
                        <h3>{slotKey}</h3>
                        <p>{slotAppointments.length} appointment{slotAppointments.length > 1 ? 's' : ''} in this block</p>
                      </div>
                      {hasConflict && (
                        <span className={`slot-badge badge-conflict`}>
                          Conflict
                        </span>
                      )}
                    </div>

                    <div className="slot-cards">
                      {slotAppointments.map((appointment) => {
                        const status = String(appointment.status || 'PENDING').toUpperCase();
                        const canApprove = status === 'PENDING' && !hasApproved;
                        const canReject = status === 'PENDING';
                        const draftValue = recordDrafts[appointment.id] ?? appointment.adminNotes ?? '';

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
                              {appointment.notes && <p><strong>Patient Notes:</strong> {appointment.notes}</p>}
                            </div>

                            <label className="record-note-field" htmlFor={`admin-note-${appointment.id}`}>
                              <span>Admin record note</span>
                              <textarea
                                id={`admin-note-${appointment.id}`}
                                value={draftValue}
                                onChange={(event) => handleRecordDraftChange(appointment.id, event.target.value)}
                                placeholder="Write follow-up instructions, observations, or remarks"
                                rows={4}
                              />
                            </label>

                            <div className="record-meta">
                              <span>Updated by {appointment.reviewedBy || 'none'}</span>
                              <span>{appointment.recordUpdatedAt ? new Date(appointment.recordUpdatedAt).toLocaleString() : 'No record saved yet'}</span>
                            </div>

                            <div className="review-actions">
                              <button type="button" className="btn-record" onClick={() => handleSaveRecord(appointment.id)}>
                                Save Record
                              </button>
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
                                disabled={!canReject}
                                onClick={() => handleReject(appointment.id)}
                              >
                                Reject
                              </button>
                            </div>

                            {(appointment.reviewedBy || appointment.reviewedAt || appointment.adminNotes) && (
                              <div className="record-timeline">
                                <p><strong>Review trail</strong></p>
                                {appointment.reviewedBy && <span>Reviewed by {appointment.reviewedBy}</span>}
                                {appointment.reviewedAt && <span>Reviewed at {new Date(appointment.reviewedAt).toLocaleString()}</span>}
                                {appointment.adminNotes && <span>Note: {appointment.adminNotes}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              });
            })()}

            {/* Processed (approved/rejected/completed) records */}
            <h3 className="records-section-title">Processed Appointments</h3>
            {(() => {
              const processed = appointments.filter((a) => String(a.status || '').toUpperCase() !== 'PENDING');
              const processedGroups = groupBySlot(processed);

              if (processedGroups.length === 0) {
                return <div className="empty-state">No processed appointments.</div>;
              }

              return processedGroups.map(([slotKey, slotAppointments]) => {
                const hasConflict = slotAppointments.length > 1;
                const hasApproved = slotAppointments.some((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED');

                return (
                  <article key={`processed-${slotKey}`} className={`slot-group ${hasConflict ? 'slot-conflict' : ''}`}>
                    <div className="slot-header">
                      <div>
                        <h3>{slotKey}</h3>
                        <p>{slotAppointments.length} appointment{slotAppointments.length > 1 ? 's' : ''} in this block</p>
                      </div>
                      {hasConflict && (
                        <span className={`slot-badge badge-conflict`}>
                          Conflict
                        </span>
                      )}
                    </div>

                    <div className="slot-cards">
                      {slotAppointments.map((appointment) => {
                        const status = String(appointment.status || 'PENDING').toUpperCase();
                        const canApprove = status === 'PENDING' && !hasApproved;
                        const canReject = status === 'PENDING';
                        const draftValue = recordDrafts[appointment.id] ?? appointment.adminNotes ?? '';

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
                              {appointment.notes && <p><strong>Patient Notes:</strong> {appointment.notes}</p>}
                            </div>

                            <label className="record-note-field" htmlFor={`admin-note-${appointment.id}`}>
                              <span>Admin record note</span>
                              <textarea
                                id={`admin-note-${appointment.id}`}
                                value={draftValue}
                                onChange={(event) => handleRecordDraftChange(appointment.id, event.target.value)}
                                placeholder="Write follow-up instructions, observations, or remarks"
                                rows={4}
                                readOnly={true}
                              />
                            </label>

                            <div className="record-meta">
                              <span>Updated by {appointment.reviewedBy || 'none'}</span>
                              <span>{appointment.recordUpdatedAt ? new Date(appointment.recordUpdatedAt).toLocaleString() : 'No record saved yet'}</span>
                            </div>

                            <div className="review-actions">
                              {/* For processed records we keep it read-only; no action buttons */}
                            </div>

                            {(appointment.reviewedBy || appointment.reviewedAt || appointment.adminNotes) && (
                              <div className="record-timeline">
                                <p><strong>Review trail</strong></p>
                                {appointment.reviewedBy && <span>Reviewed by {appointment.reviewedBy}</span>}
                                {appointment.reviewedAt && <span>Reviewed at {new Date(appointment.reviewedAt).toLocaleString()}</span>}
                                {appointment.adminNotes && <span>Note: {appointment.adminNotes}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              });
            })()}
          </div>

          <aside className="ledger-side">
            <section className="ledger-panel ledger-panel-highlight">
              <p className="ledger-eyebrow">operations snapshot</p>
              <h3>Record Vault Rules</h3>
              <ul>
                <li>Every saved note becomes part of the appointment history.</li>
                <li>Approved slots block duplicate approvals in the same time slot.</li>
                <li>Reviewed metadata stays attached to the appointment record.</li>
              </ul>
            </section>

            <section className="ledger-panel">
              <p className="ledger-eyebrow">quick status</p>
              <h3>{appointmentStats.pending} waiting</h3>
              <p>Open notes, mark the patient outcome, then save the record to preserve the trail.</p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default AdminAppointments;