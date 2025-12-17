
import React, { useState } from 'react';
import { CommunityPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Keep mock posts for social proof/atmosphere
const MOCK_POSTS: CommunityPost[] = [
    {
        id: '1', author: 'Ji-woo Mom', avatar: '👩🏻', timeAgo: '5m',
        content: 'Check out this week\'s O-dap note! My son struggled with phonics but improved so much with Chekki.',
        likes: 24, comments: 5, tag: 'Review'
    },
    {
        id: '2', author: 'Min-jun Daddy', avatar: '👨🏻', timeAgo: '2h',
        content: 'Finally hit a 10-day study streak! 🏆 My son is so motivated to see the "Growing!" bar fill up.',
        likes: 156, comments: 12, tag: 'Achievement'
    },
    {
        id: '3', author: 'Sarah K.', avatar: '👩🏼', timeAgo: '4h',
        content: 'Does anyone have good worksheets for "Magic E"? Please share!',
        likes: 8, comments: 20, tag: 'Question'
    }
];

interface Props {
    onClose: () => void;
}

export const CommunityModal: React.FC<Props> = ({ onClose }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [postContent, setPostContent] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [reportedPosts, setReportedPosts] = useState<string[]>([]);

    const generateTemplate = (platform: 'cafe' | 'insta') => {
        const base = postContent || "Today we practiced English homework with Chekki! 🚀";
        
        if (platform === 'cafe') {
            return `[Chekki Study Record]\n\n📝 Title: Today's Homework\n✨ Mood: Proud!\n\n${base}\n\nThe AI pronunciation check was really helpful today. It's amazing to see the progress day by day!\n\n#ChekkiAI #MomsEnglish #HomeworkHelper #EnglishKindergarten`;
        } else {
            return `${base}\n\nStudy streak: Day 3 🔥\n.\n.\n#Chekki #KidsEnglish #StudyGram #MomLife`;
        }
    };

    const handleCopy = (platform: 'cafe' | 'insta') => {
        const text = generateTemplate(platform);
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(platform);
            setTimeout(() => setCopySuccess(null), 2000);
        });
    };

    const handleReport = (postId: string) => {
        if (confirm("Report this post for objectionable content?")) {
            setReportedPosts(prev => [...prev, postId]);
            alert("Thank you. We have received your report and will review the content within 24 hours.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-zinc-900 rounded-3xl w-full max-w-lg h-[80vh] flex flex-col shadow-2xl border border-zinc-700 animate-fade-in-up">
                
                {/* Header */}
                <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-2">
                       <span className="text-xl">☕</span>
                       <h2 className="text-lg font-bold text-white font-display">Mom's Lounge</h2>
                   </div>
                   <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    
                    {/* --- POST GENERATOR SECTION --- */}
                    <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-5 border border-zinc-700 shadow-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                                {user?.name.charAt(0) || 'Me'}
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Create Study Log</h3>
                                <p className="text-zinc-400 text-xs">Share your child's progress easily!</p>
                            </div>
                        </div>

                        <textarea 
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder="How did the homework go today? (e.g., Min-jun got 100% on the phonics quiz!)" 
                            className="w-full bg-black/20 border border-zinc-700 rounded-xl p-3 text-zinc-200 placeholder-zinc-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none resize-none h-24 mb-4 transition-all" 
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleCopy('cafe')}
                                className="relative flex items-center justify-center gap-2 bg-[#2DB400]/10 hover:bg-[#2DB400]/20 border border-[#2DB400]/30 text-[#2DB400] py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                            >
                                {copySuccess === 'cafe' ? (
                                    <span className="animate-fade-in">Copied! ✓</span>
                                ) : (
                                    <>
                                        <span>📋 Copy for Naver Cafe</span>
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => handleCopy('insta')}
                                className="relative flex items-center justify-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                            >
                                {copySuccess === 'insta' ? (
                                    <span className="animate-fade-in">Copied! ✓</span>
                                ) : (
                                    <>
                                        <span>📸 Copy for Instagram</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 text-center mt-3">
                            * Tip: Copy this text and paste it into your favorite app with a photo!
                        </p>
                    </div>

                    {/* --- RECENT SHARES (Mock) --- */}
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">Community Highlights</h4>
                        <div className="space-y-3">
                            {MOCK_POSTS.filter(p => !reportedPosts.includes(p.id)).map(post => (
                                <div key={post.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-lg">{post.avatar}</div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-200">{post.author}</div>
                                                <div className="text-[10px] text-zinc-500">{post.timeAgo}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">{post.tag}</span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-sm mb-3 font-korean leading-relaxed">
                                        {post.content}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 text-xs text-zinc-500 font-bold">
                                            <span className="hover:text-pink-500 cursor-pointer transition-colors">♥ {post.likes}</span>
                                            <span className="hover:text-blue-500 cursor-pointer transition-colors">💬 {post.comments}</span>
                                        </div>
                                        {/* Reporting Feature (Required for App Store UGC) */}
                                        <button 
                                            onClick={() => handleReport(post.id)}
                                            className="text-[10px] text-zinc-600 hover:text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ⚠️ Report
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
