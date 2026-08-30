import { useState, useRef, useEffect } from 'react';
import { Bell, X } from '@phosphor-icons/react';
import { AppNotification } from '../../hooks/useNotifications';

interface NotificationBellProps {
  isNight: boolean;
  isKo: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

function timeAgo(iso: string, isKo: boolean): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return isKo ? '방금' : 'just now';
  if (mins < 60) return isKo ? `${mins}분 전` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isKo ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isKo ? `${days}일 전` : `${days}d ago`;
}

export function NotificationBell({
  isNight,
  isKo,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const opening = !isOpen;
          setIsOpen(opening);
          if (opening && unreadCount > 0) onMarkAllRead();
        }}
        aria-label={isKo ? '알림' : 'Notifications'}
        className={`relative min-w-11 min-h-11 flex items-center justify-center border rounded-xl transition-all cursor-pointer active:scale-[0.96] ${
          isNight
            ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
        }`}
        title={isKo ? '알림' : 'Notifications'}
      >
        <Bell size={16} weight="bold" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-black text-[10px] font-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 max-h-[70vh] sm:max-h-96 overflow-y-auto rounded-xl border shadow-xl z-50 ${
            isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'
          }`}
        >
          <div
            className={`flex items-center justify-between px-4 py-3 border-b text-xs font-black uppercase tracking-wide ${isNight ? 'border-white/10 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}
          >
            {isKo ? '알림' : 'Notifications'}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={isKo ? '닫기' : 'Close'}
              className="min-w-8 min-h-8 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div
              className={`px-4 py-8 text-center text-sm ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}
            >
              {isKo ? '알림이 없습니다' : 'No notifications yet'}
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onMarkRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer ${
                  isNight ? 'border-white/5 hover:bg-white/5' : 'border-zinc-100 hover:bg-zinc-50'
                } ${!n.read ? (isNight ? 'bg-orange-500/5' : 'bg-orange-50') : ''}`}
              >
                <div className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {n.title}
                </div>
                <div className={`text-xs mt-0.5 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {n.body}
                </div>
                <div className={`text-[10px] mt-1 ${isNight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  {timeAgo(n.createdAt, isKo)}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
