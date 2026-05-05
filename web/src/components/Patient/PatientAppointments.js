import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments, writeAppointments } from '../../lib/appointmentsStore';
import { SERVICES } from '../../lib/servicesCatalog';
import PatientFrame from './PatientFrame';
import './PatientPages.css';

function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      navigate('/login');
      return;
    }

    if (isAdminUser(storedUser)) {
      navigate('/admin/dashboard');
      return;
    }

    const nextAppointments = readAppointments().filter((appointment) => appointment.userEmail === storedUser.email);
    setAppointments(sortAppointments(nextAppointments));
  }, [navigate]);

  const handleCancel = (appointmentId) => {
    const nextAppointments = appointments.map((appointment) => {
      if (appointment.id !== appointmentId) {
        return appointment;
      }

      return {
        ...appointment,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      };
    });

    const storedUser = getStoredUser();
    const allAppointments = readAppointments();
    const otherAppointments = allAppointments.filter((appointment) => appointment.userEmail !== storedUser?.email);
    const sortedAppointments = sortAppointments([...otherAppointments, ...nextAppointments]);

    writeAppointments(sortedAppointments);
    setAppointments(sortAppointments(nextAppointments));
  };

  return (
    <PatientFrame>
      <section className="patient-page-card">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Appointments</p>
          <h1>Your Appointments</h1>
          <p>Review upcoming and past bookings, then cancel if needed.</p>
        </div>

        {appointments.length === 0 ? (
          <div className="patient-empty-state">No appointments yet.</div>
        ) : (
          <ul className="patient-appointment-list">
            {appointments.map((appointment) => {
              const meta = SERVICES[appointment.service] || {};
              const description = meta.description || 'No description available.';
              const initials = (appointment.service || '')
                .split(' ')
                .slice(0, 2)
                .map((s) => s[0])
                .join('')
                .toUpperCase();

              return (
                <li key={appointment.id} className="patient-appointment-item service-card">
                  <div className="service-card-media">
                    <div className="service-media-placeholder">{initials}</div>
                  </div>

                  <div className="service-card-body">
                    <h3>{appointment.service}</h3>
                    <p className="service-description">{description}</p>
                    <p className="service-datetime">{appointment.date} at {appointment.time}</p>
                    <p className={`patient-status status-${String(appointment.status || 'PENDING').toLowerCase()}`}>
                      {appointment.status}
                    </p>
                    {appointment.notes && <p className="patient-notes">Notes: {appointment.notes}</p>}
                  </div>

                  <div className="service-card-actions">
                    {appointment.status !== 'CANCELLED' && appointment.status !== 'REJECTED' && (
                      <button type="button" className="btn-cancel" onClick={() => handleCancel(appointment.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PatientFrame>
  );
}

export default PatientAppointments;