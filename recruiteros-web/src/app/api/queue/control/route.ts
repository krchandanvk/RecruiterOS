import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    if (action === "resume" || action === "start") {
      await db.agentControl.upsert({
        where: { id: 1 },
        update: { status: "running" },
        create: { id: 1, status: "running" },
      });
      return NextResponse.json({ success: true, message: "Agent set to running" });
    }

    if (action === "pause") {
      await db.agentControl.upsert({
        where: { id: 1 },
        update: { status: "paused" },
        create: { id: 1, status: "paused" },
      });
      return NextResponse.json({ success: true, message: "Agent set to paused" });
    }

    if (action === "stop") {
      await db.agentControl.upsert({
        where: { id: 1 },
        update: {
          status: "stopped",
          currentQueueId: null,
          progressPercent: 0,
          eta: null,
        },
        create: { id: 1, status: "stopped", progressPercent: 0 },
      });
      // Also reset any active running item back to PENDING so it can be re-run
      await db.processingQueue.updateMany({
        where: { status: "RUNNING" },
        data: { status: "PENDING" },
      });
      return NextResponse.json({ success: true, message: "Agent stopped, active jobs reset" });
    }

    if (action === "retry_failed") {
      const result = await db.processingQueue.updateMany({
        where: {
          status: { in: ["FAILED", "SKIPPED"] },
        },
        data: {
          status: "PENDING",
          errorMessage: null,
          retryCount: 0,
        },
      });
      return NextResponse.json({
        success: true,
        message: `Reset ${result.count} failed/skipped profiles back to PENDING.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error executing queue control:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
