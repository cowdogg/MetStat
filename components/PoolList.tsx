import React from 'react';
import { Pool } from '../types';
import PoolCard from './PoolCard';
import SpinnerIcon from './icons/SpinnerIcon';
import NoResultsIcon from './icons/NoResultsIcon';
import WarningIcon from './icons/WarningIcon';

interface PoolListProps {
    pools: Pool[];
    isLoading: boolean;
    error: string | null;
    onViewDetails: (poolId: string) => void;
}

const PoolList: React.FC<PoolListProps> = ({ pools, isLoading, error, onViewDetails }) => {
    if (isLoading) {
        return (
            <div className="text-center p-8">
                <SpinnerIcon className="animate-spin h-8 w-8 text-sky-400 mx-auto" />
                <p className="mt-2 text-slate-400">Fetching live data from Meteora...</p>
            </div>
        );
    }

    if (error) {
        return (
             <div className="text-center p-8 glass-pane rounded-lg text-red-300">
                <WarningIcon className="h-12 w-12 text-red-400 mx-auto" />
                <p className="mt-2 font-semibold">An Error Occurred</p>
                <p className="text-slate-400 text-sm">{error}</p>
            </div>
        );
    }

    if (pools.length === 0) {
        return (
            <div className="text-center p-8 glass-pane rounded-lg">
                <NoResultsIcon className="h-12 w-12 text-slate-500 mx-auto" />
                <p className="mt-2 text-slate-300 font-semibold">No Pools Found</p>
                <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {pools.map(pool => (
                <PoolCard key={pool.id} pool={pool} onViewDetails={onViewDetails} />
            ))}
        </div>
    );
};

export default PoolList;
