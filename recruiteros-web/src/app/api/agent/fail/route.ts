import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { queueId, error } = await req.json();

    if (!queueId) {
      return NextResponse.json({ error: "Missing queueId" }, { status: 400 });
    }

    const errorMsg = error || "Unknown automation error";

    // Query current job to determine retry logic
    const currentJob = await db.processingQueue.findUnique({
      where: { id: queueId },
    });

    if (!currentJob) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
    }

    const nextRetryCount = currentJob.retryCount + 1;
    const shouldRetry = nextRetryCount < 3; // Retry up to 3 times (0, 1, 2)
    const newStatus = shouldRetry ? "RETRY" : "FAILED";

    await db.$transaction([
      db.processingQueue.update({
        where: { id: queueId },
        data: {
          status: newStatus,
          errorMessage: errorMsg,
          retryCount: nextRetryCount,
        },
      }),
      db.agentControl.update({
        where: { id: 1 },
        data: {
          currentQueueId: null,
          progressPercent: 0,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: newStatus,
      retryCount: nextRetryCount,
      message: shouldRetry ? "Queue item set to RETRY" : "Queue item marked as FAILED",
    });
  } catch (error: any) {
    console.error("Error in POST /api/agent/fail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
