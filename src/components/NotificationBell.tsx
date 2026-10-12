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
        className={`relative min-w-11 min-h-11 flex items-center justify-center border rounded-md transition-[color,background-color,border-color,opacity,transform] cursor-pointer active:scale-[0.96] ${
          'bg-sunken border-rule text-ink-2 hover:text-ink hover:bg-sunken'
        }`}
        title={isKo ? '알림' : 'Notifications'}
      >
        <Bell size={16} weight="bold" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-md bg-line text-on-line text-[12px] font-extrabold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 max-h-[70vh] sm:max-h-96 overflow-y-auto rounded-md border z-50 ${
            'bg-surface border-rule'
          }`}
        >
          <div
            className={`flex items-center justify-between px-4 py-3 border-b text-xs font-extrabold border-rule text-ink-3`}
          >
            {isKo ? '알림' : 'Notifications'}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={isKo ? '닫기' : 'Close'}
              className="min-w-8 min-h-8 flex items-center justify-center rounded-lg hover:bg-sunken cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div
              className={`px-4 py-8 text-center text-sm text-ink-3`}
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
                  'border-rule hover:bg-sunken'
                } ${!n.read ? ('bg-line-soft') : ''}`}
              >
                <div className={`text-sm font-bold text-ink`}>
                  {n.title}
                </div>
                <div className={`text-xs mt-0.5 text-ink-2`}>
                  {n.body}
                </div>
                <div className={`text-[12px] mt-1 text-ink-3`}>
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
