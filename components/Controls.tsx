
import React from 'react';
import SearchIcon from './icons/SearchIcon';
import SettingsIcon from './icons/SettingsIcon';

interface ControlsProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAdvancedToggle: () => void;
    isAdvancedOpen: boolean;
}

const Controls: React.FC<ControlsProps> = ({ searchTerm, onSearchChange, onAdvancedToggle, isAdvancedOpen }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
            <input 
                id="search-input" 
                type="text" 
                placeholder="Search by token pair or address…" 
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500 transition" 
                aria-label="Search pools"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        </div>
        <button 
            id="advanced-toggle" 
            onClick={onAdvancedToggle}
            className="w-full md:w-auto md:justify-self-end bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center space-x-2" 
            aria-expanded={isAdvancedOpen}
            aria-controls="advanced-panel"
        >
            <SettingsIcon className="h-5 w-5" />
            <span>Advanced Ranking</span>
        </button>
    </div>
);

export default Controls;
