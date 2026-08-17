import React, { useState } from 'react';
import { ChatCircleDots, PaperPlaneTilt, Sparkle } from '@phosphor-icons/react';
import { askChekkiQuestion, ChatTurn } from '../../services/geminiService';
import { TypingIndicator } from './ui/TypingIndicator';

interface TroubleWord {
  word: string;
  count: number;
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  curriculumTopic: string;
  curriculumPhonics: string;
  curriculumPassage: string;
  curriculumOther: string;
  sortedTroubleWords: TroubleWord[];
}

export const InsightsChatPanel: React.FC<Props> = ({
  isNight = true,
  isKo = false,
  curriculumTopic,
  curriculumPhonics,
  curriculumPassage,
  curriculumOther,
  sortedTroubleWords,
}) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildContext = () =>
    [
      curriculumTopic && `Week theme: ${curriculumTopic}`,
      curriculumPhonics && `Phonics targets: ${curriculumPhonics}`,
      curriculumPassage && `Reading passage: ${curriculumPassage}`,
      curriculumOther && `Other notes: ${curriculumOther}`,
      sortedTroubleWords.length > 0 &&
        `Student mistake counts this week: ${sortedTroubleWords
          .slice(0, 15)
          .map((w) => `${w.word} (${w.count}x)`)
          .join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n');

  const handleSend = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    setError(null);
    setIsLoading(true);
    const nextMessages: ChatTurn[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setQuestion('');
    try {
      const answer = await askChekkiQuestion(trimmed, isKo ? 'ko' : 'en', false, undefined, messages, undefined, buildContext());
      setMessages([...nextMessages, { role: 'model', text: answer }]);
    } catch (err) {
      console.warn('Insights chat: question failed', err);
      setError(
        isKo
          ? '질문에 답하지 못했어요. 다시 시도해 주세요.'
          : "Couldn't get an answer just now — please try again."
      );
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`p-1 rounded-[2.5rem] text-left transition-colors ${
        isNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
      }`}
    >
      <div
        className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 text-left transition-colors ${
          isNight ? 'bg-brand-dark' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
            <ChatCircleDots size={20} weight="bold" />
          </div>
          <div>
            <h4 className={`text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {isKo ? '이번 주 데이터에 대해 질문하기' : 'Ask about this week'}
            </h4>
            <p className="text-[11px] text-zinc-500">
              {isKo
                ? '커리큘럼과 오답 통계를 바탕으로 답변합니다'
                : "Answers using this week's curriculum and mistake data"}
            </p>
          </div>
        </div>

        {(messages.length > 0 || isLoading) && (
          <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto pr-1" aria-live="polite">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                  m.role === 'user'
                    ? `ml-auto ${isNight ? 'bg-orange-500/20 text-orange-100' : 'bg-orange-100 text-orange-900'}`
                    : `${isNight ? 'bg-white/5 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`
                }`}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <TypingIndicator isNight={isNight} label={isKo ? '생각 중…' : 'Thinking…'} />
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400 font-medium mb-2">{error}</p>}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSend();
            }}
            placeholder={isKo ? '예: 이번 주 무엇에 집중해야 할까요?' : 'e.g. What should I focus on this week?'}
            className={`flex-1 p-3 rounded-xl border text-xs outline-none focus:border-orange-500 ${
              isNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
            }`}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={isLoading || !question.trim()}
            className="w-11 h-11 shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label={isKo ? '전송' : 'Send'}
          >
            {isLoading ? (
              <Sparkle size={18} className="animate-spin" />
            ) : (
              <PaperPlaneTilt size={18} weight="fill" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
