/* global globalThis */

import React from 'react';
import { getStoredUser } from '../../lib/accessControl';
import PatientFrame from './PatientFrame';
import './PatientPages.css';

function PatientProfile() {
  const user = getStoredUser();

  return (
    <PatientFrame>
      <section className="patient-page-card patient-profile-page">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Profile</p>
          <h1>Your Profile</h1>
          <p>Review the account details used for booking appointments.</p>
        </div>

        <div className="patient-profile-card">
          <div>
            <span>Name</span>
            <strong>{user?.fullName || 'Patient'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user?.email || 'No email available'}</strong>
          </div>
        </div>
      </section>
    </PatientFrame>
  );
}

export default PatientProfile;