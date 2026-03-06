import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if not logged in
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
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
          <h2>Welcome, {user.fullName}! </h2>
          <p>Email: {user.email}</p>
          <p className="success-message">{user.message}</p>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <h3> Appointments</h3>
            <p>View and manage your dental appointments</p>
          </div>
          <div className="info-card">
            <h3> Records</h3>
            <p>Access your dental records</p>
          </div>
          <div className="info-card">
            <h3> Settings</h3>
            <p>Update your profile settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
