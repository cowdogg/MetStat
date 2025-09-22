
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pool, Weights, AppStatus, Tab, TABS, ConsoleLog } from './types';
import { fetchPools } from './services/meteoraApi';
import Header from './components/Header';
import StatusIndicator from './components/StatusIndicator';
import Controls from './components/Controls';
import AdvancedPanel from './components/AdvancedPanel';
import Tabs from './components/Tabs';
import PoolList from './components/PoolList';
import PoolModal from './components/PoolModal';
import Console from './components/Console';

const App: React.FC = () => {
    // FIX: Changed state to hold pools without score, as score is a derived property.
    // This aligns with the data from `fetchPools` and resolves the type error.
    const [pools, setPools] = useState<Omit<Pool, 'score'>[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.INITIALIZING);
    const [error, setError] = useState<string | null>(null);
    
    const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState<boolean>(false);
    const [weights, setWeights] = useState<Weights>({
        fee_apr: 0.6,
        depth: 0.4,
        in_range: 0.0,
        volatility_fit: 0.0,
        rug_risk: 0.0,
    });
    const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
    const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
    const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);

    // Hook into console methods to display logs in the UI
    useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const formatMessage = (args: any[]): string => {
            return args.map(arg => {
                if (typeof arg === 'object' && arg !== null) {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return '[Unserializable Object]';
                    }
                }
                return String(arg);
            }).join(' ');
        };

        const addLog = (type: 'log' | 'warn' | 'error', message: string) => {
            setConsoleLogs(prevLogs => {
                const newLog = {
                    type,
                    message,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                };
                // Keep the log array from getting excessively large
                const MAX_LOGS = 200;
                const newLogs = [...prevLogs, newLog];
                return newLogs.slice(Math.max(newLogs.length - MAX_LOGS, 0));
            });
        };

        console.log = (...args: any[]) => {
            originalLog.apply(console, args);
            addLog('log', formatMessage(args));
        };
        console.warn = (...args: any[]) => {
            originalWarn.apply(console, args);
            addLog('warn', formatMessage(args));
        };
        console.error = (...args: any[]) => {
            originalError.apply(console, args);
            addLog('error', formatMessage(args));
        };

        console.log("App Initialized. Console is hooked.");

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    // FIX: Updated `pool` parameter type to `Omit<Pool, 'score'>` because the score is calculated from properties
    // that don't include the score itself. This makes the function more accurate and reusable.
    const calculateScore = useCallback((pool: Omit<Pool, 'score'>): number => {
        // Simple 2-factor scoring (normalized-ish)
        const feeScore = (Math.min(pool.fee_apr_est, 2.0) / 2.0) * weights.fee_apr;
        const depthScore = (pool.depth_score / 20) * weights.depth;
        return feeScore + depthScore;
    }, [weights]);

    useEffect(() => {
        const loadPools = async () => {
            try {
                setError(null);
                setAppStatus(AppStatus.INITIALIZING);
                const livePools = await fetchPools();
                setPools(livePools);
                setAppStatus(AppStatus.READY);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch pool data from Meteora API.');
                setAppStatus(AppStatus.ERROR);
            } finally {
                setIsLoading(false);
            }
        };

        loadPools();
    }, []);

    const filteredAndSortedPools = useMemo(() => {
        if (isLoading) return [];
        
        const scoredPools = pools.map(pool => ({
            ...pool,
            score: calculateScore(pool),
        }));

        let tabFiltered = scoredPools;
        if (activeTab === 'Stable-ish') tabFiltered = scoredPools.filter(p => p.isStable);
        else if (activeTab === 'Majors') tabFiltered = scoredPools.filter(p => p.isMajor);
        else if (activeTab === 'New') tabFiltered = scoredPools.filter(p => p.isNew);

        const term = searchTerm.toLowerCase().trim();
        let searchFiltered = tabFiltered;
        if (term) {
            searchFiltered = tabFiltered.filter(p => 
                p.pair.toLowerCase().includes(term) || 
                p.id.toLowerCase().includes(term)
            );
        }

        return searchFiltered.sort((a, b) => b.score - a.score);
    }, [pools, isLoading, activeTab, searchTerm, calculateScore]);

    const handleWeightChange = (key: keyof Weights, value: number) => {
        setWeights(prev => ({ ...prev, [key]: value }));
    };

    const handleViewDetails = (poolId: string) => {
        const pool = pools.find(p => p.id === poolId);
        if (pool) {
            setSelectedPool({ ...pool, score: calculateScore(pool) });
        }
    };
    
    const closeModal = () => {
        setSelectedPool(null);
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Header onToggleConsole={() => setIsConsoleOpen(!isConsoleOpen)} />
            <main className="glass-pane rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-white">Meteora DLMM Pool Analyzer</h2>
                    <StatusIndicator status={appStatus} />
                </div>
                <Controls 
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdvancedToggle={() => setIsAdvancedPanelOpen(!isAdvancedPanelOpen)}
                    isAdvancedOpen={isAdvancedPanelOpen}
                />
                {isAdvancedPanelOpen && (
                    <AdvancedPanel weights={weights} onWeightChange={handleWeightChange} />
                )}
                <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
                <PoolList 
                    pools={filteredAndSortedPools}
                    isLoading={isLoading}
                    error={error}
                    onViewDetails={handleViewDetails}
                />
            </main>
            {selectedPool && <PoolModal pool={selectedPool} onClose={closeModal} />}
            <Console 
                isOpen={isConsoleOpen}
                onClose={() => setIsConsoleOpen(false)}
                onClear={() => setConsoleLogs([])}
                logs={consoleLogs}
            />
        </div>
    );
};

export default App;
