import React, { useRef, useState, useEffect } from 'react';
import { Camera, Sun, LockSimple, ArrowRight, ChatCircleText, ChalkboardTeacher, Target } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CropModal } from './CropModal';
import { LoopStrip, Stop } from './metro';
import { ParentClassLogs } from './ParentClassLogs';

interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
  minimal?: boolean;
  onOpenHelp?: () => void;
}

// Scan home: Chekki greets the parent, one big button takes the photo.
// Everything else stays quiet so a tired parent with a child on their lap
// sees exactly one thing to do.
export const CameraView: React.FC<Props> = ({ onImageSelected, isNight = false }) => {
  const { showToast } = useToast();
  const { user, isAuthenticated, openLoginModal, setShowPaywall } = useAuth();
  const { t, language } = useLanguage();
  const ko = language === 'ko';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [guestUsed, setGuestUsed] = useState(false);
  const [inviteDismissed, setInviteDismissed] = useState(
    () => localStorage.getItem('chekki_classcode_banner_dismissed') === '1'
  );

  useEffect(() => {
    setGuestUsed(localStorage.getItem('chekki_guest_scan_used') === 'true');
  }, [isAuthenticated]);

  const isLocked = !isAuthenticated && guestUsed;

  const openPicker = () => {
    if (isLocked) openLoginModal();
    else fileInputRef.current?.click();
  };

  useEffect(() => {
    window.addEventListener('trigger-scan', openPicker);
    return () => window.removeEventListener('trigger-scan', openPicker);
  });

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      setImageToCrop(await compressImage(file));
    } catch {
      showToast({
        message: ko
          ? '사진을 불러오지 못했어요. 다른 사진으로 다시 시도해 주세요.'
          : "Couldn't read that photo. Please try another one.",
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLocked) return;
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isLocked && e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const linked = !!(user?.schoolId && user?.classId && user?.classStatus === 'active');
  const isPro = user?.plan === 'pro';
  const today = new Date().toISOString().split('T')[0];
  const scansUsed = user && user.lastScanDate === today ? user.scansUsedToday || 0 : 0;
  const scansLeft = Math.max(0, (user?.maxScansPerDay || 2) - scansUsed);

    const stops: Stop[] = [
    { ko: '정답지', en: 'Key', state: 'done' },
    { ko: '숙제', en: 'Scan', state: 'current' },
    { ko: '설명', en: 'Explain', state: 'next' },
    { ko: '수업', en: 'Class', state: 'next' },
    { ko: '리포트', en: 'Report', state: 'next' },
  ];

  // Why this and not a chatbot: three honest differences, guests only.
  const reasons = [
    {
      Icon: Camera,
      title: ko ? '사진 한 장이면 끝' : 'One photo, no typing',
      desc: ko
        ? '질문을 쓰거나 복사할 필요 없어요. 학습지를 그대로 찍으면 돼요.'
        : 'No questions to type. Just snap the page as it is.',
    },
    {
      Icon: ChatCircleText,
      title: ko ? '아이에게 할 말까지' : 'What to say to your child',
      desc: ko
        ? '정답만이 아니라, 아이에게 어떻게 설명할지 한국어로 알려 줘요.'
        : 'Not just the answer: how to explain it, in Korean.',
    },
    linked
      ? {
          Icon: ChalkboardTeacher,
          title: ko ? '선생님 정답지로 채점' : "Graded with the teacher's key",
          desc: ko
            ? '학원 선생님이 올린 정답지로 채점하고, 틀린 문제는 선생님께도 전달돼요.'
            : "Uses your academy's answer key, and the teacher sees what was missed.",
        }
      : {
          Icon: Target,
          title: ko ? '틀린 문제만, 하나씩' : 'Only the misses, one at a time',
          desc: ko
            ? '맞은 건 칭찬하고, 틀린 문제만 아이와 하나씩 같이 봐요.'
            : 'Praise the right ones, then go through the misses together.',
        },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-2 pt-2 pb-16 sm:px-4 animate-fade-in">
      {imageToCrop && (
        <CropModal
          imageSrc={imageToCrop}
          isNight={isNight}
          onClose={() => setImageToCrop(null)}
          onCropComplete={(cropped) => {
            onImageSelected(cropped.split(',')[1]);
            setImageToCrop(null);
          }}
          onGradeOriginal={() => {
            onImageSelected(imageToCrop.split(',')[1]);
            setImageToCrop(null);
          }}
        />
      )}

      {/* Chekki says hello */}
      <section className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-6 sm:text-left">
        <img
          src="/images/chekki-wave.webp"
          alt=""
          width={500}
          height={500}
          className="h-36 w-36 shrink-0 object-contain sm:h-44 sm:w-44 animate-[chekki-bob_4s_ease-in-out_infinite]"
        />
        <div className="mt-1 sm:mb-6">
          <h1 className="sign-ko text-[30px] sm:text-[38px] text-ink break-keep">
            {ko ? '오늘 숙제, 같이 봐요' : "Let's check today's homework"}
          </h1>
          <p className="mt-2 text-[17px] font-medium leading-snug text-ink-2 break-keep">
            {ko ? '사진 한 장만 찍어 주세요. 나머지는 채키가 할게요.' : 'Take one photo. Chekki does the rest.'}
          </p>
        </div>
      </section>

      {/* the one thing to do */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="mt-6"
      >
        <button
          type="button"
          onClick={openPicker}
          disabled={isProcessing}
          className={`group flex w-full items-center gap-5 rounded-lg px-6 py-6 text-left transition-[transform,box-shadow] duration-200 ease-[var(--ease-arrive)] active:scale-[0.98] disabled:cursor-progress sm:px-8 sm:py-7 ${
            isLocked
              ? 'bg-surface text-ink ring-2 ring-inset ring-rule'
              : 'bg-line text-[#2b211a] shadow-[0_10px_24px_-12px_rgba(239,124,28,0.7)] hover:shadow-[0_14px_30px_-12px_rgba(239,124,28,0.8)]'
          } ${dragActive ? 'outline-dashed outline-[3px] outline-offset-4 outline-line' : ''}`}
        >
          <span
            className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
              isLocked ? 'bg-sign text-on-sign' : 'bg-white/90 text-line-ink'
            }`}
          >
            {isProcessing ? (
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-current border-t-transparent" />
            ) : isLocked ? (
              <LockSimple size={30} weight="bold" />
            ) : (
              <Camera size={34} weight="fill" />
            )}
          </span>
          <span className="min-w-0">
            <span className="sign-ko block text-[26px] sm:text-[32px]">
              {isProcessing
                ? ko
                  ? '사진 준비 중…'
                  : 'Preparing photo…'
                : isLocked
                  ? ko
                    ? '로그인하고 계속하기'
                    : 'Sign in to keep going'
                  : ko
                    ? '학습지 찍기'
                    : 'Scan homework'}
            </span>
            <span className={`mt-1 block text-[15px] font-semibold ${isLocked ? 'text-ink-2' : 'text-[#2b211a]/75'}`}>
              {isLocked
                ? t('guest_used_desc')
                : !isAuthenticated && !guestUsed
                  ? ko
                    ? '첫 채점은 로그인 없이 무료예요'
                    : 'First one is free, no sign-in'
                  : ko
                    ? 'Scan homework'
                    : '학습지 찍기'}
            </span>
          </span>
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          disabled={isProcessing || isLocked}
        />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] font-medium text-ink-3 sm:justify-start">
          <span className="inline-flex items-center gap-1.5">
            <Sun size={15} weight="bold" aria-hidden="true" />
            {ko ? '밝은 곳에서, 평평하게 찍어 주세요' : 'Bright light, page flat'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockSimple size={14} weight="bold" aria-hidden="true" />
            {t('supported_formats')}
          </span>
        </div>
      </div>

      {isAuthenticated && !isPro && (
        <button
          type="button"
          onClick={() => setShowPaywall(true)}
          className="mt-5 flex w-full items-center justify-between gap-4 rounded-md bg-surface px-5 py-3.5 text-left ring-1 ring-inset ring-rule transition-colors hover:ring-line"
        >
          <span className="text-[15px] font-bold text-ink">
            {ko ? '오늘 남은 무료 채점 ' : 'Free scans left today '}
            <span className="num text-line-ink">{scansLeft}</span>
            {ko ? '회' : ''}
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-3">
            {ko ? '무제한은 Pro' : 'Unlimited with Pro'}
            <ArrowRight size={14} weight="bold" />
          </span>
        </button>
      )}

      {isAuthenticated && !linked && !inviteDismissed && (
        <div className="mt-5 rounded-md bg-surface px-5 py-4 ring-1 ring-inset ring-rule">
          <p className="text-[15px] font-bold text-ink">
            {ko ? '학원에서 초대를 받으셨나요?' : 'Invited by your academy?'}
          </p>
          <p className="mt-0.5 text-[14px] text-ink-2 leading-snug break-keep">
            {ko
              ? '초대 코드를 넣으면 선생님 정답지로 채점하고, 수업 리포트도 여기로 와요.'
              : "Add the invite code to grade with your teacher's answer key and get class reports here."}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-settings-class-code'))}
              className="min-h-11 rounded-md bg-sign px-4 text-sm font-bold text-on-sign"
            >
              {ko ? '초대 코드 넣기' : 'Enter invite code'}
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('chekki_classcode_banner_dismissed', '1');
                setInviteDismissed(true);
              }}
              className="min-h-11 text-sm font-semibold text-ink-3 hover:text-ink"
            >
              {ko ? '나중에' : 'Not now'}
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <section className="mt-10">
          <h2 className="text-center text-[15px] font-bold text-ink-2 sm:text-left">
            {ko ? 'AI 챗봇에 물어보는 것과 뭐가 다를까요?' : 'Why not just ask a chatbot?'}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {reasons.map(({ Icon, title, desc }) => (
              <li key={title} className="rounded-md bg-surface p-5 ring-1 ring-inset ring-rule">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-line-soft text-line-ink">
                  <Icon size={22} weight="bold" aria-hidden="true" />
                </span>
                <p className="mt-3 text-[16px] font-extrabold text-ink break-keep">{title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2 break-keep">{desc}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* this week, for families linked to an academy */}
      {linked && user?.classId && (
        <>
          <section className="mt-8 rounded-md bg-surface px-4 pt-4 pb-5 ring-1 ring-inset ring-rule sm:px-6">
            <h2 className="text-[15px] font-bold text-ink">
              {user?.schoolName || (ko ? '이번 주' : 'This week')}
            </h2>
            <LoopStrip stops={stops} language={language} className="mt-5" />
          </section>
          <div className="mt-4">
            <ParentClassLogs
              classId={user.classId}
              studentUid={user.uid}
              studentName={user.studentName}
              language={language}
              max={1}
            />
          </div>
        </>
      )}
    </div>
  );
};
