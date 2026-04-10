import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bookingStatus, setBookingStatus] = useState('');
  const [bookingForm, setBookingForm] = useState({
    service: 'General Checkup',
    date: '',
    time: '',
    notes: ''
  });
  const navigate = useNavigate();

  const storageKey = user ? `appointments-draft-${user.email}` : null;

  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user) {
        navigate('/login');
        return;
      }

      const currentUser = session.user;
      if (isMounted) {
        setUser({
          fullName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User',
          email: currentUser.email,
          message: 'Signed in with Supabase',
        });
      }

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession?.user) {
          navigate('/login');
          return;
        }

        const nextUser = newSession.user;
        if (isMounted) {
          setUser({
            fullName: nextUser.user_metadata?.full_name || nextUser.user_metadata?.name || 'User',
            email: nextUser.email,
            message: 'Signed in with Supabase',
          });
        }
      });

      subscription = data.subscription;
    };

    loadUser();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    const rawAppointments = localStorage.getItem(storageKey);
    if (!rawAppointments) {
      setAppointments([]);
      return;
    }

    try {
      const parsedAppointments = JSON.parse(rawAppointments);
      setAppointments(Array.isArray(parsedAppointments) ? parsedAppointments : []);
    } catch (error) {
      setAppointments([]);
      localStorage.removeItem(storageKey);
      console.warn('Failed to parse draft appointments from localStorage.', error);
    }
  }, [storageKey]);

  const persistAppointments = (nextAppointments) => {
    if (!storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(nextAppointments));
    setAppointments(nextAppointments);
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setBookingStatus('');
  };

  const handleBookAppointment = (event) => {
    event.preventDefault();

    if (!bookingForm.date || !bookingForm.time) {
      setBookingStatus('Please select both date and time.');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      service: bookingForm.service,
      date: bookingForm.date,
      time: bookingForm.time,
      notes: bookingForm.notes.trim(),
      status: 'Booked',
      createdAt: new Date().toISOString(),
    };

    const nextAppointments = [newAppointment, ...appointments];
    persistAppointments(nextAppointments);

    setBookingForm({
      service: 'General Checkup',
      date: '',
      time: '',
      notes: ''
    });
    setBookingStatus('Appointment booked (draft mode).');
  };

  const handleCancelAppointment = (appointmentId) => {
    const nextAppointments = appointments.filter((appointment) => appointment.id !== appointmentId);
    persistAppointments(nextAppointments);
    setBookingStatus('Appointment canceled.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>DentalBook Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user.fullName}!</h2>
          <p>Email: {user.email}</p>
          <p className="success-message">{user.message}</p>
          <p className="draft-label">Draft Mode: appointments are stored locally for now.</p>
        </div>

        <div className="appointment-grid">
          <section className="appointment-card">
            <h3>Book Appointment</h3>
            <form onSubmit={handleBookAppointment} className="booking-form">
              <label htmlFor="service">Service</label>
              <select
                id="service"
                name="service"
                value={bookingForm.service}
                onChange={handleBookingChange}
              >
                <option value="General Checkup">General Checkup</option>
                <option value="Teeth Cleaning">Teeth Cleaning</option>
                <option value="Tooth Extraction">Tooth Extraction</option>
                <option value="Dental Filling">Dental Filling</option>
                <option value="Consultation">Consultation</option>
              </select>

              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={bookingForm.date}
                onChange={handleBookingChange}
                required
              />

              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={bookingForm.time}
                onChange={handleBookingChange}
                required
              />

              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={bookingForm.notes}
                onChange={handleBookingChange}
                placeholder="Any concerns to tell your dentist?"
                rows={3}
              />

              <button type="submit" className="btn-book">Book Appointment</button>
            </form>
            {bookingStatus && <p className="booking-status">{bookingStatus}</p>}
          </section>

          <section className="appointment-card">
            <h3>Your Appointments</h3>
            {appointments.length === 0 ? (
              <p className="empty-appointments">No appointments yet.</p>
            ) : (
              <ul className="appointment-list">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="appointment-item">
                    <div>
                      <p className="appointment-service">{appointment.service}</p>
                      <p>{appointment.date} at {appointment.time}</p>
                      {appointment.notes && <p className="appointment-notes">Notes: {appointment.notes}</p>}
                    </div>
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <h3>Appointments</h3>
            <p>Book, view, and cancel appointments in draft mode</p>
          </div>
          <div className="info-card">
            <h3>Records</h3>
            <p>Access your dental records</p>
          </div>
          <div className="info-card">
            <h3>Settings</h3>
            <p>Update your profile settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
