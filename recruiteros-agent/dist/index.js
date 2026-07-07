"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const browser_js_1 = require("./browser.js");
const extractor_js_1 = require("./extractor.js");
const progai_js_1 = require("./progai.js");
const normalizer_js_1 = require("./normalizer.js");
const ai_js_1 = require("./ai.js");
const apiClient_js_1 = require("./apiClient.js");
const config_js_1 = require("./config.js");
// Keep track of average duration for ETA calculations
let processedCount = 0;
const defaultProcessingTimeSeconds = 45; // Est. time per candidate scrape + AI call
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function calculateETA(pendingCount) {
    if (pendingCount <= 0)
        return null;
    const estimatedSecondsLeft = pendingCount * defaultProcessingTimeSeconds;
    const etaDate = new Date();
    etaDate.setSeconds(etaDate.getSeconds() + estimatedSecondsLeft);
    return etaDate.toISOString();
}
async function main() {
    console.log("==================================================================");
    console.log("RecruiterOS Local Automation Agent Started");
    console.log(`API URL: ${config_js_1.config.apiBaseUrl}`);
    console.log(`Headless: ${config_js_1.config.headless}`);
    console.log("==================================================================");
    let browserContext = null;
    let page = null;
    let isActive = true;
    // Handle termination signals
    const shutdown = async () => {
        if (!isActive)
            return;
        isActive = false;
        console.log("\nShutdown signal received. Cleaning up...");
        await apiClient_js_1.apiClient.sendHeartbeat(0, null);
        await (0, browser_js_1.closeBrowser)();
        console.log("Agent stopped safely.");
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    // Initialize browser once at startup
    try {
        browserContext = await (0, browser_js_1.launchBrowser)();
        const pages = browserContext.pages();
        page = pages.length > 0 ? pages[0] : await browserContext.newPage();
    }
    catch (error) {
        console.error("FATAL: Failed to initialize Chrome. Please make sure Google Chrome is installed, and any other instance is closed.");
        process.exit(1);
    }
    // Verify LinkedIn session
    console.log("Verifying active LinkedIn session...");
    const isSessionActive = await (0, browser_js_1.verifyLinkedInSession)(page);
    if (!isSessionActive) {
        console.error("\n======================================================================");
        console.error("ERROR: LinkedIn Login Expired or Not Found.");
        console.error("Please open your Chrome browser, log in to LinkedIn, and then restart this agent.");
        console.error("======================================================================\n");
        await (0, browser_js_1.closeBrowser)();
        process.exit(1);
    }
    console.log("LinkedIn session active and verified.");
    // Main Event Loop
    while (isActive) {
        try {
            // 1. Fetch next queue job
            const response = await apiClient_js_1.apiClient.fetchNextJob();
            if (response.command === "pause" || response.command === "stop") {
                console.log(`Agent is in ${response.command.toUpperCase()} state. Polling heartbeat every 5s...`);
                await apiClient_js_1.apiClient.sendHeartbeat(0, null);
                await sleep(5000);
                continue;
            }
            if (response.command === "idle") {
                console.log("No pending jobs in queue. Sleeping for 5s...");
                await apiClient_js_1.apiClient.sendHeartbeat(0, null);
                await sleep(5000);
                continue;
            }
            // We have a job!
            const job = response.job;
            const linkedinUrl = job.linkedinUrl;
            console.log(`\n------------------------------------------------------------------`);
            console.log(`Processing Job ID: ${job.id}`);
            console.log(`LinkedIn URL: ${linkedinUrl}`);
            // Update ETA estimation (we assume a baseline pending load of 1 for this active item)
            const eta = calculateETA(1);
            await apiClient_js_1.apiClient.sendHeartbeat(20, eta); // 20% - Loaded and starting navigation
            try {
                // A. Extract LinkedIn Profile info
                await apiClient_js_1.apiClient.sendHeartbeat(30, eta); // 30% - Navigated & scraping profile
                const rawProfile = await (0, extractor_js_1.scrapeLinkedInProfile)(page, linkedinUrl);
                // B. Wait and Scrape Prog.AI Extension Panel
                await apiClient_js_1.apiClient.sendHeartbeat(60, eta); // 60% - Extracting extension emails
                const emails = await (0, progai_js_1.scrapeProgAiExtension)(page);
                // C. Normalize Captured Data
                const normalized = (0, normalizer_js_1.normalizeScrapedData)({
                    ...rawProfile,
                });
                // D. AI Processing Layer (Gemini)
                await apiClient_js_1.apiClient.sendHeartbeat(80, eta); // 80% - Invoking AI engine
                const aiOutput = await (0, ai_js_1.processCandidateWithAI)(normalized);
                // E. Submit Dossier to local Server Database
                await apiClient_js_1.apiClient.sendHeartbeat(95, eta); // 95% - Writing to SQLite
                // Structure POST payload
                const payload = {
                    queueId: job.id,
                    candidate: {
                        ...normalized.candidate,
                        candidateSummary: aiOutput.candidateSummary,
                        technicalSummary: aiOutput.technicalSummary,
                        experienceSummary: aiOutput.experienceSummary,
                        bestSuitableRoles: JSON.stringify(aiOutput.bestSuitableRoles),
                        candidateScore: aiOutput.candidateScore,
                        profileCompleteness: aiOutput.profileCompleteness,
                    },
                    experiences: normalized.experiences,
                    education: normalized.education,
                    certifications: normalized.certifications,
                    projects: normalized.projects,
                    skills: aiOutput.skillsCategorized,
                    emails,
                };
                const success = await apiClient_js_1.apiClient.submitJobSuccess(payload);
                if (success) {
                    processedCount++;
                    await apiClient_js_1.apiClient.sendHeartbeat(100, null);
                    console.log(`COMPLETED: Profile successfully analyzed and saved!`);
                }
                else {
                    throw new Error("Local API server failed to save candidate intelligence");
                }
            }
            catch (jobError) {
                console.error(`Job execution failed for URL: ${linkedinUrl}`, jobError.message);
                // Report failure to API
                await apiClient_js_1.apiClient.submitJobFailure(job.id, jobError.message || "Automation Extraction Error");
            }
            // Random delay before the next profile to replicate human browsing mechanics
            const delayMs = Math.floor(Math.random() * (config_js_1.config.maxDelayMs - config_js_1.config.minDelayMs + 1)) + config_js_1.config.minDelayMs;
            console.log(`Sleeping for ${(delayMs / 1000).toFixed(1)}s to avoid detection rate-limits...`);
            await sleep(delayMs);
        }
        catch (loopError) {
            console.error("Error in Agent Main Event Loop:", loopError.message);
            await sleep(10000); // Backoff on critical failures
        }
    }
}
// Start
main().catch((err) => {
    console.error("FATAL running agent process:", err);
    process.exit(1);
});
