export const ADMIN_EMAIL = 'admin@dentalbook.com';
export const ADMIN_PASSWORD = 'Admin@12345';
export const ADMIN_ROLE = 'admin';
export const PATIENT_ROLE = 'patient';

export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const isAdminUser = (user) => Boolean(user && (user.role === ADMIN_ROLE || user.email === ADMIN_EMAIL));

export const storeUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem('user');
};