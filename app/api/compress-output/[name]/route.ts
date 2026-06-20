import fs from "node:fs";
import path from "node:path";
import { serverOutputRoot } from "@/lib/server-runtime";

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const safeName = path.basename(decodeURIComponent(name));
  if (!safeName || safeName.includes("..")) {
    return new Response("Invalid file name.", { status: 400 });
  }

  const root = serverOutputRoot();
  const filePath = path.join(root, safeName);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
    return new Response("File not found or expired.", { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(safeName).toLowerCase();
  const mime =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".mp4"
        ? "video/mp4"
        : ext === ".br"
          ? "application/octet-stream"
          : "application/octet-stream";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${safeName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
