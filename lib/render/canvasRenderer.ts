import { Clip, Track, SubtitleCue, Transform, TextStyle } from '@/types/editor';
import { applyChromaKeyToImageData } from '@/lib/ai/chromaKey';
import { audioManager } from '@/lib/audio/audioManager';

interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tracks: Track[];
  playheadMs: number;
  width: number;
  height: number;
  mediaPool: Map<string, HTMLVideoElement | HTMLImageElement>;
  offscreenCanvas: HTMLCanvasElement;
  offscreenCtx: CanvasRenderingContext2D;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private mediaPool: Map<string, HTMLVideoElement | HTMLImageElement> = new Map();
  private audioPool: Map<string, HTMLAudioElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) throw new Error('Failed to get offscreen context');
    this.offscreenCtx = offCtx;
  }

  public getMediaElement(src: string, type: string): HTMLVideoElement | HTMLImageElement | null {
    if (!src || src.startsWith('synth-')) return null;

    if (this.mediaPool.has(src)) {
      return this.mediaPool.get(src)!;
    }

    if (type === 'video') {
      const video = document.createElement('video');
      if (src.startsWith('http://') || src.startsWith('https://')) {
        video.crossOrigin = 'anonymous';
      }
      video.src = src;
      video.preload = 'auto';
      video.playsInline = true;
      this.mediaPool.set(src, video);
      return video;
    } else if (type === 'image') {
      const img = new Image();
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = src;
      this.mediaPool.set(src, img);
      return img;
    }
    return null;
  }

  public syncMediaPlayback(tracks: Track[], playheadMs: number, isPlaying: boolean) {
    const audioClipsToSync: Array<{
      id: string;
      src: string;
      startMs: number;
      durationMs: number;
      sourceStartMs: number;
      volume: number;
      muted: boolean;
      playbackRate: number;
      trackVolume: number;
      trackMuted: boolean;
    }> = [];

    tracks.forEach((track) => {
      if (track.muted || !track.visible) return;

      track.clips.forEach((clip) => {
        const isActive = playheadMs >= clip.startMs && playheadMs <= clip.startMs + clip.durationMs;
        const targetMediaTime = ((playheadMs - clip.startMs) * (clip.playbackRate || 1) + clip.sourceStartMs) / 1000;

        if (clip.type === 'video') {
          const video = this.getMediaElement(clip.src, 'video') as HTMLVideoElement | null;
          if (video) {
            video.playbackRate = clip.playbackRate || 1;
            const finalVol = (clip.muted || track.muted) ? 0 : Math.min(1, Math.max(0, track.volume * clip.volume));
            video.volume = finalVol;
            video.muted = clip.muted || track.muted || finalVol === 0;

            if (isActive) {
              if (Math.abs(video.currentTime - targetMediaTime) > 0.25) {
                try {
                  video.currentTime = Math.max(0, targetMediaTime);
                } catch {}
              }
              if (isPlaying) {
                if (video.paused) {
                  video.play().catch(() => {});
                }
              } else {
                if (!video.paused) video.pause();
              }
            } else {
              if (!video.paused) video.pause();
            }
          }
        } else if (clip.type === 'audio') {
          if (clip.src) {
            audioClipsToSync.push({
              id: clip.id,
              src: clip.src,
              startMs: clip.startMs,
              durationMs: clip.durationMs,
              sourceStartMs: clip.sourceStartMs,
              volume: clip.volume,
              muted: clip.muted,
              playbackRate: clip.playbackRate || 1,
              trackVolume: track.volume,
              trackMuted: track.muted,
            });
          }
        }
      });
    });

    // Synchronize all audio tracks through audioManager
    audioManager.sync(audioClipsToSync, playheadMs, isPlaying);
  }

  public pauseAllAudio() {
    audioManager.pauseAll();
    this.mediaPool.forEach((media) => {
      if (media instanceof HTMLVideoElement && !media.paused) {
        media.pause();
      }
    });
  }

  public render(tracks: Track[], playheadMs: number, targetWidth?: number, targetHeight?: number) {
    const width = targetWidth || this.canvas.width;
    const height = targetHeight || this.canvas.height;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (this.offscreenCanvas.width !== width || this.offscreenCanvas.height !== height) {
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
    }

    const ctx = this.ctx;
    ctx.save();
    // Clear canvas with dark cinematic background
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, width, height);

    // Filter tracks by layer order: Video first (bottom), Overlay next, Text on top
    const orderedTracks = [...tracks].filter((t) => t.visible).reverse();

    for (const track of orderedTracks) {
      for (const clip of track.clips) {
        if (playheadMs < clip.startMs || playheadMs > clip.startMs + clip.durationMs) {
          continue; // Clip not active at current time
        }

        const clipLocalTimeMs = playheadMs - clip.startMs;
        this.renderClip(clip, clipLocalTimeMs, width, height);
      }
    }

    ctx.restore();
  }

  private renderClip(clip: Clip, localTimeMs: number, width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();

    // Calculate Transitions (Fade in / Fade out / Slide / Zoom)
    let transitionOpacity = 1;
    let transitionScale = 1;
    let transitionOffsetX = 0;

    if (clip.transitionIn && localTimeMs < clip.transitionIn.duration) {
      const progress = localTimeMs / clip.transitionIn.duration;
      if (clip.transitionIn.type === 'fade' || clip.transitionIn.type === 'crossfade') {
        transitionOpacity = progress;
      } else if (clip.transitionIn.type === 'zoom-in') {
        transitionScale = 0.5 + progress * 0.5;
        transitionOpacity = progress;
      } else if (clip.transitionIn.type === 'slide-left') {
        transitionOffsetX = (1 - progress) * -width;
      }
    }

    const remainingMs = clip.durationMs - localTimeMs;
    if (clip.transitionOut && remainingMs < clip.transitionOut.duration) {
      const progress = remainingMs / clip.transitionOut.duration;
      if (clip.transitionOut.type === 'fade' || clip.transitionOut.type === 'crossfade') {
        transitionOpacity = Math.min(transitionOpacity, progress);
      }
    }

    // Apply Transformations
    const transform = clip.transform;
    const finalOpacity = transform.opacity * transitionOpacity;
    const finalScale = transform.scale * transitionScale;
    const centerX = width / 2 + transform.x + transitionOffsetX;
    const centerY = height / 2 + transform.y;

    ctx.globalAlpha = Math.max(0, Math.min(1, finalOpacity));
    ctx.translate(centerX, centerY);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(finalScale, finalScale);

    // Apply Filter Styles
    const f = clip.filters;
    const filterParts: string[] = [];
    if (f.brightness !== 100) filterParts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== 100) filterParts.push(`contrast(${f.contrast}%)`);
    if (f.saturation !== 100) filterParts.push(`saturate(${f.saturation}%)`);
    if (f.blur > 0) filterParts.push(`blur(${f.blur}px)`);
    if (f.hueRotate !== 0) filterParts.push(`hue-rotate(${f.hueRotate}deg)`);
    if (f.sepia > 0) filterParts.push(`sepia(${f.sepia}%)`);
    if (f.grayscale > 0) filterParts.push(`grayscale(${f.grayscale}%)`);

    if (filterParts.length > 0) {
      ctx.filter = filterParts.join(' ');
    }

    if (clip.type === 'video' || clip.type === 'image') {
      this.drawMediaClip(clip, width, height, localTimeMs);
    } else if (clip.type === 'text' || clip.type === 'subtitle') {
      this.drawTextClip(clip, width, height, localTimeMs);
    }

    ctx.restore();
  }

  private drawMediaClip(clip: Clip, width: number, height: number, localTimeMs: number) {
    const ctx = this.ctx;

    // Check if it's a synthetic procedural visual
    if (clip.src.startsWith('synth-pattern-1') || clip.src === 'synth-pattern-1') {
      this.drawSynthwaveVisual(ctx, width, height, localTimeMs);
      return;
    }
    if (clip.src.startsWith('synth-pattern-2') || clip.src === 'synth-pattern-2') {
      this.drawCyberCityVisual(ctx, width, height, localTimeMs);
      return;
    }

    const media = this.getMediaElement(clip.src, clip.type);

    if (media) {
      const sourceWidth = media instanceof HTMLVideoElement ? media.videoWidth || width : media.naturalWidth || width;
      const sourceHeight = media instanceof HTMLVideoElement ? media.videoHeight || height : media.naturalHeight || height;

      // Handle Chroma Keying
      if (clip.chromaKey && clip.chromaKey.enabled) {
        const offCanvas = this.offscreenCanvas;
        const offCtx = this.offscreenCtx;
        offCanvas.width = width;
        offCanvas.height = height;
        offCtx.clearRect(0, 0, width, height);
        offCtx.drawImage(media, -width / 2, -height / 2, width, height);

        const imgData = offCtx.getImageData(0, 0, width, height);
        const keyedData = applyChromaKeyToImageData(imgData, clip.chromaKey);
        offCtx.putImageData(keyedData, 0, 0);

        ctx.drawImage(offCanvas, -width / 2, -height / 2, width, height);
      } else {
        ctx.drawImage(media, -width / 2, -height / 2, width, height);
      }
    } else {
      // Fallback placeholder pattern
      const grad = ctx.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#312e81');
      ctx.fillStyle = grad;
      ctx.fillRect(-width / 2, -height / 2, width, height);

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(clip.name, 0, 0);
    }
  }

  private drawSynthwaveVisual(ctx: CanvasRenderingContext2D, width: number, height: number, timeMs: number) {
    const t = timeMs / 1000;
    const w = width;
    const h = height;

    // Retro Synthwave Grid & Neon Sun
    const bgGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    bgGrad.addColorStop(0, '#0f051d');
    bgGrad.addColorStop(0.5, '#2e1065');
    bgGrad.addColorStop(0.7, '#831843');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Glowing Sun
    const sunGrad = ctx.createLinearGradient(0, -150, 0, 50);
    sunGrad.addColorStop(0, '#facc15');
    sunGrad.addColorStop(1, '#f43f5e');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(0, -50, 140, 0, Math.PI * 2);
    ctx.fill();

    // Sun stripes
    ctx.fillStyle = '#0f051d';
    for (let i = 0; i < 6; i++) {
      const y = -20 + i * 16;
      ctx.fillRect(-140, y, 280, 4 + i * 2);
    }

    // Dynamic 3D perspective grid lines
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    const horizon = 60;
    const gridSpeed = (t * 60) % 30;

    for (let x = -w / 2; x <= w / 2; x += 80) {
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(x * 3, h / 2);
      ctx.stroke();
    }

    for (let y = horizon; y <= h / 2; y += 20) {
      const currentY = y + gridSpeed;
      if (currentY > h / 2) continue;
      ctx.beginPath();
      ctx.moveTo(-w / 2, currentY);
      ctx.lineTo(w / 2, currentY);
      ctx.stroke();
    }
  }

  private drawCyberCityVisual(ctx: CanvasRenderingContext2D, width: number, height: number, timeMs: number) {
    const t = timeMs / 1000;
    const w = width;
    const h = height;

    // Cyberpunk Skyline
    const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.6, '#0f172a');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Buildings silhouette
    ctx.fillStyle = '#020617';
    const buildingWidths = [120, 90, 140, 80, 160, 100, 130, 95, 110, 150];
    let currentX = -w / 2 - 50;
    for (let i = 0; i < buildingWidths.length; i++) {
      const bw = buildingWidths[i];
      const bh = 220 + Math.sin(i * 1.5) * 120;
      ctx.fillRect(currentX, h / 2 - bh, bw, bh);

      // Windows
      ctx.fillStyle = (i + Math.floor(t * 2)) % 2 === 0 ? '#38bdf8' : '#f59e0b';
      for (let wy = h / 2 - bh + 20; wy < h / 2 - 20; wy += 30) {
        for (let wx = currentX + 15; wx < currentX + bw - 15; wx += 25) {
          if (Math.sin(wx + wy) > 0) {
            ctx.fillRect(wx, wy, 8, 14);
          }
        }
      }
      ctx.fillStyle = '#020617';
      currentX += bw + 10;
    }
  }

  private drawTextClip(clip: Clip, width: number, height: number, localTimeMs: number) {
    const ctx = this.ctx;
    const style: TextStyle = clip.textStyle || {
      fontFamily: 'Inter, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      outlineColor: '#000000',
      outlineWidth: 3,
    };

    let textToDisplay = clip.textContent || '';

    // Check subtitle cues if present
    if (clip.subtitleCues && clip.subtitleCues.length > 0) {
      const cue = clip.subtitleCues.find(
        (c) => localTimeMs >= c.startMs && localTimeMs <= c.endMs
      );
      if (cue) {
        textToDisplay = cue.text;
      }
    }

    if (!textToDisplay) return;

    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.textAlign = style.textAlign || 'center';
    ctx.textBaseline = 'middle';

    const lines = textToDisplay.split('\n');
    const lineHeight = style.fontSize * 1.25;
    const startY = -((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;

      // Text background pill / box
      if (style.backgroundColor) {
        const metrics = ctx.measureText(line);
        const paddingX = 20;
        const paddingY = 8;
        ctx.fillStyle = style.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(
          -metrics.width / 2 - paddingX,
          y - lineHeight / 2 - paddingY,
          metrics.width + paddingX * 2,
          lineHeight + paddingY * 2,
          8
        );
        ctx.fill();
      }

      // Drop Shadow
      if (style.shadowColor) {
        ctx.shadowColor = style.shadowColor;
        ctx.shadowBlur = style.shadowBlur || 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
      }

      // Outline / Stroke
      if (style.outlineColor && style.outlineWidth) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = style.outlineWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y);
      }

      // Fill
      ctx.fillStyle = style.color || '#FFFFFF';
      ctx.fillText(line, 0, y);

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
  }

  public destroy() {
    this.mediaPool.forEach((media) => {
      if (media instanceof HTMLVideoElement) {
        media.pause();
        media.src = '';
      }
    });
    this.audioPool.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.mediaPool.clear();
    this.audioPool.clear();
  }
}
