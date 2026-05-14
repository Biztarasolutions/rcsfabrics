'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // API call would go here
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <button
        type="submit"
        disabled={isLoading}
        className="button-primary w-full py-2 mt-6"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-dark-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-600 dark:bg-dark-800 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        className="button-secondary w-full py-2"
      >
        Google
      </button>
    </form>
  );
}
