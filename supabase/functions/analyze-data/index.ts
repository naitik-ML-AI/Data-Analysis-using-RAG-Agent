import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, schema, data, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert data analyst AI agent. You analyze datasets and provide insights, explanations, and chart specifications.

DATASET SCHEMA:
${schema}

ACTUAL DATA (tab-separated):
${data}

RULES:
1. When asked a question, analyze the data thoroughly.
2. If a visualization would help, include a JSON chart spec in a code block tagged \`\`\`chart ... \`\`\` with this exact format:
{"type":"bar|line|pie|area","data":[{"label":"A","value":10}],"xKey":"label","yKeys":["value"],"title":"Chart Title"}
3. If returning tabular results, include a JSON block tagged \`\`\`table ... \`\`\` with an array of row objects.
4. Always provide clear explanations with your analysis.
5. Support follow-up questions using conversation context.
6. When asked to "explain like I'm 10" or "beginner mode", simplify drastically.
${mode === "insights" ? `
TASK: Generate 3-5 key insights about this dataset. Return them as a JSON code block tagged \`\`\`insights ... \`\`\` with format:
[{"title":"...","description":"...","type":"trend|anomaly|summary|correlation","importance":"high|medium|low"}]
Focus on: trends, outliers, key statistics, correlations, and notable patterns.` : ""}`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
