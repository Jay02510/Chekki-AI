import React, { useState, useEffect } from 'react';

interface LogItem {
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

const globalLogs: LogItem[] = [];
const listeners = new Set<() => void>();

const formatArg = (arg: any): string => {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (arg instanceof Error) {
    const errorDetails: Record<string, any> = {};
    for (const key of Object.getOwnPropertyNames(arg)) {
      errorDetails[key] = (arg as any)[key];
    }
    return JSON.stringify(errorDetails, null, 2);
  }
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(
        arg,
        (key, value) => {
          if (value instanceof Error) {
            const errObj: Record<string, any> = {};
            for (const k of Object.getOwnPropertyNames(value)) {
              errObj[k] = (value as any)[k];
            }
            return errObj;
          }
          return value;
        },
        2
      );
    } catch (e) {
      return `[Unserializable Object: ${String(arg)}]`;
    }
  }
  return String(arg);
};

const addGlobalLog = (type: 'log' | 'warn' | 'error', args: any[]) => {
  const message = args.map((arg) => formatArg(arg)).join(' ');
  const timestamp = new Date().toLocaleTimeString();
  globalLogs.push({ type, message, timestamp });
  if (globalLogs.length > 200) {
    globalLogs.shift();
  }
  listeners.forEach((listener) => listener());
};

// Override console methods immediately in module scope — dev builds only.
// This used to run unconditionally in production, patching console.* for
// every user regardless of the debug-panel visibility flag (audit §16c).
if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    originalLog(...args);
    addGlobalLog('log', args);
  };

  console.warn = (...args) => {
    originalWarn(...args);
    addGlobalLog('warn', args);
  };

  console.error = (...args) => {
    originalError(...args);
    addGlobalLog('error', args);
  };

  window.addEventListener('error', (event) => {
    const errorMsg = event.error ? formatArg(event.error) : event.message;
    addGlobalLog('error', [`[UNCAUGHT EXCEPTION] ${errorMsg}`]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    addGlobalLog('error', [`[UNHANDLED REJECTION]`, event.reason]);
  });
}

export const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    // Only show if explicitly enabled via local storage (hidden by default)
    const hasOverride =
      typeof window !== 'undefined' && localStorage.getItem('chekki_show_debug') === 'true';
    setShowTrigger(hasOverride);

    // Sync initial logs
    setLogs([...globalLogs]);

    const handleLogAdded = () => {
      setLogs([...globalLogs]);
    };

    listeners.add(handleLogAdded);
    return () => {
      listeners.delete(handleLogAdded);
    };
  }, []);

  const clearLogs = () => {
    globalLogs.length = 0;
    setLogs([]);
  };

  if (!showTrigger) return null;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-[9999] bg-red-500 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-40 hover:opacity-100 shadow-lg font-black tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 h-1/2 bg-zinc-950/95 text-zinc-200 font-mono text-[11px] z-[9999] overflow-hidden flex flex-col border-t border-zinc-800 shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5">
        <span className="font-bold text-zinc-400">Debug Console ({logs.length})</span>
        <div className="flex gap-2">
          <button
            onClick={clearLogs}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text selection:bg-orange-500/30 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-zinc-600 italic">No logs recorded yet.</div>
        ) : (
          logs.map((log, i) => {
            let colorClass = 'text-zinc-300';
            if (log.type === 'error') colorClass = 'text-red-400 font-bold';
            else if (log.type === 'warn') colorClass = 'text-amber-400';

            return (
              <div
                key={i}
                className="flex gap-2.5 items-start py-1 border-b border-zinc-900/50 hover:bg-white/5 px-2 rounded-md transition-colors"
              >
                <span className="text-zinc-600 flex-shrink-0">[{log.timestamp}]</span>
                <span
                  className={`${colorClass} whitespace-pre-wrap break-all flex-1 leading-relaxed`}
                >
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
