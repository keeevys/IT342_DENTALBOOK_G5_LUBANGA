import React from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar/Sidebar';
import './PatientFrame.css';

function PatientFrame({ children }) {
  return (
    <div className="patient-frame">
      <Sidebar />

      <main className="patient-content">
        {children}
      </main>
    </div>
  );
}

PatientFrame.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PatientFrame;