'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('http://localhost:4000/api/v1/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Request failed');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p>If that email is in our system, we&apos;ve sent a password reset link.</p>
          <Link href="/login" className="text-blue-600 hover:underline">Return to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-sm text-center">
          <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
