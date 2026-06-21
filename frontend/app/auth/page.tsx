'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { queryClient } from '@/components/common/Providers';
import Image from 'next/image';

type RegistrationStep = 'details' | 'otp' | 'verified';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

interface ValidationState {
  firstName: boolean;
  lastName: boolean;
  email: boolean;
  phone: boolean;
  password: boolean;
  confirm: boolean;
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    confirm: false,
  });
  const [otpAttempts, setOtpAttempts] = useState(0);
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();


  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Utility functions
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const updateValidationState = (field: keyof ValidationState, value: boolean) => {
    setValidationState(prev => ({ ...prev, [field]: value }));
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone number as user types
    if (name === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }

    setRegisterForm({ ...registerForm, [name]: formattedValue });

    // Update validation state
    switch (name) {
      case 'firstName':
        updateValidationState('firstName', value.length >= 2);
        break;
      case 'lastName':
        updateValidationState('lastName', value.length >= 2);
        break;
      case 'email':
        updateValidationState('email', validateEmail(value));
        break;
      case 'phone':
        updateValidationState('phone', validatePhone(value));
        break;
      case 'password':
        updateValidationState('password', value.length >= 6);
        if (registerForm.confirm) {
          updateValidationState('confirm', value === registerForm.confirm);
        }
        break;
      case 'confirm':
        updateValidationState('confirm', value === registerForm.password && value.length > 0);
        break;
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s+/g, ''));
  };

  const validatePasswordMatch = () => {
    if (registerForm.password !== registerForm.confirm) {
      toast.error('Passwords do not match');
      return false;
    }
    if (registerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.identifier) {
      toast.error('Please enter your email or phone number');
      return;
    }

    if (loginMethod === 'password' && !loginForm.password) {
      toast.error('Please enter your password');
      return;
    }

    if (loginMethod === 'otp' && (!loginOtp || loginOtp.length !== 6)) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        identifier: loginForm.identifier,
        password: loginMethod === 'password' ? loginForm.password : undefined,
        otp: loginMethod === 'otp' ? loginOtp : undefined,
      });

      const { user, token } = res.data.data;
      queryClient.clear();
      setUser(user);
      setToken(token);
      if (typeof window !== 'undefined') localStorage.setItem('authToken', token);

      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLoginOTP = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!loginForm.identifier) {
      toast.error('Please enter your email or phone number');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authApi.sendLoginOTP({ identifier: loginForm.identifier });
      setOtpTimer(30); // 30 second countdown
      if (res.data.data && res.data.data.otp) {
        toast.success(`[Development Mode] OTP Code: ${res.data.data.otp}`, { duration: 6000 });
        setLoginOtp(res.data.data.otp);
      } else {
        toast.success(res.data.message || 'OTP sent successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields
    if (!registerForm.firstName || !registerForm.lastName) {
      toast.error('Please enter your first and last name');
      return;
    }

    if (!registerForm.email) {
      toast.error('Please enter your email');
      return;
    }

    if (!validateEmail(registerForm.email)) {
      toast.error('Please enter a valid email');
      return;
    }

    if (!registerForm.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!validatePhone(registerForm.phone)) {
      toast.error('Please enter a valid phone number (e.g., +1234567890)');
      return;
    }

    if (!validatePasswordMatch()) {
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authApi.sendOTP({ phone: registerForm.phone });
      setRegistrationStep('otp');
      setOtpTimer(30); // 30 second countdown for resend
      if (res.data.data && res.data.data.otp) {
        toast.success(`[Development Mode] OTP Code: ${res.data.data.otp}`, { duration: 6000 });
        setOtp(res.data.data.otp);
      } else {
        toast.success(res.data.message || 'OTP sent successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    if (otpAttempts >= 3) {
      toast.error('Maximum OTP attempts exceeded. Please request a new one.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await authApi.verifyOTP({
        phone: registerForm.phone,
        code: otp,
      });

      setPhoneVerified(true);
      setRegistrationStep('verified');
      setOtpAttempts(0);
      toast.success(res.data.message || 'OTP verified successfully');
    } catch (error: any) {
      const newAttempts = otpAttempts + 1;
      setOtpAttempts(newAttempts);
      const remaining = 3 - newAttempts;
      
      if (remaining > 0) {
        toast.error(`Invalid OTP. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining`);
      } else {
        toast.error('Maximum OTP attempts exceeded. Please request a new one.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    if (!validatePasswordMatch()) {
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });

      const { user, token } = res.data.data;
      queryClient.clear();
      setUser(user);
      setToken(token);
      if (typeof window !== 'undefined') localStorage.setItem('authToken', token);

      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Account creation failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setRegistrationStep('details');
    setPhoneVerified(false);
    setOtp('');
    setLoginOtp('');
    setOtpTimer(0);
    setOtpAttempts(0);
    setValidationState({
      firstName: false,
      lastName: false,
      email: false,
      phone: false,
      password: false,
      confirm: false,
    });
    setLoginForm({ identifier: '', password: '' });
    setRegisterForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirm: '',
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — image panel */}
      <div className="hidden w-1/2 relative overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80"
          alt="Luxury Fabric"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-dark-900/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-black text-white">R</span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold text-white">
            Premium Fabrics,
            <br />
            Delivered to You
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join 10,000+ designers and makers who trust RCS Fabrics for their premium fabric
            needs.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {['500+ Fabrics', 'Free Shipping', '30-Day Returns', 'Swatch Samples'].map(perk => (
              <span
                key={perk}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-sm"
              >
                <svg
                  className="h-4 w-4 text-primary-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 dark:bg-dark-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'login'
                ? 'Welcome back'
                : registrationStep === 'details'
                  ? 'Create account'
                  : registrationStep === 'otp'
                    ? 'Verify Phone'
                    : 'Confirm Details'}
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={switchMode}
                className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <div className="mt-8 space-y-5">
              {/* Method Selector Tabs */}
              <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-dark-900">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    loginMethod === 'password'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-800 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    loginMethod === 'otp'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-800 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  OTP Login
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email or Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email or Phone Number
                  </label>
                  <input
                    name="identifier"
                    type="text"
                    value={loginForm.identifier}
                    onChange={e => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    required
                    placeholder="you@example.com or +91 98765 43210"
                    className="input-field"
                  />
                </div>

                {/* Password Fields */}
                {loginMethod === 'password' && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <input
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        placeholder="••••••••"
                        className="input-field"
                      />
                    </div>
                    <div className="text-right">
                      <button type="button" className="text-sm text-primary-600 hover:underline dark:text-primary-400">
                        Forgot password?
                      </button>
                    </div>
                  </>
                )}

                {/* OTP Fields */}
                {loginMethod === 'otp' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          OTP Code
                        </label>
                        {otpTimer > 0 ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Resend in {otpTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestLoginOTP}
                            disabled={otpLoading}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold disabled:opacity-50"
                          >
                            Request OTP
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={loginOtp}
                        onChange={e => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="000000"
                        className="input-field text-center text-2xl tracking-widest font-mono"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="button-primary mt-2 w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    loginMethod === 'password' ? 'Sign In with Password' : 'Sign In with OTP'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Registration Form - Step 1: Details */}
          {mode === 'register' && registrationStep === 'details' && (
            <form onSubmit={handleRequestOTP} className="mt-8 space-y-4">
              {/* First Name */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  {registerForm.firstName && (
                    <span className={validationState.firstName ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-600 dark:text-red-400'}>
                      {validationState.firstName ? '✓ Valid' : '✗ Min 2 characters'}
                    </span>
                  )}
                </div>
                <input
                  name="firstName"
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Priya"
                  className={`input-field transition-all ${
                    registerForm.firstName
                      ? validationState.firstName
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                      : ''
                  }`}
                />
              </div>

              {/* Last Name */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  {registerForm.lastName && (
                    <span className={validationState.lastName ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-600 dark:text-red-400'}>
                      {validationState.lastName ? '✓ Valid' : '✗ Min 2 characters'}
                    </span>
                  )}
                </div>
                <input
                  name="lastName"
                  value={registerForm.lastName}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Sharma"
                  className={`input-field transition-all ${
                    registerForm.lastName
                      ? validationState.lastName
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                      : ''
                  }`}
                />
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  {registerForm.email && (
                    <span className={validationState.email ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-600 dark:text-red-400'}>
                      {validationState.email ? '✓ Valid' : '✗ Invalid email'}
                    </span>
                  )}
                </div>
                <input
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                  placeholder="you@example.com"
                  className={`input-field transition-all ${
                    registerForm.email
                      ? validationState.email
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                      : ''
                  }`}
                />
              </div>

              {/* Phone Number */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  {registerForm.phone && (
                    <span className={validationState.phone ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-600 dark:text-red-400'}>
                      {validationState.phone ? '✓ Valid' : '✗ Invalid format'}
                    </span>
                  )}
                </div>
                <input
                  name="phone"
                  type="tel"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  required
                  placeholder="+1 (555) 123-4567"
                  className={`input-field transition-all ${
                    registerForm.phone
                      ? validationState.phone
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                      : ''
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  We'll send an OTP to this number for verification
                </p>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                </div>
                <input
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  required
                  placeholder="••••••••"
                  className={`input-field transition-all ${
                    registerForm.password
                      ? validationState.password
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                      : ''
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Min 6 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </label>
                  {registerForm.confirm && (
                    <span className={validationState.confirm ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-600 dark:text-red-400'}>
                      {validationState.confirm ? '✓ Match' : '✗ Mismatch'}
                    </span>
                  )}
                </div>
                <input
                  name="confirm"
                  type="password"
                  value={registerForm.confirm}
                  onChange={handleRegisterChange}
                  required
                  placeholder="••••••••"
                  className={`input-field transition-all ${
                    registerForm.confirm
                      ? validationState.confirm
                        ? 'border-green-500 dark:border-green-400'
                        : 'border-red-500 dark:border-red-400'
                      : ''
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  otpLoading ||
                  !validationState.firstName ||
                  !validationState.lastName ||
                  !validationState.email ||
                  !validationState.phone ||
                  !validationState.password ||
                  !validationState.confirm
                }
                className="button-primary mt-4 w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  'Request OTP'
                )}
              </button>
            </form>
          )}

          {/* Registration Form - Step 2: OTP Verification */}
          {mode === 'register' && registrationStep === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="mt-8 space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      We've sent a 6-digit OTP to <span className="font-semibold">{registerForm.phone}</span>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Valid for 10 minutes
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter OTP
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {otp.length}/6
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="input-field text-center text-3xl tracking-widest font-mono transition-all border-2"
                />
              </div>

              {/* Attempt Counter */}
              {otpAttempts > 0 && (
                <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                  <p className="text-xs text-orange-800 dark:text-orange-200">
                    ⚠️ {3 - otpAttempts} attempt{3 - otpAttempts !== 1 ? 's' : ''} remaining
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="button-primary mt-4 w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="text-center">
                {otpTimer > 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Resend OTP in <span className="font-semibold text-gray-700 dark:text-gray-300">{otpTimer}s</span>
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOTP}
                    disabled={otpLoading}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 font-medium"
                  >
                    Didn't receive OTP? Resend
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegistrationStep('details');
                  setOtp('');
                  setOtpAttempts(0);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 py-2 transition-all"
              >
                ← Back to Details
              </button>
            </form>
          )}

          {/* Registration Form - Step 3: Confirmed */}
          {mode === 'register' && registrationStep === 'verified' && (
            <form onSubmit={handleCreateAccount} className="mt-8 space-y-4">
              {/* Verification Success */}
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 flex-shrink-0">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200">Phone number verified!</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">{registerForm.phone}</p>
                  </div>
                </div>
              </div>

              {/* Information Review */}
              <div className="rounded-lg border-l-4 border-primary-500 bg-primary-50 p-4 dark:bg-primary-950/30">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.757 14.243a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.757 5.757a1 1 0 01-1.414 1.414L3.636 6.05A1 1 0 115.05 4.636l.707.707zM10 5a1 1 0 01-1-1V3a1 1 0 112 0v1a1 1 0 01-1 1z" />
                  </svg>
                  Review Your Information
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-primary-200 dark:border-primary-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{registerForm.firstName} {registerForm.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-primary-200 dark:border-primary-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{registerForm.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      {registerForm.phone}
                      <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="button-primary mt-6 w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Create Account
                  </>
                )}
              </button>

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => {
                  setRegistrationStep('details');
                  setOtp('');
                  setPhoneVerified(false);
                  setOtpAttempts(0);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 py-2 transition-all"
              >
                ← Edit Information
              </button>
            </form>
          )}

          {mode === 'register' && (
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              By creating an account you agree to our{' '}
              <a href="/terms" className="text-primary-600 hover:underline dark:text-primary-400">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-600 hover:underline dark:text-primary-400">
                Privacy Policy
              </a>
              .
            </p>
          )}

          {/* Demo credentials */}
          {mode === 'login' && (
            <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800/50 dark:bg-primary-950/30">
              <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Demo Admin Account</p>
              <p className="mt-1 text-xs text-primary-600 dark:text-primary-500">Email: admin@rcsfabrics.com</p>
              <p className="text-xs text-primary-600 dark:text-primary-500">Password: admin123</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
