
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
  const { user, upgradeToPro } = useAuth();
  const isPro = user?.plan === 'pro';

  const mockHistory = [
    { date: '2023-10-01', desc: isPro ? 'Pro Plan - Monthly' : 'Free Trial', amount: isPro ? '$9.99' : '$0.00', status: 'Paid' },
    { date: '2023-09-01', desc: 'Free Trial', amount: '$0.00', status: 'Paid' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <span className="text-xl">💳</span>
             <h2 className="text-xl font-bold text-white font-display">Billing & Subscription</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex flex-col md:flex-row h-[500px]">
            {/* Sidebar / Current Plan */}
            <div className="w-full md:w-1/3 bg-zinc-950/50 border-r border-zinc-800 p-6 flex flex-col">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Current Plan</h3>
                
                <div className={`rounded-xl p-6 border-2 mb-4 relative overflow-hidden ${isPro ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-800 border-zinc-700'}`}>
                    {isPro && <div className="absolute -right-4 top-4 bg-orange-500 text-white text-[10px] font-bold px-6 py-0.5 rotate-45">ACTIVE</div>}
                    <div className="text-2xl font-bold text-white mb-1 font-display">{isPro ? 'Pro Plan' : 'Free Plan'}</div>
                    <div className="text-sm text-zinc-400 mb-4">{isPro ? '$9.99 / month' : '$0.00 / month'}</div>
                    <ul className="space-y-2 text-xs text-zinc-300">
                        <li className="flex items-center gap-2">
                            <span className={isPro ? "text-orange-500" : "text-zinc-500"}>✓</span> Unlimited Scans
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={isPro ? "text-orange-500" : "text-zinc-500"}>✓</span> 
                            <span>
                                Unlimited History<br/>
                                <span className="text-[10px] text-zinc-500">(Scores & Review Notes)</span>
                            </span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className={isPro ? "text-emerald-500" : "text-zinc-500"}>🛡️</span> 
                            <span>
                                Privacy Guarantee<br/>
                                <span className="text-[10px] text-zinc-500">No Image Storage</span>
                            </span>
                        </li>
                    </ul>
                </div>

                {!isPro ? (
                    <button 
                        onClick={() => upgradeToPro()}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    >
                        Upgrade to Pro
                    </button>
                ) : (
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all border border-zinc-700">
                        Manage Subscription
                    </button>
                )}
            </div>

            {/* Main Content / History */}
            <div className="w-full md:w-2/3 p-6 bg-zinc-900 overflow-y-auto">
                
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Payment Method</h3>
                    <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-6 bg-zinc-700 rounded flex items-center justify-center text-[10px] font-bold text-zinc-300">VISA</div>
                             <div className="text-sm text-zinc-300">•••• •••• •••• 4242</div>
                         </div>
                         <button className="text-xs font-bold text-orange-500 hover:text-orange-400">Edit</button>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Billing History</h3>
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                    <th className="px-4 py-3 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {mockHistory.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-3 text-zinc-300">{item.date}</td>
                                        <td className="px-4 py-3 text-zinc-300">{item.desc}</td>
                                        <td className="px-4 py-3 text-zinc-300 text-right">{item.amount}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
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
