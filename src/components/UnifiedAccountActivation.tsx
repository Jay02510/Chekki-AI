import React, { useState, useRef } from 'react';
import { Buildings, CheckCircle, FolderUser, UserGear, UploadSimple } from '@phosphor-icons/react';
import { auth } from '../../services/database';
import { useToast } from '../../contexts/ToastContext';
import { labelsForPlan } from '../../api/_lib/pricingTiers';
import { readAndCompressLogoFile, LogoTooLargeError } from '../utils/logoUpload';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  schoolId: string;
  seatsTotal: { ft: number; kt: number };
  trialStatus?: { onTrial: boolean; daysRemaining: number; expired: boolean } | null;
  onComplete: (data: { academyName: string; logoUrl?: string; classes: string[] }) => void;
}

export const UnifiedAccountActivation: React.FC<Props> = ({
  isNight = true,
  isKo = true,
  schoolId,
  seatsTotal,
  trialStatus = null,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { showToast } = useToast();
  const planLabel = labelsForPlan(typeof window !== 'undefined' ? sessionStorage.getItem('chekki_selected_plan') : null);

  // Step 1: School Profile
  const [academyName, setAcademyName] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('chekki_paid_school') || '' : ''));
  const [campusLevel, setCampusLevel] = useState('Kindergarten & Elementary');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 2: Curriculum & Classes
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [newClassName, setNewClassName] = useState('');

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    if (!selectedClasses.includes(newClassName.trim())) {
      setSelectedClasses([...selectedClasses, newClassName.trim()]);
    }
    setNewClassName('');
  };

  const handleRemoveClass = (cls: string) => {
    setSelectedClasses(selectedClasses.filter((c) => c !== cls));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await readAndCompressLogoFile(file);
      setLogoPreview(compressed);
    } catch (err) {
      showToast({
        type: 'error',
        message:
          err instanceof LogoTooLargeError
            ? (isKo ? '압축 후에도 이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.' : err.message)
            : (isKo ? '이미지를 불러오지 못했습니다. 다시 시도해주세요.' : 'Could not read that image. Please try again.'),
      });
    } finally {
      e.target.value = '';
    }
  };

  // Persists the real school name server-side (api/set-initial-role.ts only
  // had a placeholder "New Academy" to work with) — fire-and-forget since
  // it's not on the critical path for the wizard to keep moving.
  // Fires again every time Step 1's Next is clicked (Back then re-edit then
  // Next again) with no ordering guard — an earlier, slower in-flight call
  // could resolve AFTER a later one with a newer name, silently reverting
  // the server's academyName back to the stale value while the wizard has
  // already moved on with the newer one (audit: academy-name persist race).
  const persistAcademyNameRequestIdRef = useRef(0);

  const persistAcademyName = async () => {
    if (!academyName.trim()) return;
    const thisRequestId = ++persistAcademyNameRequestIdRef.current;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/update-school-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ academyName: academyName.trim(), logoUrl: logoPreview || undefined }),
      });
      if (thisRequestId !== persistAcademyNameRequestIdRef.current) return;
      if (!response.ok) throw new Error(await response.text());
    } catch (err) {
      if (thisRequestId !== persistAcademyNameRequestIdRef.current) return;
      console.warn('Failed to persist academy name:', err);
      // Not on the critical path for the wizard (still lets the director
      // continue), but a silent failure here used to mean they'd finish
      // onboarding and see the 'B2B Academy' placeholder everywhere with no
      // idea why — this at least tells them to fix it in settings.
      showToast({
        type: 'error',
        message: isKo
          ? '학원 이름 저장에 실패했습니다. 나중에 설정에서 다시 시도해주세요.'
          : "Couldn't save your academy name. Please try again later from settings.",
      });
    }
  };

  const [hasFinished, setHasFinished] = useState(false);

  const handleFinish = () => {
    if (hasFinished) return;
    setHasFinished(true);
    onComplete({
      academyName,
      logoUrl: logoPreview || undefined,
      classes: selectedClasses,
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans transition-colors ${
      isNight ? 'bg-brand-dark text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      <div className={`w-full max-w-2xl rounded-3xl border p-6 sm:p-10 shadow-2xl space-y-8 transition-all ${
        isNight ? 'bg-brand-dark border-white/10' : 'bg-white border-zinc-200'
      }`}>
        
        {/* Wizard Header Progress Bar */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-500 font-black text-xs flex items-center justify-center border border-orange-500/30 shrink-0">
                {step}/3
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isKo ? '원장님 맞춤 캠퍼스 워크스페이스 활성화' : 'Campus Workspace Activation'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {/* seatsTotal comes from the school doc set-initial-role.ts wrote
                  server-side — the real granted split, not the sessionStorage
                  display-only number this used to read. */}
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                ⚡ {(isKo ? planLabel.nameKo : planLabel.nameEn).toUpperCase()} (FT {seatsTotal.ft} / KT {seatsTotal.kt})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-orange-500' : isNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-orange-500' : isNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-orange-500' : isNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
          </div>

          {/* Trial Countdown — mirrors the dashboard banner (NativeDirectorPortal)
              and the mobile app's RevenueCat trial badge in SettingsModal, so the
              director sees it while actually setting up, not just at signup. */}
          {trialStatus?.onTrial && (
            <div className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              trialStatus.expired
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : trialStatus.daysRemaining <= 2
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : isNight ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}>
              <span>
                {trialStatus.expired
                  ? (isKo ? '⏰ 무료 체험이 종료되었습니다 — 대시보드에서 업그레이드하세요.' : '⏰ Your free trial has ended — upgrade from the dashboard.')
                  : (isKo ? `⏳ 무료 체험 ${trialStatus.daysRemaining}일 남음` : `⏳ ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} left in your trial`)}
              </span>
            </div>
          )}
        </div>

        {/* STEP 1: Campus Profile & Logo Upload */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Buildings size={24} className="text-orange-500 shrink-0" />
              <div>
                <h3 className="font-black text-base">{isKo ? '1단계: 원 학원명 & 맞춤 브랜딩 설정' : 'Step 1: School Profile & Campus Branding'}</h3>
                <p className="text-xs text-zinc-400">{isKo ? '학부모 리포트 및 선생님 워크스페이스에 표시될 학원 정보를 입력하세요.' : 'Configure official school name and brand logo for report headers.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {isKo ? '학원 / 원 이름 (School Name)' : 'Official School / Campus Name'}
                </label>
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  placeholder="E.g. Apex International Academy"
                  className={`w-full p-3.5 rounded-xl border text-sm font-bold outline-none focus:border-orange-500 transition-all ${
                    isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {isKo ? '대상 연령 / 과정 (Campus Level)' : 'Campus Level'}
                </label>
                <select
                  value={campusLevel}
                  onChange={(e) => setCampusLevel(e.target.value)}
                  className={`w-full p-3.5 rounded-xl border text-sm font-bold outline-none focus:border-orange-500 cursor-pointer ${
                    isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                >
                  <option value="Kindergarten & Elementary">유치부 &amp; 초등부 (Kindergarten &amp; Elementary)</option>
                  <option value="Elementary & Middle">초등부 &amp; 중등부 (Elementary &amp; Middle)</option>
                  <option value="Academy / Study Room">어학원 / 전문 공부방 (Academy / Study Room)</option>
                </select>
              </div>

              {/* Logo Upload Box */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  {isKo ? '원장님 맞춤 로고 업로드 (선택)' : 'School Brand Logo (Optional)'}
                </label>
                <div className={`p-4 border-2 border-dashed rounded-2xl flex items-center justify-between gap-4 transition-all ${
                  isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="School Logo" className="w-12 h-12 object-contain rounded-xl border border-orange-500/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                        <UploadSimple size={20} weight="bold" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold">{logoPreview ? (isKo ? '미리보기 (아직 저장되지 않음)' : 'Preview (not saved yet)') : (isKo ? '원장님 로고 이미지 첨부' : 'Attach School Logo Image')}</p>
                      <p className="text-[10px] text-zinc-400">
                        {logoPreview
                          ? (isKo ? '다음 버튼을 누르면 저장됩니다.' : 'Saved when you tap Next.')
                          : 'PNG, JPG (Transparent background recommended)'}
                      </p>
                    </div>
                  </div>

                  <label className="px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs rounded-xl border border-orange-500/30 cursor-pointer transition-all shrink-0">
                    <span>{isKo ? '파일 선택' : 'Browse'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                persistAcademyName();
                setStep(2);
              }}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{isKo ? '다음: 학급반 설정 →' : 'Next: Setup Classes →'}</span>
            </button>
          </div>
        )}

        {/* STEP 2: Classes & Curriculum Setup */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <FolderUser size={24} className="text-orange-500 shrink-0" />
              <div>
                <h3 className="font-black text-base">{isKo ? '2단계: 학급반 구성' : 'Step 2: Class Roster'}</h3>
                <p className="text-xs text-zinc-400">{isKo ? '운영 중인 학급반 이름을 등록하세요. 교재는 각 학급의 커리큘럼 설정에서 등록합니다.' : "Register active class names. You'll set each class's textbook from its curriculum setup."}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  {isKo ? '운영 학급반 목록 (Active Classes)' : 'Active Class Roster'}
                </label>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder={isKo ? '새 학급반 입력 (예: 7B Sunshine)' : 'Add class (e.g. 7B Sunshine)'}
                    className={`flex-1 p-3 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 ${
                      isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    + {isKo ? '추가' : 'Add'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedClasses.map((cls) => (
                    <span
                      key={cls}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-bold flex items-center gap-2"
                    >
                      <span>🏫 {cls}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cls)}
                        className="hover:text-rose-400 cursor-pointer font-black"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`w-1/3 py-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  isNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                }`}
              >
                ← {isKo ? '이전' : 'Back'}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <span>{isKo ? '다음: 선생님 초대 설정 →' : 'Next: Invite Staff Teachers →'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Staff Invites & Workspace Launch */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <UserGear size={24} className="text-orange-500 shrink-0" />
              <div>
                <h3 className="font-black text-base">{isKo ? '3단계: 담당 선생님 초대 & 워크스페이스 완성' : 'Step 3: Staff Email & Link Invitation'}</h3>
                <p className="text-xs text-zinc-400">{isKo ? '원어민 선생님(FT)과 한국인 선생님(KT)을 1초 초대 링크로 연결하세요.' : 'Invite Foreign & Korean Teachers via instant invite link.'}</p>
              </div>
            </div>

            {/* Invites now require picking a real class (audit: teacher
                landed with no class after accepting an invite, then either
                self-served a disconnected standalone class or waited on a
                separate after-the-fact assignment). The classes typed in
                Step 2 are still just local names at this point — they don't
                become real Firestore docs with real IDs until Finish below
                — so there's nothing yet to assign an invite to. Send
                director straight to the dashboard's invite panel instead,
                which has real classes to pick from. */}
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-bold text-center">
              {isKo
                ? '설정을 마치면 학급이 개설됩니다. 대시보드에서 선생님을 초대하고 담당 학급을 바로 배정하세요.'
                : "Your classes will be created once you finish setup. Invite teachers from your dashboard afterward — you'll assign them straight to a class as part of sending the invite."}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`w-1/3 py-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${
                  isNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                }`}
              >
                ← {isKo ? '이전' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={hasFinished}
                className="w-2/3 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CheckCircle size={18} weight="bold" />
                <span>{isKo ? '설정 완료 & 대시보드 입장! 🎉' : 'Complete & Launch Workspace! 🎉'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
