/** ffmpeg flags tuned for QuickTime / iOS / macOS playback. */
export const QUICKTIME_VIDEO_ARGS = {
  h264: [
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-pix_fmt",
    "yuv420p",
  ],
  hevc: [
    "-c:v",
    "libx265",
    "-tag:v",
    "hvc1",
    "-preset",
    "medium",
    "-crf",
    "30",
    "-pix_fmt",
    "yuv420p",
  ],
  audio: ["-c:a", "aac", "-ac", "2", "-ar", "48000", "-b:a", "128k"],
  mux: ["-movflags", "+faststart"],
  maps: ["-map", "0:v:0?", "-map", "0:a:0?"],
} as const;

export function buildQuickTimeFfmpegArgs(
  inputPath: string,
  outputPath: string,
  codec: "h264" | "hevc",
): string[] {
  return [
    "-y",
    "-i",
    inputPath,
    ...QUICKTIME_VIDEO_ARGS.maps,
    ...QUICKTIME_VIDEO_ARGS[codec],
    ...QUICKTIME_VIDEO_ARGS.audio,
    ...QUICKTIME_VIDEO_ARGS.mux,
    outputPath,
  ];
}
