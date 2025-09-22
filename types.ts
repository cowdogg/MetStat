
export const TABS = ['Top today', 'Stable-ish', 'Majors', 'New'] as const;

export interface Pool {
    id: string;
    pair: string;
    isStable: boolean;
    isMajor: boolean;
    isNew: boolean;
    tvl: number;
    volume24h: number;
    volume7d: number;
    fee_apr_est: number;
    in_range_ratio_7d: number;
    depth_score: number;
    volatility_fit: number;
    rug_risk_penalty: number;
    bin_step: number;
    bins: number[];
    current_price_bin: number;
    score: number;
}

export interface Weights {
    fee_apr: number;
    depth: number;
    in_range: number;
    volatility_fit: number;
    rug_risk: number;
}

export enum AppStatus {
    INITIALIZING = 'INITIALIZING',
    READY = 'READY',
    ERROR = 'ERROR'
}

export type Tab = typeof TABS[number];

export interface ConsoleLog {
    type: 'log' | 'warn' | 'error';
    message: string;
    timestamp: string;
}
