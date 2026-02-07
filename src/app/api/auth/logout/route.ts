import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { type SessionData, sessionOptions } from "@/lib/session";
import { env } from "@/lib/env";

export async function POST() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();

  return NextResponse.json({ success: true, redirectUrl: env.NEXT_PUBLIC_BASE_URL });
}
