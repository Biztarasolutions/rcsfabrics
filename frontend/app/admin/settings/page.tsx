'use client';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '@/lib/api';

// Super admin only. Earlier payment/UPI controls are in git history if needed again.
export default function AdminSettingsPage() {
  const [sending, setSending] = useState(false);

  const sendSamples = async () => {
    setSending(true);
    try {
      const res = await adminApi.sendEmailSamples();
      toast.success(res.data?.message || 'Sample emails sent');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not send the sample emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email templates</h3>
        <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-400">
          Send yourself a sample of every email the website sends — order confirmations, status updates, login codes and
          enquiry alerts — filled with example data, so you can check how they look in your inbox. No customer receives these.
        </p>
        <button type="button" onClick={sendSamples} disabled={sending}
          className="button-primary mt-5 px-5 py-2.5 text-sm disabled:opacity-60">
          {sending ? 'Sending 15 emails…' : 'Send all sample emails to me'}
        </button>
      </div>
    </div>
  );
}
