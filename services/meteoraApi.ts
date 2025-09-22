import { Pool } from '../types';
import { mockApiPools } from './mockData';

const API_ENDPOINTS = [
    'https://dlmm-api.meteora.ag/pair/all',
    'https://dlmm-api.meteora.ag/api/pairs/all',
    'https://dlmm-api.meteora.ag/api/pairs',
];
const MAJOR_TOKENS = ['SOL', 'USDC', 'USDT'];

// Interface for the raw pool data from Meteora's API
export interface ApiPool {
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

type Path = string | (string | number)[];

// Helper to get the first non-nullish value from a set of potential keys/paths
const getFirstAvailable = (source: Record<string, any>, paths: Path[]): unknown => {
    for (const path of paths) {
        let value: unknown = source;
        if (Array.isArray(path)) {
            for (const key of path) {
                if (value == null || typeof value !== 'object') {
                    value = undefined;
                    break;
                }
                value = (value as Record<string, unknown>)[key as string];
            }
        } else {
            value = source[path];
        }
        if (value !== undefined && value !== null) {
            return value;
        }
    }
    return undefined;
};

const toNumber = (value: unknown, defaultValue = 0): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : defaultValue;
    }
    if (typeof value === 'bigint') {
        return Number(value);
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9+\-\.eE]/g, '');
        if (!cleaned) return defaultValue;
        const parsed = Number(cleaned);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    }
    return defaultValue;
};

const pickNumber = (source: Record<string, any>, paths: Path[], defaultValue = 0): number => {
    const candidate = getFirstAvailable(source, paths);
    if (candidate === undefined || candidate === null) return defaultValue;
    return toNumber(candidate, defaultValue);
};

const pickString = (source: Record<string, any>, paths: Path[]): string | undefined => {
    const candidate = getFirstAvailable(source, paths);
    if (candidate === undefined || candidate === null) return undefined;
    const value = String(candidate).trim();
    return value ? value : undefined;
};

const pickDateString = (source: Record<string, any>, paths: Path[]): string | undefined => {
    const candidate = pickString(source, paths);
    if (!candidate) return undefined;
    const timestamp = Date.parse(candidate);
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
};

const normalizeLiquidityDistribution = (raw: unknown): ApiPool['liquidity_distribution'] | undefined => {
    if (!raw || typeof raw !== 'object') return undefined;

    const result: ApiPool['liquidity_distribution'] = {};

    const assignEntry = (binId: string, entry: any) => {
        if (!entry || typeof entry !== 'object') return;
        const amountX = toNumber(entry.amount_x ?? entry.amountX ?? entry.x ?? entry.reserve_x ?? entry.reserveX, 0);
        const amountY = toNumber(entry.amount_y ?? entry.amountY ?? entry.y ?? entry.reserve_y ?? entry.reserveY, 0);
        const price = toNumber(entry.price ?? entry.bin_price ?? entry.midPrice ?? entry.binPrice, 0);
        result[binId] = { amount_x: amountX, amount_y: amountY, price };
    };

    if (Array.isArray(raw)) {
        raw.forEach((entry: any) => {
            const binId = pickNumber(entry ?? {}, ['bin_id', 'binId', 'id'], NaN);
            if (Number.isNaN(binId)) return;
            assignEntry(String(binId), entry);
        });
    } else {
        Object.entries(raw).forEach(([binId, entry]) => assignEntry(binId, entry));
    }

    return Object.keys(result).length ? result : undefined;
};

const normalizeApiPool = (raw: Record<string, any>): ApiPool | null => {
    const tokenXSymbol = pickString(raw, [
        'token_x_symbol',
        'tokenXSymbol',
        ['token_x', 'symbol'],
        ['tokenX', 'symbol'],
        ['token_a', 'symbol'],
        ['tokenA', 'symbol'],
        ['token0', 'symbol'],
    ]);

    const tokenYSymbol = pickString(raw, [
        'token_y_symbol',
        'tokenYSymbol',
        ['token_y', 'symbol'],
        ['tokenY', 'symbol'],
        ['token_b', 'symbol'],
        ['tokenB', 'symbol'],
        ['token1', 'symbol'],
    ]);

    const address = pickString(raw, ['address', 'public_key', 'publicKey', 'id', 'pair_id', 'pairId', 'pool_address', 'poolAddress']);
    if (!tokenXSymbol || !tokenYSymbol || !address) {
        return null;
    }

    const name = pickString(raw, ['name', 'pair_name', 'pairName', 'label']) ?? `${tokenXSymbol} / ${tokenYSymbol}`;

    const liquidity = pickNumber(raw, [
        'liquidity',
        'liquidity_usd',
        'tvl',
        'tvl_usd',
        'total_value_locked',
        ['stats', 'tvl_usd'],
        ['metrics', 'tvl_usd'],
    ], 0);

    const volume24h = pickNumber(raw, [
        'volume_24h',
        'volume24h',
        'volume_24h_usd',
        ['volume', '24h'],
        ['volume', 'day'],
        ['stats', 'volume_24h'],
        ['metrics', 'volume_24h'],
    ], 0);

    const volume7d = pickNumber(raw, [
        'volume_7d',
        'volume7d',
        'volume_7d_usd',
        ['volume', '7d'],
        ['volume', 'week'],
        ['stats', 'volume_7d'],
        ['metrics', 'volume_7d'],
    ], 0);

    const feeApr24h = pickNumber(raw, [
        'fee_apr_24h',
        'fee_apr',
        'feeApr24h',
        ['apr', 'fee_24h'],
        ['stats', 'fee_apr_24h'],
        ['metrics', 'fee_apr_24h'],
    ], 0);

    const binStepRaw = pickNumber(raw, [
        'bin_step',
        'binStep',
        'step',
        'price_tick',
        'priceTick',
        ['stats', 'bin_step'],
    ], 0);
    const bin_step = Math.max(1, binStepRaw);

    const current_bin_id = Math.round(pickNumber(raw, [
        'current_bin_id',
        'currentBinId',
        'current_bin',
        'currentBin',
        'current_price_bin_id',
        ['stats', 'current_bin_id'],
    ], 0));

    const liquidity_distribution = normalizeLiquidityDistribution(
        getFirstAvailable(raw, [
            'liquidity_distribution',
            'liquidityDistribution',
            ['stats', 'liquidity_distribution'],
            ['metrics', 'liquidity_distribution'],
        ])
    );

    const created_at = pickDateString(raw, ['created_at', 'createdAt', 'launch_at', 'launched_at']);

    return {
        address,
        name,
        token_x_symbol: tokenXSymbol,
        token_y_symbol: tokenYSymbol,
        liquidity,
        volume_24h: volume24h,
        volume_7d: volume7d,
        fee_apr_24h: feeApr24h,
        bin_step,
        liquidity_distribution,
        current_bin_id,
        created_at,
    };
};

// Helper to check if a token symbol is a major token
const isMajorToken = (symbol: string) => MAJOR_TOKENS.includes(symbol.toUpperCase());

const POSSIBLE_COLLECTION_KEYS = ['data', 'pairs', 'items', 'results', 'records', 'pools'];

const extractPoolArray = (payload: unknown): Record<string, any>[] => {
    if (Array.isArray(payload)) {
        return payload as Record<string, any>[];
    }
    if (payload && typeof payload === 'object') {
        for (const key of POSSIBLE_COLLECTION_KEYS) {
            const nested = (payload as Record<string, unknown>)[key];
            const extracted = extractPoolArray(nested);
            if (extracted.length > 0) {
                return extracted;
            }
        }
    }
    return [];
};

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
    const errors: Error[] = [];

    for (const endpoint of API_ENDPOINTS) {
        try {
            const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const payload = await response.json();
            const rawPools = extractPoolArray(payload);
            if (!rawPools.length) {
                throw new Error('Received an empty response from Meteora API');
            }

            const normalized = rawPools
                .map(raw => normalizeApiPool(raw))
                .filter((pool): pool is ApiPool => Boolean(pool));

            if (!normalized.length) {
                throw new Error('Unable to normalize Meteora API response');
            }

            return normalized
                .filter(p => p.liquidity > 1000 && p.volume_24h > 100 && p.bin_step)
                .map(transformApiPool);
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            errors.push(err);
            console.warn(`Failed to fetch pools from ${endpoint}:`, err.message);
        }
    }

    console.error('All Meteora API endpoints failed. Falling back to bundled mock data.', errors);

    return mockApiPools
        .filter(p => p.liquidity > 1000 && p.volume_24h > 100 && p.bin_step)
        .map(transformApiPool);
}
