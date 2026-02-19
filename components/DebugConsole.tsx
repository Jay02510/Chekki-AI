
import React, { useState, useEffect } from 'react';

export const DebugConsole: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Override console.log
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog(...args);
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
            setLogs(prev => [`[LOG] ${message}`, ...prev].slice(0, 50));
        };

        // Override console.error
        const originalError = console.error;
        console.error = (...args) => {
            originalError(...args);
            const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
            setLogs(prev => [`[ERR] ${message}`, ...prev].slice(0, 50));
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, []);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 left-4 z-[9999] bg-red-500 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
            >
                Debug
            </button>
        );
    }

    return (
        <div className="fixed inset-x-0 bottom-0 h-1/2 bg-black/90 text-green-400 font-mono text-xs z-[9999] overflow-hidden flex flex-col border-t-2 border-green-500">
            <div className="flex justify-between items-center bg-gray-800 px-2 py-1">
                <span>Debug Console ({logs.length})</span>
                <div className="flex gap-2">
                    <button onClick={() => setLogs([])} className="bg-gray-600 px-2 rounded">Clear</button>
                    <button onClick={() => setIsVisible(false)} className="bg-red-500 text-white px-2 rounded">Close</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className={`break-words ${log.startsWith('[ERR]') ? 'text-red-400' : ''}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};
