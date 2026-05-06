import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { ADMIN_EMAIL } from '../../lib/accessControl';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.email.trim().toLowerCase() === ADMIN_EMAIL) {
      setError('This email is reserved for clinic admin access.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data?.user) {
        alert(data.session ? 'Registration successful!' : 'Registration successful! Please check your email to confirm your account.');
        navigate('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container auth-split">
      <div className="auth-left">
        <div className="auth-brand">
          <h1>Join Dentalbook</h1>
          <p className="auth-lead">Create your account to request appointments and view records.</p>
        </div>
        <div className="auth-decor">
          <span className="dot dot-lg" />
          <span className="dot dot-sm" />
        </div>
      </div>

      <div className="auth-right">
        <div className="register-card glass-card">
          <h2>Create account</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Full Name"
              />
            </div>

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

            <div className="form-group two-cols">
              <div>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword">Confirm</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="Confirm Password"
                />
              </div>
            </div>

            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="login-link">
            Already registered? <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
