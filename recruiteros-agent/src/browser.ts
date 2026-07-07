import { chromium, BrowserContext, Page } from "playwright";
import { config } from "./config.js";

let context: BrowserContext | null = null;

/**
 * Initializes and launches Google Chrome with the user's persistent profile.
 * Forces Playwright to use Chrome channel to load user extensions like Prog.AI.
 */
export async function launchBrowser(): Promise<BrowserContext> {
  if (context) return context;

  console.log(`Launching Chrome using profile: "${config.chromeProfileName}"`);
  console.log(`Path: "${config.chromeUserDataDir}"`);

  try {
    context = await chromium.launchPersistentContext(config.chromeUserDataDir, {
      channel: "chrome", // Run actual installed Chrome
      headless: config.headless,
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      args: [
        `--profile-directory=${config.chromeProfileName}`,
        "--disable-blink-features=AutomationControlled", // Anti-detection
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    // Configure standard timeouts
    context.setDefaultTimeout(30000);
    context.setDefaultNavigationTimeout(30000);

    return context;
  } catch (error: any) {
    console.error("CRITICAL: Failed to launch browser context.", error);
    if (error.message.includes("lock") || error.message.includes("user data directory")) {
      console.error("\n======================================================================");
      console.error("ERROR: Chrome User Profile is currently locked or in use.");
      console.error("Please close all running Google Chrome windows and try again.");
      console.error("======================================================================\n");
    }
    throw error;
  }
}

/**
 * Closes the browser context safely.
 */
export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
    console.log("Browser context closed successfully.");
  }
}

/**
 * Validates if the page is currently logged into LinkedIn.
 */
export async function verifyLinkedInSession(page: Page): Promise<boolean> {
  try {
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    // If redirected to a login page, session has expired
    if (currentUrl.includes("login") || currentUrl.includes("signup") || await page.locator("a[href*='login']").first().isVisible()) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error verifying LinkedIn session:", error);
    return false;
  }
}
