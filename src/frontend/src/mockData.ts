import type {
  Alert,
  AlertTrigger,
  DataFreshnessRecord,
  ExchangeFlow,
  ImpulseEvent,
  LiquidationEvent,
  LiquidationWindow,
  LiquidityScore,
  MarketSnapshot,
  NetflowPoint,
  OrderBookDepth,
  SpreadSnapshot,
  SynchronizedImpulseEvent,
  VolumeMetric,
} from "./backend.d";

const EXCHANGES = ["Binance", "Bybit", "Coinbase", "OKX"];

const now = Date.now();
const toTs = (msAgo: number): bigint => BigInt(now - msAgo);

// Generate realistic BTC price history
export function generatePriceHistory(
  exchange: string,
  count = 60,
): MarketSnapshot[] {
  let price = 67420 + (Math.random() - 0.5) * 2000;
  const history: MarketSnapshot[] = [];

  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 180;
    price = Math.max(60000, Math.min(75000, price + change));
    const fundingRate = (Math.random() - 0.4) * 0.002;
    const openInterest = 14200000000 + Math.random() * 2000000000;
    history.push({
      exchange,
      price,
      fundingRate,
      openInterest,
      timestamp: toTs(i * 60000),
    });
  }
  return history;
}

export const MOCK_PRICES: Array<[string, number]> = [
  ["Binance", 67842.5],
  ["Bybit", 67838.0],
  ["Coinbase", 67855.3],
  ["OKX", 67831.9],
];

export const MOCK_FUNDING_RATES: Array<[string, number]> = [
  ["Binance", 0.00085],
  ["Bybit", 0.00091],
  ["Coinbase", 0.00012],
  ["OKX", 0.00078],
];

export const MOCK_OPEN_INTEREST: Array<[string, number]> = [
  ["Binance", 14800000000],
  ["Bybit", 8200000000],
  ["Coinbase", 2100000000],
  ["OKX", 6400000000],
];

export const MOCK_LIQUIDATIONS: LiquidationEvent[] = [
  {
    exchange: "Binance",
    side: "long",
    amountUSD: 2840000,
    timestamp: toTs(120000),
  },
  {
    exchange: "Bybit",
    side: "long",
    amountUSD: 1290000,
    timestamp: toTs(185000),
  },
  {
    exchange: "OKX",
    side: "short",
    amountUSD: 890000,
    timestamp: toTs(310000),
  },
  {
    exchange: "Binance",
    side: "long",
    amountUSD: 4100000,
    timestamp: toTs(440000),
  },
  {
    exchange: "Bybit",
    side: "short",
    amountUSD: 620000,
    timestamp: toTs(590000),
  },
  {
    exchange: "Coinbase",
    side: "long",
    amountUSD: 1750000,
    timestamp: toTs(720000),
  },
  {
    exchange: "OKX",
    side: "long",
    amountUSD: 3200000,
    timestamp: toTs(890000),
  },
  {
    exchange: "Binance",
    side: "short",
    amountUSD: 980000,
    timestamp: toTs(1050000),
  },
];

export const MOCK_EXCHANGE_FLOWS: ExchangeFlow[] = [
  {
    exchange: "Binance",
    inflowBTC: 1842.5,
    outflowBTC: 1205.3,
    timestamp: toTs(60000),
  },
  {
    exchange: "Coinbase",
    inflowBTC: 892.1,
    outflowBTC: 1105.8,
    timestamp: toTs(120000),
  },
  {
    exchange: "Bybit",
    inflowBTC: 2105.4,
    outflowBTC: 1890.2,
    timestamp: toTs(180000),
  },
  {
    exchange: "OKX",
    inflowBTC: 1456.7,
    outflowBTC: 1102.5,
    timestamp: toTs(240000),
  },
  {
    exchange: "Binance",
    inflowBTC: 3842.5,
    outflowBTC: 890.3,
    timestamp: toTs(300000),
  }, // spike
  {
    exchange: "Coinbase",
    inflowBTC: 712.3,
    outflowBTC: 935.6,
    timestamp: toTs(360000),
  },
  {
    exchange: "Bybit",
    inflowBTC: 1890.1,
    outflowBTC: 1750.4,
    timestamp: toTs(420000),
  },
  {
    exchange: "OKX",
    inflowBTC: 1204.8,
    outflowBTC: 1389.2,
    timestamp: toTs(480000),
  },
  {
    exchange: "Binance",
    inflowBTC: 2102.3,
    outflowBTC: 1840.6,
    timestamp: toTs(540000),
  },
  {
    exchange: "Coinbase",
    inflowBTC: 845.6,
    outflowBTC: 1012.3,
    timestamp: toTs(600000),
  },
];

export const MOCK_ORDER_BOOK: Array<[string, OrderBookDepth]> = [
  [
    "Binance",
    {
      exchange: "Binance",
      bidDepth01: 8240000,
      askDepth01: 6890000,
      bidDepth05: 42100000,
      askDepth05: 38500000,
      bidDepth1: 89200000,
      askDepth1: 82400000,
      timestamp: toTs(5000),
    },
  ],
  [
    "Bybit",
    {
      exchange: "Bybit",
      bidDepth01: 4120000,
      askDepth01: 3980000,
      bidDepth05: 21500000,
      askDepth05: 19800000,
      bidDepth1: 45600000,
      askDepth1: 42100000,
      timestamp: toTs(5000),
    },
  ],
  [
    "Coinbase",
    {
      exchange: "Coinbase",
      bidDepth01: 1850000,
      askDepth01: 2140000,
      bidDepth05: 9200000,
      askDepth05: 10500000,
      bidDepth1: 19800000,
      askDepth1: 22400000,
      timestamp: toTs(5000),
    },
  ],
  [
    "OKX",
    {
      exchange: "OKX",
      bidDepth01: 980000,
      askDepth01: 1240000,
      bidDepth05: 5100000,
      askDepth05: 6200000,
      bidDepth1: 11200000,
      askDepth1: 13500000,
      timestamp: toTs(5000),
    },
  ],
];

export const MOCK_IMPULSE_EVENTS: ImpulseEvent[] = [
  {
    id: BigInt(1),
    eventType: "COORDINATED_BUY",
    description:
      "Synchronized large market buys detected across Binance, Bybit, OKX within 90-second window. Total buy pressure: $48.2M.",
    exchanges: ["Binance", "Bybit", "OKX"],
    magnitude: 2.84,
    timestamp: toTs(900000),
  },
  {
    id: BigInt(2),
    eventType: "LIQUIDATION_CASCADE",
    description:
      "Long liquidation cascade triggered at $66,200 support. $38.4M liquidated in 4-minute window.",
    exchanges: ["Binance", "Bybit"],
    magnitude: -3.21,
    timestamp: toTs(3600000),
  },
  {
    id: BigInt(3),
    eventType: "DISTRIBUTION_EVENT",
    description:
      "Simultaneous exchange inflow spike (+4,200 BTC) with price suppression detected. Classic distribution pattern.",
    exchanges: ["Binance", "Coinbase"],
    magnitude: -1.89,
    timestamp: toTs(7200000),
  },
  {
    id: BigInt(4),
    eventType: "COORDINATED_SELL",
    description:
      "Large market sell orders across multiple venues within 2-minute window. Sell pressure: $29.7M.",
    exchanges: ["Binance", "OKX"],
    magnitude: -2.45,
    timestamp: toTs(14400000),
  },
  {
    id: BigInt(5),
    eventType: "OI_FLUSH",
    description:
      "Open interest dropped $2.1B in 15 minutes. Mass deleveraging event following funding rate spike.",
    exchanges: ["Binance", "Bybit", "OKX"],
    magnitude: -4.12,
    timestamp: toTs(28800000),
  },
];

// ── NEW MOCK DATA ──────────────────────────────────────────────

export const MOCK_SYNCHRONIZED_IMPULSE_EVENTS: SynchronizedImpulseEvent[] = [
  {
    id: BigInt(1),
    direction: "buy",
    description:
      "Synchronized buy impulse across 4 exchanges within 90s. Price broke $68k resistance with 3.8x above average volume.",
    exchanges: ["Binance", "Bybit", "OKX", "Coinbase"],
    priceChangePct: 1.24,
    volumeSpikeFactor: 3.8,
    timestamp: toTs(420000),
  },
  {
    id: BigInt(2),
    direction: "sell",
    description:
      "Coordinated market sell across 3 exchanges. $67,200 support breached with heavy ask-side pressure.",
    exchanges: ["Binance", "Bybit", "OKX"],
    priceChangePct: -0.89,
    volumeSpikeFactor: 2.6,
    timestamp: toTs(1800000),
  },
  {
    id: BigInt(3),
    direction: "buy",
    description:
      "Aggressive buy sweep across all major venues in 2-minute window. Open interest expanded $1.4B simultaneously.",
    exchanges: ["Binance", "Bybit", "Coinbase"],
    priceChangePct: 2.8,
    volumeSpikeFactor: 4.1,
    timestamp: toTs(5400000),
  },
  {
    id: BigInt(4),
    direction: "sell",
    description:
      "Large liquidation-triggered sell cascade. Long positions flushed on Binance and Bybit with synchronized selling on OKX.",
    exchanges: ["Binance", "Bybit", "OKX"],
    priceChangePct: -1.67,
    volumeSpikeFactor: 3.2,
    timestamp: toTs(10800000),
  },
  {
    id: BigInt(5),
    direction: "buy",
    description:
      "Short squeeze detected — funding rate went negative before rapid buy absorption across 3 venues.",
    exchanges: ["Binance", "OKX", "Coinbase"],
    priceChangePct: 0.62,
    volumeSpikeFactor: 2.9,
    timestamp: toTs(21600000),
  },
];

export const MOCK_SPREAD_SNAPSHOT: SpreadSnapshot = {
  highestExchange: "Coinbase",
  highestPrice: 67855.3,
  lowestExchange: "OKX",
  lowestPrice: 67831.9,
  spreadPct: 0.034,
  isAbnormal: false,
  timestamp: toTs(8000),
};

export const MOCK_SPREAD_SNAPSHOT_SPIKE: SpreadSnapshot = {
  highestExchange: "Coinbase",
  highestPrice: 68120.5,
  lowestExchange: "Bybit",
  lowestPrice: 67835.2,
  spreadPct: 0.42,
  isAbnormal: true,
  timestamp: toTs(8000),
};

export const MOCK_LIQUIDATION_WINDOWS: LiquidationWindow[] = [
  {
    window: "5min",
    longLiquidations: 1200000,
    shortLiquidations: 400000,
    totalVolume: 1600000,
    isCluster: false,
  },
  {
    window: "15min",
    longLiquidations: 4800000,
    shortLiquidations: 1900000,
    totalVolume: 6700000,
    isCluster: false,
  },
  {
    window: "1h",
    longLiquidations: 28400000,
    shortLiquidations: 12100000,
    totalVolume: 40500000,
    isCluster: true,
  },
];

export const MOCK_VOLUME_METRICS: VolumeMetric[] = [
  {
    exchange: "Binance",
    volume1min: 142500000,
    volume60minAvg: 95200000,
    relativeVolume: 1.5,
    isSpike: false,
    timestamp: toTs(5000),
  },
  {
    exchange: "Bybit",
    volume1min: 312800000,
    volume60minAvg: 98400000,
    relativeVolume: 3.18,
    isSpike: true,
    timestamp: toTs(5000),
  },
  {
    exchange: "Coinbase",
    volume1min: 28400000,
    volume60minAvg: 31200000,
    relativeVolume: 0.91,
    isSpike: false,
    timestamp: toTs(5000),
  },
  {
    exchange: "OKX",
    volume1min: 89200000,
    volume60minAvg: 72100000,
    relativeVolume: 1.24,
    isSpike: false,
    timestamp: toTs(5000),
  },
];

// Data freshness — one per exchange × metric combination
export const MOCK_DATA_FRESHNESS: DataFreshnessRecord[] = [
  // Binance
  {
    exchange: "Binance",
    metricName: "price",
    lastUpdated: toTs(5000),
    latencyMs: BigInt(12),
    isStale: false,
  },
  {
    exchange: "Binance",
    metricName: "orderBook",
    lastUpdated: toTs(8000),
    latencyMs: BigInt(18),
    isStale: false,
  },
  {
    exchange: "Binance",
    metricName: "funding",
    lastUpdated: toTs(15000),
    latencyMs: BigInt(22),
    isStale: false,
  },
  {
    exchange: "Binance",
    metricName: "liquidations",
    lastUpdated: toTs(12000),
    latencyMs: BigInt(31),
    isStale: false,
  },
  {
    exchange: "Binance",
    metricName: "exchangeFlows",
    lastUpdated: toTs(25000),
    latencyMs: BigInt(45),
    isStale: false,
  },
  // Bybit
  {
    exchange: "Bybit",
    metricName: "price",
    lastUpdated: toTs(6000),
    latencyMs: BigInt(14),
    isStale: false,
  },
  {
    exchange: "Bybit",
    metricName: "orderBook",
    lastUpdated: toTs(10000),
    latencyMs: BigInt(21),
    isStale: false,
  },
  {
    exchange: "Bybit",
    metricName: "funding",
    lastUpdated: toTs(20000),
    latencyMs: BigInt(29),
    isStale: false,
  },
  {
    exchange: "Bybit",
    metricName: "liquidations",
    lastUpdated: toTs(18000),
    latencyMs: BigInt(38),
    isStale: false,
  },
  {
    exchange: "Bybit",
    metricName: "exchangeFlows",
    lastUpdated: toTs(30000),
    latencyMs: BigInt(52),
    isStale: false,
  },
  // Coinbase
  {
    exchange: "Coinbase",
    metricName: "price",
    lastUpdated: toTs(7000),
    latencyMs: BigInt(19),
    isStale: false,
  },
  {
    exchange: "Coinbase",
    metricName: "orderBook",
    lastUpdated: toTs(12000),
    latencyMs: BigInt(24),
    isStale: false,
  },
  {
    exchange: "Coinbase",
    metricName: "funding",
    lastUpdated: toTs(35000),
    latencyMs: BigInt(67),
    isStale: false,
  },
  {
    exchange: "Coinbase",
    metricName: "liquidations",
    lastUpdated: toTs(22000),
    latencyMs: BigInt(41),
    isStale: false,
  },
  {
    exchange: "Coinbase",
    metricName: "exchangeFlows",
    lastUpdated: toTs(45000),
    latencyMs: BigInt(78),
    isStale: false,
  },
  // OKX
  {
    exchange: "OKX",
    metricName: "price",
    lastUpdated: toTs(9000),
    latencyMs: BigInt(27),
    isStale: false,
  },
  {
    exchange: "OKX",
    metricName: "orderBook",
    lastUpdated: toTs(90000), // stale
    latencyMs: BigInt(89),
    isStale: true,
  },
  {
    exchange: "OKX",
    metricName: "funding",
    lastUpdated: toTs(28000),
    latencyMs: BigInt(51),
    isStale: false,
  },
  {
    exchange: "OKX",
    metricName: "liquidations",
    lastUpdated: toTs(33000),
    latencyMs: BigInt(63),
    isStale: false,
  },
  {
    exchange: "OKX",
    metricName: "exchangeFlows",
    lastUpdated: toTs(40000),
    latencyMs: BigInt(72),
    isStale: false,
  },
];

// Netflow history generator for exchange + window
export function generateNetflowHistory(
  exchange: string,
  window: string,
): NetflowPoint[] {
  const points = window === "1h" ? 12 : window === "6h" ? 24 : 48; // 5min, 15min, 30min intervals
  const intervalMs =
    window === "1h" ? 5 * 60000 : window === "6h" ? 15 * 60000 : 30 * 60000;

  // Slightly different base flows per exchange
  const baseInflows: Record<string, number> = {
    Binance: 1800,
    Bybit: 2000,
    Coinbase: 850,
    OKX: 1300,
  };
  const base = baseInflows[exchange] ?? 1500;

  let inflow = base;
  const data: NetflowPoint[] = [];

  for (let i = points; i >= 0; i--) {
    const variation = (Math.random() - 0.45) * base * 0.3;
    inflow = Math.max(base * 0.3, inflow + variation);
    const outflow = inflow * (0.7 + Math.random() * 0.5);
    const netflow = inflow - outflow;

    // Insert a spike at roughly 30%, 60%, and 80% through the data
    const spikeAt = [
      Math.floor(points * 0.7),
      Math.floor(points * 0.4),
      Math.floor(points * 0.15),
    ];
    const isSpike = spikeAt.includes(i);
    const actualInflow = isSpike ? inflow * 2.8 : inflow;
    const actualNetflow = isSpike ? actualInflow - outflow : netflow;

    data.push({
      exchange,
      inflow: Math.round(actualInflow * 10) / 10,
      outflow: Math.round(outflow * 10) / 10,
      netflow: Math.round(actualNetflow * 10) / 10,
      isSpike,
      timestamp: toTs(i * intervalMs),
    });
  }
  return data;
}

export const MOCK_LIQUIDITY_SCORE: LiquidityScore = {
  score: BigInt(72),
  fundingScore: BigInt(16),
  oiScore: BigInt(14),
  orderBookScore: BigInt(13),
  impulseScore: BigInt(15),
};

export const MOCK_ALERTS: Alert[] = [
  {
    id: BigInt(1),
    alertType: "funding_rate",
    threshold: 0.001,
    note: "High funding alert",
    active: true,
  },
  {
    id: BigInt(2),
    alertType: "open_interest",
    threshold: 16000000000,
    note: "OI spike warning",
    active: true,
  },
  {
    id: BigInt(3),
    alertType: "liquidation_burst",
    threshold: 5000000,
    note: "Large liquidation event",
    active: false,
  },
];

export const MOCK_ALERT_TRIGGERS: AlertTrigger[] = [
  {
    alertId: BigInt(1),
    message:
      "Funding rate on Binance reached 0.00091% — above threshold 0.001%",
    timestamp: toTs(300000),
  },
  {
    alertId: BigInt(2),
    message: "Open Interest exceeded $16B — OI spike detected",
    timestamp: toTs(1800000),
  },
  {
    alertId: BigInt(1),
    message: "Funding rate on Bybit reached 0.00095% — alert triggered",
    timestamp: toTs(7200000),
  },
];

// ── CHART DATA GENERATORS ──────────────────────────────────────

// Generate netflow chart data (15-min intervals, last 4 hours) — legacy format
interface LegacyNetflowPoint {
  time: string;
  inflow: number;
  outflow: number;
  netflow: number;
}
interface PricePoint {
  time: string;
  price: number;
  volume: number;
}
interface OIPoint {
  time: string;
  oi: number;
}
interface LiqPoint {
  time: string;
  longs: number;
  shorts: number;
}

export function generateNetflowData(): LegacyNetflowPoint[] {
  const data: LegacyNetflowPoint[] = [];
  let baseInflow = 1500;
  let baseOutflow = 1400;
  for (let i = 16; i >= 0; i--) {
    const time = new Date(now - i * 15 * 60000);
    const inflow = baseInflow + (Math.random() - 0.4) * 400;
    const outflow = baseOutflow + (Math.random() - 0.5) * 350;
    baseInflow = Math.max(500, inflow);
    baseOutflow = Math.max(400, outflow);
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      inflow: Math.round(inflow * 10) / 10,
      outflow: Math.round(outflow * 10) / 10,
      netflow: Math.round((inflow - outflow) * 10) / 10,
    });
  }
  // Insert a spike
  if (data.length > 5) {
    data[data.length - 5].inflow = 3842;
    data[data.length - 5].netflow = 3842 - data[data.length - 5].outflow;
  }
  return data;
}

export function generatePriceChartData(
  timeframe: string,
  exchange = "Binance",
): PricePoint[] {
  const points =
    timeframe === "1m"
      ? 60
      : timeframe === "5m"
        ? 72
        : timeframe === "1h"
          ? 60
          : 48;
  const intervalMs =
    timeframe === "1m"
      ? 60000
      : timeframe === "5m"
        ? 300000
        : timeframe === "1h"
          ? 3600000
          : 1800000;
  void exchange;
  let price = 65000 + Math.random() * 5000;
  const data: PricePoint[] = [];
  for (let i = points; i >= 0; i--) {
    price = Math.max(
      60000,
      Math.min(
        75000,
        price + (Math.random() - 0.48) * (timeframe === "1m" ? 80 : 200),
      ),
    );
    const t = new Date(now - i * intervalMs);
    data.push({
      time:
        timeframe === "24h"
          ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      price: Math.round(price * 10) / 10,
      volume: Math.round(Math.random() * 500 + 100),
    });
  }
  return data;
}

export function generateOIData(): OIPoint[] {
  let oi = 14000000000;
  const data: OIPoint[] = [];
  for (let i = 24; i >= 0; i--) {
    oi = Math.max(12000000000, oi + (Math.random() - 0.45) * 200000000);
    const t = new Date(now - i * 3600000);
    data.push({
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      oi: Math.round(oi / 1000000),
    });
  }
  return data;
}

export function generateLiquidationData(): LiqPoint[] {
  const data: LiqPoint[] = [];
  for (let i = 12; i >= 0; i--) {
    const t = new Date(now - i * 3600000);
    data.push({
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      longs: Math.round(Math.random() * 50 + 5),
      shorts: Math.round(Math.random() * 30 + 3),
    });
  }
  return data;
}

export function generateFundingHeatmapData() {
  return EXCHANGES.map((exchange) => ({
    exchange,
    rates: Array.from({ length: 8 }, (_, i) => ({
      time: new Date(now - (7 - i) * 8 * 3600000).toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),
      rate: (Math.random() - 0.35) * 0.003,
    })),
  }));
}

export function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatBTC(value: number): string {
  if (value >= 1000)
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} BTC`;
  return `${value.toFixed(2)} BTC`;
}

export function formatTimestamp(ts: bigint): string {
  return new Date(Number(ts)).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: bigint): string {
  const diff = Date.now() - Number(ts);
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// ── DYNAMIC MOCK DATA (time-seeded, changes every 30s) ──────────

/** Returns a seed that changes every 30 seconds — use to simulate live feed variance */
export function getDynamicSeed(): number {
  return Math.floor(Date.now() / 30000);
}

export function generateDynamicPrices(seed: number): Array<[string, number]> {
  const base = 67420 + (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 800;
  return [
    ["Binance", Math.round(base * 10) / 10],
    ["Bybit", Math.round(base * 0.99985 * 10) / 10],
    ["Coinbase", Math.round(base * 1.00012 * 10) / 10],
    ["OKX", Math.round(base * 0.99972 * 10) / 10],
  ];
}

export function generateDynamicFundingRates(
  seed: number,
): Array<[string, number]> {
  const base = 0.00045 + (((seed * 1234 + 5678) % 10000) / 10000) * 0.0008;
  return [
    ["Binance", Math.round(base * 1000000) / 1000000],
    ["Bybit", Math.round(base * 1.07 * 1000000) / 1000000],
    ["Coinbase", Math.round(base * 0.14 * 1000000) / 1000000],
    ["OKX", Math.round(base * 0.92 * 1000000) / 1000000],
  ];
}

export function generateDynamicOI(seed: number): Array<[string, number]> {
  const base =
    14_000_000_000 + (((seed * 7919 + 3571) % 100000) / 100000) * 3_000_000_000;
  return [
    ["Binance", Math.round(base * 0.47)],
    ["Bybit", Math.round(base * 0.26)],
    ["Coinbase", Math.round(base * 0.13)],
    ["OKX", Math.round(base * 0.14)],
  ];
}
