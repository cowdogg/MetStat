
import React, { useRef, useEffect } from 'react';
import { ConsoleLog } from '../types';
import CloseIcon from './icons/CloseIcon';

interface ConsoleProps {
    isOpen: boolean;
    onClose: () => void;
    onClear: () => void;
    logs: ConsoleLog[];
}

const Console: React.FC<ConsoleProps> = ({ isOpen, onClose, onClear, logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isOpen && event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const logColor = {
        log: 'text-slate-200',
        warn: 'text-yellow-400',
        error: 'text-red-400',
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-1/2 md:h-1/3 z-50 p-4 pt-0" aria-modal="true" role="dialog">
             <div className="glass-pane rounded-t-xl w-full h-full flex flex-col shadow-2xl">
                 <header className="flex justify-between items-center p-3 border-b border-slate-700 flex-shrink-0">
                    <h3 className="font-semibold text-white">Developer Console</h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={onClear} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-1 px-3 rounded-md transition">
                            Clear
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition" aria-label="Close Console">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                 </header>
                 <div ref={logContainerRef} className="flex-1 overflow-y-auto p-3 font-mono text-sm space-y-1">
                     {logs.map((log, index) => (
                         <div key={index} className="flex gap-3 items-start">
                             <span className="text-slate-500 flex-shrink-0">{log.timestamp}</span>
                             <p className={`${logColor[log.type]} whitespace-pre-wrap break-all`}>{log.message}</p>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );
};

export default Console;
