import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments, writeAppointments } from '../../lib/appointmentsStore';
import { SERVICES } from '../../lib/servicesCatalog';
import './AdminAppointments.css';

/* eslint-disable react/prop-types */

const toDateKey = (value) => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toISOString().slice(0, 10);
};

const formatCalendarLabel = (value) => {
  if (!value) {
    return 'Unscheduled';
  }

  const parsedDate = new Date(`${toDateKey(value)}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? String(value)
    : parsedDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
};

function AppointmentCard({
  appointment,
  readOnly,
  draftValue,
  hasApproved,
  onDraftChange,
  onSaveRecord,
  onApprove,
  onReject,
  onComplete,
}) {
  const status = String(appointment.status || 'PENDING').toUpperCase();
  const canApprove = !readOnly && status === 'PENDING' && !hasApproved;
  const canReject = !readOnly && status === 'PENDING';
  const canComplete = !readOnly && status === 'APPROVED';
  const serviceMeta = SERVICES[appointment.service] || {};
  const serviceImage = serviceMeta.image;
  const initials = (appointment.service || '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="appointment-review-card">
      <div className="review-card-media">
        {serviceImage ? (
          <img src={serviceImage} alt={appointment.service} className="review-card-image" />
        ) : (
          <div className="review-card-placeholder">{initials}</div>
        )}
      </div>

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
          onChange={(e) => onDraftChange?.(appointment.id, e.target.value)}
          placeholder="Write follow-up instructions, observations, or remarks"
          rows={4}
          readOnly={readOnly}
        />
      </label>

      <div className="record-meta">
        <span>Updated by {appointment.reviewedBy || 'none'}</span>
        <span>{appointment.recordUpdatedAt ? new Date(appointment.recordUpdatedAt).toLocaleString() : 'No record saved yet'}</span>
      </div>

      <div className="review-actions">
        {readOnly ? (
          <span className="read-only-note">Review history is locked for processed records.</span>
        ) : null}

        {!readOnly && status === 'APPROVED' && (
          <>
            <button type="button" className="btn-record" onClick={() => onSaveRecord?.(appointment.id)}>
              Save Record
            </button>
            <button
              type="button"
              className="btn-complete"
              disabled={!canComplete}
              onClick={() => onComplete?.(appointment.id)}
            >
              Completed
            </button>
          </>
        )}

        {!readOnly && status === 'PENDING' && (
          <>
            <button type="button" className="btn-record" onClick={() => onSaveRecord?.(appointment.id)}>
              Save Record
            </button>
            <button
              type="button"
              className="btn-approve"
              disabled={!canApprove}
              onClick={() => onApprove?.(appointment.id)}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn-reject"
              disabled={!canReject}
              onClick={() => onReject?.(appointment.id)}
            >
              Reject
            </button>
          </>
        )}
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
}

function AdminAppointments() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recordDrafts, setRecordDrafts] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [dayViewerOpen, setDayViewerOpen] = useState(false);

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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const haystack = `${appointment.userName || ''} ${appointment.userEmail || ''} ${appointment.service || ''} ${appointment.notes || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || String(appointment.status || '').toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const pendingAppointments = useMemo(
    () => filteredAppointments.filter((appointment) => String(appointment.status || 'PENDING').toUpperCase() === 'PENDING'),
    [filteredAppointments]
  );

  const approvedAppointments = useMemo(
    () => filteredAppointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED'),
    [filteredAppointments]
  );

  const rejectedAppointments = useMemo(
    () => filteredAppointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'REJECTED'),
    [filteredAppointments]
  );

  const completedAppointments = useMemo(
    () => filteredAppointments.filter((appointment) => String(appointment.status || '').toUpperCase() === 'COMPLETED'),
    [filteredAppointments]
  );

  const selectedDateAppointments = useMemo(() => {
    return appointments.filter((appointment) => toDateKey(appointment.date) === selectedDateKey);
  }, [appointments, selectedDateKey]);

  const calendarCells = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const currentDate = new Date(gridStart);
      currentDate.setDate(gridStart.getDate() + index);
      const dateKey = toDateKey(currentDate);
      const dayAppointments = appointments.filter((appointment) => toDateKey(appointment.date) === dateKey);

      return {
        dateKey,
        currentDate,
        inMonth: currentDate.getMonth() === calendarMonth.getMonth(),
        dayAppointments,
      };
    });
  }, [appointments, calendarMonth]);

  const goToPreviousMonth = () => {
    setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleCalendarDayClick = (event) => {
    const nextDateKey = event.currentTarget.dataset.dateKey;

    if (!nextDateKey) {
      return;
    }

    setSelectedDateKey(nextDateKey);
    setDayViewerOpen(true);
  };

  const closeDayViewer = () => {
    setDayViewerOpen(false);
  };

  const renderAppointmentCards = (list, { readOnly = false, emptyMessage }) => {
    const groupedAppointments = groupBySlot(list);

    if (groupedAppointments.length === 0) {
      return <div className="empty-state">{emptyMessage}</div>;
    }

    return groupedAppointments.map(([slotKey, slotAppointments]) => {
      const hasConflict = slotAppointments.length > 1;
      const hasApproved = slotAppointments.some((appointment) => String(appointment.status || '').toUpperCase() === 'APPROVED');

      return (
        <article key={`${readOnly ? 'read-only' : 'review'}-${slotKey}`} className={`slot-group ${hasConflict ? 'slot-conflict' : ''}`}>
          <div className="slot-header">
            <div>
              <h3>{slotKey}</h3>
              <p>{slotAppointments.length} appointment{slotAppointments.length > 1 ? 's' : ''} in this block</p>
            </div>
            {hasConflict && <span className="slot-badge badge-conflict">Conflict</span>}
          </div>

          <div className="slot-cards">
            {slotAppointments.map((appointment) => {
              const draftValue = recordDrafts[appointment.id] ?? appointment.adminNotes ?? '';

              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  readOnly={readOnly}
                  draftValue={draftValue}
                  hasApproved={hasApproved}
                  onDraftChange={handleRecordDraftChange}
                  onSaveRecord={handleSaveRecord}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onComplete={handleComplete}
                />
              );
            })}
          </div>
        </article>
      );
    });
  };

  const appointmentDaysInMonth = calendarCells.filter((cell) => cell.inMonth && cell.dayAppointments.length > 0).length;
  const selectedDateLabel = selectedDateKey ? formatCalendarLabel(selectedDateKey) : 'No date selected';
  const monthLabel = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

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
    const normalizedStatus = String(nextStatus || '').toUpperCase();
    let nextNotificationPending = false;

    if (normalizedStatus === 'APPROVED' || normalizedStatus === 'REJECTED') {
      nextNotificationPending = true;
    } else if (normalizedStatus === 'COMPLETED') {
      nextNotificationPending = false;
    }

    updateAppointmentRecord(appointmentId, (appointment) => ({
      ...appointment,
      status: nextStatus,
      reviewedBy: admin?.email,
      reviewedAt: new Date().toISOString(),
      recordUpdatedAt: new Date().toISOString(),
      notificationPending: nextNotificationPending || appointment.notificationPending || false,
    }));

    let nextMessage = `Appointment ${String(nextStatus || '').toLowerCase()}.`;

    if (normalizedStatus === 'APPROVED') {
      nextMessage = 'Appointment accepted and stored in records.';
    } else if (normalizedStatus === 'COMPLETED') {
      nextMessage = 'Appointment marked as completed and recorded in records.';
    }

    setMessage(nextMessage);
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

  const handleComplete = (appointmentId) => {
    const currentAppointment = appointments.find((appointment) => appointment.id === appointmentId);

    if (!currentAppointment) {
      return;
    }

    const currentStatus = String(currentAppointment.status || 'PENDING').toUpperCase();
    if (currentStatus !== 'APPROVED') {
      setError('Only approved appointments can be marked as completed.');
      setMessage('');
      return;
    }

    updateAppointment(appointmentId, 'COMPLETED');
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

        <section className="calendar-banner">
          <div>
            <p className="ledger-eyebrow">date board</p>
            <h2>{monthLabel}</h2>
            <p>{appointmentDaysInMonth} day{appointmentDaysInMonth === 1 ? '' : 's'} in this month have appointments pinned to them.</p>
          </div>
          <div className="calendar-banner-actions">
            <button type="button" className="btn-secondary" onClick={goToPreviousMonth} aria-label="Previous month">
              Previous
            </button>
            <button type="button" className="btn-secondary" onClick={goToNextMonth} aria-label="Next month">
              Next
            </button>
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

            <h3 className="records-section-title">Pending Requests</h3>
            {renderAppointmentCards(pendingAppointments, { emptyMessage: 'No pending requests.' })}

            <h3 className="records-section-title">Approved Requests</h3>
            {renderAppointmentCards(approvedAppointments, { emptyMessage: 'No approved requests.' })}

            <h3 className="records-section-title">Rejected Requests</h3>
            {renderAppointmentCards(rejectedAppointments, { readOnly: true, emptyMessage: 'No rejected requests.' })}

            <h3 className="records-section-title">Completed Appointments</h3>
            {renderAppointmentCards(completedAppointments, { readOnly: true, emptyMessage: 'No completed appointments.' })}
          </div>

          <aside className="ledger-side">
            <section className="ledger-panel calendar-panel">
              <div className="calendar-panel-header">
                <div>
                  <p className="ledger-eyebrow">appointment calendar</p>
                  <h3>Pinboard</h3>
                </div>
                <p>{selectedDateAppointments.length} appointment{selectedDateAppointments.length === 1 ? '' : 's'} on the selected day</p>
              </div>

              <div className="calendar-legend">
                <span className="calendar-dot calendar-dot-approved">Approved</span>
                <span className="calendar-dot calendar-dot-pending">Pending</span>
                <span className="calendar-dot calendar-dot-rejected">Rejected</span>
              </div>

              <div className="calendar-grid-shell">
                <div className="calendar-weekdays">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="calendar-grid">
                  {calendarCells.map((cell) => {
                    const isSelected = cell.dateKey === selectedDateKey;
                    const hasAppointments = cell.dayAppointments.length > 0;
                    const statusSummary = cell.dayAppointments.reduce((accumulator, appointment) => {
                      const status = String(appointment.status || 'PENDING').toUpperCase();
                      accumulator[status] = (accumulator[status] || 0) + 1;
                      return accumulator;
                    }, {});

                    return (
                      <button
                        type="button"
                        key={cell.dateKey}
                        data-date-key={cell.dateKey}
                        className={`calendar-day ${cell.inMonth ? '' : 'is-muted'} ${hasAppointments ? 'has-appointments' : ''} ${isSelected ? 'is-selected' : ''}`}
                        onClick={handleCalendarDayClick}
                      >
                        <span className="calendar-day-number">{cell.currentDate.getDate()}</span>
                        {hasAppointments ? (
                          <span className="calendar-day-count">
                            {cell.dayAppointments.length} booking{cell.dayAppointments.length === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="calendar-day-empty">Open</span>
                        )}
                        {hasAppointments && (
                          <span className="calendar-day-statuses">
                            {statusSummary.APPROVED ? <i className="calendar-mini approved" aria-hidden="true" /> : null}
                            {statusSummary.PENDING ? <i className="calendar-mini pending" aria-hidden="true" /> : null}
                            {statusSummary.REJECTED ? <i className="calendar-mini rejected" aria-hidden="true" /> : null}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="selected-day-card">
                <p className="ledger-eyebrow">selected date</p>
                <h4>{selectedDateLabel}</h4>

                {selectedDateAppointments.length === 0 ? (
                  <p className="empty-copy">No appointments are pinned to this day.</p>
                ) : (
                  <div className="selected-day-list">
                    {selectedDateAppointments.map((appointment) => {
                      const status = String(appointment.status || 'PENDING').toUpperCase();

                      return (
                        <div key={appointment.id} className="selected-day-item">
                          <div>
                            <strong>{appointment.userName || 'Patient'}</strong>
                            <p>{appointment.service || 'Service'}</p>
                          </div>
                          <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

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

      {dayViewerOpen && (
        <div className="calendar-day-modal" aria-label={`Appointments for ${selectedDateLabel}`}>
          <button type="button" className="calendar-day-modal-backdrop" onClick={closeDayViewer} aria-label="Close appointment day viewer" />
          <div className="calendar-day-modal-card">
            <div className="calendar-day-modal-header">
              <div>
                <p className="ledger-eyebrow">day view</p>
                <h3>{selectedDateLabel}</h3>
                <p>{selectedDateAppointments.length} appointment{selectedDateAppointments.length === 1 ? '' : 's'} scheduled for this date.</p>
              </div>
              <button type="button" className="btn-secondary" onClick={closeDayViewer}>
                Close
              </button>
            </div>

            {selectedDateAppointments.length === 0 ? (
              <div className="empty-state">No appointments are pinned to this day.</div>
            ) : (
              <div className="calendar-day-modal-list">
                {selectedDateAppointments.map((appointment) => {
                  const status = String(appointment.status || 'PENDING').toUpperCase();

                  return (
                    <article key={appointment.id} className="calendar-day-modal-item">
                      <div className="calendar-day-modal-top">
                        <div>
                          <h4>{appointment.userName || 'Patient'}</h4>
                          <p>{appointment.userEmail || 'No email on file'}</p>
                        </div>
                        <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>
                      </div>

                      <div className="review-details">
                        <p><strong>Service:</strong> {appointment.service}</p>
                        <p><strong>Time:</strong> {appointment.time || 'Unscheduled'}</p>
                        {appointment.notes && <p><strong>Patient Notes:</strong> {appointment.notes}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppointments;