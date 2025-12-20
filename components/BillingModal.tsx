
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
  const { user, upgradeToPro } = useAuth();
  const isPro = user?.plan === 'pro';

  // Derived current date for consistent UI
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-fade-in-up">
        
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-xl">💳</span>
             <h2 className="text-xl font-bold text-white font-display">Billing & Subscription</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex flex-col md:flex-row h-[500px]">
            <div className="w-full md:w-1/3 bg-zinc-950/50 border-r border-zinc-800 p-6 flex flex-col">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Current Status</h3>
                
                <div className={`rounded-2xl p-6 border-2 mb-4 relative overflow-hidden transition-all ${isPro ? 'bg-orange-500/10 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'bg-zinc-800 border-zinc-700'}`}>
                    {isPro && <div className="absolute -right-5 top-5 bg-orange-500 text-white text-[9px] font-black px-8 py-0.5 rotate-45 shadow-lg">PRO</div>}
                    <div className="text-2xl font-black text-white mb-1 font-display tracking-tight">{isPro ? 'Pro Active' : 'Free Plan'}</div>
                    <div className="text-sm text-zinc-400 mb-6">{isPro ? '$9.99 / month' : 'No Active Billing'}</div>
                    <ul className="space-y-3 text-[11px] text-zinc-300">
                        <li className="flex items-center gap-2">
                            <span className={isPro ? "text-orange-500" : "text-zinc-500"}>✓</span> Unlimited Scans
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={isPro ? "text-orange-500" : "text-zinc-500"}>✓</span> AI Generator access
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={isPro ? "text-emerald-500" : "text-zinc-500"}>🛡️</span> Local Privacy
                        </li>
                    </ul>
                </div>

                {!isPro ? (
                    <button 
                        onClick={() => upgradeToPro()}
                        className="mt-auto w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-orange-500/20 active:scale-95"
                    >
                        Upgrade to Pro
                    </button>
                ) : (
                    <div className="mt-auto p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Renews on</p>
                        <p className="text-sm text-white font-mono">Next Month</p>
                    </div>
                )}
            </div>

            <div className="w-full md:w-2/3 p-6 bg-zinc-900 overflow-y-auto">
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Account Information</h3>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg">🔑</div>
                             <div>
                                 <div className="text-sm font-bold text-zinc-200">Active Subscription</div>
                                 <div className="text-[10px] text-zinc-500 uppercase">Registered via Beta Access</div>
                             </div>
                         </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Invoices</h3>
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950">
                        <table className="w-full text-left text-[11px]">
                            <thead className="bg-zinc-900 text-zinc-500 border-b border-zinc-800">
                                <tr>
                                    <th className="px-5 py-4 font-bold uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-4 font-bold uppercase tracking-wider">Description</th>
                                    <th className="px-5 py-4 font-bold uppercase tracking-wider text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {isPro ? (
                                    <tr className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-5 py-4 text-zinc-300 font-mono">{today}</td>
                                        <td className="px-5 py-4 text-zinc-300 font-bold">Pro Plan Activation</td>
                                        <td className="px-5 py-4 text-emerald-400 text-right font-black">$0.00 (Beta)</td>
                                    </tr>
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-12 text-center text-zinc-600 font-medium italic">
                                            No billing history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
