import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadDirectory } from "@/lib/uploads";

const mimeTypes: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename: rawFilename } = await params;
  const filename = path.basename(rawFilename);
  if (filename !== rawFilename || !/^[a-f0-9-]+\.(jpg|png|webp|gif)$/i.test(filename)) return new NextResponse("No trobat", { status: 404 });
  const mime = mimeTypes[path.extname(filename).toLowerCase()];
  const fullPath = path.resolve(uploadDirectory(), filename);
  if (!fullPath.startsWith(`${uploadDirectory()}${path.sep}`)) return new NextResponse("No trobat", { status: 404 });
  try {
    await stat(fullPath);
    const bytes = await readFile(fullPath);
    return new NextResponse(bytes, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new NextResponse("No trobat", { status: 404 }); }
}
