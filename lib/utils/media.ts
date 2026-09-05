import { MediaAsset, MediaType } from '@/types/editor';

/**
 * Generate audio waveform peaks from an AudioBuffer or audio element URL
 */
export async function extractAudioWaveform(url: string, samples: number = 60): Promise<number[]> {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    
    const rawData = audioBuffer.getChannelData(0); // Left channel
    const blockSize = Math.floor(rawData.length / samples);
    const peaks: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j] || 0);
      }
      peaks.push(Math.min(1, (sum / blockSize) * 2.5));
    }
    await audioCtx.close();
    return peaks;
  } catch (err) {
    console.warn('Could not extract waveform, generating stylized fallback', err);
    // Return pseudo-random stylized waveform peaks
    return Array.from({ length: samples }, () => Math.sin(Math.random() * Math.PI) * 0.7 + 0.2);
  }
}

/**
 * Generate a thumbnail data URL from a video URL at time 1.0s
 */
export function generateVideoThumbnail(videoUrl: string, timeSec: number = 1): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.currentTime = timeSec;
    video.muted = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(timeSec, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve('');
      }
    };

    video.onerror = () => {
      resolve('');
    };

    // Timeout safety
    setTimeout(() => resolve(''), 3000);
  });
}

/**
 * Get media file metadata (duration, width, height, type)
 */
export async function inspectMediaFile(file: File): Promise<MediaAsset> {
  const objectUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video');
  const isAudio = file.type.startsWith('audio');
  const isImage = file.type.startsWith('image');

  let type: MediaType = 'video';
  if (isAudio) type = 'audio';
  if (isImage) type = 'image';

  let durationMs = 5000;
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;
  let thumbnailUrl: string | undefined = undefined;
  let waveform: number[] | undefined = undefined;

  if (isVideo) {
    await new Promise<void>((resolve) => {
      const vid = document.createElement('video');
      vid.src = objectUrl;
      vid.onloadedmetadata = () => {
        durationMs = Math.round(vid.duration * 1000);
        width = vid.videoWidth;
        height = vid.videoHeight;
        resolve();
      };
      vid.onerror = () => resolve();
      setTimeout(resolve, 3000);
    });
    thumbnailUrl = await generateVideoThumbnail(objectUrl, 1);
  } else if (isAudio) {
    await new Promise<void>((resolve) => {
      const aud = document.createElement('audio');
      aud.src = objectUrl;
      aud.onloadedmetadata = () => {
        durationMs = Math.round(aud.duration * 1000);
        resolve();
      };
      aud.onerror = () => resolve();
      setTimeout(resolve, 3000);
    });
    waveform = await extractAudioWaveform(objectUrl, 40);
  } else if (isImage) {
    durationMs = 5000; // default 5 seconds on timeline
    thumbnailUrl = objectUrl;
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        width = img.naturalWidth;
        height = img.naturalHeight;
        resolve();
      };
      img.onerror = () => resolve();
      setTimeout(resolve, 2000);
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

/**
 * Generate interactive synthetic video demo media (e.g. animated color waves, countdown, synth gradient)
 */
export function createSyntheticVideoAsset(title: string, type: 'cyberpunk' | 'countdown' | 'nature' | 'chroma-demo'): MediaAsset {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  // Draw poster
  if (type === 'chroma-demo') {
    // Green screen background with subject
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(640, 360, 160, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6366F1';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GREEN SCREEN DEMO', 640, 370);
  } else if (type === 'cyberpunk') {
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#4f46e5');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CYBERPUNK NEON', 640, 360);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#065f46');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), 640, 360);
  }

  const thumbUrl = canvas.toDataURL('image/jpeg');

  return {
    id: `asset_${type}_${Date.now()}`,
    name: title,
    type: 'video',
    src: thumbUrl,
    durationMs: 8000,
    sizeBytes: 1024 * 1024,
    width: 1280,
    height: 720,
    thumbnailUrl: thumbUrl,
  };
}
