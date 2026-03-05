import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, TrendingDown, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SynchronizedImpulseEvent } from "../backend.d";
import {
  useEventReplay,
  useSynchronizedImpulseEvents,
} from "../hooks/useBackendData";
import {
  formatTimestamp,
  generateLiquidationData,
  generateNetflowData,
  generatePriceChartData,
  timeAgo,
} from "../mockData";

function ReplayModal({
  event,
  open,
  onClose,
}: {
  event: SynchronizedImpulseEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  useEventReplay(event?.id ?? null);

  // Generate mock replay data for display
  const allPriceData = useMemo(() => generatePriceChartData("1h"), []);
  const priceData = allPriceData.slice(20, 50);
  const liqData = useMemo(() => generateLiquidationData().slice(0, 8), []);
  const flowData = useMemo(() => generateNetflowData().slice(8, 14), []);

  if (!event) return null;

  const isBuy = event.direction === "buy";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        data-ocid="replay.event.modal"
        className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Event Replay — SYNCHRONIZED MARKET IMPULSE
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {formatTimestamp(event.timestamp)} · ±30 minute window
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Event metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background rounded p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">
                DIRECTION
              </div>
              <Badge
                className={`text-xs font-mono flex items-center gap-1 w-fit ${
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
            </div>
            <div className="bg-background rounded p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">
                PRICE CHANGE
              </div>
              <div
                className={`text-sm font-mono font-bold ${
                  event.priceChangePct >= 0 ? "text-bull" : "text-bear"
                }`}
              >
                {event.priceChangePct >= 0 ? "+" : ""}
                {event.priceChangePct.toFixed(2)}%
              </div>
            </div>
            <div className="bg-background rounded p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">
                VOL SPIKE
              </div>
              <div className="text-sm font-mono font-bold text-warning">
                {event.volumeSpikeFactor.toFixed(1)}× avg
              </div>
            </div>
            <div className="bg-background rounded p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">
                TIME
              </div>
              <div className="text-xs font-mono text-foreground">
                {timeAgo(event.timestamp)}
              </div>
            </div>
          </div>

          {/* Exchanges involved */}
          <div className="bg-background/60 rounded p-3">
            <div className="text-xs text-muted-foreground font-mono mb-2">
              EXCHANGES INVOLVED
            </div>
            <div className="flex flex-wrap gap-1.5">
              {event.exchanges.map((ex) => (
                <span
                  key={ex}
                  className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-background/60 rounded p-3">
            <div className="text-xs text-muted-foreground font-mono mb-1">
              DESCRIPTION
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Price chart */}
          <div>
            <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
              Price — 30min Window
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={priceData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="replayGrad" x1="0" y1="0" x2="0" y2="1">
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
                    fontSize: 9,
                    fill: "oklch(0.56 0.015 240)",
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: "oklch(0.56 0.015 240)",
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                  width={44}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length)
                      return (
                        <div className="bg-popover border border-border rounded p-2 text-xs font-mono">
                          ${payload[0].value?.toLocaleString()}
                        </div>
                      );
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="oklch(0.65 0.14 230)"
                  strokeWidth={1.5}
                  fill="url(#replayGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Liquidations + flows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                Liquidation Volume
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={liqData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 9,
                      fill: "oklch(0.56 0.015 240)",
                      fontFamily: "JetBrains Mono",
                    }}
                    tickLine={false}
                    axisLine={false}
                    interval={2}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length)
                        return (
                          <div className="bg-popover border border-border rounded p-1.5 text-xs font-mono">
                            {payload.map((p) => (
                              <p
                                key={p.name}
                                className={
                                  p.name === "longs" ? "text-bear" : "text-bull"
                                }
                              >
                                {p.name}: ${p.value}M
                              </p>
                            ))}
                          </div>
                        );
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="longs"
                    fill="oklch(0.62 0.22 27)"
                    radius={[2, 2, 0, 0]}
                    stackId="a"
                  />
                  <Bar
                    dataKey="shorts"
                    fill="oklch(0.72 0.17 145)"
                    radius={[2, 2, 0, 0]}
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                Exchange Netflows
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={flowData}
                  margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 9,
                      fill: "oklch(0.56 0.015 240)",
                      fontFamily: "JetBrains Mono",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length)
                        return (
                          <div className="bg-popover border border-border rounded p-1.5 text-xs font-mono">
                            {payload.map((p) => (
                              <p
                                key={p.name}
                                className={
                                  Number(p.value) >= 0
                                    ? "text-bear"
                                    : "text-bull"
                                }
                              >
                                {p.name}: {p.value} BTC
                              </p>
                            ))}
                          </div>
                        );
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="netflow"
                    fill="oklch(0.73 0.18 60)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            data-ocid="replay.event.close_button"
            className="font-mono text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EventReplay() {
  const { data: events, isLoading } = useSynchronizedImpulseEvents(20);
  const [selectedEvent, setSelectedEvent] =
    useState<SynchronizedImpulseEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openReplay(event: SynchronizedImpulseEvent) {
    setSelectedEvent(event);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Play className="h-4 w-4" />
            Synchronized Impulse Events — Click to Replay
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {["s1", "s2", "s3", "s4"].map((k) => (
                <div key={k} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Play className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-mono">No events to replay</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-2">
              <div className="space-y-2">
                {events.map((evt, i) => {
                  const isBuy = evt.direction === "buy";
                  const ocid = `replay.event.item.${i + 1}`;
                  return (
                    <button
                      type="button"
                      key={evt.id.toString()}
                      data-ocid={ocid}
                      onClick={() => openReplay(evt)}
                      className="w-full text-left p-3 rounded border border-border bg-background/40 hover:bg-accent/30 hover:border-primary/40 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            {/* Canonical label */}
                            <span className="text-xs font-mono font-bold tracking-wider text-foreground">
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
                              {isBuy ? "BUY" : "SELL"}
                            </Badge>
                            {/* Price change */}
                            <Badge
                              variant="outline"
                              className={`text-xs font-mono ${
                                evt.priceChangePct >= 0
                                  ? "text-bull border-bull/40"
                                  : "text-bear border-bear/40"
                              }`}
                            >
                              {evt.priceChangePct >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(evt.priceChangePct).toFixed(2)}%
                            </Badge>
                            {/* Volume spike */}
                            <Badge
                              variant="outline"
                              className="text-xs font-mono text-warning border-warning/40"
                            >
                              {evt.volumeSpikeFactor.toFixed(1)}× vol
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">
                              {evt.exchanges.join(" · ")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 text-left">
                            {evt.description}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-mono text-muted-foreground">
                            {timeAgo(evt.timestamp)}
                          </div>
                          <div className="text-xs font-mono text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            ▶ Replay
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Replay modal */}
      <ReplayModal
        event={selectedEvent}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* No event selected state */}
      {!modalOpen && (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Play className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-mono">
              Select an event above to view the ±30min replay
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
