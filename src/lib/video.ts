import { type ChildProcess, spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const ffmpegBinaryPath: string = (() => {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide a binary path");
  }

  return ffmpegPath;
})();

export async function imageBufferToReel(
  imageBuffer: Buffer,
  options: {
    durationSeconds?: number;
    captionOverlay?: string;
  } = {},
) {
  const duration = options.durationSeconds ?? 8;
  const tempDir = await mkdtemp(join(tmpdir(), "igpost-"));
  const inputPath = join(tempDir, `${randomUUID()}.png`);
  const outputPath = join(tempDir, `${randomUUID()}.mp4`);

  await writeFile(inputPath, imageBuffer);

  const vf = [
    "scale=1080:1920:force_original_aspect_ratio=decrease",
    "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
  ];

  if (options.captionOverlay) {
    vf.push(
      `drawtext=text='${options.captionOverlay.replace(/'/g, "\\'")}':fontcolor=white:fontsize=40:box=1:boxcolor=black@0.6:boxborderw=20:x=(w-text_w)/2:y=h-200`,
    );
  }

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(ffmpegBinaryPath, [
      "-y",
      "-loop",
      "1",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-t",
      duration.toString(),
      "-pix_fmt",
      "yuv420p",
      "-vf",
      vf.join(","),
      "-movflags",
      "+faststart",
      outputPath,
    ]) as ChildProcess;

    ffmpeg.on("error", reject);
    ffmpeg.on("exit", (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });

  const videoBuffer = await readFile(outputPath);

  await Promise.all([
    rm(inputPath, { force: true }),
    rm(outputPath, { force: true }),
    rm(tempDir, { recursive: true, force: true }),
  ]);

  return videoBuffer;
}
