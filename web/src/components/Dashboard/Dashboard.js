import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, isAdminUser } from '../../lib/accessControl';
import { SERVICES } from '../../lib/servicesCatalog';
import PatientFrame from '../Patient/PatientFrame';
import '../Patient/PatientPages.css';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

    setUser({
      fullName: storedUser.fullName || 'User',
      email: storedUser.email,
      role: 'patient',
      message: 'Signed in successfully',
    });
  }, [navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <PatientFrame>
      <section className="patient-page-card patient-book-page">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Select Appointment</p>
          <h1>Select Calendar</h1>
          <p>Choose a treatment below to open the booking page.</p>
        </div>

        <section className="appointment-card appointment-card-full booking-services-section">
          <div className="booking-services-list">
            {Object.entries(SERVICES).map(([serviceName, serviceInfo], index) => {
              const initials = serviceName
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase();

              return (
                <article key={serviceName} className="booking-service-card">
                  <div className="booking-service-image">
                    <img src={serviceInfo.image} alt={serviceName} className="booking-service-photo" />
                    <div className="booking-service-image-badge">{initials}</div>
                    <div className="booking-service-image-ribbon">{index === 0 ? 'Featured' : 'Dental Care'}</div>
                  </div>

                  <div className="booking-service-copy">
                    <h3>{serviceName}</h3>
                    <p>{serviceInfo.description}</p>
                  </div>

                  <div className="booking-service-actions">
                    <button
                      type="button"
                      className="booking-service-button"
                      onClick={() => {
                        navigate(`/book?service=${encodeURIComponent(serviceName)}`);
                      }}
                    >
                      BOOK
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </PatientFrame>
  );
}

export default Dashboard;
