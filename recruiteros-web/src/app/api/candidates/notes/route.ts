import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, noteContent } = await req.json();

    if (!candidateId || !noteContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const note = await db.candidateNote.create({
      data: {
        candidateId,
        noteContent,
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error("Error creating candidate note:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
