import { motion } from "framer-motion";
import { Table, Database, X } from "lucide-react";
import type { DatasetInfo } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataPreviewProps {
  dataset: DatasetInfo;
  onClose?: () => void;
}

export function DataPreview({ dataset, onClose }: DataPreviewProps) {
  const columns = dataset.columns;
  const rows = dataset.preview.slice(0, 20);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{dataset.fileName}</h3>
            <p className="text-xs text-muted-foreground">{dataset.rowCount} rows · {columns.length} columns</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {columns.slice(0, 3).map(c => (
            <span key={c.name} className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground font-mono">
              {c.name}
            </span>
          ))}
          {columns.length > 3 && <span className="text-xs text-muted-foreground">+{columns.length - 3}</span>}
          {onClose && (
            <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="max-h-64">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map(c => (
                  <th key={c.name} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {c.name}
                    <span className="ml-1 text-primary/60 font-mono text-[10px]">{c.type}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  {columns.map(c => (
                    <td key={c.name} className="px-3 py-1.5 whitespace-nowrap text-foreground/80 font-mono">
                      {String(row[c.name] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
