/**
 * Robust DOM abstraction layer containing fallback selectors for LinkedIn's frequently changing DOM.
 */
export const SELECTORS = {
  // Main Top Card Elements
  fullName: [
    "h1.text-heading-xlarge",
    "h1.pv-text-details__left-panel-item",
    "h1[class*='title']",
    "h1"
  ],
  headline: [
    "div.text-body-medium",
    "p.pv-text-details__left-panel-item",
    "div[class*='headline']",
    ".pv-text-details__left-panel-item[class*='headline']"
  ],
  location: [
    "span.text-body-small.inline.t-black--light.break-words",
    "div.pv-text-details__left-panel-bottom-item span",
    "span.pv-text-details__left-panel-bottom-item",
    ".t-black--light"
  ],
  about: [
    "#about + div + div .display-flex span",
    "div#about + div + div span",
    "section.pv-about-section p",
    ".pv-shared-text-with-see-more span"
  ],
  profilePhoto: [
    "img.pv-top-card-profile-picture__image",
    "img.profile-photo-edit__preview",
    "img[class*='profile-picture']",
    "img.pv-member-photo-navigation__image"
  ],
  followers: [
    "span:has-text('followers')",
    "p.pv-text-details__left-panel-bottom-item:has-text('followers') span",
    "span.t-black--light:has-text('followers')"
  ],
  connections: [
    "span:has-text('connections')",
    "span.t-black--light:has-text('connections')",
    "span.t-bold"
  ],
  openToWork: [
    "a[href*='open-to-work']",
    "div.pv-open-to-work-card",
    "section[class*='open-to-work']",
    "img[alt*='Open To Work']"
  ],

  // Section Anchors
  experienceAnchor: ["#experience", "div#experience", "section.experience-section"],
  educationAnchor: ["#education", "div#education", "section.education-section"],
  certificationsAnchor: ["#licenses_and_certifications", "div#licenses_and_certifications", "section.licenses-and-certifications-section"],
  projectsAnchor: ["#projects", "div#projects", "section.projects-section"],
  skillsAnchor: ["#skills", "div#skills", "section.skills-section"],

  // Detail Navigation button checks (Show all buttons)
  showAllExperiences: [
    "a[href*='/details/experience/']",
    "a:has-text('Show all')",
    "button:has-text('Show all experience')"
  ],
  showAllEducations: [
    "a[href*='/details/education/']",
    "a:has-text('Show all education')",
    "button:has-text('Show all education')"
  ],
  showAllCertifications: [
    "a[href*='/details/certifications/']",
    "a:has-text('Show all certifications')",
    "button:has-text('Show all certifications')"
  ]
};

/**
 * Robust selector resolution helper.
 * Traverses fallbacks and extracts the first matching element text or attribute.
 */
export async function queryFallbackText(page: any, selectors: string[]): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible()) {
        const text = await locator.innerText();
        if (text && text.trim()) return text.trim();
      }
    } catch {
      // Continue to fallback selector
    }
  }
  return null;
}

/**
 * Robust selector resolution helper for attributes.
 */
export async function queryFallbackAttr(page: any, selectors: string[], attrName: string): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible()) {
        const attr = await locator.getAttribute(attrName);
        if (attr && attr.trim()) return attr.trim();
      }
    } catch {
      // Continue to fallback selector
    }
  }
  return null;
}
