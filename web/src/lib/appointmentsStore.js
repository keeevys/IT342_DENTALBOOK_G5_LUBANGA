/* global globalThis */

export const APPOINTMENTS_STORAGE_KEY = 'dentalbook-appointments';

export const readAppointments = () => {
  try {
    const rawAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (!rawAppointments) {
      return [];
    }

    const parsedAppointments = JSON.parse(rawAppointments);
    if (!Array.isArray(parsedAppointments)) {
      return [];
    }

    return parsedAppointments.map((appointment) => ({
      ...appointment,
      id: appointment.id ?? appointment.appointmentId ?? Date.now(),
      userEmail: appointment.userEmail ?? '',
      userName: appointment.userName ?? appointment.patientName ?? 'Patient',
      service: appointment.service ?? 'Orthodontic Treatment',
      date: appointment.date ?? appointment.appointmentDate ?? '',
      time: appointment.time ?? appointment.appointmentTime ?? '',
      notes: appointment.notes ?? '',
      status: appointment.status ?? 'PENDING',
      notificationPending: appointment.notificationPending ?? false,
      createdAt: appointment.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

export const writeAppointments = (appointments) => {
  localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));

  globalThis.dispatchEvent(new Event('dentalbook-appointments-updated'));
};

export const sortAppointments = (appointments) => {
  return [...appointments].sort((left, right) => {
    const leftStamp = `${left.date || ''}T${left.time || ''}`;
    const rightStamp = `${right.date || ''}T${right.time || ''}`;
    return leftStamp.localeCompare(rightStamp);
  });
};