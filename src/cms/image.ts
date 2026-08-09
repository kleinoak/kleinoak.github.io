/**
 * Photo handling. The repository is the media store, so every upload is
 * resized in the browser before it is ever committed — a 6 MB phone photo
 * becomes a ~300 KB web image, and the git history stays usable.
 */
import { bytesToBase64, base64ByteLength } from "./encoding";
import { maxImageDimension, mediaDir, mediaUrlPrefix } from "./config";
import { slugify } from "./validation";

export type PreparedImage = {
  /** Repo-relative path the file will be committed to. */
  path: string;
  /** Public URL once published, e.g. /images/uploads/team-photo-2026.jpg */
  src: string;
  base64: string;
  width: number;
  height: number;
  bytes: number;
};

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file is not an image. Use a JPG or PNG.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxImageDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not process the image.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const keepPng = file.type === "image/png";
  const mimeType = keepPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, keepPng ? undefined : 0.82),
  );
  if (!blob) throw new Error("This browser could not process the image.");

  const base64 = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
  const extension = keepPng ? "png" : "jpg";
  const stem = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const fileName = `${stem}-${stamp}.${extension}`;

  return {
    path: `${mediaDir}/${fileName}`,
    src: `${mediaUrlPrefix}/${fileName}`,
    base64,
    width,
    height,
    bytes: base64ByteLength(base64),
  };
}

export function dataUrlFor(path: string, base64: string): string {
  const mimeType = path.endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
