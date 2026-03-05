# Crypto Flow Radar

## Current State

Full-stack crypto market dashboard. The backend's `fetchDataCycle()` is empty — it never calls any exchange APIs. The backend does expose `getBinanceBTCPrice()` which makes a real HTTP call to Binance and returns the raw JSON string. All other data is currently mock/simulated. The frontend correctly falls back to mock data, but `isLiveData()` always returns false so the header always shows "SIM".

## Requested Changes (Diff)

### Add
- `useLiveBinancePrice` hook in `useBackendData.ts` that calls `actor.getBinanceBTCPrice()` every 30s, parses the JSON string response to extract the numeric price, and returns `{ price: number | null, isLive: boolean }`
- `generateDynamicMockPrices(seed: number)` in mockData.ts that returns time-varying mock values based on a numeric seed — used to make the dashboard update visually each refresh cycle even without real backend data

### Modify
- `useLatestPrices`: when live Binance price is received, use it as Binance's price and derive Bybit (price * 0.99985), Coinbase (price * 1.00012), OKX (price * 0.99972) from it
- `DataSourceBadge` and live status in App.tsx: show green pulsing "LIVE" when `useLiveBinancePrice().isLive` is true (not gated on backend `isLiveData()` flag which never becomes true)
- Dashboard banner: show "Live BTC price from Binance · Derivatives/flow metrics are estimated" when Binance price is live
- `useFundingRates`, `useOpenInterest`, `useLiquidations`, `useVolumeMetrics`: when backend returns empty arrays, use time-seeded dynamic mock data so values visually change on each poll cycle
- `useIsLiveData` poll interval: reduce from 15s to 10s

### Remove
- Nothing removed

## Implementation Plan

1. Add `useLiveBinancePrice()` hook to `useBackendData.ts`:
   - Query key: `["liveBinancePrice"]`
   - Calls `actor.getBinanceBTCPrice()` — returns a string like `{"symbol":"BTCUSDT","price":"67420.50"}`
   - Parse price using a simple regex: `/"price"\s*:\s*"([0-9.]+)"/`
   - Returns `{ price: number | null, isLive: boolean }`
   - `refetchInterval`: 30000ms

2. Update `useLatestPrices` hook to incorporate live price:
   - Import `useLiveBinancePrice` and use its price for Binance when available
   - Derive other exchanges from live price

3. Update `DataSourceBadge` in App.tsx to use `useLiveBinancePrice().isLive`

4. Add `generateDynamicMockValues(seed: number)` to mockData.ts returning varied prices/rates/OI

5. Update data hooks to use time-seeded dynamic mock values when backend is empty

6. Update Dashboard banner message

7. Validate build and deploy
