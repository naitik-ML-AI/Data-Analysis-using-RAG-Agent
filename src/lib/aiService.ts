import type { ChatMessage, ChartData, Insight } from "./types";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-data`;

interface StreamOptions {
  messages: { role: string; content: string }[];
  schema: string;
  data: string;
  mode?: "query" | "insights";
  onDelta: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function streamAnalysis({ messages, schema, data, mode = "query", onDelta, onDone, onError }: StreamOptions) {
  try {
    const resp = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, schema, data, mode }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(err.error || `Error ${resp.status}`);
      return;
    }

    if (!resp.body) { onError("No response body"); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nlIndex: number;
      while ((nlIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nlIndex);
        buffer = buffer.slice(nlIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { onDone(full); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) { full += content; onDelta(content); }
        } catch { /* partial */ }
      }
    }
    onDone(full);
  } catch (e) {
    onError(e instanceof Error ? e.message : "Unknown error");
  }
}

export function parseAIResponse(text: string): { content: string; chart?: ChartData; table?: Record<string, unknown>[]; insights?: Insight[] } {
  let content = text;
  let chart: ChartData | undefined;
  let table: Record<string, unknown>[] | undefined;
  let insights: Insight[] | undefined;

  // Extract chart
  const chartMatch = text.match(/```chart\s*\n?([\s\S]*?)```/);
  if (chartMatch) {
    try { chart = JSON.parse(chartMatch[1]); content = content.replace(chartMatch[0], "").trim(); } catch {}
  }

  // Extract table
  const tableMatch = text.match(/```table\s*\n?([\s\S]*?)```/);
  if (tableMatch) {
    try { table = JSON.parse(tableMatch[1]); content = content.replace(tableMatch[0], "").trim(); } catch {}
  }

  // Extract insights
  const insightsMatch = text.match(/```insights\s*\n?([\s\S]*?)```/);
  if (insightsMatch) {
    try { insights = JSON.parse(insightsMatch[1]); content = content.replace(insightsMatch[0], "").trim(); } catch {}
  }

  return { content, chart, table, insights };
}
