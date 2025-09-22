import type { ApiPool } from './meteoraApi';

// A small set of representative pools that mimic the Meteora API response.
// This ensures the UI remains functional when the live API is unavailable
// (for example due to proxy restrictions or upstream downtime).
export const mockApiPools: ApiPool[] = [
    {
        address: '8HuU7VxckbncPmjJWszg7SiZnnJ3CZvJ5EEcweavRG7e',
        name: 'SOL / USDC',
        token_x_symbol: 'SOL',
        token_y_symbol: 'USDC',
        liquidity: 3_250_000,
        volume_24h: 410_000,
        volume_7d: 2_150_000,
        fee_apr_24h: 0.38,
        bin_step: 10,
        liquidity_distribution: undefined,
        current_bin_id: 120,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        address: '93DYAVvaLBznwnUZq8jT3uNchxpzs9fsyv9RPrfJ5YLT',
        name: 'JUP / USDC',
        token_x_symbol: 'JUP',
        token_y_symbol: 'USDC',
        liquidity: 1_850_000,
        volume_24h: 230_000,
        volume_7d: 1_020_000,
        fee_apr_24h: 0.27,
        bin_step: 15,
        liquidity_distribution: undefined,
        current_bin_id: 98,
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        address: '6w9RR8BEWMRo2seD1J2x8Y5YeKMi4g5bdnNGNfo5PsK2',
        name: 'USDT / USDC Stable',
        token_x_symbol: 'USDT',
        token_y_symbol: 'USDC',
        liquidity: 4_650_000,
        volume_24h: 150_000,
        volume_7d: 910_000,
        fee_apr_24h: 0.12,
        bin_step: 1,
        liquidity_distribution: undefined,
        current_bin_id: 64,
        created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
];
