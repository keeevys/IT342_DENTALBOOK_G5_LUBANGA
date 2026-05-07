/* global globalThis */

import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearStoredUser, getStoredUser } from '../../../lib/accessControl';
import { readAppointments } from '../../../lib/appointmentsStore';
import { supabase } from '../../../lib/supabaseClient';
import { readAvatar } from '../../../lib/profileAvatarStore';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [avatar, setAvatar] = useState(() => readAvatar(user?.email));
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    const syncNotificationState = () => {
      const userAppointments = readAppointments().filter((appointment) => appointment.userEmail === user?.email);
      setHasNotification(
        userAppointments.some((appointment) => {
          const status = String(appointment.status || '').toUpperCase();
          return appointment.notificationPending && (status === 'APPROVED' || status === 'REJECTED');
        })
      );
    };

    syncNotificationState();
    globalThis.addEventListener('dentalbook-appointments-updated', syncNotificationState);
    globalThis.addEventListener('storage', syncNotificationState);

    return () => {
      globalThis.removeEventListener('dentalbook-appointments-updated', syncNotificationState);
      globalThis.removeEventListener('storage', syncNotificationState);
    };
  }, [user?.email]);

  useEffect(() => {
    const syncAvatar = () => {
      setAvatar(readAvatar(user?.email));
    };

    syncAvatar();
    globalThis.addEventListener('dentalbook-avatar-updated', syncAvatar);

    return () => {
      globalThis.removeEventListener('dentalbook-avatar-updated', syncAvatar);
    };
  }, [user?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearStoredUser();
    navigate('/login');
  };

  return (
    <aside className="patient-sidebar" aria-label="Patient navigation">
      <div className="patient-sidebar-brand">
        <h1 className="patient-sidebar-title">DENTALBOOK</h1>
        <h2>Patient Portal</h2>
        <p>Manage your visits and account from one place.</p>
      </div>

      <nav className="patient-sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `patient-sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="patient-sidebar-link-label">Book Appointment</span>
        </NavLink>
        <NavLink to="/records" className={({ isActive }) => `patient-sidebar-link patient-sidebar-link-with-badge ${isActive ? 'active' : ''}`}>
          <span className="patient-sidebar-link-label">Records</span>
          {hasNotification && <span className="patient-sidebar-notification-dot" aria-label="Pending appointment update" />}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `patient-sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="patient-sidebar-link-label">Profile</span>
        </NavLink>
      </nav>

      <div className="patient-sidebar-footer">
        <div className="patient-sidebar-user">
          <div className="patient-sidebar-user-top">
            {avatar ? (
              <img src={avatar} alt="Profile avatar" className="patient-sidebar-avatar" />
            ) : (
              <div className="patient-sidebar-avatar patient-sidebar-avatar-placeholder">P</div>
            )}
            <div>
              <span>{user?.fullName || 'Patient'}</span>
              <small>{user?.email || 'No email available'}</small>
            </div>
          </div>
        </div>

        <button type="button" className="patient-sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;