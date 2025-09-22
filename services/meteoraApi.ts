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
    // This is no longer in the /pair/all response, so it's optional
    liquidity_distribution?: { [bin_id: string]: { amount_x: number; amount_y: number; price: number } };
    current_bin_id: number;
    created_at?: string; 
}

// Helper to check if a token symbol is a major token
const isMajorToken = (symbol: string) => MAJOR_TOKENS.includes(symbol.toUpperCase());

// Adapter function to transform API data into our app's Pool format
const transformApiPool = (apiPool: ApiPool): Omit<Pool, 'score'> => {
    const pair = `${apiPool.token_x_symbol} / ${apiPool.token_y_symbol}`;
    const tvl = apiPool.liquidity || 0;

    let bins: number[] = [];
    let currentPriceBinIndex: number = -1;

    // The /pair/all endpoint no longer provides liquidity_distribution.
    // We generate mock data for visualization on the cards.
    // A full implementation might fetch this on demand for the modal.
    if (apiPool.liquidity_distribution) {
        // This logic is kept for future use if we fetch detailed pool data
        const binEntries = Object.entries(apiPool.liquidity_distribution)
            .map(([binId, data]) => ({ binId: parseInt(binId), ...data }))
            .sort((a, b) => a.binId - b.binId);

        bins = binEntries.map(b => b.amount_x + b.amount_y);
        currentPriceBinIndex = binEntries.findIndex(b => b.binId === apiPool.current_bin_id);
    } else {
        // Generate mock bin data for the card visualizer
        const NUM_BINS = 20;
        currentPriceBinIndex = Math.floor(NUM_BINS / 2); // Place current price in the middle
        bins = Array(NUM_BINS).fill(0).map((_, i) => {
            const distance = Math.abs(i - currentPriceBinIndex);
            // Create a distribution that peaks at the current price and falls off (Gaussian-like)
            const randomFactor = Math.random() * 0.4 + 0.8; // Add some noise
            const value = 100 * Math.exp(-0.2 * distance * distance) * randomFactor;
            return Math.max(5, value); // Ensure a minimum height for visual
        });
    }
    
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
        fee_apr_est: apiPool.fee_apr_24h || 0, // FIX: API provides APR as a decimal (e.g., 0.05 for 5%)
        depth_score: Math.log(tvl + 1),
        bin_step: apiPool.bin_step,
        bins: bins,
        current_price_bin: currentPriceBinIndex !== -1 ? currentPriceBinIndex : Math.floor(bins.length / 2),
        
        // These are not available from the API, so we provide sensible defaults
        in_range_ratio_7d: 0.85, // Placeholder value
        volatility_fit: 0.5,     // Placeholder value
        rug_risk_penalty: 0,     // Placeholder value
    };
};

export async function fetchPools(): Promise<Omit<Pool, 'score'>[]> {
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const data: ApiPool[] = await response.json();
        
        // Filter out pools with insufficient data and transform the rest
        return data
            .filter(p => p.liquidity > 1000 && p.volume_24h > 100 && p.bin_step)
            .map(transformApiPool);
    } catch (error) {
        console.error("Error fetching or transforming pool data:", error);
        // Re-throw the error to be handled by the calling component
        throw error;
    }
}