import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Get counts grouped by status
    const queueGroups = await db.processingQueue.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const counts = {
      PENDING: 0,
      RUNNING: 0,
      COMPLETED: 0,
      FAILED: 0,
      RETRY: 0,
      SKIPPED: 0,
    };

    for (const group of queueGroups) {
      const statusKey = group.status as keyof typeof counts;
      if (statusKey in counts) {
        counts[statusKey] = group._count._all;
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // 2. Get agent control state
    let agentControl = await db.agentControl.findUnique({
      where: { id: 1 },
    });

    if (!agentControl) {
      agentControl = await db.agentControl.create({
        data: {
          id: 1,
          status: "stopped",
          progressPercent: 0,
        },
      });
    }

    // 3. Get active URL if agent is running
    let activeUrl = null;
    if (agentControl.currentQueueId) {
      const activeJob = await db.processingQueue.findUnique({
        where: { id: agentControl.currentQueueId },
        select: { linkedinUrl: true },
      });
      activeUrl = activeJob?.linkedinUrl || null;
    }

    return NextResponse.json({
      counts,
      total,
      agent: {
        status: agentControl.status,
        currentQueueId: agentControl.currentQueueId,
        activeUrl,
        lastHeartbeat: agentControl.lastHeartbeat,
        progressPercent: agentControl.progressPercent,
        eta: agentControl.eta,
        updatedAt: agentControl.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching queue status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
