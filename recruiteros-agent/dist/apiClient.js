"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
const config_js_1 = require("./config.js");
/**
 * Handles all REST API communications with the local recruiteros-web Next.js server.
 */
exports.apiClient = {
    /**
     * Fetches the next profile URL from the processing queue.
     */
    async fetchNextJob() {
        try {
            const res = await fetch(`${config_js_1.config.apiBaseUrl}/agent/job`);
            if (!res.ok) {
                throw new Error(`Server returned status: ${res.status}`);
            }
            return (await res.json());
        }
        catch (error) {
            console.error("apiClient.fetchNextJob failed:", error.message);
            return { command: "pause", message: "Failed to connect to local Next.js API server." };
        }
    },
    /**
     * Submits fully normalized candidate intelligence and AI summaries.
     */
    async submitJobSuccess(payload) {
        try {
            const res = await fetch(`${config_js_1.config.apiBaseUrl}/agent/job`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = (await res.json());
                throw new Error(errData.error || `HTTP ${res.status}`);
            }
            console.log(`Successfully saved candidate intelligence for: ${payload.candidate.fullName}`);
            return true;
        }
        catch (error) {
            console.error("apiClient.submitJobSuccess failed:", error.message);
            return false;
        }
    },
    /**
     * Reports a job failure, updating status to RETRY or FAILED.
     */
    async submitJobFailure(queueId, errorMsg) {
        try {
            const res = await fetch(`${config_js_1.config.apiBaseUrl}/agent/fail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queueId, error: errorMsg }),
            });
            if (res.ok) {
                const data = (await res.json());
                console.log(`Job failed. Status transitioned to: ${data.status} (Retry Count: ${data.retryCount})`);
            }
        }
        catch (error) {
            console.error("apiClient.submitJobFailure failed:", error.message);
        }
    },
    /**
     * Registers heartbeat, reports progress details, and checks if control has changed.
     */
    async sendHeartbeat(progressPercent, eta) {
        try {
            const res = await fetch(`${config_js_1.config.apiBaseUrl}/agent/heartbeat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ progressPercent, eta }),
            });
            if (res.ok) {
                const data = (await res.json());
                return data.status; // Returns "running", "paused", or "stopped"
            }
            return "stopped";
        }
        catch (error) {
            console.error("apiClient.sendHeartbeat failed:", error.message);
            return "paused"; // Fallback to pause loops on network disconnects
        }
    }
};
exports.default = exports.apiClient;
