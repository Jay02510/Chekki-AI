import React, { useState } from 'react';
import { ChekkiMascot } from '../../components/Icons';
import { auth, dbInstance } from '../../services/database';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('1_month');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleCreateProUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // 1. Create purely via Auth
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      // 2. Provision Pro Profile directly
      let nextBillingDateStr: string | null = null;
      if (duration === '1_month') {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        nextBillingDateStr = d.toISOString();
      } else if (duration === '1_year') {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        nextBillingDateStr = d.toISOString();
      }

      const profile = {
        name,
        email,
        plan: 'pro',
        scansUsedToday: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        maxScansPerDay: 9999,
        subscriptionStartedAt: new Date().toISOString(),
        nextBillingDate: nextBillingDateStr,
      };

      await setDoc(doc(dbInstance, "users", uid), { ...profile, uid });

      // 3. Immediately log out so admin can create another
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
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
             <ChekkiMascot className="w-10 h-10 text-white" mood="happy" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-center">Admin Portal</h1>
          <p className="text-zinc-500 text-sm mt-1">Provision Pro Accounts</p>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleCreateProUser} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">User's Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-medium"
              placeholder="e.g. Test Teacher"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-medium"
              placeholder="name@school.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-zinc-700 font-medium"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Pro Duration</label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium appearance-none"
              >
                <option value="1_month">1 Month</option>
                <option value="1_year">1 Year</option>
                <option value="lifetime">Lifetime</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black py-4 rounded-xl mt-4 shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : 'Create Pro Account'}
          </button>
        </form>
      </div>

      <a href="/app.html" className="mt-8 text-zinc-500 text-sm font-bold hover:text-white transition-colors">← Back to App</a>
    </div>
  )
}
