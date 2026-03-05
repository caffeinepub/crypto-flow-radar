import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Bell, BellRing, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddAlert,
  useAlertTriggers,
  useAlerts,
  useDeleteAlert,
  useUpdateAlert,
} from "../hooks/useBackendData";
import { formatTimestamp } from "../mockData";

const ALERT_TYPES = [
  { value: "funding_rate", label: "Funding Rate" },
  { value: "open_interest", label: "Open Interest Spike" },
  { value: "exchange_inflow", label: "Exchange Inflow Spike" },
  { value: "liquidation_burst", label: "Liquidation Burst" },
  { value: "thin_order_book", label: "Thin Order Book" },
];

const ALERT_TYPE_DESCRIPTIONS: Record<string, string> = {
  funding_rate:
    "Triggers when funding rate exceeds threshold (e.g. 0.001 = 0.1%)",
  open_interest:
    "Triggers when total OI exceeds threshold in USD (e.g. 16000000000 = $16B)",
  exchange_inflow: "Triggers when inflow to exchange exceeds threshold in BTC",
  liquidation_burst: "Triggers when liquidations exceed threshold in USD",
  thin_order_book:
    "Triggers when 0.1% order book depth drops below threshold in USD",
};

function AlertTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    funding_rate: "📈",
    open_interest: "💹",
    exchange_inflow: "🏦",
    liquidation_burst: "💥",
    thin_order_book: "📊",
  };
  return <span className="text-sm">{icons[type] ?? "🔔"}</span>;
}

export default function Alerts() {
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: triggers } = useAlertTriggers(20);
  const addAlert = useAddAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  const [alertType, setAlertType] = useState("funding_rate");
  const [threshold, setThreshold] = useState("");
  const [note, setNote] = useState("");

  async function handleAddAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!threshold) return;
    try {
      await addAlert.mutateAsync({
        alertType,
        threshold: Number.parseFloat(threshold),
        note,
      });
      setThreshold("");
      setNote("");
      toast.success("Alert created successfully");
    } catch {
      toast.error("Failed to create alert");
    }
  }

  async function handleToggle(id: bigint, active: boolean) {
    try {
      await updateAlert.mutateAsync({ id, active });
    } catch {
      toast.error("Failed to update alert");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteAlert.mutateAsync(id);
      toast.success("Alert deleted");
    } catch {
      toast.error("Failed to delete alert");
    }
  }

  const recentTriggers = triggers?.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Notification panel */}
      {recentTriggers && recentTriggers.length > 0 && (
        <Card className="bg-card border-warning/40">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <BellRing className="h-4 w-4 text-warning animate-pulse" />
            <CardTitle className="text-sm font-mono text-warning uppercase tracking-wider">
              Recent Alert Triggers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentTriggers.map((trigger, i) => (
              <div
                key={`trigger-${trigger.alertId.toString()}-${i}`}
                data-ocid={`alerts.item.${i + 1}`}
                className="flex items-start gap-2 p-2 rounded bg-warning/10 border border-warning/20"
              >
                <BellRing className="h-3.5 w-3.5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-foreground">
                    {trigger.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {formatTimestamp(trigger.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create alert form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAlert} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Alert Type
                </Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger
                    data-ocid="alerts.type.select"
                    className="bg-background border-border font-mono text-sm h-9"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {ALERT_TYPES.map((t) => (
                      <SelectItem
                        key={t.value}
                        value={t.value}
                        className="font-mono text-sm"
                      >
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {alertType && (
                  <p className="text-xs text-muted-foreground">
                    {ALERT_TYPE_DESCRIPTIONS[alertType]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground uppercase">
                  Threshold
                </Label>
                <Input
                  data-ocid="alerts.threshold.input"
                  type="number"
                  step="any"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder={
                    alertType === "funding_rate"
                      ? "0.001"
                      : alertType === "open_interest"
                        ? "16000000000"
                        : alertType === "exchange_inflow"
                          ? "3000"
                          : alertType === "liquidation_burst"
                            ? "5000000"
                            : "1000000"
                  }
                  className="bg-background border-border font-mono text-sm h-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground uppercase">
                Note (optional)
              </Label>
              <Input
                data-ocid="alerts.note.input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. High funding — potential squeeze incoming"
                className="bg-background border-border font-mono text-sm h-9"
              />
            </div>

            <Button
              type="submit"
              data-ocid="alerts.add.submit_button"
              disabled={addAlert.isPending || !threshold}
              className="font-mono text-sm"
            >
              {addAlert.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-current/40 border-t-current rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Create Alert
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active alerts list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div data-ocid="alerts.loading_state" className="space-y-3">
              {["sk1", "sk2", "sk3"].map((k) => (
                <Skeleton key={k} className="h-16 bg-muted" />
              ))}
            </div>
          ) : !alerts || alerts.length === 0 ? (
            <div
              data-ocid="alerts.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-mono">No alerts configured</p>
              <p className="text-xs mt-1 opacity-60">
                Create an alert above to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, i) => {
                const typeLabel =
                  ALERT_TYPES.find((t) => t.value === alert.alertType)?.label ??
                  alert.alertType;
                const idx = i + 1;
                return (
                  <div
                    key={alert.id.toString()}
                    data-ocid={`alerts.item.${idx}`}
                    className={`flex items-center gap-3 p-3 rounded border transition-all ${
                      alert.active
                        ? "border-border bg-background/40"
                        : "border-border/40 bg-background/20 opacity-60"
                    }`}
                  >
                    <AlertTypeIcon type={alert.alertType} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-semibold text-foreground">
                          {typeLabel}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${alert.active ? "text-bull border-bull/40" : "text-muted-foreground"}`}
                        >
                          {alert.active ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Threshold: {alert.threshold.toLocaleString()} ·{" "}
                        {alert.note || "No note"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Switch
                        data-ocid={`alerts.toggle.${idx}`}
                        checked={alert.active}
                        onCheckedChange={(active) =>
                          handleToggle(alert.id, active)
                        }
                        disabled={updateAlert.isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`alerts.delete_button.${idx}`}
                        onClick={() => handleDelete(alert.id)}
                        disabled={deleteAlert.isPending}
                        className="h-7 w-7 text-muted-foreground hover:text-bear hover:bg-bear/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trigger history */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Alert Trigger History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!triggers || triggers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs font-mono">
              No trigger history
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-muted-foreground pb-2 pr-4">
                      Time
                    </th>
                    <th className="text-left text-muted-foreground pb-2 pr-4">
                      Alert ID
                    </th>
                    <th className="text-left text-muted-foreground pb-2">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map((t, i) => (
                    <tr
                      key={`${t.alertId.toString()}-${i}`}
                      className="border-b border-border/40"
                    >
                      <td className="py-1.5 pr-4 text-muted-foreground">
                        {formatTimestamp(t.timestamp)}
                      </td>
                      <td className="py-1.5 pr-4 text-muted-foreground">
                        #{t.alertId.toString()}
                      </td>
                      <td className="py-1.5 text-foreground">{t.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
