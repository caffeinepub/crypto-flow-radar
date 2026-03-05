import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLiquidityScore } from "../hooks/useBackendData";

interface GaugeProps {
  score: number;
  compact?: boolean;
}

function getScoreLevel(score: number): {
  label: string;
  fullLabel: string;
  color: string;
  ringColor: string;
  bgColor: string;
  pulse: boolean;
} {
  if (score <= 30)
    return {
      label: "LOW RISK",
      fullLabel: "Low Risk",
      color: "text-bull",
      ringColor: "oklch(0.72 0.17 145)",
      bgColor: "bg-bull/10",
      pulse: false,
    };
  if (score <= 60)
    return {
      label: "MODERATE RISK",
      fullLabel: "Moderate Risk",
      color: "text-warning",
      ringColor: "oklch(0.73 0.18 60)",
      bgColor: "bg-warning/10",
      pulse: false,
    };
  if (score <= 80)
    return {
      label: "ELEVATED RISK",
      fullLabel: "Elevated Risk",
      color: "text-orange-400",
      ringColor: "oklch(0.68 0.2 40)",
      bgColor: "bg-orange-400/10",
      pulse: true,
    };
  return {
    label: "HIGH LIQUIDITY EVENT RISK",
    fullLabel: "High Liquidity Event Risk",
    color: "text-bear",
    ringColor: "oklch(0.62 0.22 27)",
    bgColor: "bg-bear/10",
    pulse: true,
  };
}

export function ScoreArc({ score }: { score: number }) {
  const level = getScoreLevel(score);
  const radius = 64;
  const cx = 80;
  const cy = 80;
  const startAngle = 210;
  const endAngle = 330;
  const totalArc = 360 - startAngle + endAngle;
  const fraction = score / 100;
  const fillArc = fraction * totalArc;

  function polarToCartesian(angle: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(start: number, end: number) {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  const arcEnd = startAngle + fillArc;

  return (
    <svg
      viewBox="0 0 160 140"
      className="w-full max-w-[160px]"
      role="img"
      aria-label={`Liquidity Extraction Score: ${score} out of 100`}
    >
      {/* Track */}
      <path
        d={describeArc(startAngle, startAngle + totalArc)}
        fill="none"
        stroke="oklch(0.28 0.018 255)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Fill */}
      {score > 0 && (
        <path
          d={describeArc(startAngle, Math.min(arcEnd, startAngle + totalArc))}
          fill="none"
          stroke={level.ringColor}
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      {/* Score text */}
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        className="font-mono"
        fill={level.ringColor}
        fontSize="28"
        fontWeight="700"
        fontFamily="JetBrains Mono"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        fill="oklch(0.56 0.015 240)"
        fontSize="9"
        fontFamily="JetBrains Mono"
        letterSpacing="2"
      >
        / 100
      </text>
      <text
        x={cx}
        y={cy + 46}
        textAnchor="middle"
        fill={level.ringColor}
        fontSize="8"
        fontFamily="JetBrains Mono"
        fontWeight="700"
        letterSpacing="3"
      >
        {level.label}
      </text>
    </svg>
  );
}

export default function LiquidityScoreGauge({
  score,
  compact = false,
}: GaugeProps) {
  const level = getScoreLevel(score);

  if (compact) {
    return (
      <div className="flex flex-col items-center w-full">
        <ScoreArc score={score} />
        <div
          className={`text-xs font-mono px-3 py-1 rounded mt-1 ${level.bgColor} ${level.color} border border-current/20 ${level.pulse ? "animate-pulse" : ""}`}
        >
          {level.label}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <ScoreArc score={score} />
    </div>
  );
}

export function LiquidityScorePanel() {
  const { data: liquidityScore, isLoading } = useLiquidityScore();
  const score = Number(liquidityScore?.score ?? 0);
  const level = getScoreLevel(score);

  // 4 components, each 0–25
  const components = [
    {
      label: "Funding Rate",
      value: Number(liquidityScore?.fundingScore ?? 0),
      max: 25,
      description: "Extreme positive/negative funding rates",
    },
    {
      label: "Open Interest",
      value: Number(liquidityScore?.oiScore ?? 0),
      max: 25,
      description: "OI growth rate vs historical baseline",
    },
    {
      label: "Order Book Depth",
      value: Number(liquidityScore?.orderBookScore ?? 0),
      max: 25,
      description: "Thin books within 0.5% of mid price",
    },
    {
      label: "Impulse Events",
      value: Number(liquidityScore?.impulseScore ?? 0),
      max: 25,
      description: "Synchronized cross-exchange impulses",
    },
  ];

  if (isLoading) {
    return (
      <div data-ocid="score.panel" className="space-y-4">
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div data-ocid="score.panel" className="space-y-6">
      {/* Score display */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 flex flex-col items-center">
          <ScoreArc score={score} />
          <div
            className={`text-sm font-mono px-4 py-1.5 rounded mt-2 font-semibold ${level.bgColor} ${level.color} border border-current/20 ${level.pulse ? "animate-pulse" : ""}`}
          >
            {level.fullLabel}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center max-w-xs">
            Liquidity Extraction Risk Score — combines funding rates, open
            interest, order book depth, and synchronized impulse events.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
            Updates every 60s
          </p>
        </CardContent>
      </Card>

      {/* Score range legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            range: "0–30",
            label: "Low Risk",
            color: "text-bull bg-bull/10 border-bull/30",
          },
          {
            range: "31–60",
            label: "Moderate Risk",
            color: "text-warning bg-warning/10 border-warning/30",
          },
          {
            range: "61–80",
            label: "Elevated Risk",
            color: "text-orange-400 bg-orange-400/10 border-orange-400/30",
          },
          {
            range: "81–100",
            label: "High Liquidity Event Risk",
            color: "text-bear bg-bear/10 border-bear/30",
          },
        ].map((item) => (
          <div
            key={item.range}
            className={`rounded px-3 py-2 border text-xs font-mono ${item.color}`}
          >
            <div className="font-bold">{item.range}</div>
            <div className="opacity-80 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Component breakdown — 4 components × 25 points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {components.map((comp) => {
          const pct = (comp.value / comp.max) * 100;
          const compLevel = getScoreLevel((comp.value / comp.max) * 100);
          return (
            <Card key={comp.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wide">
                  {comp.label}
                </div>
                <div
                  className={`text-2xl font-mono font-bold ${compLevel.color} mb-1`}
                >
                  {comp.value}
                  <span className="text-sm text-muted-foreground">
                    /{comp.max}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5 bg-muted" />
                <div className={`text-xs font-mono mt-1.5 ${compLevel.color}`}>
                  {compLevel.label}
                </div>
                <div className="text-xs text-muted-foreground/60 mt-1 font-mono leading-snug">
                  {comp.description}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk indicator */}
      {score > 60 && (
        <Card
          className={`border ${score > 80 ? "border-bear bg-bear/10" : "border-warning bg-warning/10"}`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${score > 80 ? "bg-bear" : "bg-warning"}`}
            />
            <div>
              <div
                className={`text-sm font-mono font-bold ${score > 80 ? "text-bear" : "text-warning"}`}
              >
                {score > 80
                  ? "⚠ HIGH LIQUIDITY EVENT RISK DETECTED"
                  : "⚠ ELEVATED LIQUIDATION RISK"}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Funding elevated + OI rising + thin order books + impulse
                activity. Conditions ripe for extraction event.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
