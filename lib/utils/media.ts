import { MediaAsset, MediaType } from '@/types/editor';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.wmv', '.m4v', '.3gp', '.ts'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.wma', '.opus'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'];

export function detectMediaType(file: File): MediaType {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('image/')) return 'image';

  if (VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'video';
  if (AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'audio';
  if (IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'image';

  return 'video'; // default fallback
}

/**
 * Generate audio waveform peaks safely without loading large files into memory
 */
export async function extractAudioWaveform(url: string, fileSizeBytes: number = 0, samples: number = 50): Promise<number[]> {
  // If file is large (> 15MB), generate a stylized pseudo-waveform to prevent browser out-of-memory crash
  if (fileSizeBytes > 15 * 1024 * 1024) {
    return Array.from({ length: samples }, (_, i) => {
      const v = Math.abs(Math.sin(i * 0.4) * 0.6 + Math.cos(i * 0.9) * 0.3) + 0.15;
      return Math.min(1, Math.max(0.1, v));
    });
  }

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) throw new Error('No AudioContext');
    const audioCtx = new AudioCtx();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const peaks: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      const step = Math.max(1, Math.floor(blockSize / 20)); // Subsample for extreme speed
      for (let j = 0; j < blockSize; j += step) {
        sum += Math.abs(rawData[blockStart + j] || 0);
      }
      peaks.push(Math.min(1, (sum / (blockSize / step)) * 2.5));
    }
    await audioCtx.close();
    return peaks;
  } catch (err) {
    return Array.from({ length: samples }, (_, i) => {
      const v = Math.abs(Math.sin(i * 0.5) * 0.7) + 0.2;
      return Math.min(1, v);
    });
  }
}

/**
 * Generate a thumbnail data URL from a video URL quickly and safely
 */
export function generateVideoThumbnail(videoUrl: string, timeSec: number = 1): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // Timeout safeguard: never hang more than 1.5 seconds
    const timeout = setTimeout(() => {
      cleanup();
      resolve('');
    }, 1500);

    const cleanup = () => {
      clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
    };

    video.onloadedmetadata = () => {
      const targetTime = Math.min(Math.max(0.5, timeSec), (video.duration || 2) / 2);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL('image/jpeg', 0.7);
          cleanup();
          resolve(data);
          return;
        }
      } catch {}
      cleanup();
      resolve('');
    };

    video.onerror = () => {
      cleanup();
      resolve('');
    };

    video.src = videoUrl;
  });
}

/**
 * Inspect any media file (even large 1GB+ files) asynchronously with zero lag
 */
export async function inspectMediaFile(file: File): Promise<MediaAsset> {
  const objectUrl = URL.createObjectURL(file);
  const type = detectMediaType(file);

  let durationMs = 5000;
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;
  let thumbnailUrl: string | undefined = undefined;
  let waveform: number[] | undefined = undefined;

  if (type === 'video') {
    await new Promise<void>((resolve) => {
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.muted = true;

      const timer = setTimeout(resolve, 2000); // 2s max wait

      vid.onloadedmetadata = () => {
        clearTimeout(timer);
        durationMs = Math.max(1000, Math.round((vid.duration || 5) * 1000));
        width = vid.videoWidth || 1920;
        height = vid.videoHeight || 1080;
        resolve();
      };

      vid.onerror = () => {
        clearTimeout(timer);
        resolve();
      };

      vid.src = objectUrl;
    });

    thumbnailUrl = await generateVideoThumbnail(objectUrl, 1);
    waveform = await extractAudioWaveform(objectUrl, file.size, 40);
  } else if (type === 'audio') {
    await new Promise<void>((resolve) => {
      const aud = document.createElement('audio');
      aud.preload = 'metadata';

      const timer = setTimeout(resolve, 2000);

      aud.onloadedmetadata = () => {
        clearTimeout(timer);
        durationMs = Math.max(1000, Math.round((aud.duration || 5) * 1000));
        resolve();
      };

      aud.onerror = () => {
        clearTimeout(timer);
        resolve();
      };

      aud.src = objectUrl;
    });

    waveform = await extractAudioWaveform(objectUrl, file.size, 40);
  } else if (type === 'image') {
    thumbnailUrl = objectUrl;
    await new Promise<void>((resolve) => {
      const img = new Image();
      const timer = setTimeout(resolve, 1500);

      img.onload = () => {
        clearTimeout(timer);
        width = img.naturalWidth;
        height = img.naturalHeight;
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve();
      };

      img.src = objectUrl;
    });
  }

  return {
    id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    type,
    src: objectUrl,
    durationMs: durationMs || 5000,
    sizeBytes: file.size,
    width,
    height,
    thumbnailUrl,
    waveform,
  };
}
