import React from 'react';
import { X, Sparkle } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useToast } from '../../contexts/ToastContext';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

interface Props {
  isThemeNight: boolean;
  isKo: boolean;
  tempLogoUrl: string;
  setTempLogoUrl: (url: string) => void;
  setAcademyLogo: (url: string) => void;
  onClose: () => void;
}

export const AcademyLogoModal: React.FC<Props> = ({
  isThemeNight,
  isKo,
  tempLogoUrl,
  setTempLogoUrl,
  setAcademyLogo,
  onClose,
}) => {
  const [fileError, setFileError] = React.useState<string | null>(null);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });
  const { showToast } = useToast();

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="academy-logo-title"
        tabIndex={-1}
        className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-md mx-4 animate-fade-in text-left ${
        isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
      }`}>
        <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-8 transition-colors ${
          isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
        }`}>
          <button
            type="button"
            onClick={onClose}
            aria-label={isKo ? '닫기' : 'Close'}
            className={`absolute top-6 right-6 min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
            }`}
          >
            <X size={18} weight="bold" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
              <Sparkle size={22} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                {isKo ? '맞춤 브랜드 설정' : 'ACADEMY BRANDING'}
              </span>
              <h3 id="academy-logo-title" className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? '학원 맞춤 로고 등록' : 'Custom Academy Logo'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {isKo
              ? '등록된 학원 로고는 모든 학부모 성적표 리포트 및 인쇄용 오답 학습지에 맞춤 헤더로 삽입됩니다.'
              : 'Your custom logo will be featured on all parent progress reports and printed worksheets.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                localStorage.setItem('chekki_academy_logo', tempLogoUrl);
              } catch (err) {
                console.error('Failed to save academy logo:', err);
                setFileError(
                  isKo
                    ? '로고 저장에 실패했습니다. 이미지 용량을 줄이거나 URL을 사용해주세요.'
                    : "Couldn't save that logo — try a smaller image or a URL instead."
                );
                return;
              }
              setAcademyLogo(tempLogoUrl);
              onClose();
              showToast({ type: 'success', message: isKo ? '학원 맞춤 로고가 저장되었습니다!' : 'Custom Academy Logo saved!' });
            }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                {isKo ? '학원 로고 이미지 등록 (파일 선택 또는 URL)' : 'Academy Brand Logo (File or URL)'}
              </label>

              {/* File Upload Zone */}
              <label className={`block cursor-pointer p-4 border-2 border-dashed rounded-2xl text-center transition-all ${
                isThemeNight ? 'border-white/10 hover:border-orange-500/50 bg-[#050505]' : 'border-zinc-300 hover:border-orange-500/50 bg-zinc-50'
              }`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > MAX_LOGO_BYTES) {
                      setFileError(
                        isKo
                          ? '파일이 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.'
                          : 'That file is too large. Please choose an image under 5MB.'
                      );
                      e.target.value = '';
                      return;
                    }
                    setFileError(null);
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const res = evt.target?.result as string;
                      if (res) setTempLogoUrl(res);
                    };
                    reader.onerror = () => {
                      setFileError(
                        isKo ? '이미지를 불러오지 못했습니다. 다시 시도해주세요.' : 'Could not read that image. Please try again.'
                      );
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-2xl">🖼️</span>
                  <p className={`text-xs font-bold ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '내 컴퓨터에서 로고 이미지 파일 선택' : 'Click to Upload Logo Image File'}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {isKo ? 'PNG (투명 배경 권장), JPG, SVG, WEBP (최대 5MB)' : 'PNG (transparent), JPG, SVG, WEBP (Max 5MB)'}
                  </p>
                </div>
              </label>

              {fileError && (
                <p role="alert" className="text-[11px] text-red-500 font-bold px-1">
                  {fileError}
                </p>
              )}

              <div className="flex items-center gap-2 my-1">
                <div className={`h-[1px] flex-1 ${isThemeNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">{isKo ? '또는 URL 직접 입력' : 'OR PASTE IMAGE URL'}</span>
                <div className={`h-[1px] flex-1 ${isThemeNight ? 'bg-white/10' : 'bg-zinc-200'}`} />
              </div>

              <label htmlFor="academy-logo-url" className="sr-only">
                {isKo ? '로고 이미지 URL' : 'Logo image URL'}
              </label>
              <input
                id="academy-logo-url"
                type="url"
                value={tempLogoUrl}
                onChange={(e) => setTempLogoUrl(e.target.value)}
                placeholder="https://example.com/school-logo.png"
                className={`w-full border outline-none text-xs p-3.5 rounded-2xl transition-all font-mono ${
                  isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>

            {tempLogoUrl && (
              <div className={`p-4 border rounded-2xl flex items-center gap-3 ${
                isThemeNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <img src={tempLogoUrl} alt="Preview" className="w-12 h-12 rounded-xl object-contain bg-white/10 border border-white/10" />
                <div>
                  <p className={`text-xs font-bold ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? '미리보기' : 'Logo Preview'}</p>
                  <p className="text-[10px] text-emerald-500">{isKo ? '성적표 헤더에 적용됨' : 'Ready for report cards'}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setTempLogoUrl('');
                  setAcademyLogo('');
                  localStorage.removeItem('chekki_academy_logo');
                  onClose();
                }}
                className="w-1/3 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs rounded-2xl border border-red-500/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                {isKo ? '로고 초기화' : 'Remove Logo'}
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                {isKo ? '로고 저장하기' : 'Save Logo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
