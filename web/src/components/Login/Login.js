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
    <div className="login-container auth-split">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>Welcome Back</h1>
          <p className="auth-lead">Securely access patient records and clinic controls.</p>
        </div>
        <div className="auth-decor">
          <span className="dot dot-lg" />
          <span className="dot dot-sm" />
          <span className="dot dot-md" />
        </div>
      </div>

      <div className="auth-right">
        <div className="login-card glass-card">
          <h2>Sign in</h2>

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
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </form>

          <p className="register-link">
            Don't have an account? <a href="/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
