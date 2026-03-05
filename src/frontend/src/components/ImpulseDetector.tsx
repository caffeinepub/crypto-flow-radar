import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useImpulseEvents,
  useSynchronizedImpulseEvents,
} from "../hooks/useBackendData";
import { formatTimestamp, generatePriceChartData, timeAgo } from "../mockData";

function getMagnitudeStyle(mag: number) {
  const abs = Math.abs(mag);
  if (abs >= 4)
    return {
      badge: "bg-bear text-white border-bear",
      dot: "bg-bear",
    };
  if (abs >= 3)
    return {
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
      dot: "bg-orange-400",
    };
  if (abs >= 2)
    return {
      badge: "bg-warning/20 text-warning border-warning/40",
      dot: "bg-warning",
    };
  return {
    badge: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  };
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    COORDINATED_BUY: "COORD. BUY",
    COORDINATED_SELL: "COORD. SELL",
    LIQUIDATION_CASCADE: "LIQ. CASCADE",
    DISTRIBUTION_EVENT: "DISTRIBUTION",
    OI_FLUSH: "OI FLUSH",
    ACCUMULATION: "ACCUMULATION",
  };
  return labels[type] || type;
}

export default function ImpulseDetector() {
  const { data: syncEvents, isLoading: syncLoading } =
    useSynchronizedImpulseEvents(20);
  const { data: historicalEvents, isLoading: histLoading } =
    useImpulseEvents(20);
  const chartData = useMemo(() => generatePriceChartData("1h"), []);

  // Build event markers for the chart
  const chartEvents = useMemo(() => {
    if (!historicalEvents || !chartData.length) return [];
    return historicalEvents.slice(0, 3).map((evt, i) => {
      const idx = Math.max(0, chartData.length - 15 + i * 5);
      const entry = chartData[idx];
      return {
        time: entry ? entry.time : "",
        magnitude: evt.magnitude,
        type: evt.eventType,
      };
    });
  }, [historicalEvents, chartData]);

  return (
    <div className="space-y-4">
      {/* Detection threshold explanation */}
      <Card className="bg-card border-border border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-mono font-semibold text-foreground mb-2">
                IMPULSE DETECTION THRESHOLDS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Price change <span className="text-warning">&gt; 0.5%</span>{" "}
                    within <span className="text-warning">2 min</span>
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Taker volume <span className="text-warning">&gt; 2.5×</span>{" "}
                    60-min average
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Activity on{" "}
                    <span className="text-warning">≥ 3 exchanges</span>{" "}
                    simultaneously
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Synchronized Impulse Events feed */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Synchronized Market Impulses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncLoading ? (
            <div className="space-y-3">
              {["s1", "s2", "s3"].map((k) => (
                <div key={k} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !syncEvents || syncEvents.length === 0 ? (
            <div
              data-ocid="impulse.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-mono">
                No synchronized impulse events detected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {syncEvents.map((evt, i) => {
                const isBuy = evt.direction === "buy";
                return (
                  <div
                    key={evt.id.toString()}
                    data-ocid={`impulse.item.${i + 1}`}
                    className={`p-3 rounded border ${
                      isBuy
                        ? "border-bull/30 bg-bull/5"
                        : "border-bear/30 bg-bear/5"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Event type label */}
                      <span className="text-xs font-mono font-bold tracking-widest text-foreground uppercase">
                        SYNCHRONIZED MARKET IMPULSE
                      </span>

                      {/* Direction badge */}
                      <Badge
                        className={`text-xs font-mono flex items-center gap-1 ${
                          isBuy
                            ? "bg-bull/20 text-bull border-bull/40"
                            : "bg-bear/20 text-bear border-bear/40"
                        }`}
                      >
                        {isBuy ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isBuy ? "BUY IMPULSE" : "SELL IMPULSE"}
                      </Badge>

                      <span className="text-xs font-mono text-muted-foreground ml-auto">
                        {timeAgo(evt.timestamp)}
                      </span>
                    </div>

                    {/* Metrics row */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span
                        className={`text-sm font-mono font-semibold ${
                          isBuy ? "text-bull" : "text-bear"
                        }`}
                      >
                        {evt.priceChangePct > 0 ? "+" : ""}
                        {evt.priceChangePct.toFixed(2)}% price
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs font-mono text-warning border-warning/40 bg-warning/10"
                      >
                        {evt.volumeSpikeFactor.toFixed(1)}× avg vol
                      </Badge>
                      {/* Exchange pills */}
                      <div className="flex flex-wrap gap-1">
                        {evt.exchanges.map((ex) => (
                          <span
                            key={ex}
                            className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {evt.description}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                      {formatTimestamp(evt.timestamp)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price chart with impulse event overlay */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            BTC Price + Impulse Event Overlay — 1H
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="impulsePriceGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="oklch(0.65 0.14 230)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.65 0.14 230)"
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
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-popover border border-border rounded p-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-mono text-foreground">
                          ${payload[0].value?.toLocaleString()}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="oklch(0.65 0.14 230)"
                strokeWidth={1.5}
                fill="url(#impulsePriceGrad)"
              />
              {chartEvents.map((e, i) => (
                <ReferenceLine
                  key={`ref-${e.time}-${i}`}
                  x={e.time}
                  stroke={
                    e.magnitude > 0
                      ? "oklch(0.72 0.17 145)"
                      : "oklch(0.62 0.22 27)"
                  }
                  strokeDasharray="3 3"
                  label={{ value: "⚡", position: "top", fontSize: 10 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Historical events (original ImpulseEvent feed) */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Historical Market Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {histLoading ? (
            <div className="space-y-3">
              {["s1", "s2", "s3", "s4"].map((k) => (
                <div key={k} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !historicalEvents || historicalEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm font-mono">No historical events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historicalEvents.map((evt, i) => {
                const style = getMagnitudeStyle(evt.magnitude);
                const isPositive = evt.magnitude > 0;
                return (
                  <div
                    key={evt.id.toString()}
                    className="flex gap-4 p-3 rounded border border-border bg-background/40 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`}
                      />
                      {i < historicalEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${style.badge}`}
                        >
                          {getEventTypeLabel(evt.eventType)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${isPositive ? "text-bull border-bull/40" : "text-bear border-bear/40"}`}
                        >
                          {isPositive ? "▲" : "▼"}{" "}
                          {Math.abs(evt.magnitude).toFixed(2)}%
                        </Badge>
                        {evt.exchanges.map((ex) => (
                          <span
                            key={ex}
                            className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                          >
                            {ex}
                          </span>
                        ))}
                        <span className="text-xs font-mono text-muted-foreground ml-auto">
                          {timeAgo(evt.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {evt.description}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                        {formatTimestamp(evt.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
