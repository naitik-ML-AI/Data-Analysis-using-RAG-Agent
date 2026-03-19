import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUpload } from "@/components/FileUpload";
import { DataPreview } from "@/components/DataPreview";
import { ChatInterface } from "@/components/ChatInterface";
import { InsightsPanel } from "@/components/InsightsPanel";
import { parseFile, getSchemaDescription, getFullDataAsString } from "@/lib/dataParser";
import { streamAnalysis, parseAIResponse } from "@/lib/aiService";
import type { DatasetInfo, ChatMessage, Insight } from "@/lib/types";
import { toast } from "sonner";
import { Database, MessageSquare, RotateCcw } from "lucide-react";

const Index = () => {
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [fullData, setFullData] = useState<Record<string, unknown>[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const chatHistoryRef = useRef<{ role: string; content: string }[]>([]);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsParsingFile(true);
    try {
      const info = await parseFile(file);
      setDataset(info);
      setFullData(info.preview);
      setMessages([]);
      setInsights([]);
      setShowPreview(true);
      chatHistoryRef.current = [];
      toast.success(`Loaded ${info.fileName}: ${info.rowCount} rows, ${info.columns.length} columns`);

      // Auto-generate insights
      setIsLoadingInsights(true);
      const schema = getSchemaDescription(info);
      const dataStr = getFullDataAsString(info.preview);
      streamAnalysis({
        messages: [{ role: "user", content: "Generate key insights about this dataset." }],
        schema,
        data: dataStr,
        mode: "insights",
        onDelta: () => {},
        onDone: (text) => {
          const parsed = parseAIResponse(text);
          if (parsed.insights) setInsights(parsed.insights);
          setIsLoadingInsights(false);
        },
        onError: (err) => {
          console.error("Insights error:", err);
          setIsLoadingInsights(false);
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsParsingFile(false);
    }
  }, []);

  const handleSendMessage = useCallback((message: string) => {
    if (!dataset) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    chatHistoryRef.current.push({ role: "user", content: message });
    setIsChatLoading(true);
    setFollowUpSuggestions([]);

    const schema = getSchemaDescription(dataset);
    const dataStr = getFullDataAsString(fullData);
    let assistantText = "";

    streamAnalysis({
      messages: chatHistoryRef.current,
      schema,
      data: dataStr,
      mode: "query",
      onDelta: (delta) => {
        assistantText += delta;
        const parsed = parseAIResponse(assistantText);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id.startsWith("stream-")) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: parsed.content, chart: parsed.chart, table: parsed.table } : m);
          }
          return [...prev, {
            id: "stream-" + crypto.randomUUID(),
            role: "assistant",
            content: parsed.content,
            chart: parsed.chart,
            table: parsed.table,
            timestamp: new Date(),
          }];
        });
      },
      onDone: (text) => {
        const parsed = parseAIResponse(text);
        chatHistoryRef.current.push({ role: "assistant", content: text });
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          if (newMsgs[lastIdx]?.role === "assistant") {
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              id: crypto.randomUUID(),
              content: parsed.content,
              chart: parsed.chart,
              table: parsed.table,
            };
          }
          return newMsgs;
        });
        setIsChatLoading(false);

        // Generate contextual follow-up suggestions
        generateFollowUps(message, parsed.content);
      },
      onError: (err) => {
        toast.error(err);
        setIsChatLoading(false);
      },
    });
  }, [dataset, fullData]);

  const generateFollowUps = useCallback((userQuestion: string, aiResponse: string) => {
    if (!dataset) return;
    const schema = getSchemaDescription(dataset);
    const dataStr = getFullDataAsString(fullData, 30);
    streamAnalysis({
      messages: [{
        role: "user",
        content: `Based on this conversation:
User asked: "${userQuestion}"
AI responded: "${aiResponse.slice(0, 500)}"

Generate exactly 4 short follow-up questions the user might want to ask next. Return them as a JSON code block tagged \`\`\`followups
["question 1", "question 2", "question 3", "question 4"]
\`\`\`
Keep each question under 8 words. Make them diverse: one about visualization, one deeper analysis, one comparison, one trend/prediction.`
      }],
      schema,
      data: dataStr,
      mode: "query",
      onDelta: () => {},
      onDone: (text) => {
        const match = text.match(/```followups\s*\n?([\s\S]*?)```/);
        if (match) {
          try {
            const questions = JSON.parse(match[1]);
            if (Array.isArray(questions)) setFollowUpSuggestions(questions.slice(0, 4));
          } catch {}
        }
      },
      onError: () => {},
    });
  }, [dataset, fullData]);

  const handleReset = () => {
    setDataset(null);
    setFullData([]);
    setMessages([]);
    setInsights([]);
    setFollowUpSuggestions([]);
    chatHistoryRef.current = [];
  };

  const suggestedQuestions = dataset ? [
    `What are the top 5 ${dataset.columns[0]?.name || "items"}?`,
    "Show me a trend over time",
    "What anomalies exist in this data?",
    "Summarize this dataset",
    "Explain like I'm 10",
  ] : [];

  if (!dataset) {
    return <FileUpload onFileSelect={handleFileUpload} isLoading={isParsingFile} />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">AI Data Analyst</h1>
            <p className="text-xs text-muted-foreground">{dataset.fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {showPreview ? "Hide" : "Show"} Data
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Upload new dataset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <DataPreview dataset={dataset} onClose={() => setShowPreview(false)} />
                <InsightsPanel insights={insights} isLoading={isLoadingInsights} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            suggestedQuestions={suggestedQuestions}
            followUpSuggestions={followUpSuggestions}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
