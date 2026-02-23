/**
 * Extracts a YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/**
 * Returns the high-quality thumbnail URL for a YouTube video.
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
