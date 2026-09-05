import { Track, ExportSettings } from '@/types/editor';
import { CanvasRenderer } from '@/lib/render/canvasRenderer';

export interface ExportProgressCallback {
  (progress: number, message: string): void;
}

/**
 * High-performance client-side video rendering & export engine
 * Renders all timeline tracks frame-by-frame and records to high-bitrate WebM/MP4
 */
export async function exportProjectToVideo(
  tracks: Track[],
  durationMs: number,
  settings: ExportSettings,
  onProgress: ExportProgressCallback
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const { width, height, fps, format, bitrateKbps } = settings;
      const totalFrames = Math.max(1, Math.ceil((durationMs / 1000) * fps));
      const frameIntervalMs = 1000 / fps;

      onProgress(5, 'Initializing render pipeline...');

      // Create high-resolution offscreen export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;

      const renderer = new CanvasRenderer(exportCanvas);

      // Preload all media in tracks
      for (const track of tracks) {
        for (const clip of track.clips) {
          if (clip.src && !clip.src.startsWith('synth-')) {
            renderer.getMediaElement(clip.src, clip.type);
          }
        }
      }

      onProgress(15, 'Preparing media streams & codecs...');

      // Check MediaRecorder stream capture support
      const stream = exportCanvas.captureStream(fps);
      const mimeType = format === 'mp4'
        ? (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' : 'video/webm;codecs=vp9')
        : 'video/webm;codecs=vp9';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: (bitrateKbps || 6000) * 1000,
      });

      const recordedChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, {
          type: format === 'mp4' ? 'video/mp4' : 'video/webm',
        });
        renderer.destroy();
        onProgress(100, 'Export complete!');
        resolve(finalBlob);
      };

      mediaRecorder.onerror = (err) => {
        renderer.destroy();
        reject(err);
      };

      mediaRecorder.start(100);

      // Frame-by-frame precision rendering loop
      let currentFrame = 0;

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames) {
          onProgress(95, 'Finalizing video stream...');
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 300);
          return;
        }

        const currentPlayheadMs = currentFrame * frameIntervalMs;
        renderer.render(tracks, currentPlayheadMs, width, height);

        currentFrame++;
        const pct = 15 + Math.round((currentFrame / totalFrames) * 75);

        if (currentFrame % 10 === 0 || currentFrame === totalFrames) {
          onProgress(
            pct,
            `Rendering frame ${currentFrame}/${totalFrames} (${Math.round((currentFrame / totalFrames) * 100)}%)`
          );
        }

        // Use requestAnimationFrame / setTimeout to keep main thread responsive
        if (currentFrame % 5 === 0) {
          setTimeout(renderNextFrame, 0);
        } else {
          requestAnimationFrame(renderNextFrame);
        }
      };

      // Start rendering loop
      renderNextFrame();
    } catch (err) {
      console.error('Export error:', err);
      reject(err);
    }
  });
}

/**
 * Trigger browser file download from Blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
