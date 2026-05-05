import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments, writeAppointments } from '../../lib/appointmentsStore';
import PatientFrame from '../Patient/PatientFrame';
import '../Patient/PatientPages.css';
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

  useEffect(() => {
    if (!user?.email) {
      setAppointments([]);
      return;
    }

    const currentAppointments = readAppointments().filter((appointment) => appointment.userEmail === user.email);
    setAppointments(sortAppointments(currentAppointments));
  }, [user]);

  const persistAppointments = (nextAppointments) => {
    if (!user?.email) {
      return;
    }

    const allAppointments = readAppointments();
    const otherAppointments = allAppointments.filter((appointment) => appointment.userEmail !== user.email);
    const nextAllAppointments = sortAppointments([...otherAppointments, ...nextAppointments]);

    writeAppointments(nextAllAppointments);
    setAppointments(sortAppointments(nextAppointments));
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
      userEmail: user.email,
      userName: user.fullName,
      service: bookingForm.service,
      date: bookingForm.date,
      time: bookingForm.time,
      notes: bookingForm.notes.trim(),
      status: 'PENDING',
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
    setBookingStatus('Appointment booked and submitted for review.');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <PatientFrame>
      <section className="patient-page-card">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Book Appointment</p>
          <h1>Schedule your visit</h1>
          <p>Choose a service, date, and time, then submit your booking for review.</p>
        </div>

        <section className="appointment-card appointment-card-full">
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
      </section>
    </PatientFrame>
  );
}

export default Dashboard;
