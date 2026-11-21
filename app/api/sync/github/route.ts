import { syncGitHubData } from "@/lib/github/sync";
import connectDB from "@/lib/mongodb";
import Integration from "@/models/Integration";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let fullSync = false;
    try {
      const body = await req.json();
      fullSync = Boolean(body?.fullSync);
    } catch {
      // Empty body is fine
    }

    const githubIntegration = await Integration.findOne({
      userId: session.id,
      provider: "github",
    });

    if (!githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404, statusText: "NOT FOUND" },
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    syncGitHubData(
      githubIntegration.userId.toString(),
      githubIntegration.accessToken,
      async (progress, message) => {
        try {
          const data = JSON.stringify({ progress, message }) + "\n";
          await writer.write(encoder.encode(data));
        } catch (error) {
          console.error("Error writing to stream:", error);
        }
      },
      { fullSync, integrationId: githubIntegration._id.toString() },
    )
      .then(async () => {
        await writer.close();
      })
      .catch(async (error) => {
        console.error("Sync error:", error);
        try {
          const errorMessage =
            error instanceof Error ? error.message : "Sync failed";
          const data = JSON.stringify({ error: errorMessage }) + "\n";
          await writer.write(encoder.encode(data));
          await writer.close();
        } catch {
          // Stream may already be closed if client aborted
        }
      });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500, statusText: "INTERNAL SERVER ERROR" },
    );
  }
}
