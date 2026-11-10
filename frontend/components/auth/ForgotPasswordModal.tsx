'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';

export default function ForgotPasswordModal({
  open,
  onClose,
  initialIdentifier = '',
}: {
  open: boolean;
  onClose: () => void;
  initialIdentifier?: string;
}) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const close = () => {
    setStep('request');
    setOtp('');
    setPassword('');
    setConfirm('');
    onClose();
  };

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || loading) return;
    setLoading(true);
    try {
      const res = await authApi.forgotPassword({ identifier: identifier.trim() });
      const devOtp = res.data?.data?.otp;
      if (devOtp) {
        toast.success(`[Development Mode] Code: ${devOtp}`, { duration: 6000 });
        setOtp(devOtp);
      } else {
        toast.success(res.data?.message || 'If an account exists, a reset code has been sent.');
      }
      setStep('reset');
    } catch (err: any) {
      toast.error(err?.message || 'Could not send the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ identifier: identifier.trim(), otp: otp.trim(), newPassword: password });
      toast.success(res.data?.message || 'Password updated. Please sign in.');
      close();
    } catch (err: any) {
      toast.error(err?.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="forgot-title" onClick={close}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-dark-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 id="forgot-title" className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'request' ? 'Reset password' : 'Enter code'}
          </h2>
          <button type="button" onClick={close} aria-label="Close" className="text-2xl leading-none text-gray-400 hover:text-gray-600">×</button>
        </div>

        {step === 'request' ? (
          <form onSubmit={requestCode} className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Enter the email or phone number on your account and we&apos;ll send you a 6-digit code.</p>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus
              placeholder="you@example.com or +91 98765 43210" className="input-field" />
            <button type="submit" disabled={loading} className="button-primary w-full py-3">
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">We sent a code to your email/phone if an account exists. It is valid for 10 minutes.</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required inputMode="numeric"
              placeholder="6-digit code" className="input-field tracking-widest" autoComplete="one-time-code" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              placeholder="New password (min 8 characters)" className="input-field" autoComplete="new-password" />
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8}
              placeholder="Confirm new password" className="input-field" autoComplete="new-password" />
            <button type="submit" disabled={loading} className="button-primary w-full py-3">
              {loading ? 'Updating…' : 'Set new password'}
            </button>
            <button type="button" onClick={() => setStep('request')} className="w-full text-sm text-primary-600 hover:underline">
              Didn&apos;t get a code? Send again
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
