import { ChromaKeySettings } from '@/types/editor';

/**
 * Convert Hex color string (#RRGGBB) to RGB tuple [r, g, b] (0-255)
 */
export function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
  ];
}

/**
 * Color distance in normalized Euclidean space
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = (r1 - r2) / 255;
  const dg = (g1 - g2) / 255;
  const db = (b1 - b2) / 255;
  return Math.sqrt(dr * dr + dg * dg + db * db) / 1.7320508; // Normalized to 0..1
}

/**
 * Apply chroma keying to canvas ImageData directly with spill suppression
 */
export function applyChromaKeyToImageData(
  imageData: ImageData,
  settings: ChromaKeySettings
): ImageData {
  if (!settings.enabled) return imageData;

  const [targetR, targetG, targetB] = hexToRgb(settings.color || '#00FF00');
  const data = imageData.data;
  const length = data.length;
  const threshold = settings.similarity; // e.g. 0.3
  const smoothness = Math.max(0.001, settings.smoothness); // e.g. 0.1
  const spill = settings.spill; // e.g. 0.5

  for (let i = 0; i < length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    const dist = colorDistance(r, g, b, targetR, targetG, targetB);

    if (dist < threshold) {
      // Completely transparent
      data[i + 3] = 0;
    } else if (dist < threshold + smoothness) {
      // Smooth alpha transition
      const factor = (dist - threshold) / smoothness;
      data[i + 3] = Math.round(a * factor);

      // Spill suppression
      if (spill > 0) {
        if (targetG > targetR && targetG > targetB) {
          // Green screen spill
          const maxRB = Math.max(r, b);
          if (g > maxRB) {
            data[i + 1] = Math.round(g * (1 - spill) + maxRB * spill);
          }
        } else if (targetB > targetR && targetB > targetG) {
          // Blue screen spill
          const maxRG = Math.max(r, g);
          if (b > maxRG) {
            data[i + 2] = Math.round(b * (1 - spill) + maxRG * spill);
          }
        }
      }
    } else if (spill > 0) {
      // Spill suppression in near-key areas
      if (targetG > targetR && targetG > targetB) {
        const maxRB = Math.max(r, b);
        if (g > maxRB) {
          data[i + 1] = Math.round(g * (1 - spill * 0.5) + maxRB * (spill * 0.5));
        }
      }
    }
  }

  return imageData;
}
