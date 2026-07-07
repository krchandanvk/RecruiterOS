"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
// Load environment variables
dotenv_1.default.config();
// Determine default Chrome User Data directory for Windows
const getChromeUserDataDir = () => {
    const localAppData = process.env.LOCALAPPDATA || path_1.default.join(os_1.default.homedir(), "AppData", "Local");
    return path_1.default.join(localAppData, "Google", "Chrome", "User Data");
};
exports.config = {
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
if (!exports.config.geminiApiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. AI parsing will fail.");
}
