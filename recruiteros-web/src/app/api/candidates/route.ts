import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const candidates = await db.candidate.findMany({
      include: {
        experiences: {
          orderBy: { startDate: "desc" },
        },
        education: {
          orderBy: { startYear: "desc" },
        },
        certifications: true,
        projects: true,
        skills: true,
        emails: true,
        notes: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, candidates });
  } catch (error: any) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
