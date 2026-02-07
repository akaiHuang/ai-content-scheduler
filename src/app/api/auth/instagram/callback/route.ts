import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getDb } from "@/lib/firebase-admin";
import { type SessionData, sessionOptions } from "@/lib/session";

interface InstagramTokenResponse {
  access_token: string;
  user_id: number;
}

interface InstagramUserProfile {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_BASE_URL}/?error=instagram_auth_failed`,
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: env.INSTAGRAM_APP_ID,
        client_secret: env.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `${env.NEXT_PUBLIC_BASE_URL}/api/auth/instagram/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = (await tokenResponse.json()) as InstagramTokenResponse;

    // Get user profile
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`,
    );

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch Instagram profile");
    }

    const profile = (await profileResponse.json()) as InstagramUserProfile;

    // Generate userId from Instagram ID
    const userId = `ig_${profile.id}`;

    // Store in Firestore
    const db = getDb();
    await db.collection("users").doc(userId).set(
      {
        instagramUserId: profile.id,
        accessToken: tokenData.access_token,
        username: profile.username,
        accountType: profile.account_type,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    // Set session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = userId;
    session.instagramUserId = profile.id;
    session.instagramUsername = profile.username;
    await session.save();

    return NextResponse.redirect(`${env.NEXT_PUBLIC_BASE_URL}/?success=logged_in`);
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_BASE_URL}/?error=auth_processing_failed`,
    );
  }
}
