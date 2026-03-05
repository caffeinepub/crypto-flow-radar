import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useDataFreshness,
  useFundingRates,
  useLatestPrices,
  useLiquidations,
  useLiquidityScore,
  useOpenInterest,
  useVolumeMetrics,
} from "../hooks/useBackendData";
import {
  formatTimestamp,
  formatUSD,
  generatePriceChartData,
  timeAgo,
} from "../mockData";
import DataFreshnessBadge from "./DataFreshnessBadge";
import LiquidityScoreGauge from "./LiquidityScoreGauge";
import SpreadMonitor from "./SpreadMonitor";

const TIMEFRAMES = ["1m", "5m", "1h", "24h"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const EXCHANGE_LOGOS: Record<string, string> = {
  Binance: "🟡",
  Bybit: "🔵",
  Coinbase: "🔷",
  OKX: "⬛",
};

function PriceCard({
  exchange,
  price,
  prevPrice,
  volumeMetric,
  freshness,
}: {
  exchange: string;
  price: number;
  prevPrice: number;
  volumeMetric?: {
    volume1min: number;
    relativeVolume: number;
    isSpike: boolean;
    volume60minAvg: number;
  };
  freshness?: {
    lastUpdated: bigint;
    latencyMs: bigint;
    isStale: boolean;
  };
}) {
  const change = price - prevPrice;
  const changePct = (change / prevPrice) * 100;
  const isUp = change >= 0;
  const isVolSpike = volumeMetric?.isSpike ?? false;

  return (
    <Card
      className={`bg-card border-border ${isVolSpike ? "border-warning/60" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{EXCHANGE_LOGOS[exchange] || "🔸"}</span>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {exchange}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-mono ${isUp ? "border-bull text-bull bg-bull/10" : "border-bear text-bear bg-bear/10"}`}
          >
            {isUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
          </Badge>
        </div>
        <div className="font-mono text-2xl font-semibold text-foreground">
          $
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </div>
        <div
          className={`text-xs font-mono mt-1 ${isUp ? "text-bull" : "text-bear"}`}
        >
          {isUp ? "+" : ""}${change.toFixed(1)}
        </div>

        {/* Volume spike indicator */}
        {volumeMetric && (
          <div className="mt-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground">
                Vol:{" "}
                {volumeMetric.volume1min >= 1e6
                  ? `$${(volumeMetric.volume1min / 1e6).toFixed(1)}M`
                  : `$${(volumeMetric.volume1min / 1e3).toFixed(0)}K`}
              </span>
              <span
                className={`${
                  isVolSpike
                    ? "text-warning font-semibold"
                    : volumeMetric.relativeVolume > 1.5
                      ? "text-warning/80"
                      : "text-muted-foreground"
                }`}
              >
                {volumeMetric.relativeVolume.toFixed(2)}× avg
              </span>
            </div>
            {isVolSpike && (
              <div className="mt-1">
                <Badge className="text-xs font-mono bg-warning/20 text-warning border-warning/40 animate-pulse">
                  VOL SPIKE
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Data freshness */}
        {freshness && (
          <div className="mt-1.5">
            <DataFreshnessBadge
              lastUpdated={freshness.lastUpdated}
              latencyMs={freshness.latencyMs}
              isStale={freshness.isStale}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded p-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono font-semibold text-foreground">
          $
          {payload[0].value.toLocaleString(undefined, {
            minimumFractionDigits: 1,
          })}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const { data: prices, isLoading: pricesLoading } = useLatestPrices();
  const { data: fundingRates } = useFundingRates();
  const { data: openInterest } = useOpenInterest();
  const { data: liquidations } = useLiquidations(8);
  const { data: liquidityScore } = useLiquidityScore();
  const { data: volumeMetrics } = useVolumeMetrics();
  const { data: freshness } = useDataFreshness();

  const chartData = useMemo(
    () => generatePriceChartData(timeframe),
    [timeframe],
  );

  const totalOI = useMemo(() => {
    if (!openInterest) return 0;
    return openInterest.reduce((sum, [, oi]) => sum + oi, 0);
  }, [openInterest]);

  const prevPrices = useMemo(() => {
    const base: Record<string, number> = {
      Binance: 67200,
      Bybit: 67195,
      Coinbase: 67210,
      OKX: 67185,
    };
    return base;
  }, []);

  // Volume metrics map
  const volumeMap = useMemo(() => {
    const map: Record<
      string,
      {
        volume1min: number;
        relativeVolume: number;
        isSpike: boolean;
        volume60minAvg: number;
      }
    > = {};
    if (volumeMetrics) {
      for (const v of volumeMetrics) map[v.exchange] = v;
    }
    return map;
  }, [volumeMetrics]);

  // Price freshness map
  const priceFreshnessMap = useMemo(() => {
    const map: Record<
      string,
      { lastUpdated: bigint; latencyMs: bigint; isStale: boolean }
    > = {};
    if (freshness) {
      for (const f of freshness) {
        if (f.metricName === "price") map[f.exchange] = f;
      }
    }
    return map;
  }, [freshness]);

  return (
    <div className="space-y-4">
      {/* Price Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pricesLoading
          ? ["sk1", "sk2", "sk3", "sk4"].map((k) => (
              <Skeleton key={k} className="h-24 bg-muted" />
            ))
          : prices?.map(([exchange, price]) => (
              <PriceCard
                key={exchange}
                exchange={exchange}
                price={price}
                prevPrice={prevPrices[exchange] ?? price * 0.99}
                volumeMetric={volumeMap[exchange]}
                freshness={priceFreshnessMap[exchange]}
              />
            ))}
      </div>

      {/* Spread Monitor */}
      <SpreadMonitor />

      {/* Main Chart + Score */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Price Chart */}
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4" />
              BTC / USD — Price Chart
            </CardTitle>
            <div className="flex gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  type="button"
                  key={tf}
                  data-ocid="dashboard.timeframe.tab"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    timeframe === tf
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.72 0.17 145)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.72 0.17 145)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.018 255 / 0.5)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{
                    fontSize: 10,
                    fill: "oklch(0.56 0.015 240)",
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: "oklch(0.56 0.015 240)",
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="oklch(0.72 0.17 145)"
                  strokeWidth={1.5}
                  fill="url(#priceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Liquidity Score */}
        <Card className="bg-card border-border" data-ocid="score.panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Extraction Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-2">
            {liquidityScore && (
              <LiquidityScoreGauge
                score={Number(liquidityScore.score)}
                compact
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Funding Rates + OI + Liquidations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funding Rates */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Funding Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {fundingRates?.map(([exchange, rate]) => {
              const isHigh = rate > 0.0005;
              const isNeg = rate < 0;
              return (
                <div
                  key={exchange}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {EXCHANGE_LOGOS[exchange] || "🔸"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {exchange}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded ${
                      isNeg
                        ? "text-bull bg-bull/10"
                        : isHigh
                          ? "text-bear bg-bear/10"
                          : "text-warning bg-warning/10"
                    }`}
                  >
                    {isNeg ? "" : "+"}
                    {(rate * 100).toFixed(4)}%
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Open Interest */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Open Interest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-semibold text-foreground mb-1">
              {formatUSD(totalOI)}
            </div>
            <div className="flex items-center gap-1 text-xs text-bull mb-3">
              <TrendingUp className="h-3 w-3" />
              +2.4% vs 24h ago
            </div>
            <div className="space-y-1.5">
              {openInterest?.map(([exchange, oi]) => (
                <div
                  key={exchange}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground font-mono">
                    {exchange}
                  </span>
                  <span className="font-mono text-foreground">
                    {formatUSD(oi)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Liquidations */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Recent Liquidations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {liquidations?.slice(0, 6).map((liq, i) => (
              <div
                key={`${liq.exchange}-${liq.side}-${i}`}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${liq.side === "long" ? "bg-bear" : "bg-bull"}`}
                  />
                  <span className="text-muted-foreground font-mono">
                    {liq.exchange}
                  </span>
                  <span
                    className={`font-mono ${liq.side === "long" ? "text-bear" : "text-bull"}`}
                  >
                    {liq.side.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-foreground">
                    {formatUSD(liq.amountUSD)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {timeAgo(liq.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
