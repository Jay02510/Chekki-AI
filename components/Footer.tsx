import React from 'react';
import { LegalType } from '../types';

interface FooterProps {
  isNight: boolean;
  language: 'en' | 'ko';
  onLegalClick: (type: LegalType) => void;
}

// Quiet terminus: legal facts and links, set small in the signage world.
export const Footer: React.FC<FooterProps> = ({ language, onLegalClick }) => {
  const ko = language === 'ko';
  const link = 'text-[13px] font-semibold text-ink-3 hover:text-ink';
  return (
    <footer className="mt-8 w-full border-t border-rule px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1 text-[13px] text-ink-3">
          <p className="font-bold text-ink-2">채키 AI (Chekki AI)</p>
          <p>
            {ko ? '대표자' : 'Representative'} Benjamin Jason · {ko ? '사업자번호' : 'Reg. no.'}{' '}
            <span className="num">814-14-03096</span>
          </p>
          <p>
            {ko ? '고객 센터' : 'Contact'}{' '}
            <a href="mailto:support@chekkiai.com" className="underline hover:text-ink">
              support@chekkiai.com
            </a>
          </p>
          <p className="pt-2">© 2026 Chekki AI</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label={ko ? '정책' : 'Policies'}>
          <a
            href="/faq"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'instant' });
              window.history.pushState({}, '', '/faq');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className={link}
          >
            FAQ
          </a>
          <button onClick={() => onLegalClick('privacy')} className={link}>
            {ko ? '개인정보처리방침' : 'Privacy'}
          </button>
          <button onClick={() => onLegalClick('terms')} className={link}>
            {ko ? '이용약관' : 'Terms'}
          </button>
          <button onClick={() => onLegalClick('support')} className={link}>
            {ko ? '고객지원' : 'Support'}
          </button>
          <button onClick={() => onLegalClick('refund')} className={link}>
            {ko ? '환불정책' : 'Refund'}
          </button>
        </nav>
      </div>
    </footer>
  );
};
