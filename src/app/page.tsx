"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState, useEffect } from "react";

type GeneratedPackage = {
  stickerPrompt: string;
  caption: string;
  article: string;
  hashtags: string[];
  sticker: {
    imageUrl: string;
    base64: string;
  };
  reel: {
    videoUrl: string;
  };
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: unknown;
}

interface UserInfo {
  userId: string;
  instagramUserId?: string;
  instagramUsername?: string;
}

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("活潑");
  const [audience, setAudience] = useState("Instagram 粉絲");
  const [language, setLanguage] = useState("zh-TW");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState<"post" | "reel" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedPackage | null>(null);

  // Check authentication on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const stickerPreview = useMemo(() => {
    if (!result?.sticker.base64) return null;
    return `data:image/png;base64,${result.sticker.base64}`;
  }, [result]);

  const joinedHashtags = useMemo(() => {
    return result?.hashtags.join(" ") ?? "";
  }, [result]);

  const captionsTrackUrl = useMemo(() => {
    if (!result) return null;
    const text = (result.caption || result.article || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) return null;

    const vtt = `WEBVTT\n\n00:00:00.000 --> 00:00:08.000\n${text}`;
    return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
  }, [result]);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, tone, audience, language }),
      });

      const data = (await response.json()) as ApiResponse<GeneratedPackage>;

      if (!response.ok || !data.success || !data.data) {
        throw new Error("AI 生成失敗，請稍後再試。");
      }

      setResult(data.data);
      setMessage("已生成專屬 IG 套餐，快來預覽！");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "發生未知錯誤。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (kind: "post" | "reel") => {
    if (!result) return;

    if (!user) {
      setError("請先登入 Instagram 才能分享內容！");
      return;
    }

    resetFeedback();
    setIsSharing(kind);

    try {
      const payload =
        kind === "post"
          ? {
              kind,
              caption: `${result.caption}\n\n${joinedHashtags}`,
              imageUrl: result.sticker.imageUrl,
            }
          : {
              kind,
              caption: `${result.caption}\n\n${joinedHashtags}`,
              videoUrl: result.reel.videoUrl,
              shareToFeed: true,
            };

      const response = await fetch("/api/instagram/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as ApiResponse<{
        mediaId: string | null;
      }>;

      if (!response.ok || !data.success) {
        if (response.status === 401) {
          throw new Error("請先登入 Instagram 才能分享內容！");
        }
        throw new Error("分享至 Instagram 失敗，請檢查權杖與權限設定。");
      }

      setMessage("Instagram 發佈已排程，稍等一會兒就會出現在 IG 上！");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "分享失敗，請稍後重試。");
    } finally {
      setIsSharing(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setResult(null);
      setMessage("已登出");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">
              IG Post Studio
            </p>
            <h1 className="text-2xl font-semibold">AI 一鍵生成 + 發佈</h1>
          </div>
          <div className="flex items-center gap-3">
            {isCheckingAuth ? (
              <div className="text-sm text-slate-400">載入中...</div>
            ) : user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium">{user.instagramUsername || "用戶"}</p>
                  <p className="text-xs text-slate-400">已連結 Instagram</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm transition hover:bg-slate-700"
                >
                  登出
                </button>
              </>
            ) : (
              <a
                href="/api/auth/instagram/login"
                className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-600 hover:to-pink-600"
              >
                使用 Instagram 登入
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-xl shadow-blue-500/10 backdrop-blur">
          <h2 className="text-lg font-semibold">輸入靈感</h2>
          <form className="space-y-5" onSubmit={handleGenerate}>
            <div className="space-y-2">
              <label className="text-sm text-slate-300" htmlFor="topic-input">
                主題*
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="例如：秋天限定拿鐵"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                required
                minLength={3}
                id="topic-input"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300" htmlFor="tone-input">
                  語氣
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  placeholder="活潑 / 溫暖 / 專業"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  id="tone-input"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm text-slate-300"
                  htmlFor="audience-input"
                >
                  目標粉絲
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  placeholder="例如：咖啡控、上班族"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  id="audience-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm text-slate-300"
                htmlFor="language-input"
              >
                語言
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="zh-TW / en / ja ..."
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                id="language-input"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-900"
              disabled={isGenerating}
            >
              {isGenerating ? "AI 生成中..." : "生成貼圖 + 文案"}
            </button>
          </form>

          {message && (
            <p className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}
        </section>

        <section className="space-y-6 rounded-3xl border border-white/5 bg-black/30 p-6 shadow-inner shadow-blue-500/5">
          <h2 className="text-lg font-semibold">預覽 & 一鍵分享</h2>

          {!result && (
            <p className="text-sm text-slate-400">
              先生成內容，就能在這裡預覽貼圖、文案與 Reels！
            </p>
          )}

          {result && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                {stickerPreview ? (
                  <Image
                    src={stickerPreview}
                    alt="AI 貼圖預覽"
                    width={224}
                    height={224}
                    className="h-56 w-56 rounded-2xl border border-white/10 bg-white object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-slate-500">
                    貼圖預覽載入中
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  雲端網址：{result.sticker.imageUrl}
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4">
                <h3 className="text-sm font-semibold text-purple-200">
                  Reels 預覽
                </h3>
                <video
                  className="w-full rounded-xl border border-white/10"
                  controls
                  src={result.reel.videoUrl}
                  preload="metadata"
                >
                  {captionsTrackUrl ? (
                    <track
                      kind="captions"
                      src={captionsTrackUrl}
                      srcLang="zh"
                      label="AI 產生字幕"
                      default
                    />
                  ) : null}
                </video>
                <p className="text-xs text-slate-400 break-all">
                  影片網址：{result.reel.videoUrl}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-blue-200">
                    Caption
                  </h3>
                  <p className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.caption}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-200">
                    Hashtags
                  </h3>
                  <p className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm leading-relaxed">
                    {joinedHashtags}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-200">
                    文章 / Script
                  </h3>
                  <p className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.article}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className="rounded-xl border border-white/10 bg-emerald-500/90 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900"
                  disabled={isSharing === "post"}
                  onClick={() => handleShare("post")}
                  type="button"
                >
                  {isSharing === "post" ? "分享貼文中..." : "分享到 IG 貼文"}
                </button>
                <button
                  className="rounded-xl border border-white/10 bg-purple-500/90 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-purple-900"
                  disabled={isSharing === "reel"}
                  onClick={() => handleShare("reel")}
                  type="button"
                >
                  {isSharing === "reel" ? "發布短影片中..." : "分享到 IG Reels"}
                </button>
              </div>

              <p className="text-xs text-slate-500">
                注意：需使用 Instagram Business/Creator 帳號並授權 Content
                Publishing API，分享後內容可能需數十秒才出現在 IG 上。
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
