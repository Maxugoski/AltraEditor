/**
 * Format milliseconds to timecode string HH:MM:SS:FF or MM:SS:FF
 */
export function formatTimecode(ms: number, fps: number = 30, showHours: boolean = false): string {
  if (isNaN(ms) || ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  const frames = Math.floor((milliseconds / 1000) * fps);
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z: number = 2) => ('00' + n).slice(-z);

  if (showHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Format milliseconds to simple human-readable format like "01:24s" or "2m 15s"
 */
export function formatDuration(ms: number): string {
  if (isNaN(ms) || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => ('00' + n).slice(-2);
  return `${minutes}:${pad(seconds)}`;
}

/**
 * Snap a time (in ms) to nearby clip boundaries or playhead if within threshold
 */
export function snapTime(
  targetMs: number,
  snapPoints: number[],
  thresholdMs: number = 150
): { snappedTime: number; didSnap: boolean } {
  let closestDistance = Infinity;
  let closestPoint = targetMs;

  for (const point of snapPoints) {
    const dist = Math.abs(targetMs - point);
    if (dist <= thresholdMs && dist < closestDistance) {
      closestDistance = dist;
      closestPoint = point;
    }
  }

  if (closestDistance !== Infinity) {
    return { snappedTime: closestPoint, didSnap: true };
  }
  return { snappedTime: targetMs, didSnap: false };
}

/**
 * Convert pixels to milliseconds based on zoom (pixels per second)
 */
export function pxToMs(px: number, zoomPxPerSec: number): number {
  return Math.max(0, (px / zoomPxPerSec) * 1000);
}

/**
 * Convert milliseconds to pixels based on zoom (pixels per second)
 */
export function msToPx(ms: number, zoomPxPerSec: number): number {
  return (ms / 1000) * zoomPxPerSec;
}
