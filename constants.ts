import { Weights } from './types';

export const WEIGHT_LABELS: Record<keyof Weights, string> = {
    fee_apr: 'Fee APR (Est.)',
    depth: 'Depth (TVL)',
    in_range: 'In-Range Ratio',
    volatility_fit: 'Volatility Fit',
    rug_risk: 'Rug Risk',
};
