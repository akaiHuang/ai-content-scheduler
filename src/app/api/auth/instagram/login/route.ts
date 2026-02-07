import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  const params = new URLSearchParams({
    client_id: env.INSTAGRAM_APP_ID,
    redirect_uri: `${env.NEXT_PUBLIC_BASE_URL}/api/auth/instagram/callback`,
    scope: "instagram_basic,instagram_content_publish",
    response_type: "code",
    state: crypto.randomUUID(),
  });

  const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
