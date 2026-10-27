import React, { useState } from 'react';
import { CheckCircle, ChalkboardTeacher, Buildings } from '@phosphor-icons/react';
import { ChekkiMascot } from '../../components/Icons';

interface Props {
  isKo: boolean;
  initialName: string;
  initialRole: 'ft' | 'kt';
  // The director's invite already set the role, so it's shown, not chosen.
  roleLocked: boolean;
  onDone: (role: 'ft' | 'kt') => void;
}

// FT/KT first-login welcome. Classes are director-created and teacher-assigned
// only (single flow, no FT/KT self-serve creation), so this just confirms name
// and role, then hands back to TeacherPage to record it as seen.
export function TeacherWelcomeModal({ isKo, initialName, initialRole, roleLocked, onDone }: Props) {
  const [teacherWelcomeStep, setTeacherWelcomeStep] = useState<1 | 2>(1);
  const [welcomeName, setWelcomeName] = useState(initialName);
  const [welcomeRole, setWelcomeRole] = useState<'ft' | 'kt'>(initialRole);
  const [welcomeSchool] = useState(() => {
    if (typeof window === 'undefined') return '';
    // The real school name returned by /api/redeem-invite on signup — this
    // used to title-case the raw invite ID slug itself (e.g. "inv_mssre11q")
    // as a fallback "school name", which is what actually rendered here
    // (Audit: invite welcome modal shows garbage, not the real school name).
    return localStorage.getItem('chekki_invite_school_name') || '';
  });
  const [welcomeInviterName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('chekki_invite_by') || '';
  });
  const dismissWelcome = () => onDone(welcomeRole);

  return (
    <div className={`min-h-dvh flex items-center justify-center p-4 font-sans bg-surface text-ink`}>
      <div className={`relative w-full max-w-md rounded-lg border p-1.5 bg-surface border-rule`}>
        <div className={`rounded-lg p-8 sm:p-10 flex flex-col items-center bg-surface`}>

          {/* Mascot + Badge */}
          <div className="w-16 h-16 mb-5 drop-shadow-[0_8px_20px_rgba(249,115,22,0.25)]">
            <ChekkiMascot className="w-full h-full" mood="happy" />
          </div>
          <div className={`mb-4 inline-flex items-center gap-2 rounded-md px-3.5 py-1 text-[12px] font-bold ${
            welcomeRole === 'kt'
              ? 'bg-sunken border border-rule text-ink-2'
              : 'bg-line-soft border border-rule text-line-ink'
          }`}>
            <ChalkboardTeacher size={12} weight="bold" />
            <span>{welcomeRole === 'kt' ? (isKo ? 'KT 한국인 선생님 환영' : 'Korean Teacher (KT) Access') : (isKo ? 'FT 원어민 선생님 환영' : 'Foreign Teacher (FT) Access')}</span>
          </div>

          {/* Step 1 — Confirm name & role */}
          {teacherWelcomeStep === 1 && (
            <div className="w-full space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink mb-1">{isKo ? '선생님, 환영합니다!' : 'Welcome, Teacher!'}</h2>
                <p className="text-ink-3 text-xs leading-relaxed">{isKo ? '아래 정보를 확인하고 시작해 주세요.' : 'Confirm your details to get started.'}</p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-ink-3 pl-1">{isKo ? '선생님 성함' : 'Your Name'}</label>
                <input
                  type="text"
                  value={welcomeName}
                  onChange={(e) => setWelcomeName(e.target.value)}
                  placeholder={isKo ? '예: 김지원' : 'e.g. Sarah Lee'}
                  className={`w-full p-4 rounded-lg border text-sm font-bold outline-none focus:border-line transition-[color,background-color,border-color,box-shadow,transform] bg-surface border-rule text-ink`}
               />
              </div>

              {welcomeSchool && (
                <div className="p-3.5 rounded-lg bg-right-soft border border-rule flex items-center gap-2.5">
                  <Buildings size={16} className="text-correct shrink-0" />
                  <div>
                    <p className="text-[12px] text-correct font-bold">{isKo ? '초대받은 학원' : 'Invited Academy'}</p>
                    <p className="text-sm font-extrabold text-ink">{welcomeSchool}</p>
                    {welcomeInviterName && (
                      <p className="text-[12px] text-correct mt-0.5">
                        {isKo ? `${welcomeInviterName} 원장님이 초대함` : `Invited by ${welcomeInviterName}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-ink-3 pl-1">{isKo ? '선생님 역할' : 'Your Role'}</label>
                {roleLocked ? (
                  // Role was already decided by the director's invite (audit
                  // §21d) — this is a read-only confirmation, not a choice.
                  <div className={`w-full py-3 rounded-md text-xs font-extrabold border text-center ${
                    welcomeRole === 'kt' ? 'bg-sunken border-rule text-ink-2' : 'bg-line-soft border-rule text-line-ink'
                  }`}>
                    {welcomeRole === 'kt' ? (isKo ? '🇰🇷 KT 한국어 선생님 (초대로 지정됨)' : '🇰🇷 Korean Teacher — set by your invite') : (isKo ? 'FT 원어민 선생님 (초대로 지정됨)' : 'Foreign Teacher — set by your invite')}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {(['ft', 'kt'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setWelcomeRole(r)}
                        className={`flex-1 py-3 rounded-md text-xs font-extrabold border transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                          welcomeRole === r
                            ? 'bg-line border-line text-on-line'
                            : 'bg-sunken border-rule text-ink-2'
                        }`}
                      >
                        {r === 'ft' ? (isKo ? 'FT 원어민' : 'Foreign Teacher') : (isKo ? '🇰🇷 KT 한국어' : '🇰🇷 Korean Teacher')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setTeacherWelcomeStep(2)}
                className="w-full py-4 bg-line hover:bg-line text-on-line font-bold text-sm rounded-lg transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>{isKo ? '다음: 학급 확인 →' : 'Next: Class Setup →'}</span>
              </button>
            </div>
          )}

          {/* Step 2 — single flow: the director creates classes and
              assigns teachers to them (Teacher Assignments); a teacher
              never creates their own class here. This used to branch on
              welcomeSchool and let anyone without it type a class name,
              which created a standalone class disconnected from the
              director's real roster (audit: teacher ends up on a
              different class than the one the director set up) — one
              path now, regardless of how the account was created. */}
          {teacherWelcomeStep === 2 && (
            <div className="w-full space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-ink mb-1">{isKo ? '거의 다 됐어요!' : "You're all set!"}</h2>
                <p className="text-ink-3 text-xs leading-relaxed">
                  {isKo
                    ? '원장님이 담당 학급을 배정하면 대시보드에 표시됩니다.'
                    : 'Your director will assign you to a class — it\'ll show up on your dashboard once they do.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissWelcome()}
                className="w-full py-4 bg-line hover:bg-line text-on-line font-bold text-sm rounded-lg transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CheckCircle size={18} weight="bold" />
                <span>{isKo ? '완료 — 대시보드 입장!' : 'Done — Enter Dashboard!'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
