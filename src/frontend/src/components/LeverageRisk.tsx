import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useFundingRates,
  useLiquidations,
  useLiquidityScore,
  useOpenInterest,
} from "../hooks/useBackendData";
import {
  formatUSD,
  generateFundingHeatmapData,
  generateLiquidationData,
  generateOIData,
} from "../mockData";

function HeatmapCell({ rate }: { rate: number }) {
  const abs = Math.abs(rate);
  const isPos = rate > 0;
  const intensity = Math.min(1, abs / 0.003);

  const bg = isPos
    ? `oklch(${0.3 + intensity * 0.35} ${0.05 + intensity * 0.2} 27 / ${0.2 + intensity * 0.7})`
    : `oklch(${0.3 + intensity * 0.35} ${0.05 + intensity * 0.15} 230 / ${0.2 + intensity * 0.7})`;

  const textColor =
    intensity > 0.5 ? "oklch(0.95 0.01 220)" : "oklch(0.65 0.015 240)";

  return (
    <div
      className="flex items-center justify-center text-xs font-mono rounded"
      style={{
        background: bg,
        color: textColor,
        padding: "4px 2px",
        minHeight: "28px",
      }}
    >
      {rate > 0 ? "+" : ""}
      {(rate * 100).toFixed(3)}%
    </div>
  );
}

export default function LeverageRisk() {
  const { data: fundingRates } = useFundingRates();
  const { data: openInterest } = useOpenInterest();
  const { data: liquidations } = useLiquidations(30);
  const { data: liquidityScore } = useLiquidityScore();

  const oiData = useMemo(() => generateOIData(), []);
  const liqData = useMemo(() => generateLiquidationData(), []);
  const heatmapData = useMemo(() => generateFundingHeatmapData(), []);

  const totalOI = useMemo(() => {
    if (!openInterest) return 0;
    return openInterest.reduce((sum, [, oi]) => sum + oi, 0);
  }, [openInterest]);

  const longLiqs = useMemo(
    () =>
      liquidations
        ?.filter((l) => l.side === "long")
        .reduce((s, l) => s + l.amountUSD, 0) ?? 0,
    [liquidations],
  );
  const shortLiqs = useMemo(
    () =>
      liquidations
        ?.filter((l) => l.side === "short")
        .reduce((s, l) => s + l.amountUSD, 0) ?? 0,
    [liquidations],
  );
  const totalLiqs = longLiqs + shortLiqs;
  const longPct = totalLiqs > 0 ? (longLiqs / totalLiqs) * 100 : 50;

  const avgFunding = useMemo(() => {
    if (!fundingRates || fundingRates.length === 0) return 0;
    return fundingRates.reduce((s, [, r]) => s + r, 0) / fundingRates.length;
  }, [fundingRates]);

  const isHighRisk = Number(liquidityScore?.score ?? 0) > 60;

  return (
    <div className="space-y-4">
      {/* High risk banner */}
      {isHighRisk && (
        <Card className="border-bear bg-bear/10 animate-pulse">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-bear flex-shrink-0" />
            <div>
              <div className="text-sm font-mono font-bold text-bear">
                HIGH LIQUIDATION RISK
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Funding rates elevated · Open interest rising · Order books thin
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs font-mono text-muted-foreground mb-1 uppercase">
              Avg Funding
            </div>
            <div
              className={`text-xl font-mono font-bold ${avgFunding > 0.0005 ? "text-bear" : "text-bull"}`}
            >
              {avgFunding > 0 ? "+" : ""}
              {(avgFunding * 100).toFixed(4)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">per 8h</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs font-mono text-muted-foreground mb-1 uppercase">
              Total OI
            </div>
            <div className="text-xl font-mono font-bold text-foreground">
              {formatUSD(totalOI)}
            </div>
            <div className="text-xs text-bull mt-1">+2.4% 24h ↑</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs font-mono text-muted-foreground mb-1 uppercase">
              Long Liqs
            </div>
            <div className="text-xl font-mono font-bold text-bear">
              {formatUSD(longLiqs)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">last 24h</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs font-mono text-muted-foreground mb-1 uppercase">
              Short Liqs
            </div>
            <div className="text-xl font-mono font-bold text-bull">
              {formatUSD(shortLiqs)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">last 24h</div>
          </CardContent>
        </Card>
      </div>

      {/* Funding heatmap */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Funding Rate Heatmap (Exchange × Time)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Header row */}
              <div className="flex gap-1 mb-1 pl-24">
                {heatmapData[0]?.rates.map((r) => (
                  <div
                    key={r.time}
                    className="flex-1 text-center text-xs font-mono text-muted-foreground truncate"
                  >
                    {r.time}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {heatmapData.map((row) => (
                <div
                  key={row.exchange}
                  className="flex items-center gap-1 mb-1"
                >
                  <div className="w-24 text-xs font-mono text-muted-foreground flex-shrink-0 pr-2 text-right">
                    {row.exchange}
                  </div>
                  {row.rates.map((r) => (
                    <div key={r.time} className="flex-1">
                      <HeatmapCell rate={r.rate} />
                    </div>
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 pl-24 text-xs font-mono">
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ background: "oklch(0.5 0.18 27 / 0.8)" }}
                  />
                  <span className="text-muted-foreground">
                    High Positive (longs pay)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ background: "oklch(0.5 0.12 230 / 0.8)" }}
                  />
                  <span className="text-muted-foreground">
                    Negative (shorts pay)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OI chart + Long/Short ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OI Growth */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Open Interest Growth (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={oiData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
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
                  interval={5}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: "oklch(0.56 0.015 240)",
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}M`}
                  width={52}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-popover border border-border rounded p-2">
                          <p className="text-xs font-mono text-foreground">
                            ${payload[0].value}M
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="oi"
                  stroke="oklch(0.73 0.18 60)"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Long/Short + Liq clusters */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Liquidation Clusters (Hourly)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={liqData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
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
                  interval={3}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: "oklch(0.56 0.015 240)",
                    fontFamily: "JetBrains Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-popover border border-border rounded p-2 text-xs font-mono">
                          <p className="text-muted-foreground mb-1">{label}</p>
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
                />
                <Bar
                  dataKey="longs"
                  name="longs"
                  fill="oklch(0.62 0.22 27)"
                  radius={[2, 2, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="shorts"
                  name="shorts"
                  fill="oklch(0.72 0.17 145)"
                  radius={[2, 2, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Long/Short ratio */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Long / Short Liquidation Ratio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-bear w-24 text-right">
              {longPct.toFixed(1)}% Longs
            </span>
            <div className="flex-1 h-6 rounded overflow-hidden bg-muted flex">
              <div
                className="bg-bear flex items-center justify-center text-xs font-mono text-white transition-all"
                style={{ width: `${longPct}%` }}
              >
                {longPct > 30 && "LONG"}
              </div>
              <div className="flex-1 bg-bull flex items-center justify-center text-xs font-mono text-white">
                {100 - longPct > 30 && "SHORT"}
              </div>
            </div>
            <span className="text-xs font-mono text-bull w-24">
              {(100 - longPct).toFixed(1)}% Shorts
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono text-center">
            {longPct > 65
              ? "⚠ Long-heavy — downside liquidation cascade risk"
              : longPct < 35
                ? "⚠ Short-heavy — short squeeze potential"
                : "Balanced liquidation exposure"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
