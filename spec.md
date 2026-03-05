# Crypto Flow Radar — Market Structure Analytics Upgrade

## Current State

The app has a functional 8-section trading dashboard:
- **Dashboard**: BTC price across 4 exchanges, price chart, funding rates, OI, liquidations, liquidity score
- **Exchange Flows**: Netflow chart with per-exchange inflow/outflow bar chart and table
- **Order Book**: Liquidity depth display with imbalance metrics
- **Impulse Detector**: Market impulse event list
- **Leverage Risk**: Funding heatmap, OI chart, liquidation chart
- **Liquidity Score**: Gauge with component breakdown
- **Event Replay**: Event timeline with detail view
- **Alerts**: Custom alert creation and trigger history

**Backend**: Motoko actor with HTTP outcalls component. Has data types for MarketSnapshot, OrderBookDepth, ExchangeFlow, LiquidationEvent, ImpulseEvent, Alert, LiquidityScore. Most `getLiquidityScore()` and `getEventReplay()` return empty/placeholder data. Data fetching cycle exists but `fetchDataCycle` is empty.

**Frontend**: React + TypeScript with Recharts. Mock data used as fallback when backend returns empty. All sections are implemented with mock-first pattern.

## Requested Changes (Diff)

### Add

**Backend Enhancements:**
- `SynchronizedImpulseEvent` type with direction, priceChange, volumeSpike fields
- `NetflowHistory` type storing per-exchange time-series with 1h/6h/24h granularity
- `LiquidationWindow` type: 5min, 15min, 1h aggregation buckets
- `SpreadSnapshot` type: highest/lowest price, spread pct
- `VolumeMetric` type: 1min volume, relative volume vs 60min average
- `DataFreshnessRecord` type: lastUpdated timestamp, source, latency
- Spike detection logic: inflow > rolling 24h mean + 2*stddev => flag "High Exchange Inflow Event"
- Liquidity extraction score computed from 4 real components: funding extremes (0-25), OI increase (0-25), thin order books (0-25), impulse events (0-25)
- Thin Liquidity Warning trigger: 0.5% depth < 60% of 7-day average
- Liquidation spike alert: volume above historical average
- `getNetflowHistory(exchange, window)` query — returns time-series for 1h/6h/24h
- `getLiquidationWindows()` query — returns 5min/15min/1h aggregations
- `getSpreadSnapshot()` query — returns exchange spread data
- `getVolumeMetrics()` query — returns per-exchange volume and relative volume
- `getDataFreshness()` query — returns per-metric freshness records
- `getSynchronizedImpulseEvents(limit)` query — enhanced impulse events with direction and volume spike data
- Real `computeLiquidityScore()` function that calculates score from stored data
- Real `getEventReplay(id)` that returns price, liquidation, and flow data from the 30min window around the event

**New Frontend Panels:**
- **Liquidation Tracker** panel — track long/short/total by 5min/15min/1h windows, highlight clusters, alert on spikes
- **Price Spread Monitor** panel (can be inline in Dashboard or its own section) — highest/lowest exchange price, spread %, highlight >0.3%
- **Volume Spike Indicator** on each exchange card — 1min volume, relative volume vs 60min avg, flag >3x
- **Data Freshness indicators** — last updated timestamp, source exchange, API latency on each card/metric, warning if >60s stale

**Enhanced Panels:**
- **Exchange Netflow Monitor**: Add timeframe selector (1h/6h/24h), spike detection badge ("High Exchange Inflow Event"), alert on large inflows
- **Order Book Liquidity**: Add Thin Liquidity Warning banner when depth < 60% of 7-day avg, show imbalance formula clearly
- **Cross-Exchange Impulse Detector**: Upgrade to "SYNCHRONIZED MARKET IMPULSE" label with direction (buy/sell), exchanges involved, price change %, volume spike metric
- **Liquidity Extraction Score**: Show 4-component breakdown (funding 0-25, OI 0-25, order book 0-25, impulse 0-25), update every 60s
- **Event Replay**: Show price/funding/OI/liquidation/exchange flows for 30min window around selected event

### Modify

- `ExchangeFlows.tsx`: Add timeframe tabs (1h/6h/24h), per-exchange spike detection with 2-stddev logic, "High Exchange Inflow Event" badge
- `OrderBook.tsx`: Add Thin Liquidity Warning component, improve imbalance display
- `ImpulseDetector.tsx`: Rename/upgrade to show SYNCHRONIZED MARKET IMPULSE events with direction, affected exchanges, price change, volume spike
- `LiquidityScoreGauge.tsx`: Use 4-component breakdown (funding/OI/orderBook/impulse), label score ranges (Low/Moderate/Elevated/High Risk)
- `EventReplay.tsx`: Wire up to show real event context data (price, funding, OI, liquidations, flows) for 30min window
- `Dashboard.tsx`: Add Price Spread Monitor row, add volume spike indicators to exchange price cards
- `mockData.ts`: Add mock data for all new types (netflow history, liquidation windows, spread snapshot, volume metrics, data freshness, synchronized impulse events)
- `useBackendData.ts`: Add hooks for all new backend queries
- `backend.d.ts`: Add new type definitions and query methods

### Remove

- Nothing removed — all existing sections preserved

## Implementation Plan

1. **Update Motoko backend** with new types and query functions for:
   - Netflow history with time windows
   - Liquidation windows (5min/15min/1h)
   - Spread snapshot
   - Volume metrics with relative volume
   - Data freshness records
   - Synchronized impulse events with direction/volume spike
   - Real liquidity extraction score computation
   - Real event replay with contextual window data

2. **Extend mockData.ts** with:
   - `MOCK_NETFLOW_HISTORY` per exchange and window
   - `MOCK_LIQUIDATION_WINDOWS` (5min/15min/1h buckets)
   - `MOCK_SPREAD_SNAPSHOT`
   - `MOCK_VOLUME_METRICS` per exchange
   - `MOCK_DATA_FRESHNESS` per metric
   - `MOCK_SYNCHRONIZED_IMPULSE_EVENTS`

3. **Extend useBackendData.ts** with new query hooks

4. **Update/create frontend components**:
   - Upgrade `ExchangeFlows.tsx` with timeframe selector and spike detection
   - Upgrade `OrderBook.tsx` with thin liquidity warning
   - Upgrade `ImpulseDetector.tsx` to show SYNCHRONIZED MARKET IMPULSE events
   - Upgrade `LiquidityScoreGauge.tsx` with proper 4-component score
   - Add `LiquidationTracker.tsx` new panel
   - Add `SpreadMonitor.tsx` inline in Dashboard
   - Add `DataFreshnessBadge.tsx` reusable component
   - Add volume spike indicators to exchange cards in Dashboard
   - Upgrade `EventReplay.tsx` with real context data
   - Add new nav item for Liquidation Tracker

5. **Wire up alert system** for:
   - High Exchange Inflow Events
   - Thin Liquidity Warnings
   - Liquidation volume spikes
