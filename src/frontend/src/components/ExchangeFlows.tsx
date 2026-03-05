import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useDataFreshness,
  useExchangeFlows,
  useNetflowHistory,
} from "../hooks/useBackendData";
import { formatBTC, formatTimestamp } from "../mockData";
import DataFreshnessBadge from "./DataFreshnessBadge";

const SPIKE_THRESHOLD = 2500; // BTC inflow considered a spike

type Window = "1h" | "6h" | "24h";
const WINDOWS: Window[] = ["1h", "6h", "24h"];

const NetflowTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded p-2 shadow-lg">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {payload.map((p) => (
          <p
            key={p.name}
            className={`text-xs font-mono ${
              p.name === "netflow"
                ? p.value >= 0
                  ? "text-bear"
                  : "text-bull"
                : p.name === "inflow"
                  ? "text-bear"
                  : "text-bull"
            }`}
          >
            {p.name}: {p.value > 0 ? "+" : ""}
            {p.value.toFixed(1)} BTC
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart that pulls from useNetflowHistory for a selected exchange + window
function NetflowChart({
  window,
  exchange,
}: { window: Window; exchange: string }) {
  const { data: points } = useNetflowHistory(exchange, window);

  const chartData = useMemo(() => {
    if (!points) return [];
    return points.map((p) => ({
      time: new Date(Number(p.timestamp)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      inflow: p.inflow,
      outflow: p.outflow,
      netflow: p.netflow,
      isSpike: p.isSpike,
    }));
  }, [points]);

  const totalInflow = useMemo(
    () => points?.reduce((s, p) => s + p.inflow, 0) ?? 0,
    [points],
  );
  const totalOutflow = useMemo(
    () => points?.reduce((s, p) => s + p.outflow, 0) ?? 0,
    [points],
  );
  const netPosition = totalInflow - totalOutflow;
  const spikeCount = points?.filter((p) => p.isSpike).length ?? 0;

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-background/40 rounded p-2">
          <div className="text-xs text-muted-foreground font-mono mb-0.5">
            INFLOW
          </div>
          <div className="text-sm font-mono text-bear font-semibold">
            {formatBTC(totalInflow)}
          </div>
        </div>
        <div className="bg-background/40 rounded p-2">
          <div className="text-xs text-muted-foreground font-mono mb-0.5">
            OUTFLOW
          </div>
          <div className="text-sm font-mono text-bull font-semibold">
            {formatBTC(totalOutflow)}
          </div>
        </div>
        <div className="bg-background/40 rounded p-2">
          <div className="text-xs text-muted-foreground font-mono mb-0.5">
            NET
          </div>
          <div
            className={`text-sm font-mono font-semibold ${netPosition > 0 ? "text-bear" : "text-bull"}`}
          >
            {netPosition > 0 ? "+" : ""}
            {formatBTC(netPosition)}
          </div>
        </div>
      </div>

      {spikeCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-warning/10 border border-warning/30">
          <AlertTriangle className="h-3 w-3 text-warning animate-pulse" />
          <span className="text-xs font-mono text-warning">
            {spikeCount} spike{spikeCount > 1 ? "s" : ""} detected in {window}{" "}
            window
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="netflowPos" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="oklch(0.62 0.22 27)"
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor="oklch(0.62 0.22 27)"
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
            interval={Math.floor(chartData.length / 6)}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: "oklch(0.56 0.015 240)",
              fontFamily: "JetBrains Mono",
            }}
            tickLine={false}
            axisLine={false}
            width={54}
          />
          <Tooltip content={<NetflowTooltip />} />
          <ReferenceLine
            y={0}
            stroke="oklch(0.56 0.015 240)"
            strokeDasharray="4 2"
          />
          <Area
            type="monotone"
            dataKey="netflow"
            name="netflow"
            stroke="oklch(0.62 0.22 27)"
            strokeWidth={1.5}
            fill="url(#netflowPos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ExchangeFlows() {
  const { data: flows, isLoading } = useExchangeFlows(20);
  const { data: freshness } = useDataFreshness();
  const [selectedWindow, setSelectedWindow] = useState<Window>("1h");
  const [selectedExchange, setSelectedExchange] = useState("Binance");

  // Per-exchange aggregated data
  const exchangeData = useMemo(() => {
    if (!flows) return [];
    const agg: Record<string, { inflow: number; outflow: number }> = {};
    for (const f of flows) {
      if (!agg[f.exchange]) agg[f.exchange] = { inflow: 0, outflow: 0 };
      agg[f.exchange].inflow += f.inflowBTC;
      agg[f.exchange].outflow += f.outflowBTC;
    }
    return Object.entries(agg).map(([exchange, v]) => ({
      exchange,
      inflow: Math.round(v.inflow * 10) / 10,
      outflow: Math.round(v.outflow * 10) / 10,
      netflow: Math.round((v.inflow - v.outflow) * 10) / 10,
    }));
  }, [flows]);

  // Freshness per exchange
  const flowsFreshness = useMemo(() => {
    if (!freshness) return {};
    const map: Record<string, (typeof freshness)[0]> = {};
    for (const f of freshness) {
      if (f.metricName === "exchangeFlows") map[f.exchange] = f;
    }
    return map;
  }, [freshness]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {exchangeData.map((ex) => {
          const isSpike = ex.inflow > SPIKE_THRESHOLD;
          const fresh = flowsFreshness[ex.exchange];
          return (
            <Card
              key={ex.exchange}
              className={`bg-card border-border ${isSpike ? "border-warning" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground uppercase">
                    {ex.exchange}
                  </span>
                  {isSpike && (
                    <Badge className="text-xs bg-warning/20 text-warning border-warning/40 animate-pulse flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      HIGH INFLOW
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownToLine className="h-3 w-3 text-bear" />
                  <span className="text-xs text-muted-foreground font-mono">
                    In:
                  </span>
                  <span className="text-xs font-mono text-bear">
                    {formatBTC(ex.inflow)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpFromLine className="h-3 w-3 text-bull" />
                  <span className="text-xs text-muted-foreground font-mono">
                    Out:
                  </span>
                  <span className="text-xs font-mono text-bull">
                    {formatBTC(ex.outflow)}
                  </span>
                </div>
                <div
                  className={`text-sm font-mono font-semibold ${ex.netflow > 0 ? "text-bear" : "text-bull"}`}
                >
                  Net: {ex.netflow > 0 ? "+" : ""}
                  {ex.netflow.toFixed(1)} BTC
                </div>
                {fresh && (
                  <div className="mt-2 pt-2 border-t border-border/60">
                    <DataFreshnessBadge
                      lastUpdated={fresh.lastUpdated}
                      latencyMs={fresh.latencyMs}
                      isStale={fresh.isStale}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Netflow chart with timeframe + exchange selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Exchange Netflow — {selectedExchange} — Last {selectedWindow}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Exchange selector */}
            <div className="flex gap-1">
              {["Binance", "Bybit", "Coinbase", "OKX"].map((ex) => (
                <button
                  type="button"
                  key={ex}
                  data-ocid="flows.exchange.tab"
                  onClick={() => setSelectedExchange(ex)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                    selectedExchange === ex
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
            {/* Window selector */}
            <div className="flex gap-1">
              {WINDOWS.map((w) => (
                <button
                  type="button"
                  key={w}
                  data-ocid="flows.window.tab"
                  onClick={() => setSelectedWindow(w)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    selectedWindow === w
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <NetflowChart window={selectedWindow} exchange={selectedExchange} />
        </CardContent>
      </Card>

      {/* Per-exchange bar chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Inflow vs Outflow by Exchange
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={exchangeData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.018 255 / 0.5)"
                vertical={false}
              />
              <XAxis
                dataKey="exchange"
                tick={{
                  fontSize: 10,
                  fill: "oklch(0.56 0.015 240)",
                  fontFamily: "JetBrains Mono",
                }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 10,
                  fill: "oklch(0.56 0.015 240)",
                  fontFamily: "JetBrains Mono",
                }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip content={<NetflowTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                  color: "oklch(0.56 0.015 240)",
                }}
              />
              <Bar
                dataKey="inflow"
                name="inflow"
                fill="oklch(0.62 0.22 27)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="outflow"
                name="outflow"
                fill="oklch(0.72 0.17 145)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Flow table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Recent Flow Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {["r1", "r2", "r3", "r4", "r5"].map((k) => (
                <div key={k} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground pb-2 pr-4">
                      Time
                    </th>
                    <th className="text-left text-muted-foreground pb-2 pr-4">
                      Exchange
                    </th>
                    <th className="text-right text-muted-foreground pb-2 pr-4">
                      Inflow
                    </th>
                    <th className="text-right text-muted-foreground pb-2 pr-4">
                      Outflow
                    </th>
                    <th className="text-right text-muted-foreground pb-2">
                      Netflow
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flows?.slice(0, 10).map((flow, i) => {
                    const netflow = flow.inflowBTC - flow.outflowBTC;
                    const isSpike = flow.inflowBTC > SPIKE_THRESHOLD;
                    return (
                      <tr
                        key={`${flow.exchange}-${i}`}
                        className={`border-b border-border/40 ${isSpike ? "bg-warning/5" : ""}`}
                      >
                        <td className="py-1.5 pr-4 text-muted-foreground">
                          {formatTimestamp(flow.timestamp)}
                        </td>
                        <td className="py-1.5 pr-4">
                          <span className="flex items-center gap-1.5">
                            {flow.exchange}
                            {isSpike && (
                              <span className="text-warning">
                                <AlertTriangle className="h-3 w-3 inline" />
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-1.5 pr-4 text-right text-bear">
                          {formatBTC(flow.inflowBTC)}
                        </td>
                        <td className="py-1.5 pr-4 text-right text-bull">
                          {formatBTC(flow.outflowBTC)}
                        </td>
                        <td
                          className={`py-1.5 text-right ${netflow > 0 ? "text-bear" : "text-bull"}`}
                        >
                          {netflow > 0 ? "+" : ""}
                          {formatBTC(netflow)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
