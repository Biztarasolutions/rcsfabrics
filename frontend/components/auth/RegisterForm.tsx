'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // API call would go here
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Password
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Confirm Password
        </label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-dark-700 dark:bg-dark-800 dark:text-white"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full py-2 mt-6"
      >
        {isLoading ? 'Creating account...' : 'Register'}
      </button>
    </form>
  );
}
