import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span className="text-foreground">AI Data</span>{" "}
          <span className="text-primary">Analyst</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Upload your dataset and ask questions in natural language. Get instant insights, charts, and analysis.
        </p>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer w-full max-w-lg p-12 rounded-xl border-2 border-dashed
          transition-all duration-300
          ${isDragging ? "border-primary bg-primary/5 glow-primary" : "border-border hover:border-primary/50 hover:bg-card/50"}
          ${isLoading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                {isDragging ? <FileSpreadsheet className="w-8 h-8 text-primary" /> : <Upload className="w-8 h-8 text-muted-foreground" />}
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <p className="text-foreground font-medium">
              {isLoading ? "Analyzing your dataset..." : "Drop your file here or click to browse"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">CSV, XLSX, XLS up to 50MB</p>
          </div>
        </div>
      </label>

      <div className="flex gap-3 mt-8">
        {["Sales Data", "Financial Reports", "Survey Results"].map(tag => (
          <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
