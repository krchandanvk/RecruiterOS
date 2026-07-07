import dotenv from "dotenv";
import path from "path";
import os from "os";

// Load environment variables
dotenv.config();

// Determine default Chrome User Data directory for Windows
const getChromeUserDataDir = () => {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return path.join(localAppData, "Google", "Chrome", "User Data");
};

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  chromeUserDataDir: process.env.CHROME_USER_DATA_DIR || getChromeUserDataDir(),
  chromeProfileName: process.env.CHROME_PROFILE_NAME || "Default",
  headless: process.env.HEADLESS === "true", // Default to false (headed) to let extensions load
  maxRetries: parseInt(process.env.MAX_RETRIES || "3", 10),
  minDelayMs: parseInt(process.env.MIN_DELAY_MS || "5000", 10),
  maxDelayMs: parseInt(process.env.MAX_DELAY_MS || "15000", 10),
};

// Validate critical config
if (!config.geminiApiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI parsing will fail.");
}
