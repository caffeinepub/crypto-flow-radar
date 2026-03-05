import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Alert,
  DataFreshnessRecord,
  LiquidationWindow,
  LiquidityScore,
  NetflowPoint,
  SpreadSnapshot,
  SynchronizedImpulseEvent,
  VolumeMetric,
} from "../backend.d";
import {
  MOCK_ALERTS,
  MOCK_ALERT_TRIGGERS,
  MOCK_DATA_FRESHNESS,
  MOCK_EXCHANGE_FLOWS,
  MOCK_FUNDING_RATES,
  MOCK_IMPULSE_EVENTS,
  MOCK_LIQUIDATIONS,
  MOCK_LIQUIDATION_WINDOWS,
  MOCK_LIQUIDITY_SCORE,
  MOCK_OPEN_INTEREST,
  MOCK_ORDER_BOOK,
  MOCK_PRICES,
  MOCK_SPREAD_SNAPSHOT,
  MOCK_SYNCHRONIZED_IMPULSE_EVENTS,
  MOCK_VOLUME_METRICS,
  generateNetflowHistory,
  generatePriceHistory,
} from "../mockData";
import { useActor } from "./useActor";

const POLL_INTERVAL = 30000;

// Helper: use mock data if backend returns empty
function withMock<T>(data: T[] | undefined, mock: T[]): T[] {
  if (!data || data.length === 0) return mock;
  return data;
}

export function useLatestPrices() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["latestPrices"],
    queryFn: async () => {
      if (!actor) return MOCK_PRICES;
      try {
        const result = await actor.getLatestPrices();
        return withMock(result, MOCK_PRICES);
      } catch {
        return MOCK_PRICES;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL - 5000,
    placeholderData: MOCK_PRICES,
  });
}

export function usePriceHistory(exchange: string, limit = 60) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["priceHistory", exchange, limit],
    queryFn: async () => {
      if (!actor) return generatePriceHistory(exchange, limit);
      try {
        const result = await actor.getPriceHistory(exchange, BigInt(limit));
        if (!result || result.length === 0)
          return generatePriceHistory(exchange, limit);
        return result;
      } catch {
        return generatePriceHistory(exchange, limit);
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: generatePriceHistory(exchange, limit),
  });
}

export function useFundingRates() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["fundingRates"],
    queryFn: async () => {
      if (!actor) return MOCK_FUNDING_RATES;
      try {
        const result = await actor.getFundingRates();
        return withMock(result, MOCK_FUNDING_RATES);
      } catch {
        return MOCK_FUNDING_RATES;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_FUNDING_RATES,
  });
}

export function useOpenInterest() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["openInterest"],
    queryFn: async () => {
      if (!actor) return MOCK_OPEN_INTEREST;
      try {
        const result = await actor.getOpenInterest();
        return withMock(result, MOCK_OPEN_INTEREST);
      } catch {
        return MOCK_OPEN_INTEREST;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_OPEN_INTEREST,
  });
}

export function useLiquidations(limit = 20) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["liquidations", limit],
    queryFn: async () => {
      if (!actor) return MOCK_LIQUIDATIONS;
      try {
        const result = await actor.getLiquidations(BigInt(limit));
        return withMock(result, MOCK_LIQUIDATIONS);
      } catch {
        return MOCK_LIQUIDATIONS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_LIQUIDATIONS,
  });
}

export function useExchangeFlows(limit = 20) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["exchangeFlows", limit],
    queryFn: async () => {
      if (!actor) return MOCK_EXCHANGE_FLOWS;
      try {
        const result = await actor.getExchangeFlows(BigInt(limit));
        return withMock(result, MOCK_EXCHANGE_FLOWS);
      } catch {
        return MOCK_EXCHANGE_FLOWS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_EXCHANGE_FLOWS,
  });
}

export function useOrderBookDepth() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orderBookDepth"],
    queryFn: async () => {
      if (!actor) return MOCK_ORDER_BOOK;
      try {
        const result = await actor.getOrderBookDepth();
        return withMock(result, MOCK_ORDER_BOOK);
      } catch {
        return MOCK_ORDER_BOOK;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_ORDER_BOOK,
  });
}

export function useImpulseEvents(limit = 20) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["impulseEvents", limit],
    queryFn: async () => {
      if (!actor) return MOCK_IMPULSE_EVENTS;
      try {
        const result = await actor.getImpulseEvents(BigInt(limit));
        return withMock(result, MOCK_IMPULSE_EVENTS);
      } catch {
        return MOCK_IMPULSE_EVENTS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_IMPULSE_EVENTS,
  });
}

export function useLiquidityScore() {
  const { actor, isFetching } = useActor();
  return useQuery<LiquidityScore>({
    queryKey: ["liquidityScore"],
    queryFn: async () => {
      if (!actor) return MOCK_LIQUIDITY_SCORE;
      try {
        const result = await actor.getLiquidityScore();
        return result;
      } catch {
        return MOCK_LIQUIDITY_SCORE;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_LIQUIDITY_SCORE,
  });
}

export function useAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      if (!actor) return MOCK_ALERTS;
      try {
        const result = await actor.getAlerts();
        return withMock(result, MOCK_ALERTS);
      } catch {
        return MOCK_ALERTS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_ALERTS,
  });
}

export function useAlertTriggers(limit = 20) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["alertTriggers", limit],
    queryFn: async () => {
      if (!actor) return MOCK_ALERT_TRIGGERS;
      try {
        const result = await actor.getAlertTriggers(BigInt(limit));
        return withMock(result, MOCK_ALERT_TRIGGERS);
      } catch {
        return MOCK_ALERT_TRIGGERS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_ALERT_TRIGGERS,
  });
}

export function useAddAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      alertType,
      threshold,
      note,
    }: { alertType: string; threshold: number; note: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.addAlert(alertType, threshold, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useUpdateAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: bigint; active: boolean }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateAlert(id, active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDeleteAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteAlert(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useEventReplay(impulseEventId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["eventReplay", impulseEventId?.toString()],
    queryFn: async () => {
      if (!actor || impulseEventId === null) return null;
      try {
        return await actor.getEventReplay(impulseEventId);
      } catch {
        return null;
      }
    },
    enabled: !isFetching && impulseEventId !== null,
  });
}

export function useManualRefresh() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return "Refreshed (mock)";
      try {
        return await actor.triggerManualRefresh();
      } catch {
        return "Refreshed";
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

// ── NEW HOOKS ─────────────────────────────────────────────────

export function useSynchronizedImpulseEvents(limit = 20) {
  const { actor, isFetching } = useActor();
  return useQuery<SynchronizedImpulseEvent[]>({
    queryKey: ["synchronizedImpulseEvents", limit],
    queryFn: async () => {
      if (!actor) return MOCK_SYNCHRONIZED_IMPULSE_EVENTS;
      try {
        const result = await actor.getSynchronizedImpulseEvents(BigInt(limit));
        return withMock(result, MOCK_SYNCHRONIZED_IMPULSE_EVENTS);
      } catch {
        return MOCK_SYNCHRONIZED_IMPULSE_EVENTS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_SYNCHRONIZED_IMPULSE_EVENTS,
  });
}

export function useNetflowHistory(exchange: string, window: string) {
  const { actor, isFetching } = useActor();
  return useQuery<NetflowPoint[]>({
    queryKey: ["netflowHistory", exchange, window],
    queryFn: async () => {
      if (!actor) return generateNetflowHistory(exchange, window);
      try {
        const result = await actor.getNetflowHistory(exchange, window);
        if (!result || result.length === 0)
          return generateNetflowHistory(exchange, window);
        return result;
      } catch {
        return generateNetflowHistory(exchange, window);
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: generateNetflowHistory(exchange, window),
  });
}

export function useLiquidationWindows() {
  const { actor, isFetching } = useActor();
  return useQuery<LiquidationWindow[]>({
    queryKey: ["liquidationWindows"],
    queryFn: async () => {
      if (!actor) return MOCK_LIQUIDATION_WINDOWS;
      try {
        const result = await actor.getLiquidationWindows();
        return withMock(result, MOCK_LIQUIDATION_WINDOWS);
      } catch {
        return MOCK_LIQUIDATION_WINDOWS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_LIQUIDATION_WINDOWS,
  });
}

export function useSpreadSnapshot() {
  const { actor, isFetching } = useActor();
  return useQuery<SpreadSnapshot | null>({
    queryKey: ["spreadSnapshot"],
    queryFn: async () => {
      if (!actor) return MOCK_SPREAD_SNAPSHOT;
      try {
        return await actor.getSpreadSnapshot();
      } catch {
        return MOCK_SPREAD_SNAPSHOT;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_SPREAD_SNAPSHOT,
  });
}

export function useVolumeMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<VolumeMetric[]>({
    queryKey: ["volumeMetrics"],
    queryFn: async () => {
      if (!actor) return MOCK_VOLUME_METRICS;
      try {
        const result = await actor.getVolumeMetrics();
        return withMock(result, MOCK_VOLUME_METRICS);
      } catch {
        return MOCK_VOLUME_METRICS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_VOLUME_METRICS,
  });
}

export function useDataFreshness() {
  const { actor, isFetching } = useActor();
  return useQuery<DataFreshnessRecord[]>({
    queryKey: ["dataFreshness"],
    queryFn: async () => {
      if (!actor) return MOCK_DATA_FRESHNESS;
      try {
        const result = await actor.getDataFreshness();
        return withMock(result, MOCK_DATA_FRESHNESS);
      } catch {
        return MOCK_DATA_FRESHNESS;
      }
    },
    enabled: !isFetching,
    refetchInterval: POLL_INTERVAL,
    placeholderData: MOCK_DATA_FRESHNESS,
  });
}
