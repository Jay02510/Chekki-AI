
import React, { useState } from 'react';
import { CommunityPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Keep mock posts as examples of what parents could share
const MOCK_POSTSList = (ko: boolean): CommunityPost[] => [
    {
        id: '1', author: ko ? '지우네 가족' : 'Ji-woo Family', avatar: '👩🏻', timeAgo: ko ? '예시' : 'Example',
        content: ko ? '이번 주 오답노트 결과에요! 파닉스 헷갈려했는데 채키 AI로 발음 교정받고 많이 좋아졌어요. 🤗 #채키AI #영어홈스쿨링' : 'Check out this week\'s review note! My child struggled with phonics but improved so much with Chekki.',
        likes: 24, comments: 5, tag: ko ? '리뷰' : 'Review'
    },
    {
        id: '2', author: ko ? '민준이네' : 'Min-jun Family', avatar: '👨🏻', timeAgo: ko ? '예시' : 'Example',
        content: ko ? '드디어 10일 연속 출석 달성! 🏆 "Growing!" 바가 채워지는 걸 보면서 아이가 더 신나서 숙제해요.' : 'Finally hit a 10-day study streak! 🏆 My child is so motivated to see the "Growing!" bar fill up.',
        likes: 156, comments: 12, tag: ko ? '성취' : 'Achievement'
    },
    {
        id: '3', author: ko ? '사라 맘' : 'Sarah K.', avatar: '👩🏼', timeAgo: ko ? '예시' : 'Example',
        content: ko ? '혹시 "Magic E" 관련해서 좋은 워크시트 자료 공유해주실 분 계신가요? ㅠㅠ' : 'Does anyone have good worksheets for "Magic E"? Please share!',
        likes: 8, comments: 20, tag: ko ? '질문' : 'Question'
    }
];

interface Props {
    onClose: () => void;
}

export const CommunityModal: React.FC<Props> = ({ onClose }) => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const [postContent, setPostContent] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const [reportedPosts, setReportedPosts] = useState<string[]>([]);

    const generateTemplate = (platform: 'cafe' | 'insta') => {
        const base = postContent || (language === 'ko' ? "오늘도 채키랑 영어 숙제 끝냈어요! 🚀" : "Today we practiced English homework with Chekki! 🚀");

        if (platform === 'cafe') {
            return `[영유 숙제 기록] 채키 AI로 오늘도 열공 완료! ✨\n\n아이랑 영유 숙제하다 보면 저도 가끔 헷갈릴 때가 있는데,\n채키(Chekki) 덕분에 발음도 확인하고 설명도 다정하게 해줄 수 있어서 너무 좋네요.\n\n특히 어려워했던 문제는 오답노트로 따로 모아볼 수 있어서 주말 복습도 든든합니다.\n공유해주신 학습 팁들 항상 잘 보고 있어요! 다들 화이팅입니다. ❤️\n\n💬 기록 한마디: ${base}\n\n#채키AI #영유맘 #숙제도우미 #부모표영어 #7세영어 #자기주도학습`;
        } else {
            return `${base}\n\n오늘도 우리 아이 성장을 위해 찰칵! 📸\n영어 숙제 시간이 이제 스트레스가 아니라\n도란도란 이야기 나누는 즐거운 시간이 되었어요.\n\n채키(@Chekki_AI)가 알려주는 부모표 티칭 가이드 최고! 👍\n\n#공부기록 #홈스쿨링 #영유맘소통 #육아소통 #부모표영어 #ChekkiAI #ChekkiMoment #StudyGram`;
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

            <div className="relative bg-zinc-900 rounded-3xl w-full max-w-lg md:max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-zinc-700 animate-fade-in-up">

                {/* Header */}
                <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">☕</span>
                        <h2 className="text-lg font-bold text-white font-display">Parent&apos;s Lounge</h2>
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
                                <p className="text-zinc-400 text-xs">Share your child&apos;s progress easily!</p>
                            </div>
                        </div>

                        <textarea
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                            placeholder={language === 'ko' ? "오늘 숙제는 어땠나요? (예: 민준이가 파닉스 퀴즈를 다 맞았어요!)" : "How did the homework go today?"}
                            className="w-full bg-black/20 border border-zinc-700 rounded-xl p-3 text-zinc-200 placeholder-zinc-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none resize-none h-24 mb-4 transition-all font-korean"
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
                                        <span>📋 Copy for Cafe</span>
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
                                        <span>📸 Copy for Insta</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 text-center mt-3 font-korean opacity-70">
                            * 팁: 문구를 복사한 뒤 사진과 함께 업로드해 보세요!
                        </p>
                    </div>

                    {/* --- RECENT SHARES (Mock) --- */}
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1">
                            {language === 'ko' ? '이런 포스트를 올려보세요 (예시)' : 'Examples of what to post'}
                        </h4>
                        <div className="space-y-3">
                            {MOCK_POSTSList(language === 'ko').filter(p => !reportedPosts.includes(p.id)).map(post => (
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
