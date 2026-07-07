import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetches the next profile in queue for the agent
export async function GET() {
  try {
    // Check if agent is set to run
    const agentControl = await db.agentControl.findUnique({
      where: { id: 1 },
    });

    if (!agentControl || agentControl.status !== "running") {
      return NextResponse.json({
        command: agentControl?.status || "stop",
        message: "Agent status is not running.",
      });
    }

    // Get next PENDING or RETRY item
    const nextJob = await db.processingQueue.findFirst({
      where: {
        status: { in: ["PENDING", "RETRY"] },
      },
      orderBy: [
        { status: "desc" }, // RETRY first, then PENDING
        { createdAt: "asc" }, // Oldest first
      ],
    });

    if (!nextJob) {
      return NextResponse.json({
        command: "idle",
        message: "No pending profiles in queue.",
      });
    }

    // Set job to RUNNING and update AgentControl
    await db.$transaction([
      db.processingQueue.update({
        where: { id: nextJob.id },
        data: { status: "RUNNING" },
      }),
      db.agentControl.update({
        where: { id: 1 },
        data: {
          currentQueueId: nextJob.id,
          progressPercent: 10, // Started extraction
        },
      }),
    ]);

    return NextResponse.json({
      command: "process",
      job: nextJob,
    });
  } catch (error: any) {
    console.error("Error in GET /api/agent/job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Saves scraped candidate intelligence
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      queueId,
      candidate,
      experiences,
      education,
      certifications,
      projects,
      skills,
      emails,
    } = body;

    if (!queueId || !candidate || !candidate.linkedinUrl) {
      return NextResponse.json({ error: "Missing required profile data" }, { status: 400 });
    }

    const { linkedinUrl } = candidate;

    // Use transaction to perform atomic database upsert
    await db.$transaction(async (tx: any) => {
      // 1. Create or update candidate metadata
      const savedCandidate = await tx.candidate.upsert({
        where: { linkedinUrl },
        update: {
          fullName: candidate.fullName,
          headline: candidate.headline,
          about: candidate.about,
          industry: candidate.industry,
          currentCompany: candidate.currentCompany,
          currentDesignation: candidate.currentDesignation,
          location: candidate.location,
          country: candidate.country,
          followersCount: candidate.followersCount,
          connectionsCount: candidate.connectionsCount,
          openToWork: candidate.openToWork ?? false,
          profilePhotoUrl: candidate.profilePhotoUrl,
          rawJson: candidate.rawJson,
          candidateSummary: candidate.candidateSummary,
          technicalSummary: candidate.technicalSummary,
          experienceSummary: candidate.experienceSummary,
          bestSuitableRoles: candidate.bestSuitableRoles,
          candidateScore: candidate.candidateScore,
          profileCompleteness: candidate.profileCompleteness,
        },
        create: {
          linkedinUrl,
          fullName: candidate.fullName,
          headline: candidate.headline,
          about: candidate.about,
          industry: candidate.industry,
          currentCompany: candidate.currentCompany,
          currentDesignation: candidate.currentDesignation,
          location: candidate.location,
          country: candidate.country,
          followersCount: candidate.followersCount,
          connectionsCount: candidate.connectionsCount,
          openToWork: candidate.openToWork ?? false,
          profilePhotoUrl: candidate.profilePhotoUrl,
          rawJson: candidate.rawJson,
          candidateSummary: candidate.candidateSummary,
          technicalSummary: candidate.technicalSummary,
          experienceSummary: candidate.experienceSummary,
          bestSuitableRoles: candidate.bestSuitableRoles,
          candidateScore: candidate.candidateScore,
          profileCompleteness: candidate.profileCompleteness,
        },
      });

      const candidateId = savedCandidate.id;

      // 2. Refresh Experiences
      await tx.candidateExperience.deleteMany({ where: { candidateId } });
      if (experiences && experiences.length > 0) {
        await tx.candidateExperience.createMany({
          data: experiences.map((exp: any) => ({
            candidateId,
            company: exp.company,
            designation: exp.designation,
            employmentType: exp.employmentType || null,
            startDate: exp.startDate || null,
            endDate: exp.endDate || null,
            duration: exp.duration || null,
            location: exp.location || null,
            description: exp.description || null,
          })),
        });
      }

      // 3. Refresh Education
      await tx.candidateEducation.deleteMany({ where: { candidateId } });
      if (education && education.length > 0) {
        await tx.candidateEducation.createMany({
          data: education.map((edu: any) => ({
            candidateId,
            institute: edu.institute,
            degree: edu.degree || null,
            branch: edu.branch || null,
            startYear: edu.startYear ? parseInt(edu.startYear) : null,
            endYear: edu.endYear ? parseInt(edu.endYear) : null,
            grade: edu.grade || null,
            description: edu.description || null,
          })),
        });
      }

      // 4. Refresh Certifications
      await tx.candidateCertification.deleteMany({ where: { candidateId } });
      if (certifications && certifications.length > 0) {
        await tx.candidateCertification.createMany({
          data: certifications.map((cert: any) => ({
            candidateId,
            name: cert.name,
            issuingOrganization: cert.issuingOrganization,
            issueDate: cert.issueDate || null,
            expiryDate: cert.expiryDate || null,
            credentialId: cert.credentialId || null,
            credentialUrl: cert.credentialUrl || null,
          })),
        });
      }

      // 5. Refresh Projects
      await tx.candidateProject.deleteMany({ where: { candidateId } });
      if (projects && projects.length > 0) {
        await tx.candidateProject.createMany({
          data: projects.map((proj: any) => ({
            candidateId,
            name: proj.name,
            description: proj.description || null,
            technology: proj.technology || null,
            duration: proj.duration || null,
          })),
        });
      }

      // 6. Refresh Skills (categorized by AI)
      await tx.candidateSkill.deleteMany({ where: { candidateId } });
      if (skills && skills.length > 0) {
        await tx.candidateSkill.createMany({
          data: skills.map((sk: any) => ({
            candidateId,
            skillName: sk.skillName,
            category: sk.category || "Other",
          })),
        });
      }

      // 7. Refresh Emails (Prog.AI results)
      await tx.candidateEmail.deleteMany({ where: { candidateId } });
      if (emails && emails.length > 0) {
        await tx.candidateEmail.createMany({
          data: emails.map((em: any) => ({
            candidateId,
            email: em.email,
            isPrimary: em.isPrimary ?? false,
            confidence: em.confidence || null,
            verified: em.verified ?? false,
            source: em.source || "Prog.AI",
            githubUrl: em.githubUrl || null,
            portfolioUrl: em.portfolioUrl || null,
            websiteUrl: em.websiteUrl || null,
          })),
        });
      }

      // 8. Update queue item status to COMPLETED
      await tx.processingQueue.update({
        where: { id: queueId },
        data: { status: "COMPLETED" },
      });

      // 9. Reset AgentControl status for active items
      await tx.agentControl.update({
        where: { id: 1 },
        data: {
          currentQueueId: null,
          progressPercent: 100,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Profile intelligence saved successfully" });
  } catch (error: any) {
    console.error("Error in POST /api/agent/job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
