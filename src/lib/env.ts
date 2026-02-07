import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "Missing OPENAI_API_KEY"),
  FIREBASE_PROJECT_ID: z.string().min(1, "Missing FIREBASE_PROJECT_ID"),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, "Missing FIREBASE_STORAGE_BUCKET"),
  FIREBASE_SERVICE_ACCOUNT_KEY: z
    .string()
    .min(1, "Missing FIREBASE_SERVICE_ACCOUNT_KEY"),
  FIREBASE_API_KEY: z.string().min(1, "Missing FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, "Missing FIREBASE_AUTH_DOMAIN"),
  INSTAGRAM_APP_ID: z.string().min(1, "Missing INSTAGRAM_APP_ID"),
  INSTAGRAM_APP_SECRET: z.string().min(1, "Missing INSTAGRAM_APP_SECRET"),
  INSTAGRAM_GRAPH_API_VERSION: z.string().optional().default("v21.0"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL must be a valid URL"),
});

const envResult = envSchema.safeParse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID,
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
  INSTAGRAM_GRAPH_API_VERSION: process.env.INSTAGRAM_GRAPH_API_VERSION,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
});

if (!envResult.success) {
  console.error("❌ Invalid environment variables:");
  console.error(envResult.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = envResult.data;
