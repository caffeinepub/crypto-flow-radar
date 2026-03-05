import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface LiquidationEvent {
    side: string;
    timestamp: bigint;
    amountUSD: Float;
    exchange: string;
}
export interface EventReplay {
    flows: Array<ExchangeFlow>;
    priceHistory: Array<MarketSnapshot>;
    liquidations: Array<LiquidationEvent>;
    event?: ImpulseEvent;
}
export interface LiquidityScore {
    oiScore: bigint;
    score: bigint;
    impulseScore: bigint;
    orderBookScore: bigint;
    fundingScore: bigint;
}
export interface ExchangeFlow {
    inflowBTC: Float;
    timestamp: bigint;
    outflowBTC: Float;
    exchange: string;
}
export interface DataFreshnessRecord {
    isStale: boolean;
    lastUpdated: bigint;
    latencyMs: bigint;
    metricName: string;
    exchange: string;
}
export interface AlertTrigger {
    alertId: bigint;
    message: string;
    timestamp: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface VolumeMetric {
    volume1min: Float;
    isSpike: boolean;
    timestamp: bigint;
    exchange: string;
    relativeVolume: Float;
    volume60minAvg: Float;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SynchronizedImpulseEvent {
    id: bigint;
    volumeSpikeFactor: Float;
    direction: string;
    description: string;
    timestamp: bigint;
    priceChangePct: Float;
    exchanges: Array<string>;
}
export interface SpreadSnapshot {
    isAbnormal: boolean;
    lowestExchange: string;
    highestExchange: string;
    highestPrice: Float;
    timestamp: bigint;
    lowestPrice: Float;
    spreadPct: Float;
}
export interface LiquidationWindow {
    totalVolume: Float;
    window: string;
    longLiquidations: Float;
    shortLiquidations: Float;
    isCluster: boolean;
}
export interface MarketSnapshot {
    openInterest: Float;
    timestamp: bigint;
    fundingRate: Float;
    exchange: string;
    price: Float;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface OrderBookDepth {
    bidDepth1: Float;
    askDepth1: Float;
    timestamp: bigint;
    bidDepth01: Float;
    bidDepth05: Float;
    askDepth01: Float;
    askDepth05: Float;
    exchange: string;
}
export type Float = number;
export interface NetflowPoint {
    isSpike: boolean;
    netflow: Float;
    inflow: Float;
    timestamp: bigint;
    exchange: string;
    outflow: Float;
}
export interface Alert {
    id: bigint;
    alertType: string;
    active: boolean;
    threshold: Float;
    note: string;
}
export interface ImpulseEvent {
    id: bigint;
    description: string;
    timestamp: bigint;
    exchanges: Array<string>;
    magnitude: Float;
    eventType: string;
}
export interface backendInterface {
    addAlert(alertType: string, threshold: Float, note: string): Promise<bigint>;
    deleteAlert(id: bigint): Promise<boolean>;
    fetchDataCycle(): Promise<void>;
    getAlertTriggers(limit: bigint): Promise<Array<AlertTrigger>>;
    getAlerts(): Promise<Array<Alert>>;
    getBinanceBTCPrice(): Promise<string>;
    getDataFreshness(): Promise<Array<DataFreshnessRecord>>;
    getEventReplay(impulseEventId: bigint): Promise<EventReplay>;
    getExchangeFlows(limit: bigint): Promise<Array<ExchangeFlow>>;
    getFundingRates(): Promise<Array<[string, Float]>>;
    getImpulseEvents(limit: bigint): Promise<Array<ImpulseEvent>>;
    getLatestPrices(): Promise<Array<[string, Float]>>;
    getLiquidationWindows(): Promise<Array<LiquidationWindow>>;
    getLiquidations(limit: bigint): Promise<Array<LiquidationEvent>>;
    getLiquidityScore(): Promise<LiquidityScore>;
    getNetflowHistory(exchange: string, window: string): Promise<Array<NetflowPoint>>;
    getOpenInterest(): Promise<Array<[string, Float]>>;
    getOrderBookDepth(): Promise<Array<[string, OrderBookDepth]>>;
    getPriceHistory(exchange: string, limit: bigint): Promise<Array<MarketSnapshot>>;
    getSpreadSnapshot(): Promise<SpreadSnapshot | null>;
    getSynchronizedImpulseEvents(limit: bigint): Promise<Array<SynchronizedImpulseEvent>>;
    getVolumeMetrics(): Promise<Array<VolumeMetric>>;
    init(): Promise<void>;
    isLiveData(): Promise<boolean>;
    startDataFetching(): Promise<void>;
    transformHttpResponse(input: TransformationInput): Promise<TransformationOutput>;
    triggerManualRefresh(): Promise<string>;
    updateAlert(id: bigint, active: boolean): Promise<boolean>;
}
