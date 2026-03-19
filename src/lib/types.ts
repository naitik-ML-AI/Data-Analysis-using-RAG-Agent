export interface DatasetInfo {
  fileName: string;
  columns: ColumnInfo[];
  rowCount: number;
  preview: Record<string, unknown>[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  sampleValues: string[];
  nullCount: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  chart?: ChartData;
  table?: Record<string, unknown>[];
  timestamp: Date;
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  title: string;
}

export interface Insight {
  title: string;
  description: string;
  type: "trend" | "anomaly" | "summary" | "correlation";
  importance: "high" | "medium" | "low";
}
