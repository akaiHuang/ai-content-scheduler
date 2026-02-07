import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { publishToInstagram } from "@/lib/instagram";
import { getDb } from "@/lib/firebase-admin";
import { type SessionData, sessionOptions } from "@/lib/session";
import type { UserInstagramData } from "@/lib/firebase-admin";

const shareSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("post"),
    caption: z.string().min(1),
    imageUrl: z.string().url(),
  }),
  z.object({
    kind: z.literal("reel"),
    caption: z.string().min(1),
    videoUrl: z.string().url(),
    shareToFeed: z.boolean().optional(),
  }),
]);

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    if (!session.userId || !session.instagramUserId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get user's Instagram credentials
    const db = getDb();
    const userDoc = await db.collection("users").doc(session.userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data() as UserInstagramData;

    if (!userData.accessToken) {
      return NextResponse.json(
        { success: false, error: "Instagram not connected" },
        { status: 403 },
      );
    }

    const json = await request.json();
    const body = shareSchema.parse(json);

    const result = await publishToInstagram(body, {
      instagramUserId: userData.instagramUserId,
      accessToken: userData.accessToken,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.flatten() },
        { status: 400 },
      );
    }

    console.error("/api/instagram/share error", error);

    return NextResponse.json(
      { success: false, error: "Failed to publish to Instagram" },
      { status: 500 },
    );
  }
}
