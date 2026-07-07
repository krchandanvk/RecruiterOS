import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config.js";

// Initialize Gemini API
const getGenAIClient = () => {
  if (!config.geminiApiKey) {
    return null;
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
};

interface AIProcessedOutput {
  candidateSummary: string;
  technicalSummary: string;
  experienceSummary: string;
  bestSuitableRoles: string[];
  skillsCategorized: Array<{
    skillName: string;
    category: "Backend" | "Frontend" | "Cloud" | "AI" | "DevOps" | "Database" | "Testing" | "Mobile" | "Security" | "Other";
  }>;
  candidateScore: number;
  profileCompleteness: number;
}

/**
 * Invokes Gemini AI to synthesize candidate profile data, categorizes skills,
 * and generates scores/summaries.
 */
export async function processCandidateWithAI(normalizedData: any): Promise<AIProcessedOutput> {
  const genAI = getGenAIClient();
  
  if (!genAI) {
    console.warn("WARNING: Gemini client not initialized (missing API key). Returning fallback mockup values.");
    return generateFallbackMockValues(normalizedData);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are an expert technical recruiter and AI agent assessing a candidate's profile.
Analyze the following structured candidate profile:

Candidate: ${JSON.stringify(normalizedData.candidate)}
Experiences: ${JSON.stringify(normalizedData.experiences)}
Education: ${JSON.stringify(normalizedData.education)}
Certifications: ${JSON.stringify(normalizedData.certifications)}
Projects: ${JSON.stringify(normalizedData.projects)}
Skills List: ${JSON.stringify(normalizedData.skills)}

Generate candidate intelligence in JSON format. The response must match the following TypeScript interface exactly:

interface AIProcessedOutput {
  candidateSummary: string; // High-level executive candidate summary (2-3 sentences)
  technicalSummary: string; // Synthesized technical summary of engineering capabilities and stacks (2-3 sentences)
  experienceSummary: string; // Narrative of tenure, scope, and professional experience trajectory (2-3 sentences)
  bestSuitableRoles: string[]; // List of 2 to 3 target roles they are highly suitable for (e.g. "Senior Backend Engineer", "AI Researcher")
  skillsCategorized: Array<{
    skillName: string; // Must match exactly the skill name from the input Skills List
    category: "Backend" | "Frontend" | "Cloud" | "AI" | "DevOps" | "Database" | "Testing" | "Mobile" | "Security" | "Other"; // Categorize the skill
  }>;
  candidateScore: number; // A comprehensive assessment score from 0 to 100 based on their experience breadth and depth
  profileCompleteness: number; // Score from 0 to 100 based on details populated (e.g. higher if about, photo, experiences, education, and skills are fully defined)
}

Provide ONLY the valid JSON block matching this structure.
`;

    console.log("Sending candidate profile to Gemini API for assessment...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse response JSON
    const parsed: AIProcessedOutput = JSON.parse(responseText);

    // Validate that categories are correct
    const validCategories = ["Backend", "Frontend", "Cloud", "AI", "DevOps", "Database", "Testing", "Mobile", "Security", "Other"];
    if (parsed.skillsCategorized) {
      parsed.skillsCategorized = parsed.skillsCategorized.map((s: any) => {
        if (!validCategories.includes(s.category)) {
          s.category = "Other";
        }
        return s;
      });
    }

    return parsed;
  } catch (error) {
    console.error("Failed to process candidate with Gemini API:", error);
    console.log("Falling back to automated mockup analysis heuristics.");
    return generateFallbackMockValues(normalizedData);
  }
}

/**
 * Heuristics-based fallback analyzer if Gemini API is unavailable.
 */
function generateFallbackMockValues(normalizedData: any): AIProcessedOutput {
  const name = normalizedData.candidate.fullName || "Candidate";
  const title = normalizedData.candidate.headline || "Software Engineer";
  const rawSkills = normalizedData.skills || [];

  // Categorize skills using regex
  const skillsCategorized = rawSkills.map((sk: string) => {
    const lower = sk.toLowerCase();
    let category: any = "Other";

    if (lower.includes("node") || lower.includes("python") || lower.includes("java") || lower.includes("go") || lower.includes("nest") || lower.includes("express") || lower.includes("backend") || lower.includes("c#") || lower.includes("ruby")) {
      category = "Backend";
    } else if (lower.includes("react") || lower.includes("vue") || lower.includes("next") || lower.includes("angular") || lower.includes("html") || lower.includes("css") || lower.includes("tailwind") || lower.includes("frontend") || lower.includes("javascript") || lower.includes("typescript")) {
      category = "Frontend";
    } else if (lower.includes("aws") || lower.includes("azure") || lower.includes("gcp") || lower.includes("cloud") || lower.includes("serverless")) {
      category = "Cloud";
    } else if (lower.includes("ai") || lower.includes("ml") || lower.includes("learning") || lower.includes("llm") || lower.includes("prompt") || lower.includes("gpt") || lower.includes("gemini") || lower.includes("pytorch") || lower.includes("tensorflow")) {
      category = "AI";
    } else if (lower.includes("docker") || lower.includes("k8s") || lower.includes("kubernetes") || lower.includes("ci/cd") || lower.includes("jenkins") || lower.includes("devops") || lower.includes("actions")) {
      category = "DevOps";
    } else if (lower.includes("sql") || lower.includes("postgres") || lower.includes("db") || lower.includes("mongo") || lower.includes("redis") || lower.includes("database") || lower.includes("prisma")) {
      category = "Database";
    } else if (lower.includes("jest") || lower.includes("cypress") || lower.includes("test") || lower.includes("qa") || lower.includes("selenium")) {
      category = "Testing";
    } else if (lower.includes("ios") || lower.includes("android") || lower.includes("flutter") || lower.includes("native") || lower.includes("mobile")) {
      category = "Mobile";
    } else if (lower.includes("security") || lower.includes("cyber") || lower.includes("auth") || lower.includes("oauth") || lower.includes("crypt")) {
      category = "Security";
    }

    return {
      skillName: sk,
      category,
    };
  });

  // Calculate completeness based on field counts
  let completeness = 30; // base profile card
  if (normalizedData.candidate.about) completeness += 10;
  if (normalizedData.candidate.profilePhotoUrl) completeness += 10;
  if (normalizedData.experiences.length > 0) completeness += 20;
  if (normalizedData.education.length > 0) completeness += 15;
  if (normalizedData.skills.length > 0) completeness += 15;

  return {
    candidateSummary: `${name} is an experienced professional working as a ${title} in the ${normalizedData.candidate.industry || "software"} industry, with location at ${normalizedData.candidate.location || "unspecified"}.`,
    technicalSummary: `${name} demonstrates skills in ${rawSkills.slice(0, 4).join(", ") || "various engineering segments"}, illustrating a solid background in development stacks.`,
    experienceSummary: `${name} has a professional history of ${normalizedData.experiences.length} role(s), showing steady career progression.`,
    bestSuitableRoles: [title, "Software Engineer"],
    skillsCategorized,
    candidateScore: Math.min(60 + normalizedData.experiences.length * 5 + rawSkills.length, 98),
    profileCompleteness: Math.min(completeness, 100),
  };
}
