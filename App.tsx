import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Pool, Weights, AppStatus, Tab, TABS } from './types';
import { fetchPools } from './services/meteoraApi';
import Header from './components/Header';
import StatusIndicator from './components/StatusIndicator';
import Controls from './components/Controls';
import AdvancedPanel from './components/AdvancedPanel';
import Tabs from './components/Tabs';
import PoolList from './components/PoolList';
import PoolModal from './components/PoolModal';

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
            <Header />
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
        </div>
    );
};

export default App;