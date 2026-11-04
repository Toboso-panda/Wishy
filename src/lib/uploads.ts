import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const types: Record<string, { extension: string; acceptedExtensions: string[]; signature: (b: Buffer) => boolean }> = {
  "image/jpeg": { extension: ".jpg", acceptedExtensions: [".jpg", ".jpeg"], signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/jpg": { extension: ".jpg", acceptedExtensions: [".jpg", ".jpeg"], signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/pjpeg": { extension: ".jpg", acceptedExtensions: [".jpg", ".jpeg"], signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: ".png", acceptedExtensions: [".png"], signature: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: ".webp", acceptedExtensions: [".webp"], signature: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  "image/gif": { extension: ".gif", acceptedExtensions: [".gif"], signature: (b) => ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6)) },
};

export function uploadDirectory() {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

export async function saveImage(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (file.size > 5 * 1024 * 1024) throw new Error("La imatge és massa gran (màxim 5 MB).");
  const format = types[file.type];
  if (!format) throw new Error("Format d’imatge no vàlid. Fes servir JPG, PNG, WEBP o GIF.");
  if (!format.acceptedExtensions.includes(path.extname(file.name).toLowerCase())) throw new Error("L’extensió de la imatge no coincideix amb el seu format.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!format.signature(bytes)) throw new Error("El contingut del fitxer no correspon a una imatge vàlida.");
  const filename = `${randomUUID()}${format.extension}`;
  await mkdir(uploadDirectory(), { recursive: true });
  await writeFile(path.join(uploadDirectory(), filename), bytes, { flag: "wx" });
  return `/uploads/${filename}`;
}

export async function removeImage(imagePath?: string | null) {
  if (!imagePath) return;
  const filename = path.basename(imagePath);
  if (filename !== imagePath.replace(/^\/uploads\//, "")) return;
  try { await unlink(path.join(uploadDirectory(), filename)); } catch { /* Old images are best-effort cleanup. */ }
}
