import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  BookOpen,
  Gauge,
  LayoutDashboard,
  Menu,
  Play,
  RefreshCw,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Alerts from "./components/Alerts";
import Dashboard from "./components/Dashboard";
import EventReplay from "./components/EventReplay";
import ExchangeFlows from "./components/ExchangeFlows";
import ImpulseDetector from "./components/ImpulseDetector";
import LeverageRisk from "./components/LeverageRisk";
import LiquidationTracker from "./components/LiquidationTracker";
import { LiquidityScorePanel } from "./components/LiquidityScoreGauge";
import OrderBook from "./components/OrderBook";
import { useActor } from "./hooks/useActor";
import {
  useAlertTriggers,
  useIsLiveData,
  useLiquidityScore,
  useManualRefresh,
} from "./hooks/useBackendData";

type Section =
  | "dashboard"
  | "flows"
  | "orderbook"
  | "impulse"
  | "leverage"
  | "score"
  | "replay"
  | "alerts"
  | "liquidations";

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    ocid: "nav.dashboard.link",
  },
  {
    id: "flows",
    label: "Exchange Flows",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    ocid: "nav.flows.link",
  },
  {
    id: "orderbook",
    label: "Order Book",
    icon: <BookOpen className="h-4 w-4" />,
    ocid: "nav.orderbook.link",
  },
  {
    id: "impulse",
    label: "Impulse Detector",
    icon: <Zap className="h-4 w-4" />,
    ocid: "nav.impulse.link",
  },
  {
    id: "leverage",
    label: "Leverage Risk",
    icon: <AlertTriangle className="h-4 w-4" />,
    ocid: "nav.leverage.link",
  },
  {
    id: "score",
    label: "Liquidity Score",
    icon: <Gauge className="h-4 w-4" />,
    ocid: "nav.score.link",
  },
  {
    id: "replay",
    label: "Event Replay",
    icon: <Play className="h-4 w-4" />,
    ocid: "nav.replay.link",
  },
  {
    id: "liquidations",
    label: "Liquidations",
    icon: <TrendingDown className="h-4 w-4" />,
    ocid: "nav.liquidations.link",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: <Bell className="h-4 w-4" />,
    ocid: "nav.alerts.link",
  },
];

const SECTION_TITLES: Record<Section, string> = {
  dashboard: "Dashboard",
  flows: "Exchange Flow Monitor",
  orderbook: "Order Book Liquidity",
  impulse: "Market Impulse Detector",
  leverage: "Leverage Risk Monitor",
  score: "Liquidity Extraction Score",
  replay: "Event Replay",
  alerts: "Alert System",
  liquidations: "Liquidation Tracker",
};

function ScoreRiskBadge() {
  const { data: score } = useLiquidityScore();
  const s = Number(score?.score ?? 0);
  if (s <= 30)
    return (
      <Badge className="text-xs font-mono bg-bull/20 text-bull border-bull/40">
        LOW RISK
      </Badge>
    );
  if (s <= 60)
    return (
      <Badge className="text-xs font-mono bg-warning/20 text-warning border-warning/40">
        MODERATE
      </Badge>
    );
  if (s <= 80)
    return (
      <Badge className="text-xs font-mono bg-orange-500/20 text-orange-400 border-orange-400/40 animate-pulse">
        HIGH RISK
      </Badge>
    );
  return (
    <Badge className="text-xs font-mono bg-bear/20 text-bear border-bear/40 animate-pulse">
      CRITICAL
    </Badge>
  );
}

function DataSourceBadge() {
  const { data: isLive } = useIsLiveData();
  if (isLive) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
        <span className="text-xs font-mono text-bull">LIVE</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
      <span className="text-xs font-mono text-muted-foreground">SIM</span>
    </div>
  );
}

function LastUpdated() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-xs font-mono text-muted-foreground">
      {time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
}

export default function App() {
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const refresh = useManualRefresh();
  const { data: triggers } = useAlertTriggers(5);
  const { actor } = useActor();

  // Trigger first live data fetch on mount
  useEffect(() => {
    if (actor) {
      actor.init().catch(() => {
        /* ignore */
      });
    }
  }, [actor]);

  const pendingAlerts = triggers?.length ?? 0;

  async function handleRefresh() {
    try {
      await refresh.mutateAsync();
      toast.success("Data refreshed");
    } catch {
      toast.info("Refreshed (using cached data)");
    }
  }

  function navigateTo(id: Section) {
    setSection(id);
    setSidebarOpen(false);
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-30">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="lg:hidden text-muted-foreground hover:text-foreground"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <Activity className="h-5 w-5 text-bull" />
          <span className="font-display font-bold text-sm tracking-tight text-foreground">
            CRYPTO FLOW RADAR
          </span>
          <Badge
            variant="outline"
            className="text-xs font-mono text-muted-foreground border-border hidden sm:flex"
          >
            BTC
          </Badge>
        </div>

        <div className="flex-1" />

        {/* Status row */}
        <div className="hidden sm:flex items-center gap-3">
          <DataSourceBadge />
          <LastUpdated />
          <ScoreRiskBadge />
        </div>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="sm"
          data-ocid="dashboard.refresh.button"
          onClick={handleRefresh}
          disabled={refresh.isPending}
          className="h-8 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${refresh.isPending ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        {/* Alerts badge */}
        <button
          type="button"
          onClick={() => navigateTo("alerts")}
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Alerts"
        >
          <Bell className="h-5 w-5" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning text-background text-xs flex items-center justify-center font-bold">
              {pendingAlerts}
            </span>
          )}
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence mode="wait">
          <aside
            className={`
              fixed lg:static z-20 inset-y-0 left-0 top-12 lg:top-0
              w-52 bg-sidebar border-r border-sidebar-border flex-shrink-0
              flex flex-col transition-transform duration-200
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
          >
            <ScrollArea className="flex-1">
              <nav className="p-2 space-y-0.5 pt-4">
                {NAV_ITEMS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    data-ocid={item.ocid}
                    onClick={() => navigateTo(item.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-mono transition-all
                      ${
                        section === item.id
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
                      }
                    `}
                  >
                    <span
                      className={
                        section === item.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.id === "alerts" && pendingAlerts > 0 && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-warning text-background text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {pendingAlerts}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </ScrollArea>

            {/* Sidebar footer */}
            <div className="p-3 border-t border-sidebar-border">
              <div className="text-xs font-mono text-muted-foreground/60 text-center">
                30s auto-refresh
              </div>
            </div>
          </aside>
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Section header */}
          <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2 flex-shrink-0">
            <span className="text-muted-foreground">
              {NAV_ITEMS.find((n) => n.id === section)?.icon}
            </span>
            <h1 className="text-sm font-mono font-semibold text-foreground tracking-wide">
              {SECTION_TITLES[section]}
            </h1>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 max-w-[1400px] mx-auto pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {section === "dashboard" && <Dashboard />}
                  {section === "flows" && <ExchangeFlows />}
                  {section === "orderbook" && <OrderBook />}
                  {section === "impulse" && <ImpulseDetector />}
                  {section === "leverage" && <LeverageRisk />}
                  {section === "score" && <LiquidityScorePanel />}
                  {section === "replay" && <EventReplay />}
                  {section === "alerts" && <Alerts />}
                  {section === "liquidations" && <LiquidationTracker />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-border px-4 py-2 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-mono text-muted-foreground/50">
              © {currentYear}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-muted-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </span>
            <div className="flex items-center gap-1.5 sm:hidden">
              <DataSourceBadge />
            </div>
          </footer>
        </main>
      </div>

      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
