import React from 'react';
import PatientFrame from './PatientFrame';
import './PatientPages.css';

function PatientRecords() {
  return (
    <PatientFrame>
      <section className="patient-page-card">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Records</p>
          <h1>Dental Records</h1>
          <p>View treatment history, visit summaries, and future record updates here.</p>
        </div>

        <div className="patient-empty-state">
          Records access is ready for future integration.
        </div>
      </section>
    </PatientFrame>
  );
}

export default PatientRecords;