import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts";
import type { ChartData } from "@/lib/types";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon } from "lucide-react";

const COLORS = [
  "hsl(160, 84%, 44%)",
  "hsl(200, 80%, 55%)",
  "hsl(30, 90%, 55%)",
  "hsl(270, 70%, 60%)",
  "hsl(0, 72%, 55%)",
  "hsl(45, 90%, 55%)",
  "hsl(320, 70%, 55%)",
];

const CHART_TYPES = [
  { key: "bar" as const, icon: BarChart3, label: "Bar" },
  { key: "line" as const, icon: LineChartIcon, label: "Line" },
  { key: "area" as const, icon: AreaChartIcon, label: "Area" },
  { key: "pie" as const, icon: PieChartIcon, label: "Pie" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

interface ChartDisplayProps {
  chart: ChartData;
}

export function ChartDisplay({ chart }: ChartDisplayProps) {
  const [activeType, setActiveType] = useState(chart.type);
  const { data, xKey, yKeys, title } = chart;

  const axisStyle = { fill: "hsl(215, 12%, 50%)", fontSize: 11, fontFamily: "Space Grotesk" };
  const gridStroke = "hsl(220, 14%, 16%)";

  const renderChart = () => {
    const commonProps = { data, margin: { top: 10, right: 20, left: 0, bottom: 5 } };

    switch (activeType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <defs>
              {yKeys.map((_, i) => (
                <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220, 14%, 12%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={`url(#barGrad${i})`} radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out" />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart {...commonProps}>
            <defs>
              {yKeys.map((_, i) => (
                <filter key={i} id={`glow${i}`}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {yKeys.map((key, i) => (
              <Line
                key={key} type="monotone" dataKey={key}
                stroke={COLORS[i % COLORS.length]} strokeWidth={2.5}
                dot={{ fill: COLORS[i % COLORS.length], r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(220, 18%, 10%)" }}
                filter={`url(#glow${i})`}
                animationDuration={1000} animationEasing="ease-out"
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              {yKeys.map((_, i) => (
                <linearGradient key={i} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey={xKey} tick={axisStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {yKeys.map((key, i) => (
              <Area
                key={key} type="monotone" dataKey={key}
                stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                fill={`url(#areaGrad${i})`}
                animationDuration={1000} animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <defs>
              {data.map((_, i) => (
                <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data} dataKey={yKeys[0]} nameKey={xKey}
              cx="50%" cy="50%" outerRadius={90} innerRadius={40}
              paddingAngle={3} cornerRadius={4}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "hsl(215, 12%, 40%)" }}
              animationDuration={800} animationEasing="ease-out"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`url(#pieGrad${i})`} stroke="hsl(220, 18%, 10%)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header with chart type switcher */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
          {CHART_TYPES.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              title={label}
              className={`p-1.5 rounded-md transition-all duration-200 ${
                activeType === key
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
