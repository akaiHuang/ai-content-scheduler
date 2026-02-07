import { z } from "zod";
import { openai } from "./openai";
import { uploadBuffer } from "./storage";
import { imageBufferToReel } from "./video";

const contentSchema = z.object({
  sticker_prompt: z.string(),
  caption: z.string(),
  article: z.string(),
  hashtags: z.array(z.string()).max(10),
});

export function normalizeHashtags(raw: string[]) {
  return raw
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => `#${tag.replace(/^#+/, "")}`)
    .filter((tag) => tag !== "#");
}

export interface GenerateOptions {
  topic: string;
  tone?: string;
  audience?: string;
  language?: string;
}

export async function generateIgPackage(options: GenerateOptions) {
  const { topic, tone, audience, language } = options;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a top-tier Instagram strategist. Produce compelling sticker prompts, captions, and article copy in the requested language.",
      },
      {
        role: "user",
        content: `Create content for an Instagram post about "${topic}"${tone ? ` with a ${tone} tone` : ""}${audience ? ` targeted at ${audience}` : ""}. Respond in ${language ?? "the same language as the topic"}. Provide JSON following the schema.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ig_package",
        schema: {
          type: "object",
          properties: {
            sticker_prompt: {
              description:
                "Short descriptive prompt for generating a fun sticker-style illustration.",
              type: "string",
            },
            caption: {
              description: "IG-ready caption under 2,000 characters.",
              type: "string",
            },
            article: {
              description:
                "Long-form article or script that can be used as supporting content.",
              type: "string",
            },
            hashtags: {
              description: "Array of 3-10 relevant hashtags without # prefix.",
              type: "array",
              items: {
                type: "string",
              },
              minItems: 3,
              maxItems: 10,
            },
          },
          required: ["sticker_prompt", "caption", "article", "hashtags"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("OpenAI did not return structured content");
  }

  const parsedContent = contentSchema.parse(JSON.parse(rawContent));

  const image = await openai.images.generate({
    model: "gpt-image-1",
    prompt: `${parsedContent.sticker_prompt}. Render as cute sticker with transparent background, bold outlines, Instagram-ready.`,
    size: "1024x1024",
    background: "transparent",
  });

  const base64 = image.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("OpenAI did not return an image");
  }

  const imageBuffer = Buffer.from(base64, "base64");
  const imageUrl = await uploadBuffer(imageBuffer, {
    contentType: "image/png",
    ext: "png",
  });

  const reelBuffer = await imageBufferToReel(imageBuffer, {
    captionOverlay: parsedContent.caption.slice(0, 120),
  });

  const reelUrl = await uploadBuffer(reelBuffer, {
    contentType: "video/mp4",
    ext: "mp4",
    prefix: "reels",
  });

  return {
    stickerPrompt: parsedContent.sticker_prompt,
    caption: parsedContent.caption,
    article: parsedContent.article,
    hashtags: normalizeHashtags(parsedContent.hashtags),
    sticker: {
      imageUrl,
      base64,
    },
    reel: {
      videoUrl: reelUrl,
    },
  };
}
