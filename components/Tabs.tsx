
import React from 'react';
import { Tab } from '../types';

interface TabsProps {
    tabs: readonly Tab[];
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

const TabsComponent: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
    <div className="border-b border-slate-700 mb-4">
        <nav className="flex space-x-4" aria-label="Tabs">
            {tabs.map(tab => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`py-2 px-1 text-sm font-medium ${activeTab === tab ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    {tab}
                </button>
            ))}
        </nav>
    </div>
);

export default TabsComponent;
