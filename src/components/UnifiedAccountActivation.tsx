import React, { useState } from 'react';
import { Buildings, CheckCircle, FolderUser, UserGear, UploadSimple, Sparkle } from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  onComplete: (data: { academyName: string; logoUrl?: string; classes: string[]; staffEmails: string[] }) => void;
}

export const UnifiedAccountActivation: React.FC<Props> = ({
  isNight = true,
  isKo = true,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: School Profile
  const [academyName, setAcademyName] = useState('Apex International Academy');
  const [campusLevel, setCampusLevel] = useState('Kindergarten & Elementary');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 2: Curriculum & Classes
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['7A Sunshine', '8B Excellence', '9C Leader']);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTextbook, setSelectedTextbook] = useState('Bricks Reading 150');

  // Step 3: Staff Invites
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffEmails, setStaffEmails] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleAddStaffEmail = () => {
    if (!staffEmailInput.trim()) return;
    if (!staffEmails.includes(staffEmailInput.trim())) {
      setStaffEmails([...staffEmails, staffEmailInput.trim()]);
    }
    setStaffEmailInput('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/schools/login?invite=${encodeURIComponent(academyName.replace(/\s+/g, '-').toLowerCase())}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleFinish = () => {
    onComplete({
      academyName,
      logoUrl: logoPreview || undefined,
      classes: selectedClasses,
      staffEmails,
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans transition-colors ${
      isNight ? 'bg-[#030305] text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      <div className={`w-full max-w-2xl rounded-3xl border p-6 sm:p-10 shadow-2xl space-y-8 transition-all ${
        isNight ? 'bg-[#08080c] border-white/10' : 'bg-white border-zinc-200'
      }`}>
        
        {/* Wizard Header Progress Bar */}
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-500 font-black text-xs flex items-center justify-center border border-orange-500/30">
                {step}/3
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isKo ? '원장님 맞춤 캠퍼스 워크스페이스 활성화' : 'Campus Workspace Activation'}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              DIRECTOR SETUP
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-orange-500' : isNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-orange-500' : isNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-orange-500' : isNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
          </div>
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
                    isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
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
                    isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
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
                      <p className="text-xs font-bold">{logoPreview ? (isKo ? '로고 업로드 완료' : 'Logo Uploaded') : (isKo ? '원장님 로고 이미지 첨부' : 'Attach School Logo Image')}</p>
                      <p className="text-[10px] text-zinc-400">PNG, JPG (Transparent background recommended)</p>
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
              onClick={() => setStep(2)}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>{isKo ? '다음: 학급반 및 커리큘럼 설정 →' : 'Next: Setup Classes & Curriculum →'}</span>
            </button>
          </div>
        )}

        {/* STEP 2: Classes & Curriculum Setup */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <FolderUser size={24} className="text-orange-500 shrink-0" />
              <div>
                <h3 className="font-black text-base">{isKo ? '2단계: 학급반 구성 & 주교재 등록' : 'Step 2: Class Roster & Primary Textbook'}</h3>
                <p className="text-xs text-zinc-400">{isKo ? '운영 중인 학급반 이름과 메인 사용 교재를 등록하세요.' : 'Register active class names and primary textbook series.'}</p>
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
                      isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
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

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  {isKo ? '메인 영어 교재 시리즈 (Primary Textbook)' : 'Primary Textbook Series'}
                </label>
                <input
                  type="text"
                  value={selectedTextbook}
                  onChange={(e) => setSelectedTextbook(e.target.value)}
                  placeholder="E.g. Bricks Reading 150 / Subject Link L4"
                  className={`w-full p-3.5 rounded-xl border text-sm font-bold outline-none focus:border-orange-500 ${
                    isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
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
                className="w-2/3 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
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

            <div className="space-y-4">
              {/* 1-Click Copy Invite Link Box */}
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-orange-400 flex items-center gap-1.5">
                    <Sparkle size={16} weight="fill" />
                    <span>{isKo ? '🔗 1초 전용 초대 링크 (Workspace Invite Link)' : '1-Click Workspace Invite Link'}</span>
                  </span>
                  {copiedLink && (
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">
                      ✓ {isKo ? '복사 완료!' : 'Copied!'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-300">
                  {isKo ? '이 링크를 선생님 카톡이나 이메일에 전송하면 코드 입력 없이 자동 연결됩니다.' : 'Send this link to teachers to instantly attach them to your campus without typing codes.'}
                </p>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>📋 {isKo ? '초대 링크 1초 복사하기' : 'Copy Invite Link'}</span>
                </button>
              </div>

              {/* Direct Email Invite */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  {isKo ? '선생님 이메일 مستقیم 초대 (선택)' : 'Direct Staff Email Invite (Optional)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={staffEmailInput}
                    onChange={(e) => setStaffEmailInput(e.target.value)}
                    placeholder="E.g. sarah.teacher@apex.edu"
                    className={`flex-1 p-3 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddStaffEmail}
                    className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    + {isKo ? '초대 추가' : 'Invite'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {staffEmails.map((email) => (
                    <span
                      key={email}
                      className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold"
                    >
                      ✉️ {email}
                    </span>
                  ))}
                </div>
              </div>
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
                className="w-2/3 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
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
