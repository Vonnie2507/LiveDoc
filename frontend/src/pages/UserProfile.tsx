import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { QuestionInputField } from '../components/QuestionInputField';
import { TouchTargetButton } from '../components/TouchTargetButton';
import { validators } from '../utils/validators';

export function UserProfile(): JSX.Element {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (): Promise<void> => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Name is required');
      return;
    }

    if (!validators.validateEmail(email)) {
      setErrorMessage('Invalid email format');
      return;
    }

    if (currentPassword) {
      if (newPassword.length < 8) {
        setErrorMessage('Password must be at least 8 characters');
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match');
        return;
      }
    }

    const updateObject: any = {
      name,
      email,
      phone
    };

    if (currentPassword) {
      updateObject.currentPassword = currentPassword;
      updateObject.newPassword = newPassword;
    }

    try {
      await updateProfile(updateObject);
      setSuccessMessage('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage('Failed to update profile: ' + error.message);
    }
  };

  return (
    <div>
      <h1>My Profile</h1>
      <QuestionInputField
        type="text"
        value={name}
        onChange={setName}
        placeholder="Name"
        required
      />
      <QuestionInputField
        type="text"
        value={email}
        onChange={setEmail}
        placeholder="Email"
        required
      />
      <QuestionInputField
        type="text"
        value={phone}
        onChange={setPhone}
        placeholder="Phone"
      />
      <div>Change Password</div>
      <QuestionInputField
        type="password"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Current Password"
      />
      <QuestionInputField
        type="password"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="New Password"
      />
      <QuestionInputField
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Confirm Password"
      />
      <TouchTargetButton variant="primary" onClick={handleSaveProfile}>
        Save Changes
      </TouchTargetButton>
      {errorMessage && <div>{errorMessage}</div>}
      {successMessage && <div>{successMessage}</div>}
    </div>
  );
}