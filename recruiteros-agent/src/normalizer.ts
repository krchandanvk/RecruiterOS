/**
 * Normalization layer to clean raw parsed strings, format dates, and structure types.
 */
export function normalizeScrapedData(raw: any): any {
  return {
    candidate: {
      fullName: cleanText(raw.candidate.fullName) || "Unknown Name",
      linkedinUrl: raw.candidate.linkedinUrl,
      profilePhotoUrl: raw.candidate.profilePhotoUrl || null,
      headline: cleanText(raw.candidate.headline),
      about: cleanText(raw.candidate.about),
      location: cleanText(raw.candidate.location),
      country: cleanText(raw.candidate.country),
      followersCount: raw.candidate.followersCount || null,
      connectionsCount: raw.candidate.connectionsCount || null,
      openToWork: !!raw.candidate.openToWork,
      rawJson: JSON.stringify(raw), // Store original JSON
    },
    experiences: (raw.experiences || []).map((exp: any) => ({
      company: cleanText(exp.company) || "Unknown Company",
      designation: cleanText(exp.designation) || "Unknown Title",
      employmentType: cleanText(exp.employmentType),
      startDate: cleanText(exp.startDate),
      endDate: cleanText(exp.endDate),
      duration: cleanText(exp.duration),
      location: cleanText(exp.location),
      description: cleanText(exp.description),
    })),
    education: (raw.education || []).map((edu: any) => {
      let startYear: number | null = null;
      let endYear: number | null = null;
      
      if (edu.startYear) {
        const val = parseInt(edu.startYear, 10);
        if (!isNaN(val) && val > 1950 && val < 2050) startYear = val;
      }
      if (edu.endYear) {
        const val = parseInt(edu.endYear, 10);
        if (!isNaN(val) && val > 1950 && val < 2050) endYear = val;
      }

      return {
        institute: cleanText(edu.institute) || "Unknown Institute",
        degree: cleanText(edu.degree),
        branch: cleanText(edu.branch),
        startYear,
        endYear,
        grade: cleanText(edu.grade),
        description: cleanText(edu.description),
      };
    }),
    certifications: (raw.certifications || []).map((cert: any) => ({
      name: cleanText(cert.name) || "Certification",
      issuingOrganization: cleanText(cert.issuingOrganization) || "Unknown Issuer",
      issueDate: cleanText(cert.issueDate),
      expiryDate: cleanText(cert.expiryDate),
      credentialId: cleanText(cert.credentialId),
      credentialUrl: cleanText(cert.credentialUrl),
    })),
    projects: (raw.projects || []).map((proj: any) => ({
      name: cleanText(proj.name) || "Project",
      description: cleanText(proj.description),
      technology: cleanText(proj.technology),
      duration: cleanText(proj.duration),
    })),
    skills: (raw.skills || []).map((s: string) => cleanText(s)).filter((s: string) => s.length > 0),
  };
}

/**
 * Utility helper to trim text and remove leading/trailing noise, returning null if empty.
 */
function cleanText(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .replace(/^[\s,·•|:]+|[\s,·•|:]+$/g, "") // Strip leading/trailing punctuation/whitespace
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}
