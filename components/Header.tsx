
import React from 'react';
import TerminalIcon from './icons/TerminalIcon';

interface HeaderProps {
    onToggleConsole: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleConsole }) => (
    <header className="mb-6 flex justify-between items-start">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-50">Solana DeFi Playground</h1>
            <p className="text-slate-400 mt-1">Your portal to powerful DeFi analysis tools.</p>
        </div>
        <button 
            onClick={onToggleConsole}
            className="mt-2 ml-4 bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700 text-slate-300 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center space-x-2 flex-shrink-0"
            aria-label="Toggle Developer Console"
        >
            <TerminalIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Console</span>
        </button>
    </header>
);

export default Header;
