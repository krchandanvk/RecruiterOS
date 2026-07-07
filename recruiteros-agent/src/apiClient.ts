import { config } from "./config.js";

/**
 * Handles all REST API communications with the local recruiteros-web Next.js server.
 */
export const apiClient = {
  /**
   * Fetches the next profile URL from the processing queue.
   */
  async fetchNextJob(): Promise<{ command: string; job?: any; message?: string }> {
    try {
      const res = await fetch(`${config.apiBaseUrl}/agent/job`);
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }
      return (await res.json()) as { command: string; job?: any; message?: string };
    } catch (error: any) {
      console.error("apiClient.fetchNextJob failed:", error.message);
      return { command: "pause", message: "Failed to connect to local Next.js API server." };
    }
  },

  /**
   * Submits fully normalized candidate intelligence and AI summaries.
   */
  async submitJobSuccess(payload: {
    queueId: string;
    candidate: any;
    experiences: any[];
    education: any[];
    certifications: any[];
    projects: any[];
    skills: any[];
    emails: any[];
  }): Promise<boolean> {
    try {
      const res = await fetch(`${config.apiBaseUrl}/agent/job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = (await res.json()) as any;
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      console.log(`Successfully saved candidate intelligence for: ${payload.candidate.fullName}`);
      return true;
    } catch (error: any) {
      console.error("apiClient.submitJobSuccess failed:", error.message);
      return false;
    }
  },

  /**
   * Reports a job failure, updating status to RETRY or FAILED.
   */
  async submitJobFailure(queueId: string, errorMsg: string): Promise<void> {
    try {
      const res = await fetch(`${config.apiBaseUrl}/agent/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, error: errorMsg }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        console.log(`Job failed. Status transitioned to: ${data.status} (Retry Count: ${data.retryCount})`);
      }
    } catch (error: any) {
      console.error("apiClient.submitJobFailure failed:", error.message);
    }
  },

  /**
   * Registers heartbeat, reports progress details, and checks if control has changed.
   */
  async sendHeartbeat(progressPercent: number, eta: string | null): Promise<string> {
    try {
      const res = await fetch(`${config.apiBaseUrl}/agent/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressPercent, eta }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        return data.status; // Returns "running", "paused", or "stopped"
      }
      return "stopped";
    } catch (error: any) {
      console.error("apiClient.sendHeartbeat failed:", error.message);
      return "paused"; // Fallback to pause loops on network disconnects
    }
  }
};
export default apiClient;
