import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { QuestionInputField } from '../components/QuestionInputField';
import { TouchTargetButton } from '../components/TouchTargetButton';
import { validateEmail } from '../utils/validators';

export function UserProfile(): JSX.Element {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

    if (!validateEmail(email)) {
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
    } catch (error) {
      setErrorMessage(`Failed to update profile: ${(error as Error).message}`);
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
        required={true}
      />

      <QuestionInputField
        type="text"
        value={email}
        onChange={setEmail}
        placeholder="Email"
        required={true}
      />

      <QuestionInputField
        type="text"
        value={phone}
        onChange={setPhone}
        placeholder="Phone"
        required={false}
      />

      <div>Change Password</div>

      <QuestionInputField
        type="password"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Current Password"
        required={false}
      />

      <QuestionInputField
        type="password"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="New Password"
        required={false}
      />

      <QuestionInputField
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Confirm Password"
        required={false}
      />

      <TouchTargetButton variant="primary" onClick={handleSaveProfile}>
        Save Changes
      </TouchTargetButton>

      {successMessage && <div>{successMessage}</div>}
      {errorMessage && <div>{errorMessage}</div>}
    </div>
  );
}