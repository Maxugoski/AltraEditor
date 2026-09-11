/**
 * Centralized Client-Side Audio Management Engine
 * Handles user-gesture unlocking, Web Audio context, and multi-track audio synchronization
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
  private audioContext: AudioContext | null = null;
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private isUnlocked: boolean = false;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Unlock browser audio context and audio elements on user gesture (click/keydown)
   * This MUST be called synchronously inside a user interaction handler.
   */
  public unlock(): void {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // Pre-warm a tiny silent buffer to unlock mobile and desktop browser autoplay
      if (this.audioContext && !this.isUnlocked) {
        const buffer = this.audioContext.createBuffer(1, 1, 22050);
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        this.isUnlocked = true;
      }
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
  }

  private clipSrcMap: Map<string, string> = new Map();

  public getAudioElement(clipId: string, src: string): HTMLAudioElement | null {
    if (!src || src.startsWith('synth-') || (!src.startsWith('blob:') && !src.startsWith('http') && !src.startsWith('data:'))) {
      return null;
    }

    const currentRawSrc = this.clipSrcMap.get(clipId);
    let audio = this.audioElements.get(clipId);
    if (!audio || currentRawSrc !== src) {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      try {
        audio = new Audio(src);
        audio.preload = 'auto';
        if (src.startsWith('http://') || src.startsWith('https://')) {
          audio.crossOrigin = 'anonymous';
        }
        this.audioElements.set(clipId, audio);
        this.clipSrcMap.set(clipId, src);
      } catch {
        return null;
      }
    }
    return audio;
  }

  /**
   * Synchronize all audio tracks with the current playhead
   */
  public sync(
    audioClips: Array<{
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
    }>,
    playheadMs: number,
    isPlaying: boolean
  ) {
    audioClips.forEach((clip) => {
      if (!clip.src) return;

      const audio = this.getAudioElement(clip.id, clip.src);
      if (!audio) return;

      const isActive = playheadMs >= clip.startMs && playheadMs <= clip.startMs + clip.durationMs;
      const targetTime = ((playheadMs - clip.startMs) * clip.playbackRate + clip.sourceStartMs) / 1000;
      const finalVolume = (clip.muted || clip.trackMuted) ? 0 : Math.min(1, Math.max(0, clip.volume * clip.trackVolume));

      audio.volume = finalVolume;
      audio.playbackRate = clip.playbackRate || 1;

      if (isActive && finalVolume > 0) {
        // Correct time drift if off by more than 0.2s
        if (Math.abs(audio.currentTime - targetTime) > 0.2) {
          try {
            audio.currentTime = Math.max(0, targetTime);
          } catch {}
        }

        if (isPlaying) {
          if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                console.debug('Audio play deferred:', err);
              });
            }
          }
        } else {
          if (!audio.paused) audio.pause();
        }
      } else {
        if (!audio.paused) audio.pause();
      }
    });
  }

  public pauseAll() {
    this.audioElements.forEach((audio) => {
      if (!audio.paused) audio.pause();
    });
  }

  public destroy() {
    this.pauseAll();
    this.audioElements.forEach((audio) => {
      audio.src = '';
    });
    this.audioElements.clear();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const audioManager = AudioManager.getInstance();
