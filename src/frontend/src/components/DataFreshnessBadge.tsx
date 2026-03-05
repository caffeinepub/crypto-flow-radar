import { AlertTriangle, Clock } from "lucide-react";

interface DataFreshnessBadgeProps {
  lastUpdated: bigint;
  latencyMs: bigint;
  isStale: boolean;
  exchange?: string;
}

function secondsAgo(ts: bigint): number {
  return Math.floor((Date.now() - Number(ts)) / 1000);
}

export default function DataFreshnessBadge({
  lastUpdated,
  latencyMs,
  isStale,
  exchange,
}: DataFreshnessBadgeProps) {
  const secs = secondsAgo(lastUpdated);

  if (isStale) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono text-warning">
        <AlertTriangle className="h-3 w-3 flex-shrink-0 animate-pulse" />
        STALE ({secs}s ago)
        {exchange ? ` · ${exchange}` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground/70">
      <Clock className="h-3 w-3 flex-shrink-0" />
      {secs}s ago · {Number(latencyMs)}ms
      {exchange ? ` · ${exchange}` : ""}
    </span>
  );
}
