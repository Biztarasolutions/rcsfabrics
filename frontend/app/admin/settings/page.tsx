'use client';
import React from 'react';

// Settings are cleared for now (super admin only). The earlier payment/UPI
// controls are in git history if they are needed again; saved values are unchanged.
export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-dark-700 dark:bg-dark-900">
        <p className="text-base font-semibold text-gray-900 dark:text-white">Nothing here yet</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Store settings will appear here.</p>
      </div>
    </div>
  );
}
