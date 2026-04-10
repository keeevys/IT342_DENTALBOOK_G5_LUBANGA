import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let subscription = null;

    const loadUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user) {
        navigate('/login');
        return;
      }

      const currentUser = session.user;
      if (isMounted) {
        setUser({
          fullName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User',
          email: currentUser.email,
          message: 'Signed in with Supabase',
        });
      }

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!newSession?.user) {
          navigate('/login');
          return;
        }

        const nextUser = newSession.user;
        if (isMounted) {
          setUser({
            fullName: nextUser.user_metadata?.full_name || nextUser.user_metadata?.name || 'User',
            email: nextUser.email,
            message: 'Signed in with Supabase',
          });
        }
      });

      subscription = data.subscription;
    };

    loadUser();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
