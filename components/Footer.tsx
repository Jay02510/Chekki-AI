import React from 'react';
import { ChekkiMascot } from './Icons';
import { LegalType } from '../types';

interface FooterProps {
  isNight: boolean;
  language: 'en' | 'ko';
  onLegalClick: (type: LegalType) => void;
}

export const Footer: React.FC<FooterProps> = ({ isNight, language, onLegalClick }) => {
  return (
    <footer
      className={`w-full ${isNight ? 'bg-zinc-950/50 border-white/5' : 'bg-white border-zinc-100 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]'} border-t py-12 px-6`}
    >
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChekkiMascot className="w-8 h-8 text-white" mood="happy" />
            </div>
            <h2
              className={`text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display`}
            >
              Chekki<span className="text-orange-500">AI</span>
            </h2>
          </div>
          <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-sm">
            {language === 'ko'
              ? '채키 AI는 부모님과 아이들의 즐거운 학습 경험을 위해 최선을 다합니다. 혁신적인 AI 기술로 숙제와 공부가 더 즐거워지는 세상을 만듭니다.'
              : 'Chekki AI is dedicated to creating joyful learning experiences for parents and children through innovative AI technology.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h4
              className={`text-xs font-black ${isNight ? 'text-white' : 'text-zinc-900'} uppercase tracking-[0.2em]`}
            >
              {language === 'ko' ? '사업자 정보' : 'Business Info'}
            </h4>
            <div className="space-y-1.5 text-[10px] md:text-xs text-zinc-500 font-medium">
              <p>
                <span className="text-zinc-600 font-bold">
                  {language === 'ko' ? '상호:' : 'Biz:'}
                </span>{' '}
                채키 AI (Chekki AI)
              </p>
              <p>
                <span className="text-zinc-600 font-bold">
                  {language === 'ko' ? '사업자번호:' : 'Reg No:'}
                </span>{' '}
                814-14-03096
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <h4
              className={`text-xs font-black ${isNight ? 'text-white opacity-40' : 'text-zinc-400'} uppercase tracking-[0.2em]`}
            >
              {language === 'ko' ? '고객 센터' : 'Contact Us'}
            </h4>
            <div className="space-y-1.5 text-[10px] md:text-xs text-zinc-500 font-medium font-korean">
              <p>
                <span className="text-zinc-600 font-bold">
                  {language === 'ko' ? '이메일:' : 'Email:'}
                </span>{' '}
                support@chekkiai.com
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] md:text-xs text-zinc-600 font-bold uppercase tracking-widest">
          © 2026 CHEKKI AI. ALL RIGHTS RESERVED.
        </p>
        <div className="flex gap-4 md:gap-6">
          <a
            href="/faq"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '/faq');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors"
          >
            FAQ
          </a>
          <button
            onClick={() => onLegalClick('privacy')}
            className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors"
          >
            Privacy
          </button>
          <button
            onClick={() => onLegalClick('terms')}
            className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors"
          >
            Terms
          </button>
          <button
            onClick={() => onLegalClick('support')}
            className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors"
          >
            Support
          </button>
          <button
            onClick={() => onLegalClick('refund')}
            className="text-[10px] md:text-xs text-zinc-600 hover:text-orange-500 font-bold uppercase tracking-widest transition-colors"
          >
            Refund
          </button>
        </div>
      </div>
    </footer>
  );
};
