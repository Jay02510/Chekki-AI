import React from 'react';
import { X, Calendar } from '@phosphor-icons/react';

interface Props {
  isThemeNight: boolean;
  isKo: boolean;
  selectedClass: { name?: string; activeWeekNumber?: number } | null;
  curriculumTopic: string;
  curriculumVocab: string;
  curriculumPhonics: string;
  onSelectWeek: (weekNum: number) => void;
  onClose: () => void;
}

export const WeekCalendarModal: React.FC<Props> = ({
  isThemeNight,
  isKo,
  selectedClass,
  curriculumTopic,
  curriculumVocab,
  curriculumPhonics,
  onSelectWeek,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-3xl mx-4 animate-fade-in text-left max-h-[90vh] ${
        isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
      }`}>
        <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar transition-colors ${
          isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-6 right-6 p-2 rounded-full transition-all cursor-pointer ${
              isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
            }`}
          >
            <X size={18} weight="bold" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg">
              <Calendar size={24} weight="bold" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                {isKo ? '주차별 커리큘럼 업로드 현황' : 'CURRICULUM UPLOAD CALENDAR'}
              </span>
              <h3 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                {isKo ? `${selectedClass?.name || '학급'} 학기 주차별 캘린더` : `${selectedClass?.name || 'Class'} Weekly Curriculum Schedule`}
              </h3>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {isKo
              ? '각 주차별로 교재 업로드 일시와 등록된 학습 단어를 확인하고 원클릭으로 해당 주차로 이동할 수 있습니다.'
              : 'Check upload timestamps and target topics per week. Click any week to make it active.'}
          </p>

          {/* 12-Week Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((weekNum) => {
              const isActiveWeek = selectedClass?.activeWeekNumber === weekNum;
              const topicName = (weekNum === selectedClass?.activeWeekNumber && curriculumTopic)
                ? curriculumTopic
                : (isKo ? '미등록 주차' : 'No Curriculum Set');
              const wordCount = (weekNum === selectedClass?.activeWeekNumber && curriculumVocab)
                ? curriculumVocab.split(',').filter(Boolean).length
                : 0;
              const hasUpload = wordCount > 0 || (weekNum === selectedClass?.activeWeekNumber && Boolean(curriculumTopic || curriculumVocab || curriculumPhonics));
              const uploadDate = isKo ? '실시간 연동' : 'Live Sync';

              return (
                <div
                  key={weekNum}
                  onClick={() => {
                    onSelectWeek(weekNum);
                    onClose();
                  }}
                  className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all active:scale-[0.97] relative group ${
                    isActiveWeek
                      ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                      : isThemeNight
                        ? 'bg-[#050505] border-white/10 hover:border-white/20 hover:bg-white/5'
                        : 'bg-zinc-50 border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  {isActiveWeek && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-md shadow-xs">
                      {isKo ? '현재 주차' : 'Active'}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-orange-500">
                        Week {weekNum}
                      </span>
                    </div>
                    <h4 className={`text-xs font-bold truncate ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {topicName}
                    </h4>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/5 text-[10px]">
                    {hasUpload ? (
                      <>
                        <div className="flex items-center justify-between text-emerald-500 font-bold">
                          <span>✅ {isKo ? '업로드 완료' : 'Uploaded'}</span>
                          <span className="font-mono">{wordCount} words</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-500 font-mono text-[9px]">
                          <span>📅 {uploadDate}</span>
                          <span className="text-orange-500 font-bold group-hover:underline">
                            {isKo ? '이동 ➔' : 'Jump ➔'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-zinc-500 font-medium">
                        <span>⏳ {isKo ? '미등록 (빈 학습지)' : 'Empty Curriculum'}</span>
                        <span className="text-orange-500 font-bold group-hover:underline">
                          {isKo ? '이동 ➔' : 'Jump ➔'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`mt-6 pt-4 border-t flex justify-end ${isThemeNight ? 'border-white/10' : 'border-zinc-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                isThemeNight ? 'bg-[#050505] text-zinc-300 border-white/10 hover:bg-white/5' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
