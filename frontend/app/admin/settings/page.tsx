'use client';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

function Toggle({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:opacity-50 ${enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
  );
}

const PAYMENT_KEYS = [
  { key: 'payment_upi_enabled', label: 'UPI Payment', desc: 'Let customers pay via UPI (Rajasthan Cloth Store)', icon: '📲' },
  { key: 'payment_cod_enabled', label: 'Cash on Delivery', desc: 'Let customers pay cash at delivery', icon: '💵' },
  { key: 'payment_razorpay_enabled', label: 'Cards / Net Banking / Wallets', desc: 'Accept Razorpay payments (cards, net banking, wallets)', icon: '💳' },
];

const UPI_KEYS = [
  { key: 'upi_id', label: 'UPI ID', placeholder: 'yourname@bank' },
  { key: 'upi_name', label: 'Display Name', placeholder: 'Your Store Name' },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  // Admin profile state
  const [profileForm, setProfileForm] = React.useState({ firstName: '', lastName: '', phone: '' });
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Fetch current profile to pre-fill form
  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => authApi.getProfile().then(r => r.data.data),
  });
  React.useEffect(() => {
    if (profileData) {
      setProfileForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
      });
    }
  }, [profileData]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile(profileForm);
      const updatedUser = res.data.data;
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminApi.getSettings().then(r => r.data.data.map as Record<string, string>),
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-settings'] });
      toast.success('Setting saved');
    },
    onError: () => toast.error('Failed to save setting'),
  });

  const toggle = (key: string, current: string) => {
    mutation.mutate({ key, value: current === 'true' ? 'false' : 'true' });
  };

  const save = (key: string, value: string) => {
    if (!value.trim()) { toast.error('Value cannot be empty'); return; }
    mutation.mutate({ key, value: value.trim() });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-dark-800"/>)}</div>
      </div>
    );
  }

  const map: Record<string, string> = data || {};

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage payment options and store configuration.</p>
      </div>

      {/* Admin Profile */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Admin Profile</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your name appears in cancelled order records.</p>
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input value={profileForm.firstName} onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                placeholder="First name" className="input-field"/>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input value={profileForm.lastName} onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                placeholder="Last name" className="input-field"/>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX" className="input-field"/>
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile}
            className="button-primary px-6 py-2.5 disabled:opacity-50">
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </section>

      {/* Payment Methods */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
        <div className="space-y-3">
          {PAYMENT_KEYS.map(({ key, label, desc, icon }) => {
            const enabled = map[key] !== 'false';
            return (
              <div key={key} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                </div>
                <Toggle enabled={enabled} onChange={() => toggle(key, map[key] ?? 'true')} disabled={mutation.isPending}/>
              </div>
            );
          })}
        </div>
      </section>

      {/* UPI Details */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">UPI Details</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Shown to customers at checkout when UPI is selected.</p>
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-700 dark:bg-dark-800">
          {UPI_KEYS.map(({ key, label, placeholder }) => (
            <UpiField key={key} field={key} label={label} placeholder={placeholder} defaultValue={map[key] || ''} onSave={save} saving={mutation.isPending}/>
          ))}
          <div className="mt-3 rounded-xl bg-green-50 border border-green-200 p-4 dark:bg-green-950/20 dark:border-green-900/40">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Preview</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Pay to: <strong className="text-gray-900 dark:text-white">{map.upi_name || 'Rajasthan Cloth Store'}</strong>
            </p>
            <code className="mt-1 block text-sm font-mono text-green-800 dark:text-green-300">{map.upi_id || 'MAB0450543A0000066@Yesbank'}</code>
          </div>
        </div>
      </section>
    </div>
  );
}

function UpiField({ field, label, placeholder, defaultValue, onSave, saving }: { field: string; label: string; placeholder: string; defaultValue: string; onSave: (k: string, v: string) => void; saving: boolean }) {
  const [val, setVal] = React.useState(defaultValue);
  React.useEffect(() => setVal(defaultValue), [defaultValue]);
  const dirty = val !== defaultValue;
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} className="input-field flex-1 text-sm"/>
        {dirty && (
          <button onClick={() => onSave(field, val)} disabled={saving}
            className="rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            Save
          </button>
        )}
      </div>
    </div>
  );
}
