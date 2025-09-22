import React from 'react';
import { Pool } from '../types';
import { formatNumber } from '../utils/formatters';

interface PoolCardProps {
    pool: Pool;
    onViewDetails: (poolId: string) => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ pool, onViewDetails }) => {
    const handleAddLiquidity = () => {
        window.open(`https://app.meteora.ag/dlmm/${pool.id}`, '_blank');
    };

    return (
        <div className="glass-pane rounded-lg p-4 flex flex-col justify-between transition hover:border-sky-500/50">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-lg font-semibold text-white">{pool.pair}</p>
                        <p className="text-xs text-slate-400">Score: <span className="font-mono text-sky-300">{pool.score.toFixed(4)}</span></p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mb-4 text-center">
                    <div><p className="text-slate-400 text-xs">TVL</p><p className="font-medium text-slate-50">${formatNumber(pool.tvl)}</p></div>
                    <div><p className="text-slate-400 text-xs">24h Vol</p><p className="font-medium text-slate-50">${formatNumber(pool.volume24h)}</p></div>
                    <div><p className="text-slate-400 text-xs">Fee APR</p><p className="font-medium text-green-400">{(pool.fee_apr_est * 100).toFixed(2)}%</p></div>
                </div>
                <div className="flex items-center text-sm mb-4 bg-slate-900/50 rounded-md p-2 gap-3">
                    <div className="text-center min-w-[90px]"><p className="text-slate-400 text-xs">In-Range (7d)</p><p className="font-medium text-slate-50">{(pool.in_range_ratio_7d * 100).toFixed(1)}%</p></div>
                    <div className="flex-1">
                        <p className="text-slate-400 text-xs mb-1">Bin Distribution</p>
                        <div className="flex items-end h-6 w-full gap-0.5" aria-hidden="true">
                            {pool.bins.map((h, i) => (
                                <div 
                                    key={i} 
                                    className={`flex-1 transition-colors ${i === pool.current_price_bin ? 'bg-amber-500' : 'bg-sky-500/50'}`} 
                                    style={{ height: `${Math.max(5, (h / Math.max(...pool.bins)) * 100)}%` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={handleAddLiquidity} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition text-sm" aria-label="Add Liquidity">Add Liquidity</button>
                <button onClick={() => onViewDetails(pool.id)} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg transition text-sm" aria-label="View Details">View Details</button>
            </div>
        </div>
    );
};

export default PoolCard;
