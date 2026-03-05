import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  TrendingUp,
} from "lucide-react";
import { useLatestPrices, useSpreadSnapshot } from "../hooks/useBackendData";

export default function SpreadMonitor() {
  const { data: prices } = useLatestPrices();
  const { data: spread } = useSpreadSnapshot();

  if (!prices || prices.length === 0) return null;

  const allPrices = prices.map(([, p]) => p);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

  const isAbnormal = spread?.isAbnormal ?? false;
  const spreadPct =
    spread?.spreadPct ?? ((maxPrice - minPrice) / avgPrice) * 100;

  return (
    <Card
      data-ocid="spread.panel"
      className={`bg-card border-border ${isAbnormal ? "border-warning" : ""}`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Price Spread Monitor
        </CardTitle>
        <div className="flex items-center gap-2">
          {isAbnormal ? (
            <Badge className="text-xs font-mono bg-warning/20 text-warning border-warning/40 animate-pulse flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              SPREAD ALERT
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className={`text-xs font-mono ${
                spreadPct > 0.2
                  ? "text-warning border-warning/40"
                  : "text-bull border-bull/40"
              }`}
            >
              SPREAD: {spreadPct.toFixed(3)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAbnormal && (
          <div className="mb-3 px-3 py-2 rounded bg-warning/10 border border-warning/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 animate-pulse" />
            <span className="text-xs font-mono text-warning">
              Cross-exchange spread exceeds 0.3% — arbitrage opportunity or
              liquidity fragmentation detected
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {prices.map(([exchange, price]) => {
            const isHigh =
              exchange === spread?.highestExchange || price === maxPrice;
            const isLow =
              exchange === spread?.lowestExchange || price === minPrice;
            const diffFromAvg = ((price - avgPrice) / avgPrice) * 100;

            return (
              <div
                key={exchange}
                className={`rounded p-2.5 border ${
                  isHigh
                    ? "border-bull/40 bg-bull/5"
                    : isLow
                      ? "border-bear/40 bg-bear/5"
                      : "border-border bg-background/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                    {exchange}
                  </span>
                  {isHigh ? (
                    <ArrowUpRight className="h-3 w-3 text-bull" />
                  ) : isLow ? (
                    <ArrowDownRight className="h-3 w-3 text-bear" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`font-mono text-sm font-semibold ${
                    isHigh
                      ? "text-bull"
                      : isLow
                        ? "text-bear"
                        : "text-foreground"
                  }`}
                >
                  $
                  {price.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </div>
                <div
                  className={`text-xs font-mono mt-0.5 ${
                    diffFromAvg > 0
                      ? "text-bull"
                      : diffFromAvg < 0
                        ? "text-bear"
                        : "text-muted-foreground"
                  }`}
                >
                  {diffFromAvg > 0 ? "+" : ""}
                  {diffFromAvg.toFixed(3)}%
                </div>
                {isHigh && (
                  <span className="text-xs font-mono text-bull/70">
                    HIGHEST
                  </span>
                )}
                {isLow && (
                  <span className="text-xs font-mono text-bear/70">LOWEST</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Spread summary row */}
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Highest:</span>
            <span className="text-bull">
              {spread?.highestExchange ?? "—"} ($
              {(spread?.highestPrice ?? maxPrice).toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              )
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Lowest:</span>
            <span className="text-bear">
              {spread?.lowestExchange ?? "—"} ($
              {(spread?.lowestPrice ?? minPrice).toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              )
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Spread:</span>
            <span className={isAbnormal ? "text-warning" : "text-foreground"}>
              {spreadPct.toFixed(4)}%
            </span>
          </div>
          {isAbnormal && (
            <Badge className="text-xs bg-warning/20 text-warning border-warning/40">
              ABOVE 0.3% THRESHOLD
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
