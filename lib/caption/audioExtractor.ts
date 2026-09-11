import { Track, Clip } from '@/types/editor';

/**
 * High-performance browser-native audio extraction and 16kHz mono resampling engine
 * Prepares timeline media for OpenAI Whisper AI STT inference
 */
export async function extractAudioFromTimeline(
  tracks: Track[],
  options?: {
    specificTrackId?: string | null;
    specificClipId?: string | null;
    maxDurationSec?: number;
  }
): Promise<{
  audioData: Float32Array;
  sampleRate: number;
  durationSec: number;
}> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser environment.');
  }

  // 1. Collect relevant clips
  let eligibleClips: Clip[] = [];
  tracks.forEach((track) => {
    if (options?.specificTrackId && track.id !== options.specificTrackId) return;
    if (track.muted) return;

    track.clips.forEach((clip) => {
      if (options?.specificClipId && clip.id !== options.specificClipId) return;
      if (clip.muted) return;
      if (clip.type === 'video' || clip.type === 'audio') {
        if (clip.src && !clip.src.startsWith('synth-')) {
          eligibleClips.push(clip);
        }
      }
    });
  });

  // Calculate timeline span
  let maxEndTimeMs = 0;
  eligibleClips.forEach((c) => {
    const end = c.startMs + c.durationMs;
    if (end > maxEndTimeMs) maxEndTimeMs = end;
  });

  const durationSec = Math.max(
    1,
    Math.min(options?.maxDurationSec || 120, maxEndTimeMs / 1000)
  );

  const targetSampleRate = 16000; // Standard 16kHz for Whisper
  const totalSamples = Math.ceil(durationSec * targetSampleRate);

  // If no real media files on timeline, notify user
  if (eligibleClips.length === 0) {
    throw new Error('No audio or video clips found on the timeline. Please add a video or audio clip to the timeline first.');
  }

  const decodeCtx = new AudioCtx();

  try {
    const OfflineAudioCtx =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;

    const offlineCtx = new OfflineAudioCtx(1, totalSamples, targetSampleRate);

    // Fetch and decode each clip into the offline context
    for (const clip of eligibleClips) {
      try {
        const response = await fetch(clip.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);

        const sourceNode = offlineCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.playbackRate.value = clip.playbackRate || 1;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, clip.volume));

        sourceNode.connect(gainNode);
        gainNode.connect(offlineCtx.destination);

        const timelineOffsetSec = clip.startMs / 1000;
        const sourceOffsetSec = (clip.sourceStartMs || 0) / 1000;
        const clipDurationSec = clip.durationMs / 1000;

        sourceNode.start(timelineOffsetSec, sourceOffsetSec, clipDurationSec);
      } catch (err) {
        console.warn(`Could not decode audio from clip: ${clip.name}`, err);
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    // Normalize audio volume for optimal Whisper speech recognition accuracy
    const normalizedData = normalizeAudio(channelData);

    return {
      audioData: normalizedData,
      sampleRate: targetSampleRate,
      durationSec,
    };
  } finally {
    try {
      await decodeCtx.close();
    } catch {}
  }
}

/**
 * Normalizes Float32Array audio samples to -1.0 .. 1.0 peak range with headroom
 */
function normalizeAudio(samples: Float32Array): Float32Array {
  let maxAmp = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }

  if (maxAmp === 0) return samples;

  const targetAmp = 0.88;
  const multiplier = Math.min(8.0, targetAmp / maxAmp);

  const output = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    output[i] = Math.max(-1.0, Math.min(1.0, samples[i] * multiplier));
  }
  return output;
}
