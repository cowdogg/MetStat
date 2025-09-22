import { Pool } from '../types';

const API_ENDPOINT = 'https://dlmm-api.meteora.ag/pair/all';
const MAJOR_TOKENS = ['SOL', 'USDC', 'USDT'];

// Interface for the raw pool data from Meteora's API
interface ApiPool {
    address: string;
    name: string;
    token_x_symbol: string;
    token_y_symbol: string;
    liquidity: number; // TVL
    volume_24h: number;
    volume_7d: number;
    fee_apr_24h: number;
    bin_step: number;
    // The API provides bins as an object, we need to convert it
    liquidity_distribution: { [bin_id: string]: { amount_x: number; amount_y: number; price: number } };
    current_bin_id: number;
    // Assuming 'is_new' could be part of the API, otherwise we'll calculate it
    created_at?: string; 
}

// Helper to check if a token symbol is a major token
const isMajorToken = (symbol: string) => MAJOR_TOKENS.includes(symbol.toUpperCase());

// Adapter function to transform API data into our app's Pool format
const transformApiPool = (apiPool: ApiPool): Omit<Pool, 'score'> => {
    const pair = `${apiPool.token_x_symbol} / ${apiPool.token_y_symbol}`;
    const tvl = apiPool.liquidity || 0;
    
    // Convert liquidity distribution from object to an ordered array
    const binEntries = Object.entries(apiPool.liquidity_distribution)
        .map(([binId, data]) => ({ binId: parseInt(binId), ...data }))
        .sort((a, b) => a.binId - b.binId);

    const bins = binEntries.map(b => b.amount_x + b.amount_y); // Simple sum for visualization, could be improved
    const currentPriceBinIndex = binEntries.findIndex(b => b.binId === apiPool.current_bin_id);

    const isNew = apiPool.created_at ? (new Date().getTime() - new Date(apiPool.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
    
    return {
        id: apiPool.address,
        pair,
        isStable: apiPool.name.toLowerCase().includes('stable'),
        isMajor: isMajorToken(apiPool.token_x_symbol) || isMajorToken(apiPool.token_y_symbol),
        isNew,
        tvl,
        volume24h: apiPool.volume_24h || 0,
        volume7d: apiPool.volume_7d || 0,
        fee_apr_est: (apiPool.fee_apr_24h || 0) / 100, // API provides APR as percentage
        depth_score: Math.log(tvl + 1),
        bin_step: apiPool.bin_step,
        bins: bins.length > 5 ? bins : Array(20).fill(0), // Pad with zeros if not enough bin data
        current_price_bin: currentPriceBinIndex !== -1 ? currentPriceBinIndex : Math.floor(bins.length / 2),
        
        // These are not available from the API, so we provide sensible defaults
        in_range_ratio_7d: 0.85, // Placeholder value
        volatility_fit: 0.5,     // Placeholder value
        rug_risk_penalty: 0,     // Placeholder value
    };
};

export async function fetchPools(): Promise<Omit<Pool, 'score'>[]> {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    const data: ApiPool[] = await response.json();
    
    // Filter out pools with insufficient data and transform the rest
    return data
        .filter(p => p.liquidity > 1000 && p.volume_24h > 100)
        .map(transformApiPool);
}
