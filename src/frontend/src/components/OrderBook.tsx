import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import { useDataFreshness, useOrderBookDepth } from "../hooks/useBackendData";
import { formatUSD } from "../mockData";
import DataFreshnessBadge from "./DataFreshnessBadge";

const THIN_THRESHOLD = 2000000; // < $2M is thin
const VERY_THIN_THRESHOLD = 1000000; // < $1M is very thin

// 7-day average simulation (in a real system this comes from backend)
const SEVEN_DAY_AVG_05_DEPTH: Record<string, number> = {
  Binance: 68000000,
  Bybit: 34000000,
  Coinbase: 16000000,
  OKX: 9500000,
};

function depthColor(depth: number, threshold = THIN_THRESHOLD) {
  if (depth < VERY_THIN_THRESHOLD) return "text-bear";
  if (depth < threshold) return "text-warning";
  return "text-bull";
}

function depthBg(depth: number) {
  if (depth < VERY_THIN_THRESHOLD) return "bg-bear/10 border-bear/30";
  if (depth < THIN_THRESHOLD) return "bg-warning/10 border-warning/30";
  return "bg-bull/10 border-bull/30";
}

function ImbalanceBar({ bid, ask }: { bid: number; ask: number }) {
  const total = bid + ask;
  const bidPct = total > 0 ? (bid / total) * 100 : 50;
  const imbalance = total > 0 ? (bid - ask) / total : 0;

  // Imbalance badge color
  const imbalanceBadge =
    imbalance > 0.05
      ? "text-bull border-bull/40 bg-bull/10"
      : imbalance < -0.05
        ? "text-bear border-bear/40 bg-bear/10"
        : "text-muted-foreground border-border bg-muted/50";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-bull w-12 text-right">{bidPct.toFixed(1)}%</span>
        <div className="flex-1 h-2 rounded overflow-hidden bg-muted flex">
          <div
            className="bg-bull transition-all"
            style={{ width: `${bidPct}%` }}
          />
          <div className="bg-bear flex-1" />
        </div>
        <span className="text-bear w-12">{(100 - bidPct).toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-muted-foreground text-xs">
          imbalance = (bid − ask) / (bid + ask) =
        </span>
        <Badge
          variant="outline"
          className={`text-xs font-mono px-1.5 py-0 ${imbalanceBadge}`}
        >
          {imbalance > 0 ? "+" : ""}
          {imbalance.toFixed(4)}
        </Badge>
      </div>
    </div>
  );
}

export default function OrderBook() {
  const { data: orderBooks, isLoading } = useOrderBookDepth();
  const { data: freshness } = useDataFreshness();

  const obFreshness = useMemo(() => {
    if (!freshness) return {};
    const map: Record<string, (typeof freshness)[0]> = {};
    for (const f of freshness) {
      if (f.metricName === "orderBook") map[f.exchange] = f;
    }
    return map;
  }, [freshness]);

  const thinExchanges = orderBooks?.filter(
    ([, ob]) =>
      ob.bidDepth01 < THIN_THRESHOLD || ob.askDepth01 < THIN_THRESHOLD,
  );

  // 7-day thin liquidity warning (depth at 0.5% < 60% of 7-day avg)
  const thinLiquidity05 = orderBooks?.filter(([exchange, ob]) => {
    const avg = SEVEN_DAY_AVG_05_DEPTH[exchange] ?? 20000000;
    const total05 = ob.bidDepth05 + ob.askDepth05;
    return total05 < avg * 0.6;
  });

  return (
    <div className="space-y-4">
      {/* 7-day thin liquidity warning */}
      {thinLiquidity05 && thinLiquidity05.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 animate-pulse mt-0.5" />
            <div>
              <div className="text-sm font-mono font-bold text-warning mb-0.5">
                THIN LIQUIDITY DETECTED
              </div>
              {thinLiquidity05.map(([exchange]) => (
                <div
                  key={exchange}
                  className="text-xs text-muted-foreground font-mono"
                >
                  Order book depth at 0.5% is below 60% of 7-day average on{" "}
                  <span className="text-warning">{exchange}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert for thin 0.1% books */}
      {thinExchanges && thinExchanges.length > 0 && (
        <Card className="border-bear/40 bg-bear/5">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-bear flex-shrink-0" />
            <div>
              <span className="text-sm font-mono font-bold text-bear">
                VERY THIN ORDER BOOKS — 0.1% LEVEL
              </span>
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                {thinExchanges.map(([ex]) => ex).join(", ")} — depth below $
                {(THIN_THRESHOLD / 1e6).toFixed(1)}M
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-exchange depth cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading
          ? ["ob1", "ob2", "ob3", "ob4"].map((k) => (
              <div key={k} className="h-48 bg-muted rounded animate-pulse" />
            ))
          : orderBooks?.map(([exchange, ob]) => {
              const isThin =
                ob.bidDepth01 < THIN_THRESHOLD ||
                ob.askDepth01 < THIN_THRESHOLD;
              const fresh = obFreshness[exchange];
              const avg05 = SEVEN_DAY_AVG_05_DEPTH[exchange] ?? 20000000;
              const total05 = ob.bidDepth05 + ob.askDepth05;
              const isThin05 = total05 < avg05 * 0.6;

              // Imbalance at each level
              const imbalance01 =
                ob.bidDepth01 + ob.askDepth01 > 0
                  ? (ob.bidDepth01 - ob.askDepth01) /
                    (ob.bidDepth01 + ob.askDepth01)
                  : 0;

              const imbalanceBadge =
                imbalance01 > 0.05
                  ? "text-bull border-bull/40 bg-bull/10"
                  : imbalance01 < -0.05
                    ? "text-bear border-bear/40 bg-bear/10"
                    : "text-muted-foreground border-border bg-muted/50";

              return (
                <Card
                  key={exchange}
                  className={`bg-card border-border ${isThin || isThin05 ? "border-warning" : ""}`}
                >
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-mono text-muted-foreground uppercase">
                      {exchange} — Order Book Depth
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      {isThin05 && (
                        <Badge className="text-xs bg-warning/20 text-warning border-warning/40">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          THIN 0.5%
                        </Badge>
                      )}
                      {isThin && !isThin05 && (
                        <Badge className="text-xs bg-warning/20 text-warning border-warning/40">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          THIN
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs font-mono ${imbalanceBadge}`}
                      >
                        {imbalance01 > 0.05
                          ? "BID HEAVY"
                          : imbalance01 < -0.05
                            ? "ASK HEAVY"
                            : "BALANCED"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Depth levels table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-muted-foreground pb-1.5">
                              Level
                            </th>
                            <th className="text-right text-bull pb-1.5">
                              Bid Depth
                            </th>
                            <th className="text-right text-bear pb-1.5">
                              Ask Depth
                            </th>
                            <th className="text-right text-muted-foreground pb-1.5">
                              Imbalance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              label: "±0.1%",
                              bid: ob.bidDepth01,
                              ask: ob.askDepth01,
                            },
                            {
                              label: "±0.5%",
                              bid: ob.bidDepth05,
                              ask: ob.askDepth05,
                            },
                            {
                              label: "±1.0%",
                              bid: ob.bidDepth1,
                              ask: ob.askDepth1,
                            },
                          ].map((row) => {
                            const total = row.bid + row.ask;
                            const imb =
                              total > 0 ? (row.bid - row.ask) / total : 0;
                            return (
                              <tr
                                key={row.label}
                                className="border-b border-border/40"
                              >
                                <td className="py-1.5 text-muted-foreground">
                                  {row.label}
                                </td>
                                <td
                                  className={`py-1.5 text-right ${depthColor(row.bid, THIN_THRESHOLD)}`}
                                >
                                  {formatUSD(row.bid)}
                                </td>
                                <td
                                  className={`py-1.5 text-right ${depthColor(row.ask, THIN_THRESHOLD)}`}
                                >
                                  {formatUSD(row.ask)}
                                </td>
                                <td
                                  className={`py-1.5 text-right ${imb > 0 ? "text-bull" : "text-bear"}`}
                                >
                                  {imb > 0 ? "+" : ""}
                                  {imb.toFixed(4)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Imbalance visual with formula */}
                    <div>
                      <div className="text-xs text-muted-foreground font-mono mb-1.5">
                        0.1% Bid/Ask Imbalance
                      </div>
                      <ImbalanceBar bid={ob.bidDepth01} ask={ob.askDepth01} />
                    </div>

                    {/* Health indicator */}
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 rounded border text-xs font-mono ${depthBg(ob.bidDepth01)}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          ob.bidDepth01 < VERY_THIN_THRESHOLD
                            ? "bg-bear animate-pulse"
                            : ob.bidDepth01 < THIN_THRESHOLD
                              ? "bg-warning animate-pulse"
                              : "bg-bull"
                        }`}
                      />
                      <span className={depthColor(ob.bidDepth01)}>
                        {ob.bidDepth01 < VERY_THIN_THRESHOLD
                          ? "VERY THIN — High slippage risk"
                          : ob.bidDepth01 < THIN_THRESHOLD
                            ? "THIN — Elevated slippage"
                            : "HEALTHY — Normal depth"}
                      </span>
                    </div>

                    {/* Data freshness */}
                    {fresh && (
                      <div className="pt-1">
                        <DataFreshnessBadge
                          lastUpdated={fresh.lastUpdated}
                          latencyMs={fresh.latencyMs}
                          isStale={fresh.isStale}
                          exchange={fresh.exchange}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Aggregated depth comparison */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Cross-Exchange Bid/Ask Imbalance — 0.1% Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderBooks?.map(([exchange, ob]) => (
            <div key={exchange}>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-muted-foreground">{exchange}</span>
                <span className="text-muted-foreground">
                  Total: {formatUSD(ob.bidDepth01 + ob.askDepth01)}
                </span>
              </div>
              <ImbalanceBar bid={ob.bidDepth01} ask={ob.askDepth01} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
