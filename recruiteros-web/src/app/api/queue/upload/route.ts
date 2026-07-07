import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeLinkedInUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const urls: string[] = [];

    // Parse lines looking for LinkedIn URLs
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Basic CSV splitting (handling optional quotes)
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      for (const cell of cells) {
        const cleanedCell = cell.replace(/^["']|["']$/g, "").trim();
        const normalized = normalizeLinkedInUrl(cleanedCell);
        if (normalized && !urls.includes(normalized)) {
          urls.push(normalized);
        }
      }
    }

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "No valid LinkedIn profile URLs found in the CSV" },
        { status: 400 }
      );
    }

    // Insert URLs into the processing queue in a transaction to prevent race conditions
    let insertedCount = 0;
    let skippedCount = 0;

    await db.$transaction(async (tx: any) => {
      for (const url of urls) {
        const existingQueue = await tx.processingQueue.findUnique({
          where: { linkedinUrl: url },
        });

        if (existingQueue) {
          skippedCount++;
          continue;
        }

        await tx.processingQueue.create({
          data: {
            linkedinUrl: url,
            status: "PENDING",
            retryCount: 0,
          },
        });
        insertedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      message: `Processed CSV. Inserted ${insertedCount} new profile(s), skipped ${skippedCount} duplicate(s).`,
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error: any) {
    console.error("Error uploading CSV:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}
