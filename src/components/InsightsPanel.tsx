import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, BarChart3, Zap, Loader2 } from "lucide-react";
import type { Insight } from "@/lib/types";

const iconMap = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  summary: BarChart3,
  correlation: Zap,
};

const colorMap = {
  high: "text-chart-green border-chart-green/20 bg-chart-green/5",
  medium: "text-chart-blue border-chart-blue/20 bg-chart-blue/5",
  low: "text-muted-foreground border-border bg-muted/30",
};

interface InsightsPanelProps {
  insights: Insight[];
  isLoading: boolean;
}

export function InsightsPanel({ insights, isLoading }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-6 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm">Generating insights from your data...</span>
      </div>
    );
  }

  if (!insights.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 px-1">
        <Zap className="w-4 h-4 text-primary" />
        Auto Insights
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-lg border p-3 ${colorMap[insight.importance]}`}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">{insight.title}</p>
                  <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
