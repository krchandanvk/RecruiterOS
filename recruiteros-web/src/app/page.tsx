"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { QueueManager } from "@/components/QueueManager";
import { DashboardGrid } from "@/components/DashboardGrid";
import { Candidate360 } from "@/components/Candidate360";
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  FileSearch2, 
  BriefcaseBusiness 
} from "lucide-react";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/candidates");
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    // Poll candidates list less aggressively than queue (every 5s)
    const interval = setInterval(fetchCandidates, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 glass-panel p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/20 shadow-md">
            <BriefcaseBusiness className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent sm:text-2xl">
              RecruiterOS
            </h1>
            <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
              Talent Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Data button */}
          <button
            onClick={() => {
              setLoading(true);
              fetchCandidates();
            }}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-black/35 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all"
            title="Refresh candidate data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Theme toggler */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-black/35 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Queue Monitor section */}
      <QueueManager onQueueUpdate={fetchCandidates} />

      {/* Grid section */}
      <main className="flex-1 min-h-0 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileSearch2 className="w-4 h-4 text-blue-500" />
            Candidate Intelligence Grid
          </h2>
          <span className="text-xs text-muted-foreground font-semibold bg-white/5 dark:bg-black/20 border border-white/5 px-2.5 py-0.5 rounded-full">
            {candidates.length} Candidate(s) loaded
          </span>
        </div>

        <DashboardGrid 
          candidates={candidates} 
          onRowClick={(candidate) => setSelectedCandidate(candidate)} 
        />
      </main>

      {/* Candidate 360 detailed drawer view */}
      {selectedCandidate && (
        <Candidate360
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onNoteAdded={fetchCandidates}
        />
      )}
    </div>
  );
}
