import { getUserFileForDownload } from "@/app/actions/files";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await getUserFileForDownload(id);

  if (!result.ok) {
    const status =
      result.error === "Unauthorized"
        ? 401
        : result.error === "Not found"
          ? 404
          : 500;
    return new Response(result.error, { status });
  }

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${result.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
