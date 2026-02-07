import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { generateIgPackage } from "@/lib/generator";

const requestSchema = z.object({
  topic: z.string().min(3, "Topic is too short"),
  tone: z.string().optional(),
  audience: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = requestSchema.parse(json);

    const result = await generateIgPackage(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.flatten() },
        { status: 400 },
      );
    }

    console.error("/api/generate error", error);

    return NextResponse.json(
      { success: false, error: "Failed to generate content" },
      { status: 500 },
    );
  }
}
