import { Page } from "playwright";
import { 
  SELECTORS, 
  queryFallbackText, 
  queryFallbackAttr 
} from "./selectors.js";

interface ScrapedData {
  candidate: {
    fullName: string;
    linkedinUrl: string;
    profilePhotoUrl: string | null;
    headline: string | null;
    about: string | null;
    location: string | null;
    country: string | null;
    followersCount: number | null;
    connectionsCount: number | null;
    openToWork: boolean;
  };
  experiences: Array<{
    company: string;
    designation: string;
    employmentType: string | null;
    startDate: string | null;
    endDate: string | null;
    duration: string | null;
    location: string | null;
    description: string | null;
  }>;
  education: Array<{
    institute: string;
    degree: string | null;
    branch: string | null;
    startYear: string | null;
    endYear: string | null;
    grade: string | null;
    description: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string | null;
    expiryDate: string | null;
    credentialId: string | null;
    credentialUrl: string | null;
  }>;
  projects: Array<{
    name: string;
    description: string | null;
    technology: string | null;
    duration: string | null;
  }>;
  skills: string[];
}

/**
 * Extracts all visible LinkedIn profile information by traversing details sub-pages.
 */
export async function scrapeLinkedInProfile(page: Page, profileUrl: string): Promise<ScrapedData> {
  const username = profileUrl.split("/in/")[1]?.split("/")[0]?.trim().toLowerCase();
  const cleanProfileUrl = `https://www.linkedin.com/in/${username}`;
  
  console.log(`Navigating to LinkedIn profile: ${cleanProfileUrl}`);
  await page.goto(cleanProfileUrl, { waitUntil: "domcontentloaded" });
  
  // Wait a few seconds to let dynamic content load
  await page.waitForTimeout(4000);

  // 1. Extract Basic profile card info
  const fullName = await queryFallbackText(page, SELECTORS.fullName) || "Unknown Name";
  const headline = await queryFallbackText(page, SELECTORS.headline);
  const rawLocation = await queryFallbackText(page, SELECTORS.location);
  const about = await queryFallbackText(page, SELECTORS.about);
  const profilePhotoUrl = await queryFallbackAttr(page, SELECTORS.profilePhoto, "src");
  
  // Scrape followers / connections
  const rawFollowers = await queryFallbackText(page, SELECTORS.followers);
  let followersCount: number | null = null;
  if (rawFollowers) {
    const numMatch = rawFollowers.replace(/,/g, "").match(/\d+/);
    if (numMatch) followersCount = parseInt(numMatch[0]);
  }

  const rawConnections = await queryFallbackText(page, SELECTORS.connections);
  let connectionsCount: number | null = null;
  if (rawConnections) {
    const numMatch = rawConnections.replace(/,/g, "").match(/\d+/);
    if (numMatch) connectionsCount = parseInt(numMatch[0]);
  }

  // Open to work tag checks
  let openToWork = false;
  for (const selector of SELECTORS.openToWork) {
    if (await page.locator(selector).first().isVisible()) {
      openToWork = true;
      break;
    }
  }

  // Parse location and country
  let location = rawLocation;
  let country = null;
  if (rawLocation) {
    const parts = rawLocation.split(",");
    if (parts.length > 1) {
      country = parts[parts.length - 1].trim();
    }
  }

  console.log(`Extracted basic details for: ${fullName}`);

  // 2. Extract Experience details via details sub-page (exhaustive method)
  const experiences = await scrapeExperiencesExhaustive(page, cleanProfileUrl);

  // 3. Extract Education details via details sub-page (exhaustive method)
  const education = await scrapeEducationExhaustive(page, cleanProfileUrl);

  // 4. Extract Certifications details via details sub-page (exhaustive method)
  const certifications = await scrapeCertificationsExhaustive(page, cleanProfileUrl);

  // 5. Extract Projects and Skills from main profile page or fallbacks
  const projects = await scrapeProjects(page, cleanProfileUrl);
  const skills = await scrapeSkills(page, cleanProfileUrl);

  // Return parsed profile context
  return {
    candidate: {
      fullName,
      linkedinUrl: cleanProfileUrl,
      profilePhotoUrl,
      headline,
      about,
      location,
      country,
      followersCount,
      connectionsCount,
      openToWork,
    },
    experiences,
    education,
    certifications,
    projects,
    skills,
  };
}

async function scrapeExperiencesExhaustive(page: Page, profileUrl: string) {
  const experiencesList: any[] = [];
  try {
    const expUrl = `${profileUrl}/details/experience/`;
    console.log(`Fetching experiences from: ${expUrl}`);
    await page.goto(expUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const listItems = page.locator(".pvs-list__paged-list-item");
    const count = await listItems.count();

    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      
      // Determine if this is a grouped company node (multiple roles under same company)
      // Grouped nodes typically have a logo, company name, but no designation in the first row.
      // Underneath, they have nested list items.
      const isGrouped = await item.locator("ul.pvs-list").first().isVisible();

      if (isGrouped) {
        // Grouped experience node
        const companyName = await item.locator("div.display-flex.flex-row.justify-between span[aria-hidden='true']").first().innerText().catch(() => "");
        const nestedItems = item.locator("ul.pvs-list > li");
        const nestedCount = await nestedItems.count();

        for (let j = 0; j < nestedCount; j++) {
          const nestedItem = nestedItems.nth(j);
          const rawLines = await nestedItem.locator("span[aria-hidden='true']").allInnerTexts();
          
          if (rawLines.length > 0) {
            // Grouped experiences structured as:
            // Line 0: Designation
            // Line 1: Employment Type (e.g. "Full-time")
            // Line 2: Date interval + Duration (e.g. "Jan 2020 - Present · 4 yrs")
            // Line 3: Location
            // Line 4+: Description
            const designation = rawLines[0] || "";
            const empType = rawLines[1]?.includes(" · ") ? null : rawLines[1] || null;
            
            const dateLine = rawLines.find(l => l.includes(" - ") || l.includes("Present"));
            let startDate = null, endDate = null, duration = null;
            if (dateLine) {
              const dateParts = dateLine.split(" · ");
              const intervals = dateParts[0].split(" - ");
              startDate = intervals[0]?.trim() || null;
              endDate = intervals[1]?.trim() || null;
              duration = dateParts[1]?.trim() || null;
            }

            const locLine = rawLines.find(l => l.toLowerCase().includes("location") || l.toLowerCase().includes("hybrid") || l.toLowerCase().includes("remote") || l.toLowerCase().includes("office"));
            const desc = await nestedItem.locator(".pv-shared-text-with-see-more span[aria-hidden='true']").innerText().catch(() => null);

            experiencesList.push({
              company: companyName.split(" · ")[0]?.trim() || "Unknown Company",
              designation: designation.trim(),
              employmentType: empType?.trim() || null,
              startDate,
              endDate,
              duration,
              location: locLine?.trim() || null,
              description: desc || null,
            });
          }
        }
      } else {
        // Single experience node
        const rawLines = await item.locator("span[aria-hidden='true']").allInnerTexts();
        if (rawLines.length > 0) {
          const designation = rawLines[0] || "";
          const companyLine = rawLines[1] || "";
          
          let company = companyLine;
          let empType = null;
          if (companyLine.includes(" · ")) {
            const parts = companyLine.split(" · ");
            company = parts[0];
            empType = parts[1];
          }

          const dateLine = rawLines.find(l => l.includes(" - ") || l.includes("Present"));
          let startDate = null, endDate = null, duration = null;
          if (dateLine) {
            const dateParts = dateLine.split(" · ");
            const intervals = dateParts[0].split(" - ");
            startDate = intervals[0]?.trim() || null;
            endDate = intervals[1]?.trim() || null;
            duration = dateParts[1]?.trim() || null;
          }

          const locLine = rawLines.find(l => l.toLowerCase().includes("location") || l.toLowerCase().includes("hybrid") || l.toLowerCase().includes("remote") || l.toLowerCase().includes("office") || (!l.includes(" - ") && l !== designation && l !== companyLine && !l.includes("Contract") && !l.includes("Full-time")));
          const desc = await item.locator(".pv-shared-text-with-see-more span[aria-hidden='true']").innerText().catch(() => null);

          experiencesList.push({
            company: company.trim(),
            designation: designation.trim(),
            employmentType: empType?.trim() || null,
            startDate,
            endDate,
            duration,
            location: locLine?.trim() || null,
            description: desc || null,
          });
        }
      }
    }
  } catch (error) {
    console.error("Failed scraping experiences page:", error);
  }
  return experiencesList;
}

async function scrapeEducationExhaustive(page: Page, profileUrl: string) {
  const educationList: any[] = [];
  try {
    const eduUrl = `${profileUrl}/details/education/`;
    console.log(`Fetching education from: ${eduUrl}`);
    await page.goto(eduUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const listItems = page.locator(".pvs-list__paged-list-item");
    const count = await listItems.count();

    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const rawLines = await item.locator("span[aria-hidden='true']").allInnerTexts();
      if (rawLines.length > 0) {
        const institute = rawLines[0] || "";
        const degreeLine = rawLines[1] || "";
        
        let degree = null;
        let branch = null;
        if (degreeLine) {
          const parts = degreeLine.split(",");
          degree = parts[0]?.trim() || null;
          branch = parts[1]?.trim() || null;
        }

        const dateLine = rawLines.find(l => l.match(/\d{4}\s*-\s*\d{4}/) || l.match(/^\d{4}$/));
        let startYear = null;
        let endYear = null;
        if (dateLine) {
          const years = dateLine.match(/\d{4}/g);
          if (years) {
            startYear = years[0] || null;
            endYear = years[1] || null;
          }
        }

        const gradeLine = rawLines.find(l => l.toLowerCase().includes("grade") || l.toLowerCase().includes("gpa"));
        let grade = null;
        if (gradeLine) {
          grade = gradeLine.replace(/grade:?/gi, "").trim();
        }

        const desc = await item.locator(".pv-shared-text-with-see-more span[aria-hidden='true']").innerText().catch(() => null);

        educationList.push({
          institute: institute.trim(),
          degree,
          branch,
          startYear,
          endYear,
          grade,
          description: desc || null,
        });
      }
    }
  } catch (error) {
    console.error("Failed scraping education page:", error);
  }
  return educationList;
}

async function scrapeCertificationsExhaustive(page: Page, profileUrl: string) {
  const certsList: any[] = [];
  try {
    const certUrl = `${profileUrl}/details/certifications/`;
    console.log(`Fetching certifications from: ${certUrl}`);
    await page.goto(certUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const listItems = page.locator(".pvs-list__paged-list-item");
    const count = await listItems.count();

    for (let i = 0; i < count; i++) {
      const item = listItems.nth(i);
      const rawLines = await item.locator("span[aria-hidden='true']").allInnerTexts();
      if (rawLines.length > 0) {
        const name = rawLines[0] || "";
        const organization = rawLines[1] || "";
        
        const dateLine = rawLines.find(l => l.toLowerCase().includes("issued") || l.toLowerCase().includes("expir"));
        let issueDate = null;
        let expiryDate = null;
        if (dateLine) {
          // Parse Issued Month Year - Expires Month Year
          const parts = dateLine.split(" · ");
          const issuePart = parts.find(p => p.toLowerCase().includes("issued"));
          const expirePart = parts.find(p => p.toLowerCase().includes("expires") || p.toLowerCase().includes("no expiration"));
          
          if (issuePart) {
            issueDate = issuePart.replace(/issued/gi, "").trim();
          }
          if (expirePart) {
            expiryDate = expirePart.replace(/expires/gi, "").trim();
          }
        }

        const credentialIdLine = rawLines.find(l => l.toLowerCase().includes("credential id"));
        let credentialId = null;
        if (credentialIdLine) {
          credentialId = credentialIdLine.replace(/credential id:?/gi, "").trim();
        }

        const credentialUrl = await item.locator("a[href*='credential']").first().getAttribute("href").catch(() => null) ||
                              await item.locator("a[class*='confirm']").first().getAttribute("href").catch(() => null);

        certsList.push({
          name: name.trim(),
          issuingOrganization: organization.trim(),
          issueDate,
          expiryDate,
          credentialId,
          credentialUrl,
        });
      }
    }
  } catch (error) {
    console.warn("Failed scraping certifications Details page, falling back to empty list.", error);
  }
  return certsList;
}

async function scrapeProjects(page: Page, profileUrl: string) {
  const projectsList: any[] = [];
  try {
    // Navigate to projects details if accessible, otherwise extract from main profile page
    const projUrl = `${profileUrl}/details/projects/`;
    console.log(`Checking projects details page: ${projUrl}`);
    await page.goto(projUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const listItems = page.locator(".pvs-list__paged-list-item");
    const count = await listItems.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const item = listItems.nth(i);
        const rawLines = await item.locator("span[aria-hidden='true']").allInnerTexts();
        if (rawLines.length > 0) {
          const name = rawLines[0] || "";
          
          const dateLine = rawLines.find(l => l.includes(" - ") || l.match(/\d{4}/));
          const desc = await item.locator(".pv-shared-text-with-see-more span[aria-hidden='true']").innerText().catch(() => null);
          const techLine = rawLines.find(l => l.toLowerCase().includes("associated with") || l.toLowerCase().includes("technolog"));

          projectsList.push({
            name: name.trim(),
            description: desc || null,
            technology: techLine || null,
            duration: dateLine || null,
          });
        }
      }
    }
  } catch (error) {
    console.warn("Failed fetching projects detailed list.", error);
  }
  return projectsList;
}

async function scrapeSkills(page: Page, profileUrl: string): Promise<string[]> {
  const skillsList: string[] = [];
  try {
    const skillsUrl = `${profileUrl}/details/skills/`;
    console.log(`Checking skills details page: ${skillsUrl}`);
    await page.goto(skillsUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const skillsLocators = page.locator(".pvs-list__paged-list-item span[aria-hidden='true']");
    const count = await skillsLocators.count();

    for (let i = 0; i < count; i++) {
      const text = await skillsLocators.nth(i).innerText();
      // Only keep short text (skills are typically 1-4 words) that are not repeating sub-texts
      if (text && text.trim() && text.length < 50 && !skillsList.includes(text.trim())) {
        // filter out junk words like "Endorsed by", "Show all", etc.
        const cleaned = text.trim();
        const lowercase = cleaned.toLowerCase();
        if (
          !lowercase.includes("endorsed") && 
          !lowercase.includes("endorsement") &&
          !lowercase.includes("see details") &&
          !lowercase.includes("passed") &&
          !lowercase.match(/^\d+$/)
        ) {
          skillsList.push(cleaned);
        }
      }
    }
  } catch (error) {
    console.warn("Failed fetching skills detailed list.", error);
  }
  return skillsList;
}
