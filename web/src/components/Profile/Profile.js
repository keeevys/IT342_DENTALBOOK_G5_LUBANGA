import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user) {
        navigate('/login');
        return;
      }

      const currentUser = session.user;
      const profileKey = `profile-draft-${currentUser.email}`;
      const rawProfile = localStorage.getItem(profileKey);
      let parsedAvatarUrl = '';

      if (rawProfile) {
        try {
          const parsedProfile = JSON.parse(rawProfile);
          parsedAvatarUrl = typeof parsedProfile.avatarUrl === 'string' ? parsedProfile.avatarUrl : '';
        } catch (error) {
          parsedAvatarUrl = '';
          console.warn('Failed to parse draft profile from localStorage.', error);
        }
      }

      if (isMounted) {
        setUser({
          fullName: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User',
          email: currentUser.email,
          profileKey,
        });
        setAvatarUrl(parsedAvatarUrl);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const saveAvatar = (nextAvatarUrl) => {
    if (!user?.profileKey) {
      return;
    }

    localStorage.setItem(user.profileKey, JSON.stringify({ avatarUrl: nextAvatarUrl }));
    setAvatarUrl(nextAvatarUrl);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }

    setLoading(true);
    setMessage('');

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      saveAvatar(result);
      setMessage('Profile picture updated in draft mode.');
      setLoading(false);
    };
    reader.onerror = () => {
      setMessage('Unable to read the selected image.');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    saveAvatar('');
    setMessage('Profile picture removed.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <p className="profile-eyebrow">User Profile</p>
          <h1>{user.fullName}</h1>
        </div>
        <div className="profile-header-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-profile-back">Back to Dashboard</button>
          <button onClick={handleLogout} className="btn-profile-logout">Logout</button>
        </div>
      </header>

      <main className="profile-content">
        <section className="profile-card">
          <h2>Profile Picture</h2>
          <div className="profile-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-placeholder">{user.fullName.charAt(0).toUpperCase()}</div>
            )}
          </div>

          <label className="profile-upload-label" htmlFor="avatarUpload">
            Change profile picture
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="profile-upload-input"
          />

          <div className="profile-actions">
            <button onClick={handleRemoveAvatar} className="btn-profile-secondary" disabled={loading}>
              Remove Picture
            </button>
          </div>

          {message && <p className="profile-message">{message}</p>}
          <p className="profile-note">Draft mode stores this picture locally in your browser for now.</p>
        </section>

        <section className="profile-card">
          <h2>Account Details</h2>
          <div className="profile-detail">
            <span>Full Name</span>
            <strong>{user.fullName}</strong>
          </div>
          <div className="profile-detail">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
