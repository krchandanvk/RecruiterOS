"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiClient_js_1 = require("./apiClient.js");
const normalizer_js_1 = require("./normalizer.js");
const config_js_1 = require("./config.js");
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function runMockIntegrationTest() {
    console.log("==================================================================");
    console.log("Starting RecruiterOS Mock End-to-End Integration Test");
    console.log(`API Target URL: ${config_js_1.config.apiBaseUrl}`);
    console.log("==================================================================");
    const testProfileUrl = "https://www.linkedin.com/in/test-candidate-john-doe";
    // Resolve base URL (e.g. http://localhost:3000 or http://localhost:3001 based on API config)
    const serverBaseUrl = config_js_1.config.apiBaseUrl.replace(/\/api$/, "");
    // Step 1: Upload a Mock CSV to the web server
    console.log("\n[Step 1] Uploading mock CSV profile to queue...");
    try {
        const csvContent = `linkedin_url\n${testProfileUrl}\n`;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", blob, "test_candidates.csv");
        const uploadRes = await fetch(`${serverBaseUrl}/api/queue/upload`, {
            method: "POST",
            body: formData,
        });
        const uploadData = (await uploadRes.json());
        if (!uploadRes.ok) {
            throw new Error(`Upload failed: ${uploadData.error}`);
        }
        console.log(`Success: ${uploadData.message}`);
    }
    catch (err) {
        console.error("FAILED Step 1:", err.message);
        process.exit(1);
    }
    // Step 2: Trigger Agent Start command in database
    console.log("\n[Step 2] Setting AgentControl status to 'running'...");
    try {
        const controlRes = await fetch(`${serverBaseUrl}/api/queue/control`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" }),
        });
        if (!controlRes.ok) {
            throw new Error(`Control activation failed with HTTP ${controlRes.status}`);
        }
        console.log("Success: Agent set to running.");
    }
    catch (err) {
        console.error("FAILED Step 2:", err.message);
        process.exit(1);
    }
    // Step 3: Fetch the next job via agent apiClient
    console.log("\n[Step 3] Fetching next job from queue via apiClient...");
    let job = null;
    try {
        const jobResponse = await apiClient_js_1.apiClient.fetchNextJob();
        if (jobResponse.command !== "process" || !jobResponse.job) {
            throw new Error(`Expected process command but received: ${JSON.stringify(jobResponse)}`);
        }
        job = jobResponse.job;
        console.log(`Success: Fetched Job ID: ${job.id} targeting: ${job.linkedinUrl}`);
    }
    catch (err) {
        console.error("FAILED Step 3:", err.message);
        process.exit(1);
    }
    // Step 4: Simulate scraping & normalization
    console.log("\n[Step 4] Simulating browser profile extraction & data normalization...");
    const mockRawScraped = {
        candidate: {
            fullName: "John Doe",
            linkedinUrl: testProfileUrl,
            profilePhotoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80",
            headline: "Staff Engineer | Node.js & TypeScript Expert | AI Enabler",
            about: "Passionate developer with 10+ years experience building highly concurrent architectures and cloud engines.",
            location: "San Francisco, California, United States",
            country: "United States",
            followersCount: 1540,
            connectionsCount: 500,
            openToWork: true,
        },
        experiences: [
            {
                company: "TechCorp Global",
                designation: "Staff Software Engineer",
                employmentType: "Full-time",
                startDate: "Jan 2022",
                endDate: "Present",
                duration: "4 yrs 6 mos",
                location: "San Francisco, CA",
                description: "Leading core platform rewrite in Node.js. Designing distributed pub/sub pipelines and caching architectures.",
            },
            {
                company: "WebSoft Solutions",
                designation: "Senior Software Engineer",
                employmentType: "Full-time",
                startDate: "Mar 2018",
                endDate: "Dec 2021",
                duration: "3 yrs 10 mos",
                location: "Oakland, CA",
                description: "Built responsive frontend architectures using React & Next.js. Configured serverless pipelines on AWS.",
            }
        ],
        education: [
            {
                institute: "Stanford University",
                degree: "Master of Science",
                branch: "Computer Science",
                startYear: "2016",
                endYear: "2018",
                grade: "A",
                description: "Focused on database theory, software design, and machine learning models.",
            }
        ],
        certifications: [
            {
                name: "AWS Certified Solutions Architect",
                issuingOrganization: "Amazon Web Services",
                issueDate: "Aug 2023",
                expiryDate: "Aug 2026",
                credentialId: "AWS-12345",
                credentialUrl: "https://aws.amazon.com",
            }
        ],
        projects: [
            {
                name: "Serverless Auth Gateway",
                description: "A fast, open-source OAuth plugin for cloud-native API hubs.",
                technology: "TypeScript, AWS Lambda, DynamoDB",
                duration: "6 months",
            }
        ],
        skills: ["Node.js", "TypeScript", "React", "Next.js", "AWS", "PostgreSQL", "Docker", "Jest", "GraphQL"]
    };
    const mockEmails = [
        {
            email: "johndoe@techcorp.io",
            isPrimary: true,
            confidence: "high",
            verified: true,
            source: "Prog.AI",
            githubUrl: "https://github.com/johndoe-test",
            portfolioUrl: "https://johndoe.io",
            websiteUrl: "https://techcorp.io",
        }
    ];
    const normalized = (0, normalizer_js_1.normalizeScrapedData)(mockRawScraped);
    console.log("Success: Data normalized successfully.");
    // Step 5: Process with AI summaries (Heuristics Fallback when API key is unset)
    console.log("\n[Step 5] Triggering local AI summary and skill categorization...");
    // Custom mock summaries matching John Doe
    const aiOutput = {
        candidateSummary: "John Doe is a highly accomplished Staff Software Engineer based in San Francisco, specializing in scalable Node.js architectures and robust React interfaces.",
        technicalSummary: "Demonstrates deep expertise in Node.js, TypeScript, React, Next.js, and AWS serverless computing, backed by Postgres and Docker integrations.",
        experienceSummary: "Holds a proven tenure at TechCorp Global and WebSoft Solutions, showing consistent ownership of platform redesigns and software delivery.",
        bestSuitableRoles: ["Staff Engineer", "Senior Backend Architect", "Fullstack Lead"],
        skillsCategorized: [
            { skillName: "Node.js", category: "Backend" },
            { skillName: "TypeScript", category: "Frontend" },
            { skillName: "React", category: "Frontend" },
            { skillName: "Next.js", category: "Frontend" },
            { skillName: "AWS", category: "Cloud" },
            { skillName: "PostgreSQL", category: "Database" },
            { skillName: "Docker", category: "DevOps" },
            { skillName: "Jest", category: "Testing" },
            { skillName: "GraphQL", category: "Backend" }
        ],
        candidateScore: 92,
        profileCompleteness: 95
    };
    console.log(`Success: Synthesized AI score: ${aiOutput.candidateScore}/100, completeness: ${aiOutput.profileCompleteness}%`);
    // Step 6: Submit final intelligence to the Next.js SQLite database
    console.log("\n[Step 6] Submitting candidate intelligence to web server...");
    try {
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
            emails: mockEmails,
        };
        const submitOk = await apiClient_js_1.apiClient.submitJobSuccess(payload);
        if (!submitOk) {
            throw new Error("Job submission rejected by API server");
        }
        console.log("Success: Intelligence data accepted and written to database.");
    }
    catch (err) {
        console.error("FAILED Step 6:", err.message);
        process.exit(1);
    }
    // Step 7: Verify data in SQLite by fetching candidates list
    console.log("\n[Step 7] Verifying candidate record exists in local database...");
    try {
        const verifyRes = await fetch(`${serverBaseUrl}/api/candidates`);
        if (!verifyRes.ok) {
            throw new Error(`Failed to fetch candidates: HTTP ${verifyRes.status}`);
        }
        const verifyData = (await verifyRes.json());
        const johnRecord = verifyData.candidates?.find((c) => c.linkedinUrl === testProfileUrl);
        if (!johnRecord) {
            throw new Error("Candidate record not found in the SQLite database!");
        }
        console.log("------------------------------------------------------------------");
        console.log("INTEGRATION TEST VERIFICATION: SUCCESS");
        console.log(`Candidate Name: ${johnRecord.fullName}`);
        console.log(`Headline:       ${johnRecord.headline}`);
        console.log(`AI Score:       ${johnRecord.candidateScore}%`);
        console.log(`Emails Scraped:  ${johnRecord.emails.map((e) => e.email).join(", ")}`);
        console.log(`Skills:         ${johnRecord.skills.map((s) => s.skillName).join(", ")}`);
        console.log("------------------------------------------------------------------");
    }
    catch (err) {
        console.error("FAILED Step 7:", err.message);
        process.exit(1);
    }
}
runMockIntegrationTest().catch(err => {
    console.error("FATAL running integration test script:", err);
    process.exit(1);
});
