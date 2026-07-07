"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeProgAiExtension = scrapeProgAiExtension;
/**
 * Scrapes contact information from the Prog.AI extension panel.
 * Uses fallback queries and regex scans to guarantee resilience.
 */
async function scrapeProgAiExtension(page) {
    console.log("Waiting for Prog.AI extension panel to render...");
    // Wait up to 10 seconds for the extension to inject/load its data
    let extensionLoaded = false;
    for (let attempt = 0; attempt < 10; attempt++) {
        // Look for text matching "prog{.ai}" or "Contacts"
        const hasProgAi = await page.locator("body :has-text('prog{.ai}')").first().isVisible().catch(() => false) ||
            await page.locator("body :has-text('Contacts')").first().isVisible().catch(() => false);
        if (hasProgAi) {
            extensionLoaded = true;
            break;
        }
        await page.waitForTimeout(1000);
    }
    if (!extensionLoaded) {
        console.warn("WARNING: Prog.AI panel anchor text ('prog{.ai}' or 'Contacts') not detected on the page. Switched to global regex page scanning fallback.");
    }
    else {
        console.log("Prog.AI panel detected.");
    }
    // 1. Gather all emails visible in the body using a global regex scanner.
    // Since LinkedIn hides candidate emails unless you click a contact info popup, 
    // any email displayed directly on the screen belongs to the Prog.AI extension!
    const emailsList = [];
    const textContent = await page.locator("body").innerText().catch(() => "");
    // Regex matching emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = Array.from(new Set(textContent.match(emailRegex) || []));
    console.log(`Found emails on page:`, foundEmails);
    // 2. Scan for social URLs (GitHub, Portfolio, Personal Websites)
    // We scan the page links for github.com, portfolio sites, etc.
    let githubUrl = null;
    let portfolioUrl = null;
    let websiteUrl = null;
    const locators = page.locator("a[href]");
    const linkCount = await locators.count();
    for (let i = 0; i < linkCount; i++) {
        const href = await locators.nth(i).getAttribute("href").catch(() => null);
        if (!href)
            continue;
        const lowerHref = href.toLowerCase();
        if (lowerHref.includes("github.com/")) {
            // Filter out common github utility URLs (like github.com/trending, github.com/about)
            if (!lowerHref.includes("/about") &&
                !lowerHref.includes("/contact") &&
                !lowerHref.includes("/pricing") &&
                !lowerHref.includes("/features") &&
                !lowerHref.includes("/security")) {
                githubUrl = href;
            }
        }
        else if (lowerHref.includes("portfolio") ||
            lowerHref.includes("github.io") ||
            lowerHref.includes("vercel.app") ||
            lowerHref.includes("pages.dev")) {
            portfolioUrl = href;
        }
        else if (href.startsWith("http") &&
            !lowerHref.includes("linkedin.com") &&
            !lowerHref.includes("github.com") &&
            !lowerHref.includes("google.com") &&
            !lowerHref.includes("prog.ai")) {
            websiteUrl = href;
        }
    }
    // 3. Map captured emails to the contact structure
    for (let idx = 0; idx < foundEmails.length; idx++) {
        const email = foundEmails[idx];
        // We assume the first email is primary
        const isPrimary = idx === 0;
        // Check if the page has ticks or verified words near the email
        const emailLocator = page.locator(`body :has-text('${email}')`).last();
        let verified = false;
        let confidence = "high";
        try {
            if (await emailLocator.isVisible()) {
                const surroundingText = await emailLocator.innerText().catch(() => "");
                if (surroundingText.toLowerCase().includes("verified")) {
                    verified = true;
                }
            }
        }
        catch {
            // Ignored
        }
        emailsList.push({
            email,
            isPrimary,
            confidence,
            verified,
            source: "Prog.AI",
            githubUrl,
            portfolioUrl,
            websiteUrl,
        });
    }
    // Fallback: If no emails found but we found github, return a contact entry for github reference
    if (emailsList.length === 0 && (githubUrl || portfolioUrl || websiteUrl)) {
        console.log("No emails parsed, but found social links. Creating a contact reference.");
        emailsList.push({
            email: "No email parsed",
            isPrimary: true,
            confidence: "low",
            verified: false,
            source: "Prog.AI",
            githubUrl,
            portfolioUrl,
            websiteUrl,
        });
    }
    return emailsList;
}
