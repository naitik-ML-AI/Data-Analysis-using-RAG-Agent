import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { DatasetInfo, ColumnInfo } from "./types";

function inferType(values: unknown[]): string {
  const sample = values.filter(v => v !== null && v !== undefined && v !== "").slice(0, 50);
  if (sample.length === 0) return "unknown";
  const numCount = sample.filter(v => !isNaN(Number(v))).length;
  if (numCount / sample.length > 0.8) return "number";
  const dateCount = sample.filter(v => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / sample.length > 0.8) return "date";
  return "string";
}

export function parseCSV(file: File): Promise<DatasetInfo> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, unknown>[];
        if (!data.length) return reject(new Error("Empty dataset"));
        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => ({
          name,
          type: inferType(data.map(r => r[name])),
          sampleValues: data.slice(0, 5).map(r => String(r[name] ?? "")),
          nullCount: data.filter(r => r[name] === null || r[name] === undefined || r[name] === "").length,
        }));
        resolve({ fileName: file.name, columns, rowCount: data.length, preview: data.slice(0, 100) });
      },
      error: (err) => reject(err),
    });
  });
}

export function parseExcel(file: File): Promise<DatasetInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        if (!data.length) return reject(new Error("Empty dataset"));
        const columns: ColumnInfo[] = Object.keys(data[0]).map(name => ({
          name,
          type: inferType(data.map(r => r[name])),
          sampleValues: data.slice(0, 5).map(r => String(r[name] ?? "")),
          nullCount: data.filter(r => r[name] === null || r[name] === undefined || r[name] === "").length,
        }));
        resolve({ fileName: file.name, columns, rowCount: data.length, preview: data.slice(0, 100) });
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function parseFile(file: File): Promise<DatasetInfo> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return parseCSV(file);
  if (ext === "xlsx" || ext === "xls") return parseExcel(file);
  return Promise.reject(new Error("Unsupported file format. Please upload CSV or Excel files."));
}

export function getSchemaDescription(info: DatasetInfo): string {
  const cols = info.columns.map(c =>
    `- ${c.name} (${c.type}): samples: ${c.sampleValues.slice(0, 3).join(", ")}${c.nullCount > 0 ? ` [${c.nullCount} nulls]` : ""}`
  ).join("\n");
  return `Dataset: "${info.fileName}" with ${info.rowCount} rows and ${info.columns.length} columns:\n${cols}`;
}

export function getFullDataAsString(data: Record<string, unknown>[], maxRows = 200): string {
  const subset = data.slice(0, maxRows);
  if (!subset.length) return "No data";
  const keys = Object.keys(subset[0]);
  const header = keys.join("\t");
  const rows = subset.map(r => keys.map(k => String(r[k] ?? "")).join("\t")).join("\n");
  return `${header}\n${rows}`;
}
