/* global globalThis */

import React, { useEffect, useRef, useState } from 'react';
import { getStoredUser } from '../../lib/accessControl';
import { readAvatar, removeAvatar, uploadAvatar } from '../../lib/profileAvatarStore';
import PatientFrame from './PatientFrame';
import './PatientPages.css';

function PatientProfile() {
  const user = getStoredUser();
  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAvatar(user?.email ? readAvatar(user.email) || '' : '');
  }, [user?.email]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file.');
      return;
    }

    try {
      setMessage('Uploading picture...');
      const uploadedAvatar = await uploadAvatar(user.email, file);
      setAvatar(uploadedAvatar || '');
      setMessage('Profile picture saved.');
      globalThis.dispatchEvent(new Event('dentalbook-avatar-updated'));
    } catch (error) {
      setMessage(error?.message || 'Could not upload the selected image.');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.email) {
      return;
    }

    try {
      await removeAvatar(user.email);
      setAvatar('');
      setMessage('Profile picture removed.');
      globalThis.dispatchEvent(new Event('dentalbook-avatar-updated'));
    } catch (error) {
      setMessage(error?.message || 'Could not remove the profile picture.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <PatientFrame>
      <section className="patient-page-card patient-profile-page">
        <div className="patient-page-header">
          <p className="patient-page-eyebrow">Profile</p>
          <h1>Your Profile</h1>
          <p>Review the account details used for booking appointments.</p>
        </div>

        <div className="patient-avatar-section">
          <div className="patient-avatar-preview">
            {avatar ? (
              <img src={avatar} alt="Profile avatar preview" className="patient-avatar-image" />
            ) : (
              <div className="patient-avatar-placeholder">No avatar selected</div>
            )}
          </div>

          <div className="patient-avatar-actions">
            <label htmlFor="patient-avatar-upload" className="patient-avatar-button">
              Upload Picture
            </label>
            <input
              id="patient-avatar-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="patient-avatar-input"
            />

            <button type="button" className="patient-avatar-remove" onClick={handleRemoveAvatar}>
              Remove Picture
            </button>

            {message && <p className="patient-avatar-message">{message}</p>}
          </div>
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