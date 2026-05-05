import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE, PATIENT_ROLE, storeUser } from '../../lib/accessControl';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.email.trim().toLowerCase() === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
      storeUser({
        fullName: 'Clinic Admin',
        email: ADMIN_EMAIL,
        role: ADMIN_ROLE,
        message: 'Admin login successful'
      });
      alert('Admin login successful!');
      navigate('/admin/dashboard');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (data?.session) {
        const user = data.session.user;
        const isAdminAccount = user.email?.trim().toLowerCase() === ADMIN_EMAIL;
        storeUser({
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email,
          role: isAdminAccount ? ADMIN_ROLE : PATIENT_ROLE,
          message: isAdminAccount ? 'Admin login successful' : 'Login successful'
        });
        alert(isAdminAccount ? 'Admin login successful!' : 'Login successful!');
        navigate(isAdminAccount ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Password"
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="register-link">
          Don't Have an Account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
}

export default Login;
