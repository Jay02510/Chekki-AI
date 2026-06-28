import React, { useState } from 'react';
import { ChekkiMascot } from '../../components/Icons';
import { auth, dbInstance } from '../../services/database';
import { createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, signInWithCustomToken } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

const ADMIN_PASSCODE = 'ChecciAdmin2026!';

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // User Creation State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('1_month');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'upgrade' | 'delete' | 'view_members'>('create');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFetchUsers = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'list' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      setUsers(data.users || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error fetching users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === ADMIN_PASSCODE) {
      setIsAuthorized(true);
      setMessage({ text: '', type: '' });
    } else {
      setMessage({ text: 'Incorrect Passcode', type: 'error' });
    }
  };

  const handleCreateProUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // 0. Sanitize inputs
      const cleanEmail = email.toLowerCase().trim();
      const cleanPassword = password.trim();

      // 1. Create purely via Auth
      let uid = '';
      try {
        const res = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        uid = res.user.uid;
      } catch (authErr: any) {
        // If user already exists, we might want to just upgrade them if we could get UID
        // But for security/simplicity, we'll just report the error.
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error(
            'This email is already registered. Please use the "Upgrade" feature (coming soon) or contact support.'
          );
        }
        throw authErr;
      }

      // 2. Provision Free Profile first to satisfy Firestore rules
      const profile: any = {
        name,
        email: cleanEmail,
        plan: 'free',
        scansUsedToday: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        maxScansPerDay: 2,
        maxQuestionsPerDay: 5,
        uid,
      };

      await setDoc(doc(dbInstance, 'users', uid), profile);

      // 3. Immediately call the serverless admin-upgrade endpoint to elevate to Pro
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passcode,
          action: 'upgrade',
          email: cleanEmail,
          duration,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ||
            'User created as FREE, but failed to elevate to PRO. Please use the Upgrade tab.'
        );
      }

      // 4. Immediately log out so admin session isn't replaced by the new user
      await signOut(auth);

      setMessage({ text: '✅ Pro User Created Successfully!', type: 'success' });
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error creating user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const cleanEmail = email.toLowerCase().trim();

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passcode,
          action: 'upgrade',
          email: cleanEmail,
          duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade user');
      }

      setMessage({ text: '✅ User Upgraded Successfully!', type: 'success' });
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error upgrading user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUserByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const cleanEmail = email.toLowerCase().trim();
      
      if (!window.confirm(`Are you sure you want to permanently delete user ${cleanEmail}?`)) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passcode,
          action: 'delete',
          email: cleanEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setMessage({ text: '✅ User Deleted Successfully!', type: 'success' });
      setEmail('');
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error deleting user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user ${email}?`)) {
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'delete', uid }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }
      
      setMessage({ text: `✅ User ${email} deleted successfully!`, type: 'success' });
      // Remove from local state immediately to avoid another fetch, or re-fetch
      setUsers(users.filter(u => u.uid !== uid));
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error deleting user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ text: `✅ Password reset email sent to ${email}`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error sending password reset', type: 'error' });
    }
  };

  const handleDowngradeUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to downgrade user ${email} to FREE?`)) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'downgrade', uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to downgrade user');
      setMessage({ text: `✅ User ${email} downgraded successfully!`, type: 'success' });
      handleFetchUsers();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error downgrading user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonateUser = async (uid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to log in as ${email}? This will end your current admin session.`)) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'impersonate', uid }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get custom token');
      
      await signInWithCustomToken(auth, data.customToken);
      window.location.href = '/app.html';
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error impersonating user', type: 'error' });
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div
        className={`w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-200 ${mode === 'view_members' && isAuthorized ? 'max-w-4xl' : 'max-w-md'}`}
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <ChekkiMascot className="w-10 h-10 text-white" mood="happy" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-center">
            Admin Portal
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Provision Pro Accounts</p>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
          >
            {message.text}
          </div>
        )}

        {!isAuthorized ? (
          <form onSubmit={handleAuthorize} className="space-y-4 relative z-10">
            <div className="relative">
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider text-center">
                Enter Master Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700 font-medium text-center pr-12"
                  placeholder="••••••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPasscode ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-orange-600 hover:to-pink-600 text-white font-black py-4 rounded-xl mt-4 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Verify
            </button>
          </form>
        ) : (
          <div className="w-full relative z-10 animate-fade-in">
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('create');
                  setMessage({ text: '', type: '' });
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'create' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white/80'}`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('upgrade');
                  setMessage({ text: '', type: '' });
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'upgrade' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white/80'}`}
              >
                Upgrade Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('delete');
                  setMessage({ text: '', type: '' });
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'delete' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white/80'}`}
              >
                Delete Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('view_members');
                  setMessage({ text: '', type: '' });
                  handleFetchUsers();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'view_members' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white/80'}`}
              >
                View Members
              </button>
            </div>

            {mode === 'view_members' ? (
              <div className="w-full flex flex-col gap-4 mt-4">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700 font-medium"
                />
              <div className="w-full overflow-x-auto">
                {loading ? (
                  <div className="flex justify-center p-8 text-zinc-500 font-bold tracking-widest animate-pulse">
                    LOADING MEMBERS...
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400">
                        <th className="py-3 px-4 font-bold">Name</th>
                        <th className="py-3 px-4 font-bold">Email</th>
                        <th className="py-3 px-4 font-bold">Plan</th>
                        <th className="py-3 px-4 font-bold">Insights</th>
                        <th className="py-3 px-4 font-bold">Billing Date</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500">
                            No members found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.uid} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                            <td className="py-3 px-4 text-zinc-400">{user.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${user.plan === 'pro' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-300'}`}
                              >
                                {user.plan || 'FREE'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-500">
                              <div className="flex flex-col">
                                <span className="text-xs">Scans: {user.scansUsedToday} / {user.maxScansPerDay}</span>
                                <span className="text-[10px] text-zinc-600">Last: {user.lastScanDate || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-zinc-500">
                              {user.nextBillingDate
                                ? new Date(user.nextBillingDate).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleResetPassword(user.email)}
                                  className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                  title="Send Password Reset Email"
                                >
                                  Reset PW
                                </button>
                                <button
                                  onClick={() => handleImpersonateUser(user.uid, user.email)}
                                  className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                  title="Log in as user"
                                >
                                  Sign In
                                </button>
                                {user.plan === 'pro' && (
                                  <button
                                    onClick={() => handleDowngradeUser(user.uid, user.email)}
                                    className="px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                    title="Downgrade to Free"
                                  >
                                    Downgrade
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(user.uid, user.email)}
                                  className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                >
                                  Del
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              </div>
            ) : (
              <form
                onSubmit={mode === 'create' ? handleCreateProUser : mode === 'delete' ? handleDeleteUserByEmail : handleUpgradeUser}
                className="space-y-4"
              >
                {mode === 'create' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      User&apos;s Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700 font-medium"
                      placeholder="e.g. Test Teacher"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700 font-medium"
                    placeholder="name@school.com"
                  />
                </div>

                {mode === 'create' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700 font-medium pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {mode !== 'delete' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                      Pro Duration
                    </label>
                    <div className="relative">
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium appearance-none"
                      >
                        <option value="1_month">1 Month</option>
                        <option value="1_year">1 Year</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                    loading ? 'bg-zinc-800 cursor-not-allowed' : 
                    mode === 'delete' ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400' : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : mode === 'create' ? (
                    'Create Pro User'
                  ) : mode === 'delete' ? (
                    'Delete User'
                  ) : (
                    'Upgrade User'
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <a
        href="/app.html"
        className="mt-8 text-zinc-500 text-sm font-bold hover:text-white transition-colors"
      >
        ← Back to App
      </a>
    </div>
  );
}
