import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { QuestionInputField } from '../components/QuestionInputField'
import { TouchTargetButton } from '../components/TouchTargetButton'

export function Login(): JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const { login, loading } = useAuth()
  const navigate = useNavigate()

  const handleEmailChange = (newValue: string): void => {
    setEmail(newValue)
    if (newValue !== '') {
      setEmailError('')
    }
  }

  const handlePasswordChange = (newValue: string): void => {
    setPassword(newValue)
    if (newValue !== '') {
      setPasswordError('')
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (email === '') {
      setEmailError('Email is required')
    }
    if (password === '') {
      setPasswordError('Password is required')
    }
    
    if (email !== '' && password !== '') {
      try {
        await login(email, password)
        navigate('/dashboard')
      } catch (error: any) {
        setPasswordError(error.message)
      }
    }
  }

  return (
    <div style={{ maxWidth: '400px', padding: '40px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Login to Another Project</h1>
      
      <QuestionInputField
        label="Email"
        inputType="text"
        value={email}
        onChange={handleEmailChange}
        validationState={emailError !== '' ? 'invalid' : 'empty'}
        errorMessage={emailError}
      />
      
      <QuestionInputField
        label="Password"
        inputType="password"
        value={password}
        onChange={handlePasswordChange}
        validationState={passwordError !== '' ? 'invalid' : 'empty'}
        errorMessage={passwordError}
      />
      
      <TouchTargetButton
        variant="primary"
        label="Login"
        onClick={handleSubmit}
        disabled={loading}
      />
    </div>
  )
}