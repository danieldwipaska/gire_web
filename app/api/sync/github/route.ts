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
    let integrationId: string | undefined;
    try {
      const body = await req.json();
      fullSync = Boolean(body?.fullSync);
      if (typeof body?.integrationId === "string" && body.integrationId) {
        integrationId = body.integrationId;
      }
    } catch {
      // Empty body is fine
    }

    const integrations = await Integration.find({
      userId: session.id,
      provider: "github",
      ...(integrationId ? { _id: integrationId } : {}),
    });

    if (integrations.length === 0) {
      return NextResponse.json(
        { error: "GitHub integration not found" },
        { status: 404, statusText: "NOT FOUND" },
      );
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const runAllSyncs = async () => {
      const total = integrations.length;
      for (let idx = 0; idx < total; idx++) {
        const account = integrations[idx];
        const prefix =
          total > 1 ? `[@${account.githubUsername} (${idx + 1}/${total})] ` : "";

        await syncGitHubData(
          account.userId.toString(),
          account.accessToken,
          async (progress, message) => {
            try {
              const overallProgress = Math.floor(
                ((idx + progress / 100) / total) * 100,
              );
              const data =
                JSON.stringify({
                  progress: overallProgress,
                  message: `${prefix}${message}`,
                }) + "\n";
              await writer.write(encoder.encode(data));
            } catch (error) {
              console.error("Error writing to stream:", error);
            }
          },
          { fullSync, integrationId: account._id.toString() },
        );
      }
    };

    runAllSyncs()
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
          // Stream may already be closed
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
