import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, isAdminUser } from '../../lib/accessControl';
import { readAppointments, sortAppointments, writeAppointments } from '../../lib/appointmentsStore';
import { SERVICES } from '../../lib/servicesCatalog';
import PatientFrame from '../Patient/PatientFrame';
import '../Patient/PatientPages.css';
import './BookingPage.css';

const TIME_START = 10 * 60;
const TIME_END = 18 * 60;
const LUNCH_BREAK_START = 11 * 60 + 30;
const LUNCH_BREAK_END = 13 * 60 + 30;

const formatTimeLabel = (minutes) => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
};

const createTimeSlots = () => {
  const slots = [];
  let currentMinutes = TIME_START;

  while (currentMinutes <= TIME_END) {
    if (currentMinutes >= LUNCH_BREAK_START && currentMinutes < LUNCH_BREAK_END) {
      currentMinutes = LUNCH_BREAK_END;
      continue;
    }

    slots.push(formatTimeLabel(currentMinutes));

    if (currentMinutes === TIME_END) {
      break;
    }

    const gap = 20 + Math.floor(Math.random() * 3) * 10;
    const nextMinutes = currentMinutes + gap;

    if (currentMinutes < LUNCH_BREAK_START && nextMinutes >= LUNCH_BREAK_START) {
      currentMinutes = LUNCH_BREAK_END;
      continue;
    }

    currentMinutes = nextMinutes;

    if (currentMinutes > TIME_END && slots.at(-1) !== formatTimeLabel(TIME_END)) {
      slots.push(formatTimeLabel(TIME_END));
      break;
    }
  }

  return [...new Set(slots)];
};

const formatMonthLabel = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

const formatCalendarDateLabel = (date) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const fromDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptySlots = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leadingEmptySlots; index += 1) {
    days.push({ key: `pad-${year}-${month}-${index}`, date: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ key: `day-${year}-${month}-${day}`, date: new Date(year, month, day) });
  }

  return days;
};

function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const serviceNames = useMemo(() => Object.keys(SERVICES), []);
  const serviceSlots = useMemo(() => createTimeSlots(), []);
  const serviceFromQuery = new URLSearchParams(location.search).get('service');
  const today = useMemo(() => new Date(), []);
  const [user, setUser] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(today));
  const [selectedTime, setSelectedTime] = useState(serviceSlots[0] || '10:00 AM');
  const [bookingForm, setBookingForm] = useState({
    service: serviceNames[0] || 'Orthodontic Treatment',
    notes: '',
  });

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
    if (!serviceFromQuery || !SERVICES[serviceFromQuery]) {
      return;
    }

    setBookingForm((previous) => ({
      ...previous,
      service: serviceFromQuery,
    }));
  }, [serviceFromQuery]);

  useEffect(() => {
    const syncAppointments = () => {
      setAppointments(readAppointments());
    };

    syncAppointments();
  }, []);

  const calendarDays = useMemo(() => getCalendarDays(viewMonth), [viewMonth]);
  const selectedDateObject = useMemo(() => fromDateKey(selectedDate), [selectedDate]);
  const selectedService = SERVICES[bookingForm.service] || SERVICES[serviceNames[0]] || {
    description: 'Treatment selected from the booking button.',
  };

  const bookedTimesForSelectedDate = useMemo(() => {
    return appointments
      .filter((appointment) => appointment.date === selectedDate)
      .filter((appointment) => appointment.status !== 'CANCELLED' && appointment.status !== 'REJECTED')
      .map((appointment) => appointment.time);
  }, [appointments, selectedDate]);

  const availableTimeSlots = useMemo(() => {
    return serviceSlots.filter((slot) => !bookedTimesForSelectedDate.includes(slot));
  }, [serviceSlots, bookedTimesForSelectedDate]);

  const selectedDateLabel = formatCalendarDateLabel(selectedDateObject);

  const persistAppointments = (nextAppointments) => {
    if (!user?.email) {
      return;
    }

    const allAppointments = readAppointments();
    const otherAppointments = allAppointments.filter((appointment) => appointment.userEmail !== user.email);
    const nextAllAppointments = sortAppointments([...otherAppointments, ...nextAppointments]);

    writeAppointments(nextAllAppointments);
    setAppointments(nextAllAppointments);
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

    if (!selectedDate || !selectedTime) {
      setBookingStatus('Please select both date and time.');
      return;
    }

    const newAppointment = {
      id: Date.now(),
      userEmail: user.email,
      userName: user.fullName,
      service: bookingForm.service,
      date: selectedDate,
      time: selectedTime,
      notes: bookingForm.notes.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const currentUserAppointments = readAppointments().filter((appointment) => appointment.userEmail === user.email);
    const nextAppointments = [newAppointment, ...currentUserAppointments];
    persistAppointments(nextAppointments);

    setBookingForm((previous) => ({
      ...previous,
      notes: '',
    }));
    setBookingStatus('Appointment booked and submitted for review.');
  };

  useEffect(() => {
    if (availableTimeSlots.length === 0) {
      setSelectedTime('');
      return;
    }

    if (!availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, selectedTime]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const goMonth = (delta) => {
    setViewMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1));
  };

  return (
    <PatientFrame>
      <section className="patient-page-card booking-page booking-surface">
        <header className="booking-topbar">
            <button type="button" className="booking-back-link" onClick={() => navigate('/dashboard')}>
              ‹ Select Appointment
            </button>
          <h1>Select Calendar</h1>
          <div className="booking-topbar-spacer" />
        </header>

        <div className="booking-layout">
          <section className="booking-calendar-panel">
            <div className="booking-calendar-header">
              <button type="button" className="booking-month-button" onClick={() => goMonth(-1)} aria-label="Previous month">
                ‹
              </button>
              <strong>{formatMonthLabel(viewMonth)}</strong>
              <button type="button" className="booking-month-button" onClick={() => goMonth(1)} aria-label="Next month">
                ›
              </button>
            </div>

            <div className="booking-weekdays" aria-hidden="true">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="booking-calendar-grid" role="grid" aria-label="Appointment calendar">
              {calendarDays.map((item) => {
                if (!item.date) {
                  return <span key={item.key} className="booking-calendar-empty" />;
                }

                const dayKey = toDateKey(item.date);
                const isSelected = dayKey === selectedDate;

                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`booking-calendar-day ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(dayKey)}
                  >
                    {item.date.getDate()}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="booking-details-panel">
            <div className="booking-details-header">
              <h2>{selectedDateLabel}</h2>
              <p>TIME ZONE: MANILA (GMT+08:00)</p>
            </div>

            <div className="booking-treatment-strip">
              <div className="booking-treatment-art">
                <img src={selectedService.image} alt={bookingForm.service} className="booking-treatment-photo" />
                <div className="booking-treatment-art-badge">
                  {bookingForm.service
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
              </div>

              <div className="booking-treatment-copy">
                <h3>{bookingForm.service}</h3>
                <p>{selectedService.description}</p>
              </div>
            </div>

            <div className="booking-time-grid" aria-label="Available appointment times">
              {availableTimeSlots.length === 0 ? (
                <p className="booking-no-slots">No open times for this date.</p>
              ) : availableTimeSlots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  className={`booking-time-slot ${selectedTime === slot ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>

            <form onSubmit={handleBookAppointment} className="booking-notes-form">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={bookingForm.notes}
                onChange={handleBookingChange}
                placeholder="Any concerns to tell your dentist?"
                rows={4}
              />

              <div className="booking-action-row">
                <div className="booking-selection-summary">
                  <span>{bookingForm.service}</span>
                  <strong>
                    {selectedDateLabel} at {selectedTime}
                  </strong>
                </div>
                <button type="submit" className="btn-book booking-submit-button">
                  Confirm Booking
                </button>
              </div>
            </form>

            {bookingStatus && <p className="booking-status">{bookingStatus}</p>}
          </section>
        </div>
      </section>
    </PatientFrame>
  );
}

export default BookingPage;
