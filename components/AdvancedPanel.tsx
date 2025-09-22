
import React from 'react';
import { Weights } from '../types';
import { WEIGHT_LABELS } from '../constants';

interface AdvancedPanelProps {
    weights: Weights;
    onWeightChange: (key: keyof Weights, value: number) => void;
}

const AdvancedPanel: React.FC<AdvancedPanelProps> = ({ weights, onWeightChange }) => {
    const disabledSliders: (keyof Weights)[] = ['in_range', 'volatility_fit', 'rug_risk'];

    return (
        <div id="advanced-panel" className="glass-pane rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-4 text-white">Tune Ranking Formula Weights</h3>
            <div id="sliders-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {(Object.keys(weights) as (keyof Weights)[]).map(key => {
                    const isDisabled = disabledSliders.includes(key);
                    return (
                        <div key={key}>
                            <label htmlFor={`${key}-slider`} className={`block text-sm font-medium ${isDisabled ? 'text-slate-500' : 'text-slate-300'} mb-1`}>
                                {WEIGHT_LABELS[key]}
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    id={`${key}-slider`}
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={weights[key]}
                                    onChange={(e) => onWeightChange(key, parseFloat(e.target.value))}
                                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb ${isDisabled ? 'bg-slate-800' : 'bg-slate-700'}`}
                                    disabled={isDisabled}
                                />
                                <span className={`text-sm font-mono w-10 text-right ${isDisabled ? 'text-slate-500' : 'text-sky-400'}`}>
                                    {weights[key].toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">Note: In‑Range, Volatility, and Risk sliders are disabled in the demo.</p>
        </div>
    );
};

export default AdvancedPanel;
