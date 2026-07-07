import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { progressPercent, eta } = await req.json();

    // 1. Update the agent's heartbeat metrics
    const agent = await db.agentControl.update({
      where: { id: 1 },
      data: {
        lastHeartbeat: new Date(),
        progressPercent: progressPercent !== undefined ? Number(progressPercent) : undefined,
        eta: eta ? new Date(eta) : null,
      },
    });

    // 2. Return the command/status back to the agent so it knows if it needs to pause/stop
    return NextResponse.json({
      success: true,
      status: agent.status,
    });
  } catch (error: any) {
    console.error("Error in POST /api/agent/heartbeat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
