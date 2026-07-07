"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  FileSpreadsheet,
  Clock
} from "lucide-react";

interface QueueStats {
  counts: {
    PENDING: number;
    RUNNING: number;
    COMPLETED: number;
    FAILED: number;
    RETRY: number;
    SKIPPED: number;
  };
  total: number;
  agent: {
    status: string;
    currentQueueId: string | null;
    activeUrl: string | null;
    lastHeartbeat: string | null;
    progressPercent: number;
    eta: string | null;
    updatedAt: string;
  };
}

interface QueueManagerProps {
  onQueueUpdate?: () => void;
}

export function QueueManager({ onQueueUpdate }: QueueManagerProps) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/queue/status");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch queue stats", err);
    }
  };

  // Poll queue stats every 1.5 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleControl = async (action: "start" | "pause" | "stop" | "retry_failed") => {
    setLoading(true);
    try {
      const res = await fetch("/api/queue/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchStats();
        if (onQueueUpdate) onQueueUpdate();
      }
    } catch (err) {
      console.error(`Failed to trigger ${action}`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/queue/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadMessage({
          type: "success",
          text: data.message || "File uploaded successfully!"
        });
        fetchStats();
        if (onQueueUpdate) onQueueUpdate();
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setUploadMessage({
          type: "error",
          text: data.error || "Failed to process CSV file."
        });
      }
    } catch (err) {
      setUploadMessage({
        type: "error",
        text: "Error uploading CSV. Please try again."
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper to parse dates
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Helper to check if agent is offline (no heartbeat in 15 seconds)
  const isAgentOffline = () => {
    if (!stats?.agent.lastHeartbeat) return true;
    const last = new Date(stats.agent.lastHeartbeat).getTime();
    const now = new Date().getTime();
    return now - last > 15000; // 15 seconds threshold
  };

  const counts = stats?.counts || {
    PENDING: 0,
    RUNNING: 0,
    COMPLETED: 0,
    FAILED: 0,
    RETRY: 0,
    SKIPPED: 0
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
      {/* Upload & Controls Panel */}
      <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            Upload Queue
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Upload CSV containing LinkedIn profile URLs to process candidate intelligence.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            ref={fileInputRef}
            className="hidden"
            id="csv-file-upload"
          />

          <label
            htmlFor="csv-file-upload"
            className="flex items-center justify-center gap-2 border border-dashed border-border hover:border-blue-500 rounded-lg p-4 cursor-pointer text-sm font-medium transition-colors bg-white/5 hover:bg-white/10 dark:bg-black/20 dark:hover:bg-black/30"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : (
              <Upload className="w-4 h-4 text-blue-500" />
            )}
            {uploading ? "Processing CSV..." : "Choose CSV File"}
          </label>

          {uploadMessage && (
            <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
              uploadMessage.type === "success" 
                ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" 
                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            }`}>
              {uploadMessage.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              <span>{uploadMessage.text}</span>
            </div>
          )}
        </div>

        <div className="border-t border-border mt-4 pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Automation Controls
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats?.agent.status !== "running" ? (
              <button
                onClick={() => handleControl("start")}
                disabled={loading || counts.PENDING + counts.RETRY === 0}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-600/80 text-white rounded-lg py-2 px-3 text-xs font-semibold transition-all backdrop-blur-sm shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start
              </button>
            ) : (
              <button
                onClick={() => handleControl("pause")}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg py-2 px-3 text-xs font-semibold transition-all backdrop-blur-sm shadow-md"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </button>
            )}

            <button
              onClick={() => handleControl("stop")}
              disabled={loading || stats?.agent.status === "stopped"}
              className="flex-1 flex items-center justify-center gap-1 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-600/80 text-white rounded-lg py-2 px-3 text-xs font-semibold transition-all backdrop-blur-sm shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>

            {counts.FAILED + counts.SKIPPED > 0 && (
              <button
                onClick={() => handleControl("retry_failed")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 dark:bg-black/40 dark:hover:bg-black/60 border border-white/10 rounded-lg py-2 px-3 text-xs font-semibold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Retry Failed ({counts.FAILED + counts.SKIPPED})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Monitor Panel */}
      <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Agent Live Monitor
            </h2>
            {stats && (
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isAgentOffline() 
                    ? "bg-red-500" 
                    : stats.agent.status === "running"
                      ? "bg-green-500 animate-pulse"
                      : stats.agent.status === "paused"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-gray-400"
                }`} />
                <span className="text-xs font-medium uppercase tracking-wide">
                  {isAgentOffline() 
                    ? "Offline" 
                    : `${stats.agent.status}`}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground text-xs">Active Profile</span>
              <span className="font-mono text-xs font-semibold max-w-[250px] truncate" title={stats?.agent.activeUrl || "None"}>
                {stats?.agent.activeUrl ? stats.agent.activeUrl.replace("https://www.linkedin.com/in/", "") : "None"}
              </span>
            </div>

            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground text-xs">Last Heartbeat</span>
              <span className="text-xs font-semibold font-mono">
                {formatTime(stats?.agent.lastHeartbeat || null)}
              </span>
            </div>

            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground text-xs">Estimated Completion (ETA)</span>
              <span className="text-xs font-semibold font-mono text-blue-500">
                {stats?.agent.eta ? formatTime(stats.agent.eta) : "Calculating..."}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5 font-semibold">
            <span>Profile Extraction Progress</span>
            <span>{stats?.agent.progressPercent || 0}%</span>
          </div>
          <div className="w-full bg-white/10 dark:bg-black/35 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${stats?.agent.progressPercent || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Breakdown Card */}
      <div className="lg:col-span-1 glass-panel rounded-xl p-5 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-3">Queue Summary</h2>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white/5 dark:bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-foreground">{counts.PENDING}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Pending</div>
            </div>
            <div className="bg-white/5 dark:bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-blue-500">{counts.RUNNING}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Running</div>
            </div>
            <div className="bg-white/5 dark:bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-green-500">{counts.COMPLETED}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Completed</div>
            </div>
            <div className="bg-white/5 dark:bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-red-500">{counts.FAILED}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Failed</div>
            </div>
            <div className="bg-white/5 dark:bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-amber-500">{counts.RETRY}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Retrying</div>
            </div>
            <div className="bg-white/5 dark:bg-black/25 rounded-lg p-2 border border-white/5">
              <div className="text-lg font-bold text-gray-500">{counts.SKIPPED}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Skipped</div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs font-semibold mt-3 pt-3 border-t border-border flex justify-between">
          <span className="text-muted-foreground">Total In Queue</span>
          <span>{stats?.total || 0} URL(s)</span>
        </div>
      </div>
    </div>
  );
}
