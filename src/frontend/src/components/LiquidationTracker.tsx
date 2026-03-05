import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useDataFreshness,
  useLiquidationWindows,
  useLiquidations,
} from "../hooks/useBackendData";
import { formatUSD, timeAgo } from "../mockData";
import DataFreshnessBadge from "./DataFreshnessBadge";

const WINDOW_LABELS: Record<string, string> = {
  "5min": "5 Min",
  "15min": "15 Min",
  "1h": "1 Hour",
};

export default function LiquidationTracker() {
  const { data: windows, isLoading: windowsLoading } = useLiquidationWindows();
  const { data: liquidations, isLoading: liqLoading } = useLiquidations(20);
  const { data: freshness } = useDataFreshness();

  const liqFreshness = useMemo(() => {
    if (!freshness) return null;
    return freshness.find(
      (f) => f.metricName === "liquidations" && f.exchange === "Binance",
    );
  }, [freshness]);

  const hasCluster = windows?.some((w) => w.isCluster) ?? false;

  const barData = useMemo(() => {
    if (!windows) return [];
    return windows.map((w) => ({
      window: WINDOW_LABELS[w.window] ?? w.window,
      longs: Math.round((w.longLiquidations / 1e6) * 100) / 100,
      shorts: Math.round((w.shortLiquidations / 1e6) * 100) / 100,
      total: Math.round((w.totalVolume / 1e6) * 100) / 100,
      isCluster: w.isCluster,
    }));
  }, [windows]);

  return (
    <div data-ocid="liquidations.panel" className="space-y-4">
      {/* Cluster alert */}
      {hasCluster && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning animate-pulse flex-shrink-0" />
            <div>
              <span className="text-sm font-mono font-bold text-warning">
                LIQUIDATION CLUSTER DETECTED
              </span>
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                Abnormally large liquidation volume in recent window — cascade
                risk elevated
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Window cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {windowsLoading
          ? ["w1", "w2", "w3"].map((k) => (
              <div key={k} className="h-36 bg-muted rounded animate-pulse" />
            ))
          : windows?.map((w) => (
              <Card
                key={w.window}
                className={`bg-card border-border ${w.isCluster ? "border-warning" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      {WINDOW_LABELS[w.window] ?? w.window}
                    </span>
                    {w.isCluster ? (
                      <Badge className="text-xs font-mono bg-warning/20 text-warning border-warning/40 animate-pulse flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        CLUSTER
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs font-mono text-muted-foreground border-border"
                      >
                        NORMAL
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-bear">
                        LONG LIQS
                      </span>
                      <span className="text-xs font-mono text-bear font-semibold">
                        {formatUSD(w.longLiquidations)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-bull">
                        SHORT LIQS
                      </span>
                      <span className="text-xs font-mono text-bull font-semibold">
                        {formatUSD(w.shortLiquidations)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        TOTAL
                      </span>
                      <span
                        className={`text-sm font-mono font-bold ${w.isCluster ? "text-warning" : "text-foreground"}`}
                      >
                        {formatUSD(w.totalVolume)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Bar chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Liquidations by Window (USD Millions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={barData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.018 255 / 0.5)"
                vertical={false}
              />
              <XAxis
                dataKey="window"
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
                tickFormatter={(v) => `$${v}M`}
                width={52}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-popover border border-border rounded p-2 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1 font-mono">
                          {label}
                        </p>
                        {payload.map((p) => (
                          <p
                            key={p.name}
                            className={`text-xs font-mono ${
                              p.name === "longs" ? "text-bear" : "text-bull"
                            }`}
                          >
                            {p.name === "longs" ? "Long Liqs" : "Short Liqs"}: $
                            {Number(p.value).toFixed(2)}M
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                  color: "oklch(0.56 0.015 240)",
                }}
                formatter={(value) =>
                  value === "longs" ? "Long Liquidations" : "Short Liquidations"
                }
              />
              <Bar
                dataKey="longs"
                name="longs"
                fill="oklch(0.62 0.22 27)"
                radius={[2, 2, 0, 0]}
              >
                {barData.map((entry) => (
                  <Cell
                    key={entry.window}
                    fill={
                      entry.isCluster
                        ? "oklch(0.73 0.18 60)"
                        : "oklch(0.62 0.22 27)"
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="shorts"
                name="shorts"
                fill="oklch(0.72 0.17 145)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent liquidations list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Recent Liquidation Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liqLoading ? (
            <div className="space-y-2">
              {["l1", "l2", "l3", "l4"].map((k) => (
                <div key={k} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !liquidations || liquidations.length === 0 ? (
            <div
              data-ocid="liquidations.empty_state"
              className="text-center py-8 text-muted-foreground"
            >
              <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-mono">No recent liquidations</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {liquidations.slice(0, 10).map((liq, i) => {
                const isLarge = liq.amountUSD > 2000000;
                return (
                  <div
                    key={`liq-${liq.exchange}-${liq.side}-${i}`}
                    data-ocid={`liquidations.item.${i + 1}`}
                    className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                      isLarge
                        ? "bg-warning/8 border border-warning/20"
                        : "bg-background/40 border border-border/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${liq.side === "long" ? "bg-bear" : "bg-bull"}`}
                      />
                      <span className="font-mono text-muted-foreground">
                        {liq.exchange}
                      </span>
                      <span
                        className={`font-mono font-semibold ${liq.side === "long" ? "text-bear" : "text-bull"}`}
                      >
                        {liq.side.toUpperCase()}
                      </span>
                      {isLarge && (
                        <AlertTriangle className="h-3 w-3 text-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono font-semibold ${liq.side === "long" ? "text-bear" : "text-bull"}`}
                      >
                        {formatUSD(liq.amountUSD)}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {timeAgo(liq.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Freshness badge */}
          {liqFreshness && (
            <div className="mt-3 pt-3 border-t border-border/60">
              <DataFreshnessBadge
                lastUpdated={liqFreshness.lastUpdated}
                latencyMs={liqFreshness.latencyMs}
                isStale={liqFreshness.isStale}
                exchange={liqFreshness.exchange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
