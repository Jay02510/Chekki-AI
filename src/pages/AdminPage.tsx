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
import { ConfirmDialog } from '../../components/ConfirmDialog';

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
  const [mode, setMode] = useState<'create' | 'upgrade' | 'delete' | 'view_members' | 'schools' | 'invoices' | 'invites'>(
    'create'
  );
  const [message, setMessage] = useState({ text: '', type: '' });
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    confirmText: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
  } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [isPurgingDemoData, setIsPurgingDemoData] = useState(false);

  // Invoices State
  const [invoices, setInvoices] = useState<any[]>([]);

  // Pending Teacher Invites State (ops visibility into unclaimed invite links)
  const [invites, setInvites] = useState<any[]>([]);

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
      // Pending-first so the actionable ones aren't buried under already-paid history.
      const sorted = [...(data.invoices || [])].sort((a: any, b: any) => {
        if (a.status === b.status) return 0;
        return a.status === 'paid' ? 1 : -1;
      });
      setInvoices(sorted);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error fetching invoices', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchInvites = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'list_invites' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invites');
      }
      setInvites(data.invites || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error fetching invites', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvite = (inviteId: string, email: string | null) => {
    setConfirmDialog({
      title: `Revoke the pending invite for ${email || 'this address'}? The seat it was holding becomes available again.`,
      confirmText: 'Revoke Invite',
      variant: 'destructive',
      onConfirm: () => {
        setConfirmDialog(null);
        void performRevokeInvite(inviteId);
      },
    });
  };

  const performRevokeInvite = async (inviteId: string) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'revoke_invite', inviteId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to revoke invite');
      setMessage({ text: '✅ Invite revoked.', type: 'success' });
      handleFetchInvites();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error revoking invite', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInvoice = async (invoiceId: string) => {
    setConfirmDialog({
      title: 'Confirm corporate bank payment received & activate teacher codes?',
      confirmText: 'Confirm Payment',
      variant: 'default',
      onConfirm: () => {
        setConfirmDialog(null);
        void performConfirmInvoice(invoiceId);
      },
    });
  };

  const performConfirmInvoice = async (invoiceId: string) => {
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

  const handleDeleteInvoice = (invoiceId: string, academyName: string) => {
    setConfirmDialog({
      title: `Dismiss the invoice request from "${academyName}"? This only removes the request record — if it was already confirmed, the school it created is untouched.`,
      confirmText: 'Delete Invoice',
      variant: 'destructive',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteInvoice(invoiceId);
      },
    });
  };

  const performDeleteInvoice = async (invoiceId: string) => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'delete_invoice', invoiceId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete invoice');
      setMessage({ text: '✅ Invoice deleted.', type: 'success' });
      handleFetchInvoices();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error deleting invoice', type: 'error' });
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
    setConfirmDialog({
      title: `Permanently delete school "${schoolName}" (${schoolId})? All associated teachers will be unassigned and downgraded to FREE.`,
      confirmText: 'Delete School',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteSchool(schoolId, schoolName);
      },
    });
  };

  const performDeleteSchool = async (schoolId: string, schoolName: string) => {
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
        if (authErr.code === 'auth/email-already-in-use') {
          // Auth account exists — route straight into the Upgrade tab (same
          // /api/admin action:'upgrade' flow as handleUpgradeUser) instead of
          // dead-ending. That endpoint looks the user up by email in
          // Firestore, so it can still 404 if the Auth account exists but
          // never got a Firestore users/ doc (a rarer data-integrity gap) —
          // handleUpgradeUser's own error path already surfaces that clearly.
          setEmail(cleanEmail);
          setMode('upgrade');
          setMessage({
            text: 'This email is already registered — switched you to the Upgrade tab. Just hit Upgrade to elevate it to Pro.',
            type: 'error',
          });
          setLoading(false);
          return;
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
        // This endpoint looks the user up by email in the users/ Firestore
        // collection only — it never checks Firebase Auth. A 404 here can
        // mean either "no account at all" or the rarer case of an Auth
        // account that exists but never got a Firestore profile doc (e.g. a
        // signup that was interrupted). That second case can't be fixed by
        // retrying Upgrade — the admin needs to Delete the orphaned Auth
        // account and have the user sign up again.
        if (response.status === 404) {
          throw new Error(
            `${data.error || 'User not found.'} If you're sure this email signed up before, it may be an orphaned Auth account with no profile — use Delete, then have them sign up again.`
          );
        }
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

  const handleDeleteUserByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.toLowerCase().trim();
    setConfirmDialog({
      title: `Are you sure you want to permanently delete user ${cleanEmail}?`,
      confirmText: 'Delete User',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteUserByEmail(cleanEmail);
      },
    });
  };

  const performDeleteUserByEmail = async (cleanEmail: string) => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
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
    setConfirmDialog({
      title: `Are you sure you want to permanently delete user ${email}?`,
      confirmText: 'Delete User',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteUser(uid, email);
      },
    });
  };

  const performDeleteUser = async (uid: string, email: string) => {
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
      // Re-fetch instead of local filter-by-uid: duplicate-email seed rows can
      // resolve to a different uid server-side than the row's displayed uid,
      // which left the row visibly stuck after a real successful delete.
      await handleFetchUsers();
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.message || 'Error deleting user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelected = (uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleSelectAllVisible = (visibleUids: string[]) => {
    setSelectedUids((prev) => {
      const allSelected = visibleUids.length > 0 && visibleUids.every((uid) => prev.has(uid));
      return allSelected ? new Set() : new Set(visibleUids);
    });
  };

  const handleBulkDeleteUsers = () => {
    const count = selectedUids.size;
    if (count === 0) return;
    setConfirmDialog({
      title: `Permanently delete ${count} selected user${count > 1 ? 's' : ''}? This cannot be undone.`,
      confirmText: `Delete ${count} User${count > 1 ? 's' : ''}`,
      variant: 'destructive',
      onConfirm: () => {
        setConfirmDialog(null);
        void performBulkDeleteUsers();
      },
    });
  };

  const performBulkDeleteUsers = async () => {
    const uids = Array.from(selectedUids);
    setLoading(true);
    setMessage({ text: '', type: '' });
    let succeeded = 0;
    const failed: string[] = [];

    for (const uid of uids) {
      try {
        const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode, action: 'delete', uid }),
        });
        if (!response.ok) throw new Error();
        succeeded++;
      } catch {
        failed.push(uid);
      }
    }

    setSelectedUids(new Set(failed));
    setMessage({
      text: failed.length === 0
        ? `✅ Deleted ${succeeded} user${succeeded !== 1 ? 's' : ''}.`
        : `Deleted ${succeeded}, failed on ${failed.length}. Failed ones stay selected — try again.`,
      type: failed.length === 0 ? 'success' : 'error',
    });
    // Re-fetch instead of local filter-by-uid — see performDeleteUser for why.
    await handleFetchUsers();
    setLoading(false);
  };

  const handlePurgeDemoData = async () => {
    setIsPurgingDemoData(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'purge_demo_data', dryRun: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to scan for demo data');

      const userCount = data.users?.length || 0;
      const curriculumCount = data.curriculumDocIds?.length || 0;
      if (userCount === 0 && curriculumCount === 0) {
        setMessage({ text: 'No demo/test users or leftover demo curriculum docs found.', type: 'success' });
        setIsPurgingDemoData(false);
        return;
      }

      const emailPreview = (data.users || []).slice(0, 8).map((u: any) => u.email).join(', ');
      const moreCount = userCount > 8 ? ` +${userCount - 8} more` : '';

      setConfirmDialog({
        title: `Permanently delete ${userCount} demo/test user${userCount !== 1 ? 's' : ''} (${emailPreview}${moreCount}) and ${curriculumCount} leftover curriculum doc${curriculumCount !== 1 ? 's' : ''}? This cannot be undone.`,
        confirmText: `Delete ${userCount + curriculumCount} Item${userCount + curriculumCount !== 1 ? 's' : ''}`,
        variant: 'destructive',
        onConfirm: () => {
          setConfirmDialog(null);
          void performPurgeDemoData();
        },
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error scanning for demo data', type: 'error' });
    } finally {
      setIsPurgingDemoData(false);
    }
  };

  const performPurgeDemoData = async () => {
    setIsPurgingDemoData(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'purge_demo_data', dryRun: false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to purge demo data');

      setMessage({
        text: `✅ Deleted ${data.deletedUsers} demo/test user${data.deletedUsers !== 1 ? 's' : ''} and ${data.deletedCurriculums} leftover curriculum doc${data.deletedCurriculums !== 1 ? 's' : ''}.`,
        type: 'success',
      });
      await handleFetchUsers();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error purging demo data', type: 'error' });
    } finally {
      setIsPurgingDemoData(false);
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
    setConfirmDialog({
      title: `Are you sure you want to downgrade user ${email} to FREE?`,
      confirmText: 'Downgrade User',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDowngradeUser(uid, email);
      },
    });
  };

  const performDowngradeUser = async (uid: string, email: string) => {
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

  const handleImpersonateUser = async (uid: string, email: string, role?: string) => {
    setConfirmDialog({
      title: `Are you sure you want to log in as ${email}? This will end your current admin session.`,
      confirmText: 'Log In As User',
      onConfirm: () => {
        setConfirmDialog(null);
        void performImpersonateUser(uid, email, role);
      },
    });
  };

  const performImpersonateUser = async (uid: string, email: string, role?: string) => {
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
      // /app.html mounts the same <App/> root, but its internal routing
      // decides teacher/director portal vs. the consumer scanning app purely
      // from window.location.pathname (checked once at mount) — landing on
      // the bare "/app.html" path matches none of its routes and fell
      // through to the consumer app, not the teacher/director dashboard
      // (Audit: "Login as user" via admin always opens the web app).
      window.location.href = role === 'teacher' || role === 'director' ? '/teacher' : '/app.html';
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
        className={`w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-200 ${isAuthorized ? 'max-w-4xl' : 'max-w-md'}`}
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
            <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
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
              <button
                type="button"
                onClick={() => {
                  setMode('invites');
                  setMessage({ text: '', type: '' });
                  handleFetchInvites();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${mode === 'invites' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white/80'}`}
              >
                Pending Invites
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
                <button
                  type="button"
                  onClick={handlePurgeDemoData}
                  disabled={isPurgingDemoData}
                  className="self-start px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30 disabled:opacity-40 transition-colors"
                  title="Find and delete every user whose email contains 'demo' or 'test', plus leftover demo curriculum docs"
                >
                  {isPurgingDemoData ? 'Scanning…' : '🧹 Purge Demo/Test Data'}
                </button>
                {selectedUids.size > 0 && (
                  <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span className="text-xs font-bold text-red-400">
                      {selectedUids.size} selected
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUids(new Set())}
                        className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkDeleteUsers}
                        className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                      >
                        Delete {selectedUids.size} Selected
                      </button>
                    </div>
                  </div>
                )}
                <div className="w-full overflow-x-auto">
                  {(
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400">
                          <th className="py-3 px-4 font-bold w-8">
                            <input
                              type="checkbox"
                              aria-label="Select all visible members"
                              checked={filteredUsers.length > 0 && filteredUsers.every((u: any) => selectedUids.has(u.uid))}
                              onChange={() => toggleSelectAllVisible(filteredUsers.map((u: any) => u.uid))}
                              className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-orange-500 cursor-pointer"
                            />
                          </th>
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
                          <SkeletonRows columns={8} />
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-zinc-500">
                              No members found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.uid} className={`transition-colors ${selectedUids.has(user.uid) ? 'bg-red-500/5' : 'hover:bg-zinc-800/30'}`}>
                              <td className="py-3 px-4">
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${user.name || user.email}`}
                                  checked={selectedUids.has(user.uid)}
                                  onChange={() => toggleUserSelected(user.uid)}
                                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-orange-500 cursor-pointer"
                                />
                              </td>
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
                                    onClick={() => handleImpersonateUser(user.uid, user.email, user.role)}
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
                          <th className="py-3 px-4 font-bold">FT / KT Seats</th>
                          <th className="py-3 px-4 font-bold">Plan / Trial</th>
                          <th className="py-3 px-4 font-bold">Created At</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                          <SkeletonRows columns={8} />
                        ) : filteredSchools.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-zinc-500">
                              No schools found.
                            </td>
                          </tr>
                        ) : (
                          filteredSchools.map((school) => {
                            const trialEndsAtMs = school.trialEndsAt ? new Date(school.trialEndsAt).getTime() : null;
                            const daysRemaining = trialEndsAtMs !== null ? Math.ceil((trialEndsAtMs - Date.now()) / (24 * 60 * 60 * 1000)) : null;
                            const isTrial = school.planId === 'trial';
                            const isExpired = isTrial && daysRemaining !== null && daysRemaining <= 0;
                            const isExpiringSoon = isTrial && !isExpired && daysRemaining !== null && daysRemaining <= 2;
                            return (
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
                              <td className="py-3 px-4 text-zinc-400 font-mono">
                                <span className="text-orange-400 font-bold">{school.seatsTotal?.ft ?? 0}</span> FT / <span className="text-blue-400 font-bold">{school.seatsTotal?.kt ?? 0}</span> KT
                              </td>
                              <td className="py-3 px-4">
                                {!school.planId ? (
                                  <span className="text-zinc-600">-</span>
                                ) : isExpired ? (
                                  <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                    Trial Expired
                                  </span>
                                ) : isExpiringSoon ? (
                                  <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                    Trial: {daysRemaining}d left
                                  </span>
                                ) : isTrial ? (
                                  <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                                    Trial: {daysRemaining}d left
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                    {school.planId}
                                  </span>
                                )}
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
                            );
                          })
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
                              <div className="flex items-center justify-end gap-2">
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
                                <button
                                  onClick={() => handleDeleteInvoice(inv.invoiceId, inv.academyName)}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-bold"
                                  title="Delete this invoice request"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : mode === 'invites' ? (
              <div className="w-full flex flex-col gap-4 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                    Pending Teacher Invites ({invites.length})
                  </h3>
                  <button
                    onClick={handleFetchInvites}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Refresh List
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 -mt-2">
                  Invite links a director sent that nobody has claimed yet, oldest first.
                </p>

                <div className="w-full overflow-x-auto">
                  {!loading && invites.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-sm">
                      No pending invites.
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase">
                          <th className="py-3 px-4 font-bold">Invite ID</th>
                          <th className="py-3 px-4 font-bold">School</th>
                          <th className="py-3 px-4 font-bold">Email</th>
                          <th className="py-3 px-4 font-bold">Role</th>
                          <th className="py-3 px-4 font-bold">Sent</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {loading ? (
                          <SkeletonRows columns={6} />
                        ) : (
                          invites.map((inv) => {
                            const daysOld = inv.createdAt
                              ? Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / (24 * 60 * 60 * 1000))
                              : null;
                            return (
                              <tr key={inv.inviteId} className="hover:bg-zinc-900/50 text-xs">
                                <td className="py-3.5 px-4 font-mono font-bold text-orange-400">{inv.inviteId}</td>
                                <td className="py-3.5 px-4 text-zinc-300">{inv.schoolId || '-'}</td>
                                <td className="py-3.5 px-4 text-zinc-300">{inv.email || '-'}</td>
                                <td className="py-3.5 px-4 text-zinc-400 uppercase">{inv.role || '-'}</td>
                                <td className="py-3.5 px-4">
                                  {daysOld !== null ? (
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                      daysOld >= 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {daysOld}d ago
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => handleRevokeInvite(inv.inviteId, inv.email)}
                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-bold"
                                  >
                                    Revoke
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
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

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          confirmText={confirmDialog.confirmText}
          isNight
          variant={confirmDialog.variant || 'destructive'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
