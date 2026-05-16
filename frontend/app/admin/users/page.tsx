'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getCustomers().then(res => res.data.data || []),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-700 dark:bg-dark-900">
        <p className="text-gray-500">Manage all registered users and their roles.</p>
        <div className="mt-4">
          {isLoading ? <p>Loading users...</p> : <p>{users.length} users found.</p>}
        </div>
      </div>
    </div>
  );
}
