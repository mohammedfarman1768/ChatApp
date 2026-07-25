'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const sans = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('http://localhost:4000/api/v1/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
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
      <div className={`flex min-h-screen bg-[#F8FAFC] ${sans.className}`}>
        <div className="w-full flex items-center justify-center p-8 bg-[#F3F6FA]">
          <div className="w-full max-w-[420px] bg-white rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-50 text-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-[24px] font-bold text-[#111827] tracking-tight mb-3">Check your email</h1>
            <p className="text-gray-500 text-[15px] mb-8">We&apos;ve sent a verification link to <span className="font-semibold text-gray-700">{email}</span>.</p>
            <Link href="/login" className="block w-full py-3.5 text-white bg-[#2563EB] rounded-[12px] hover:bg-[#1D4ED8] transition-all font-semibold text-[15px] shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-[#F8FAFC] ${sans.className}`}>
      {/* Top right Sign In link */}
      <div className="absolute top-6 right-6 md:top-8 md:right-12 z-20">
        <Link href="/login" className="text-[#3B82F6] font-semibold hover:text-[#2563EB] transition-colors">Log In</Link>
      </div>

      {/* Left Side: Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-white flex-col items-center justify-center relative">
        <div className="w-full max-w-lg px-8">
          <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <circle cx="80" cy="320" r="60" fill="#EEF2FF" />
            <circle cx="420" cy="80" r="50" fill="#FEF3C7" />
            <circle cx="400" cy="340" r="40" fill="#D1FAE5" />
            <circle cx="120" cy="200" r="36" fill="#FBBF24"/>
            <circle cx="120" cy="185" r="18" fill="#F59E0B"/>
            <rect x="90" y="208" width="60" height="50" rx="30" fill="#FBBF24"/>
            <circle cx="250" cy="210" r="36" fill="#6366F1"/>
            <circle cx="250" cy="195" r="18" fill="#4F46E5"/>
            <rect x="220" y="218" width="60" height="50" rx="30" fill="#6366F1"/>
            <circle cx="380" cy="200" r="36" fill="#34D399"/>
            <circle cx="380" cy="185" r="18" fill="#10B981"/>
            <rect x="350" y="208" width="60" height="50" rx="30" fill="#34D399"/>
            <rect x="60" y="100" width="120" height="50" rx="16" fill="#6366F1"/>
            <polygon points="90,150 80,168 110,150" fill="#6366F1"/>
            <rect x="75" y="116" width="50" height="8" rx="4" fill="white" opacity="0.8"/>
            <rect x="75" y="130" width="70" height="8" rx="4" fill="white" opacity="0.5"/>
            <rect x="290" y="80" width="140" height="55" rx="16" fill="#FBBF24"/>
            <polygon points="380,135 400,155 370,135" fill="#FBBF24"/>
            <rect x="305" y="96" width="60" height="8" rx="4" fill="white" opacity="0.8"/>
            <rect x="305" y="110" width="90" height="8" rx="4" fill="white" opacity="0.5"/>
            <rect x="180" y="290" width="130" height="50" rx="16" fill="#34D399"/>
            <polygon points="210,290 195,272 230,290" fill="#34D399"/>
            <rect x="195" y="306" width="55" height="8" rx="4" fill="white" opacity="0.8"/>
            <rect x="195" y="320" width="80" height="8" rx="4" fill="white" opacity="0.5"/>
            <circle cx="200" cy="190" r="5" fill="#6366F1" opacity="0.4"/>
            <circle cx="215" cy="183" r="4" fill="#FBBF24" opacity="0.4"/>
            <circle cx="310" cy="210" r="5" fill="#34D399" opacity="0.4"/>
          </svg>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-24 relative bg-[#F3F6FA]">
        <div className="w-full max-w-[420px] bg-white rounded-[24px] p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          
          <div className="mb-10 text-center">
            <h1 className="text-[28px] font-bold text-[#111827] tracking-tight mb-2">Create an Account</h1>
            <p className="text-gray-500 text-[15px]">Sign up to get started</p>
          </div>
          
          {error && <div className="p-3 mb-6 text-sm text-red-600 bg-red-50 rounded-lg text-center border border-red-100">{error}</div>}
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-[14px] font-semibold text-[#374151] mb-2 ml-1">Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[12px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all" 
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#374151] mb-2 ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[12px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all" 
              />
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-[#374151] mb-2 ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a Password"
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-[12px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-all" 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 mt-6 text-white bg-[#2563EB] rounded-[12px] hover:bg-[#1D4ED8] active:bg-[#1E3A8A] transition-all font-semibold text-[15px] shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
