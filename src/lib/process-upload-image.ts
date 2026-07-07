import path from "path";
import sharp from "sharp";

const MAX_EDGE = Number(process.env.UPLOAD_MAX_EDGE ?? 1920);
const WEBP_QUALITY = Number(process.env.UPLOAD_WEBP_QUALITY ?? 82);
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

/** Resize, auto-orient, and compress uploads for web display without visible quality loss. */
export async function processUploadImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
}

export function getMaxUploadInputBytes(): number {
  return MAX_INPUT_BYTES;
}
