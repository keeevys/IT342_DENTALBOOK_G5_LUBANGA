import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientFrame from './PatientFrame';
import { getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments, writeAppointments } from '../../lib/appointmentsStore';
import { SERVICES } from '../../lib/servicesCatalog';
import './PatientPages.css';

function PatientRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);

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

    const patientAppointments = readAppointments().filter((a) => a.userEmail === storedUser.email);

    const sortedAppointments = sortAppointments(patientAppointments);
    setRecords(sortedAppointments);

    const acknowledgedAppointments = readAppointments().map((appointment) => {
      if (appointment.userEmail !== storedUser.email) {
        return appointment;
      }

      if (!appointment.notificationPending) {
        return appointment;
      }

      if (String(appointment.status || '').toUpperCase() !== 'APPROVED' && String(appointment.status || '').toUpperCase() !== 'REJECTED') {
        return appointment;
      }

      return {
        ...appointment,
        notificationPending: false,
      };
    });

    writeAppointments(acknowledgedAppointments);
  }, [navigate]);

  return (
    <PatientFrame>
      <section className="patient-page-card patient-records-page">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Records</p>
          <h1>Dental Records</h1>
          <p>View treatment history, visit summaries, and past appointments below.</p>
        </div>

        {records.length === 0 ? (
          <div className="patient-empty-state">No past records or appointments found.</div>
        ) : (
          <ul className="patient-appointment-list">
            {records.map((appointment) => {
              const meta = SERVICES[appointment.service] || {};
              const description = meta.description || '';
              const serviceImage = meta.image;
              const initials = (appointment.service || '')
                .split(' ')
                .slice(0, 2)
                .map((s) => s[0])
                .join('')
                .toUpperCase();

              return (
                <li key={appointment.id} className="patient-appointment-item service-card">
                  <div className="service-card-media">
                    {serviceImage ? (
                      <img src={serviceImage} alt={appointment.service} className="service-media-image" />
                    ) : (
                      <div className="service-media-placeholder">{initials}</div>
                    )}
                  </div>

                  <div className="service-card-body">
                    <h3>{appointment.service}</h3>
                    {description && <p className="service-description">{description}</p>}
                    <p className="service-datetime">{appointment.date} at {appointment.time}</p>
                    <p className={`patient-status status-${String(appointment.status || 'PENDING').toLowerCase()}`}>
                      {appointment.status}
                    </p>
                    {appointment.adminNotes && <p className="patient-notes">Clinician notes: {appointment.adminNotes}</p>}
                    {appointment.notes && <p className="patient-notes">Patient notes: {appointment.notes}</p>}
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

export default PatientRecords;