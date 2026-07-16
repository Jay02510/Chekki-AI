import React, { useState } from 'react';
import { CommunityPost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// Keep mock posts as examples of what parents could share
const MOCK_POSTSList = (ko: boolean): CommunityPost[] => [
  {
    id: '1',
    author: ko ? '지우네 가족' : 'Ji-woo Family',
    avatar: '👩🏻',
    timeAgo: ko ? '예시' : 'Example',
    content: ko
      ? '채키AI 덕분에 20분 걸리던 숙제 채점이 단 1초만에 끝났어요! ⏱️📸 이제 여유롭게 커피 한 잔 합니다. #채키AI #영어홈스쿨링 #시간단축'
      : "Chekki's Instant Grader just turned 20 minutes of grading into 1 second! ⏱️📸 Finally having my coffee.",
    likes: 24,
    comments: 5,
    tag: ko ? '리뷰' : 'Review',
  },
  {
    id: '2',
    author: ko ? '민준이네' : 'Min-jun Family',
    avatar: '👨🏻',
    timeAgo: ko ? '예시' : 'Example',
    content: ko
      ? '매일 밤 숙제 때문에 싸우던 일상은 이제 안녕 👋 자동 오답 워크시트 덕분에 아이도 저도 스트레스 제로입니다 😭✨'
      : 'No more fighting over English homework. The automated practice worksheets made my child finally understand it! 😭✨',
    likes: 156,
    comments: 12,
    tag: ko ? '성취' : 'Achievement',
  },
  {
    id: '3',
    author: ko ? '사라 맘' : 'Sarah K.',
    avatar: '👩🏼',
    timeAgo: ko ? '예시' : 'Example',
    content: ko
      ? '영알못 엄마라 항상 미안했는데, 채키 티칭 스크립트 그대로 읽어주니 아이가 절 영어 고수인 줄 알아요 ㅋㅋㅋ 😎'
      : 'I was always worried about my own English level, but reading the Chekki teaching scripts makes me feel like a pro teacher! 😎',
    likes: 8,
    comments: 20,
    tag: ko ? '질문' : 'Question',
  },
];

interface Props {
  onClose: () => void;
  isNight?: boolean;
}

export const CommunityModal: React.FC<Props> = ({ onClose, isNight = true }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [postContent, setPostContent] = useState('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [reportedPosts, setReportedPosts] = useState<string[]>([]);

  const generateTemplate = (platform: 'cafe' | 'insta') => {
    const base =
      postContent ||
      (language === 'ko'
        ? '오늘도 채키랑 숙제 싸움 없이 평화롭게 끝! 🚀'
        : 'Another peaceful homework session with Chekki! 🚀');

    if (platform === 'cafe') {
      return `[영유 숙제 기록] 채키 AI로 오늘도 채점 지옥 탈출! ✨\n\n아이랑 영유 숙제하다 보면 저도 가끔 헷갈리고 설명하기 막막할 때가 많은데요,\n채키(Chekki) 앱으로 1초만에 채점하고 다정한 티칭 가이드까지 그대로 읽어줄 수 있어서 너무 편해요.\n\n무엇보다 아이랑 숙제하면서 화내는 일이 싹 사라졌어요. 😭\n틀린 문제는 오답노트에서 자동으로 복습 문제지로 만들어줘서 주말 대비도 끝이네요!\n\n💬 기록 한마디: ${base}\n\n#채키AI #영유맘 #숙제도우미 #부모표영어 #7세영어 #자기주도학습`;
    } else {
      return `${base}\n\n오늘도 우리 아이 성장을 위해 찰칵! 📸\n퇴근 후 20분씩 걸리던 채점이 단 1초만에 끝나서 제 시간이 생겼어요 ☕️\n\n영어 숙제 시간이 이제 스트레스가 아니라\n도란도란 이야기 나누는 즐거운 시간이 되었어요.\n채키(@Chekki_AI)가 알려주는 부모표 티칭 가이드 최고! 👍\n\n#공부기록 #홈스쿨링 #영유맘소통 #육아소통 #부모표영어 #ChekkiAI #ChekkiMoment #StudyGram`;
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
    if (confirm('Report this post for objectionable content?')) {
      setReportedPosts((prev) => [...prev, postId]);
      alert('Thank you. We have received your report and will review the content within 24 hours.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter flex flex-col max-h-[95vh] w-full max-w-xl mx-2 sm:mx-4">
        <div className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-[#050505]' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div
          className={`${isNight ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} p-4 border-b flex justify-between items-center shrink-0`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">☕</span>
            <h2
              className={`text-lg font-bold ${isNight ? 'text-white' : 'text-zinc-900'} font-display`}
            >
              Parent&apos;s Lounge
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-orange-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* --- POST GENERATOR SECTION --- */}
          <div
            className={`${isNight ? 'bg-gradient-to-b from-zinc-800 to-zinc-900 border-zinc-700' : 'bg-zinc-50 border-zinc-200 shadow-sm'} rounded-2xl p-5 border shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.name.charAt(0) || 'Me'}
              </div>
              <div>
                <h3 className={`${isNight ? 'text-white' : 'text-zinc-900'} font-bold text-sm`}>
                  Create Study Log
                </h3>
                <p className="text-zinc-400 text-xs">Share your child&apos;s progress easily!</p>
              </div>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder={
                language === 'ko'
                  ? '오늘 숙제는 어땠나요? (예: 민준이가 파닉스 퀴즈를 다 맞았어요!)'
                  : 'How did the homework go today?'
              }
              className={`w-full ${isNight ? 'bg-black/20 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-xl p-3 placeholder-zinc-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none resize-none h-24 mb-4 transition-all font-korean`}
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCopy('cafe')}
                className="relative flex items-center justify-center gap-2 bg-[#2DB400]/10 hover:bg-[#2DB400]/20 border border-[#2DB400]/30 text-[#2DB400] py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.97]"
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
                className="relative flex items-center justify-center gap-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.97]"
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
              {MOCK_POSTSList(language === 'ko')
                .filter((p) => !reportedPosts.includes(p.id))
                .map((post) => (
                  <div
                    key={post.id}
                    className={`${isNight ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-orange-500/30 shadow-sm'} border p-4 rounded-xl transition-colors relative group`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`${isNight ? 'bg-zinc-800' : 'bg-zinc-100'} w-8 h-8 rounded-full flex items-center justify-center text-lg`}
                        >
                          {post.avatar}
                        </div>
                        <div>
                          <div
                            className={`text-sm font-bold ${isNight ? 'text-zinc-200' : 'text-zinc-900'}`}
                          >
                            {post.author}
                          </div>
                          <div className="text-[10px] text-zinc-500">{post.timeAgo}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${isNight ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'} border`}
                        >
                          {post.tag}
                        </span>
                      </div>
                    </div>
                    <p
                      className={`${isNight ? 'text-zinc-300' : 'text-zinc-600'} text-sm mb-3 font-korean leading-relaxed`}
                    >
                      {post.content}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-xs text-zinc-500 font-bold">
                        <span className="hover:text-pink-500 cursor-pointer transition-colors">
                          ♥ {post.likes}
                        </span>
                        <span className="hover:text-blue-500 cursor-pointer transition-colors">
                          💬 {post.comments}
                        </span>
                      </div>
                      {/* Reporting Feature (Required for App Store UGC) */}
                      <button
                        onClick={() => handleReport(post.id)}
                        className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'} hover:text-red-500 flex items-center gap-1 transition-opacity opacity-60 md:opacity-0 md:group-hover:opacity-100`}
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
    </div>
  );
};
