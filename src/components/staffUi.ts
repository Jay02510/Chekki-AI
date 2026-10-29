// Shared class strings for the staff dashboards' warm-token screens (see
// DESIGN.md "Staff dashboards"). TeacherPage puts .dark/.theme-light on body,
// so these follow the dashboard's own theme toggle.

export const staffUi = {
  page: 'mx-auto max-w-5xl text-left text-ink',
  h2: 'text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]',
  h3: 'text-[20px] font-extrabold tracking-[-0.01em]',
  sub: 'text-[14px] text-ink-3',
  label: 'mb-1 block text-[13px] font-bold text-ink-3',
  field:
    'min-h-11 w-full rounded-md bg-surface px-3 text-[16px] text-ink outline-none ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:ring-2 focus:ring-line',
  primaryBtn:
    'btn-press inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md bg-line px-5 text-[15px] font-extrabold text-on-line disabled:cursor-not-allowed disabled:opacity-50',
  quietBtn:
    'btn-press inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-[14px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3 disabled:cursor-not-allowed disabled:opacity-50',
  iconBtn:
    'btn-press inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-2 hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50',
  dangerText: 'cursor-pointer text-[14px] font-bold text-wrong hover:underline disabled:opacity-50',
  rows: 'divide-y divide-rule border-y border-rule',
  th: 'whitespace-nowrap py-2.5 pr-3 text-[13px] font-bold text-ink-3',
  notice: 'rounded-lg bg-surface p-4 text-[14px] font-semibold text-ink-2 ring-1 ring-inset ring-rule',
  pill: {
    neutral: 'inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-bold text-ink-2 ring-1 ring-inset ring-rule',
    warm: 'inline-block whitespace-nowrap rounded-md bg-line-soft px-2 py-0.5 text-[13px] font-bold text-line-ink',
    good: 'inline-block whitespace-nowrap rounded-md bg-right-soft px-2 py-0.5 text-[13px] font-bold text-correct',
  },
};

export const msgTone = (type: 'error' | 'success' | string) =>
  `text-[14px] font-bold ${type === 'error' ? 'text-wrong' : 'text-correct'}`;

// Class levels are stored in English (CreateClassModal's option values).
const LEVEL_KO: Record<string, string> = {
  '5-year-old': '5세반',
  '6-year-old': '6세반',
  '7-year-old': '7세반',
  'Elementary Grade 1': '초등 1학년',
  'Elementary Grade 2': '초등 2학년',
};
export const levelLabel = (level: string | undefined, isKo: boolean) => (level && isKo ? LEVEL_KO[level] || level : level || '');
