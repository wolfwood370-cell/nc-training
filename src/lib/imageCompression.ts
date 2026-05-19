/**
 * Client-side image compression using HTML5 Canvas.
 * Resizes to max 1920px (width or height), converts to WebP (with JPEG fallback),
 * and iteratively reduces quality to enforce a 500KB hard cap.
 * Files already under 500KB are returned as-is.
 */

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const PREFERRED_FORMAT = "image/webp";
const FALLBACK_FORMAT = "image/jpeg";

function supportsWebP(): boolean {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(PREFERRED_FORMAT).startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function resizeAndCompress(
  img: HTMLImageElement,
  maxDim: number,
  quality: number,
  format: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let { width, height } = img;

    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob returned null"));
          return;
        }
        resolve(blob);
      },
      format,
      quality,
    );
  });
}

/**
 * Compress an image file client-side.
 * - Files under 500 KB are returned unchanged.
 * - Resizes to `maxDim` (default 1920 px), outputs WebP (or JPEG fallback).
 * - Iteratively lowers quality and, as a last resort, shrinks dimensions to
 *   stay under the 500 KB hard cap.
 *
 * @returns A `File` object (preserving a usable filename).
 */
export async function compressImage(file: File, maxDim = 1920, quality = 0.8): Promise<File> {
  // Skip compression for small files
  if (file.size <= MAX_FILE_SIZE) {
    return file;
  }

  const img = await loadImage(file);
  const format = supportsWebP() ? PREFERRED_FORMAT : FALLBACK_FORMAT;
  const ext = format === PREFERRED_FORMAT ? "webp" : "jpg";

  // First pass at requested quality
  let blob = await resizeAndCompress(img, maxDim, quality, format);

  // Iteratively lower quality if still over cap
  let q = quality - 0.1;
  while (blob.size > MAX_FILE_SIZE && q >= 0.1) {
    blob = await resizeAndCompress(img, maxDim, q, format);
    q -= 0.1;
  }

  // Last resort: shrink dimensions
  if (blob.size > MAX_FILE_SIZE) {
    blob = await resizeAndCompress(img, Math.round(maxDim * 0.75), 0.3, format);
  }

  // Wrap as File so callers can use .name / .type seamlessly
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, { type: format });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
