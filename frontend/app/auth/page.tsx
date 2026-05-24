'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await authApi.login({ email: form.email, password: form.password });
      } else {
        res = await authApi.register({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName
        });
      }

      const { user, token } = res.data.data;
      setUser(user);
      setToken(token);
      if (typeof window !== 'undefined') localStorage.setItem('authToken', token);
      
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — image panel */}
      <div className="hidden w-1/2 relative overflow-hidden lg:block">
        <Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80" alt="Luxury Fabric" fill priority sizes="50vw" className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-dark-900/60"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <span className="text-3xl font-black text-white">R</span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold text-white">Premium Fabrics,<br/>Delivered to You</h2>
          <p className="mt-4 text-lg text-white/80">Join 10,000+ designers and makers who trust RCS Fabrics for their premium fabric needs.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {['500+ Fabrics', 'Free Shipping', '30-Day Returns', 'Swatch Samples'].map((perk) => (
              <span key={perk} className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-sm">
                <svg className="h-4 w-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 dark:bg-dark-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Priya" className="input-field"/>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Sharma" className="input-field"/>
                </div>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" className="input-field"/>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="••••••••" className="input-field"/>
            </div>
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required placeholder="••••••••" className="input-field"/>
              </div>
            )}
            {mode === 'login' && (
              <div className="text-right">
                <button type="button" className="text-sm text-primary-600 hover:underline dark:text-primary-400">Forgot password?</button>
              </div>
            )}
            <button type="submit" disabled={loading} className="button-primary mt-2 w-full py-3.5 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'register' && (
            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              By creating an account you agree to our{' '}
              <a href="/terms" className="text-primary-600 hover:underline dark:text-primary-400">Terms</a> and{' '}
              <a href="/privacy" className="text-primary-600 hover:underline dark:text-primary-400">Privacy Policy</a>.
            </p>
          )}

          {/* Demo credentials */}
          <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800/50 dark:bg-primary-950/30">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400">Demo Admin Account</p>
            <p className="mt-1 text-xs text-primary-600 dark:text-primary-500">Email: admin@rcsfabrics.com</p>
            <p className="text-xs text-primary-600 dark:text-primary-500">Password: admin123</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
