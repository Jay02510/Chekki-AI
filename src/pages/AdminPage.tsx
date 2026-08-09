import React, { useState } from 'react';
import { ChekkiMascot } from '../../components/Icons';
import { auth, dbInstance } from '../../services/database';
import {
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithCustomToken,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useDialogA11y } from '../../hooks/useDialogA11y';

// Skeleton rows for these admin tables, matching the real column count, so
// the header/search bar stay in place while data loads instead of the whole
// table being replaced by a "LOADING..." string (Audit: spinner-text loading
// instead of skeletons).
function SkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-zinc-800/50">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="py-3.5 px-4">
              <div className="h-3.5 rounded bg-zinc-800 animate-pulse" style={{ width: `${55 + ((r + c) % 4) * 10}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  // User Creation State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('1_month');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'upgrade' | 'delete' | 'view_members' | 'schools' | 'invoices'>(
    'create'
  );
  const [message, setMessage] = useState({ text: '', type: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Invoices State
  const [invoices, setInvoices] = useState<any[]>([]);

  // Schools State
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolIdInput, setSchoolIdInput] = useState('');
  const [schoolNameInput, setSchoolNameInput] = useState('');
  const [schoolTeacherCodeInput, setSchoolTeacherCodeInput] = useState('');
  const [schoolMaxUsesInput, setSchoolMaxUsesInput] = useState(5);
  const [assignEmailInput, setAssignEmailInput] = useState('');
  const [assignSchoolIdInput, setAssignSchoolIdInput] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateSchoolModal, setShowCreateSchoolModal] = useState(false);
  const createSchoolDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showCreateSchoolModal,
    onClose: () => setShowCreateSchoolModal(false),
  });
  const assignTeacherDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showAssignModal,
    onClose: () => setShowAssignModal(false),
  });

  const handleFetchInvoices = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'list_invoices' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invoices');
      }
      setInvoices(data.invoices || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error fetching invoices', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId: string) => {
    if (!window.confirm('Confirm corporate bank payment received & activate teacher codes?')) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'confirm_invoice', invoiceId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm invoice');
      }
      setMessage({ text: `✅ ${data.message} Teacher Code: ${data.teacherCode}`, type: 'success' });
      handleFetchInvoices();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error confirming invoice', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleFetchSchools = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'list_schools' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch schools');
      }
      setSchools(data.schools || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error fetching schools', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode,
          action: 'create_school',
          schoolId: schoolIdInput,
          schoolName: schoolNameInput,
          teacherCode: schoolTeacherCodeInput,
          maxUses: schoolMaxUsesInput,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create school');
      }
      setMessage({ text: '✅ School created successfully!', type: 'success' });
      setSchoolIdInput('');
      setSchoolNameInput('');
      setSchoolTeacherCodeInput('');
      setSchoolMaxUsesInput(5);
      setShowCreateSchoolModal(false);
      handleFetchSchools();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error creating school', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode,
          action: 'assign_teacher',
          email: assignEmailInput,
          schoolId: assignSchoolIdInput,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign teacher');
      }
      setMessage({ text: '✅ Teacher assigned successfully!', type: 'success' });
      setAssignEmailInput('');
      setAssignSchoolIdInput('');
      setShowAssignModal(false);
      handleFetchSchools();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error assigning teacher', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete school "${schoolName}" (${schoolId})?\nAll associated teachers will be unassigned and downgraded to FREE.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'delete_school', schoolId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete school');
      }

      setMessage({ text: `✅ School ${schoolName} deleted successfully!`, type: 'success' });
      handleFetchSchools();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error deleting school', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      s.schoolId.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      s.teacherCode.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorizing(true);
    setMessage({ text: '', type: '' });
    try {
      // The passcode is never checked client-side — it's only ever validated
      // server-side in api/admin.ts. Verify it here with a cheap real action
      // so no admin secret ever ships in the client bundle.
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim(), action: 'list' }),
      });
      if (response.ok) {
        setIsAuthorized(true);
      } else {
        setMessage({ text: 'Incorrect Passcode', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Failed to verify passcode. Check your connection.', type: 'error' });
    } finally {
      setAuthorizing(false);
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
      setUsers(users.filter((u) => u.uid !== uid));
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
    if (
      !window.confirm(
        `Are you sure you want to log in as ${email}? This will end your current admin session.`
      )
    )
      return;
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

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div
        className={`w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-200 ${(mode === 'view_members' || mode === 'schools') && isAuthorized ? 'max-w-4xl' : 'max-w-md'}`}
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
              disabled={authorizing}
              className="w-full bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-orange-600 hover:to-pink-600 text-white font-black py-4 rounded-xl mt-4 shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authorizing ? 'Verifying...' : 'Verify'}
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
              <button
                type="button"
                onClick={() => {
                  setMode('schools');
                  setMessage({ text: '', type: '' });
                  handleFetchSchools();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'schools' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white/80'}`}
              >
                Schools
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('invoices');
                  setMessage({ text: '', type: '' });
                  handleFetchInvoices();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'invoices' ? 'bg-orange-500 text-white shadow font-black' : 'text-zinc-500 hover:text-white/80'}`}
              >
                Bank Invoices 🧾
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
                  {(
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="py-3 px-4 font-bold">Name</th>
                          <th className="py-3 px-4 font-bold">Email</th>
                          <th className="py-3 px-4 font-bold">Role / School</th>
                          <th className="py-3 px-4 font-bold">Plan</th>
                          <th className="py-3 px-4 font-bold">Insights</th>
                          <th className="py-3 px-4 font-bold">Billing Date</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                          <SkeletonRows columns={7} />
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-zinc-500">
                              No members found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.uid} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                              <td className="py-3 px-4 text-zinc-400">{user.email}</td>
                              <td className="py-3 px-4 text-zinc-400">
                                <div className="flex flex-col">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider w-fit ${user.role === 'teacher' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-400'}`}
                                  >
                                    {user.role || 'parent'}
                                  </span>
                                  {user.schoolName && (
                                    <span className="text-[10px] text-zinc-500 mt-1 font-bold">
                                      {user.schoolName}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${user.plan === 'pro' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-300'}`}
                                >
                                  {user.plan || 'FREE'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-500">
                                <div className="flex flex-col">
                                  <span className="text-xs">
                                    Scans: {user.scansUsedToday} / {user.maxScansPerDay}
                                  </span>
                                  <span className="text-[10px] text-zinc-600">
                                    Last: {user.lastScanDate || 'N/A'}
                                  </span>
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
            ) : mode === 'schools' ? (
              <div className="w-full flex flex-col gap-4 mt-4 animate-fade-in">
                {/* School List Header & Control Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search by school name or code..."
                    value={schoolSearchQuery}
                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                    className="w-full sm:w-72 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-zinc-700 text-sm font-medium"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setMessage({ text: '', type: '' });
                        setShowCreateSchoolModal(true);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <span>+ Create School</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMessage({ text: '', type: '' });
                        setAssignSchoolIdInput('');
                        setAssignEmailInput('');
                        setShowAssignModal(true);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-1.5"
                    >
                      <span>Assign Teacher</span>
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="w-full overflow-x-auto">
                  {(
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="py-3 px-4 font-bold">School Code (ID)</th>
                          <th className="py-3 px-4 font-bold">School Name</th>
                          <th className="py-3 px-4 font-bold">Teacher Auth Code</th>
                          <th className="py-3 px-4 font-bold">Teacher Quota</th>
                          <th className="py-3 px-4 font-bold">Created At</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                          <SkeletonRows columns={6} />
                        ) : filteredSchools.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-zinc-500">
                              No schools found.
                            </td>
                          </tr>
                        ) : (
                          filteredSchools.map((school) => (
                            <tr
                              key={school.schoolId}
                              className="hover:bg-zinc-800/30 transition-colors"
                            >
                              <td className="py-3 px-4 text-white font-bold tracking-wide">
                                {school.schoolId}
                              </td>
                              <td className="py-3 px-4 text-zinc-300 font-medium">{school.name}</td>
                              <td className="py-3 px-4 text-orange-400 font-mono font-bold">
                                {school.teacherCode}
                              </td>
                              <td className="py-3 px-4 text-zinc-400">
                                <div className="flex flex-col">
                                  <span>
                                    {school.usedByUids?.length || 0} / {school.maxUses} used
                                  </span>
                                  <span
                                    className="text-[10px] text-zinc-600 truncate max-w-[150px]"
                                    title={school.usedByUids?.join(', ') || ''}
                                  >
                                    {school.usedByUids?.length > 0
                                      ? school.usedByUids.join(', ')
                                      : 'None'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-zinc-500">
                                {school.createdAt
                                  ? new Date(school.createdAt).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setAssignSchoolIdInput(school.schoolId);
                                      setAssignEmailInput('');
                                      setShowAssignModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    + Assign Teacher
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchool(school.schoolId, school.name)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-[10px] font-bold uppercase tracking-wider"
                                  >
                                    Delete
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

                {/* MODALS */}
                {showCreateSchoolModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div
                      ref={createSchoolDialogRef}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="create-school-title"
                      tabIndex={-1}
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                    >
                      <h3 id="create-school-title" className="text-lg font-black uppercase tracking-wider mb-4">
                        Create New School Code
                      </h3>
                      <form onSubmit={handleCreateSchool} className="space-y-4">
                        <div>
                          <label htmlFor="create-school-id" className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            School Code (ID / Student Redemption)
                          </label>
                          <input
                            id="create-school-id"
                            type="text"
                            required
                            placeholder="e.g. APEX10"
                            value={schoolIdInput}
                            onChange={(e) => setSchoolIdInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold uppercase tracking-wider"
                          />
                        </div>
                        <div>
                          <label htmlFor="create-school-name" className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            School Name
                          </label>
                          <input
                            id="create-school-name"
                            type="text"
                            required
                            placeholder="e.g. Apex Seocho"
                            value={schoolNameInput}
                            onChange={(e) => setSchoolNameInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label htmlFor="create-school-teacher-code" className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Teacher Authorization Code
                          </label>
                          <input
                            id="create-school-teacher-code"
                            type="text"
                            required
                            placeholder="e.g. APEX10-TEACHER"
                            value={schoolTeacherCodeInput}
                            onChange={(e) => setSchoolTeacherCodeInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold uppercase tracking-wider"
                          />
                        </div>
                        <div>
                          <label htmlFor="create-school-max-uses" className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Max Teacher Redemptions
                          </label>
                          <input
                            id="create-school-max-uses"
                            type="number"
                            required
                            value={schoolMaxUsesInput}
                            onChange={(e) =>
                              setSchoolMaxUsesInput(parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateSchoolModal(false)}
                            className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider rounded-xl transition-all text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg text-xs"
                          >
                            Create School
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {showAssignModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div
                      ref={assignTeacherDialogRef}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="assign-teacher-title"
                      tabIndex={-1}
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                    >
                      <h3 id="assign-teacher-title" className="text-lg font-black uppercase tracking-wider mb-4">
                        Assign Teacher to School
                      </h3>
                      <form onSubmit={handleAssignTeacher} className="space-y-4">
                        <div>
                          <label htmlFor="assign-teacher-email" className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Teacher Email
                          </label>
                          <input
                            id="assign-teacher-email"
                            type="email"
                            required
                            placeholder="teacher@school.com"
                            value={assignEmailInput}
                            onChange={(e) => setAssignEmailInput(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label htmlFor="assign-teacher-school" className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Select School
                          </label>
                          <div className="relative">
                            <select
                              id="assign-teacher-school"
                              required
                              value={assignSchoolIdInput}
                              onChange={(e) => setAssignSchoolIdInput(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium appearance-none"
                            >
                              <option value="">-- Choose School --</option>
                              {schools.map((s) => (
                                <option key={s.schoolId} value={s.schoolId}>
                                  {s.name} ({s.schoolId})
                                </option>
                              ))}
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
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAssignModal(false)}
                            className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider rounded-xl transition-all text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-lg text-xs"
                          >
                            Assign Teacher
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : mode === 'invoices' ? (
              <div className="w-full flex flex-col gap-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                    School Bank Invoice Requests ({invoices.length})
                  </h3>
                  <button
                    onClick={handleFetchInvoices}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Refresh List
                  </button>
                </div>

                <div className="w-full overflow-x-auto">
                  {!loading && invoices.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-sm">
                      No corporate bank invoice requests found.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                          <th className="py-3 px-4 font-bold">Invoice ID</th>
                          <th className="py-3 px-4 font-bold">Academy & Contact</th>
                          <th className="py-3 px-4 font-bold">Plan & Seats</th>
                          <th className="py-3 px-4 font-bold">Amount</th>
                          <th className="py-3 px-4 font-bold">Biz Reg No.</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                          <SkeletonRows columns={7} />
                        ) : invoices.map((inv) => (
                          <tr key={inv.invoiceId} className="hover:bg-zinc-900/50 text-xs">
                            <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                              {inv.invoiceId}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white">{inv.academyName}</div>
                              <div className="text-zinc-500 text-[11px]">{inv.contactName} ({inv.email})</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-zinc-300 font-medium flex items-center gap-1.5">
                                <span>{inv.planName}</span>
                                {inv.planId === 'trial' ? (
                                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase rounded">TRIAL</span>
                                ) : (
                                  <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${
                                    inv.billingCycle === 'yearly' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                                  }`}>
                                    {inv.billingCycle === 'yearly' ? 'YEARLY (20% OFF)' : 'MONTHLY'}
                                  </span>
                                )}
                              </div>
                              <div className="text-zinc-500 text-[11px]">{inv.teacherCount} Teacher Seats</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                              ₩{(inv.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-zinc-400">
                              {inv.bizRegNumber || '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                inv.status === 'paid' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {inv.status === 'paid' ? 'PAID & ACTIVATED' : 'PENDING PAYMENT'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => handleConfirmInvoice(inv.invoiceId)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition-all active:scale-[0.95]"
                                >
                                  Confirm Bank Payment & Activate
                                </button>
                              )}
                              {inv.status === 'paid' && (
                                <span className="text-[11px] font-mono text-zinc-500">
                                  Code: {inv.generatedTeacherCode}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  mode === 'create'
                    ? handleCreateProUser
                    : mode === 'delete'
                      ? handleDeleteUserByEmail
                      : handleUpgradeUser
                }
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
                    loading
                      ? 'bg-zinc-800 cursor-not-allowed'
                      : mode === 'delete'
                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
                        : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400'
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
