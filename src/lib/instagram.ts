import { env } from "./env";

export interface UserInstagramCredentials {
  instagramUserId: string;
  accessToken: string;
}

type ShareInput =
  | {
      kind: "post";
      imageUrl: string;
      caption: string;
    }
  | {
      kind: "reel";
      videoUrl: string;
      caption: string;
      shareToFeed?: boolean;
    };

interface InstagramResponse<T> {
  data?: T;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

const GRAPH_BASE = `https://graph.facebook.com/${env.INSTAGRAM_GRAPH_API_VERSION}`;

async function callInstagram<T>(
  path: string,
  payload: Record<string, string>,
  accessToken: string,
) {
  const response = await fetch(`${GRAPH_BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      access_token: accessToken,
      ...payload,
    }),
  });

  const json = (await response.json()) as InstagramResponse<T>;

  if (!response.ok || json.error) {
    throw new Error(
      json.error?.message ??
        `Instagram API error (${response.status} ${response.statusText})`,
    );
  }

  return json;
}

export async function publishToInstagram(
  input: ShareInput,
  credentials: UserInstagramCredentials,
) {
  const creationPayload: Record<string, string> = {
    caption: input.caption,
  };

  if (input.kind === "post") {
    creationPayload.image_url = input.imageUrl;
  } else {
    creationPayload.media_type = "REELS";
    creationPayload.video_url = input.videoUrl;
    if (input.shareToFeed !== undefined) {
      creationPayload.share_to_feed = input.shareToFeed ? "true" : "false";
    }
  }

  const creation = await callInstagram<{ id: string }>(
    `${credentials.instagramUserId}/media`,
    creationPayload,
    credentials.accessToken,
  );

  if (!creation?.data?.id) {
    throw new Error("Failed to create Instagram media container");
  }

  const publish = await callInstagram<{ id: string }>(
    `${credentials.instagramUserId}/media_publish`,
    {
      creation_id: creation.data.id,
    },
    credentials.accessToken,
  );

  return {
    creationId: creation.data.id,
    mediaId: publish.data?.id ?? null,
  };
}
