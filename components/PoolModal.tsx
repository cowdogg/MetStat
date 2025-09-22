import React, { useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Pool } from '../types';
import { formatNumber } from '../utils/formatters';
import CloseIcon from './icons/CloseIcon';
import WarningIcon from './icons/WarningIcon';

interface PoolModalProps {
    pool: Pool;
    onClose: () => void;
}

const PoolModal: React.FC<PoolModalProps> = ({ pool, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const chartData = pool.bins.map((value, index) => ({
        name: `Bin ${index + 1}`,
        liquidity: value,
        isCurrent: index === pool.current_price_bin,
    }));
    
    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto modal-backdrop flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div ref={modalRef} className="glass-pane rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="p-6">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                        <div>
                            <h3 id="modal-title" className="text-2xl font-bold text-white">{pool.pair}</h3>
                            <p className="text-slate-400 text-xs break-all">{pool.id}</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition flex-shrink-0 ml-4" aria-label="Close">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900/50 p-4 rounded-lg min-h-[250px]">
                            <h4 className="font-semibold mb-2 text-white">Bin Liquidity</h4>
                             <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value, index) => (index % 3 === 0 || chartData[index].isCurrent) ? value : ''} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} labelStyle={{ color: '#cbd5e1' }} itemStyle={{ color: '#7dd3fc' }} />
                                    <Bar dataKey="liquidity" barSize={20}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#f59e0b' : '#38bdf8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                <div className="glass-pane rounded-md p-3 text-center"><p className="text-xs text-slate-400">TVL</p><p className="text-lg font-semibold text-white">${formatNumber(pool.tvl)}</p></div>
                                <div className="glass-pane rounded-md p-3 text-center"><p className="text-xs text-slate-400">Fee APR</p><p className="text-lg font-semibold text-green-400">${(pool.fee_apr_est * 100).toFixed(2)}%</p></div>
                                <div className="glass-pane rounded-md p-3 text-center"><p className="text-xs text-slate-400">Bin Step</p><p className="text-lg font-semibold text-white">{pool.bin_step}</p></div>
                                <div className="glass-pane rounded-md p-3 text-center col-span-2 sm:col-span-3"><p className="text-xs text-slate-400">7d Vol</p><p className="text-lg font-semibold text-white">$${formatNumber(pool.volume7d)}</p></div>
                            </div>
                            <div className="border border-slate-700 p-4 rounded-lg">
                                <h4 className="font-semibold mb-3 text-amber-400 flex items-center">
                                    <WarningIcon className="w-5 h-5 mr-2" />
                                    Risk Analysis (Estimated)
                                </h4>
                                <div className="text-sm space-y-2">
                                     <p className="text-slate-400 text-xs">Note: Advanced risk metrics are not available via the public API in this version.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoolModal;
