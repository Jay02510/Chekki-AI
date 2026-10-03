import React from 'react';
import { Tray, Notebook, UsersThree, ClockCounterClockwise, DotsThreeOutline } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  educatorRole: 'ft' | 'kt';
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  /** KT inbox badge — reports waiting for review. */
  pendingCount: number;
  /** Opens the full sidebar drawer for the less-used tabs and settings. */
  onMore: () => void;
}

// Phone-only bottom nav for teachers: the daily tabs one tap away instead of
// behind the hamburger drawer. Everything else (answer key, weekly report,
// settings, logout) stays in the drawer, opened via "More".
export function TeacherMobileTabBar({ isNight, isKo, educatorRole, activeTab, setActiveTab, pendingCount, onMore }: Props) {
  const items: { id: TabId; label: string; Icon: typeof Tray; badge?: number }[] =
    educatorRole === 'kt'
      ? [
          { id: 'kt_script', label: isKo ? '검토함' : 'Inbox', Icon: Tray, badge: pendingCount },
          { id: 'kt_log', label: isKo ? '일지 쓰기' : 'Write log', Icon: Notebook },
          { id: 'overview', label: isKo ? '학급' : 'Class', Icon: UsersThree },
        ]
      : [
          { id: 'overview', label: isKo ? '오늘의 일지' : 'Daily log', Icon: Notebook },
          { id: 'history', label: isKo ? '기록' : 'History', Icon: ClockCounterClockwise },
        ];

  const itemClass = (active: boolean) =>
    `flex-1 min-h-14 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold cursor-pointer transition-colors ${
      active ? 'text-orange-500' : isNight ? 'text-zinc-400' : 'text-zinc-500'
    }`;

  return (
    <nav
      aria-label={isKo ? '주요 메뉴' : 'Main navigation'}
      className={`md:hidden fixed inset-x-0 bottom-0 z-[340] flex border-t pb-[env(safe-area-inset-bottom)] ${
        isNight ? 'bg-brand-card/95 border-white/10' : 'bg-white/95 border-zinc-200'
      } backdrop-blur-md`}
    >
      {items.map(({ id, label, Icon, badge }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            aria-current={active ? 'page' : undefined}
            className={itemClass(active)}
          >
            <span className="relative">
              <Icon size={22} weight={active ? 'fill' : 'regular'} />
              {!!badge && (
                <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-black text-[10px] font-black leading-4 text-center tabular-nums">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            {label}
          </button>
        );
      })}
      <button type="button" onClick={onMore} className={itemClass(false)}>
        <DotsThreeOutline size={22} />
        {isKo ? '더보기' : 'More'}
      </button>
    </nav>
  );
}
