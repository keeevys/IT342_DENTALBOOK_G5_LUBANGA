import React from 'react';
import PatientFrame from './PatientFrame';
import './PatientPages.css';

function PatientSettings() {
  return (
    <PatientFrame>
      <section className="patient-page-card">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Settings</p>
          <h1>Account Settings</h1>
          <p>Manage profile preferences and account options from this page.</p>
        </div>

        <div className="patient-empty-state">
          Settings controls can be added here next.
        </div>
      </section>
    </PatientFrame>
  );
}

export default PatientSettings;