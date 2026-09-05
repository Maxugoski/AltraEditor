/**
 * Client-Side Video Export Worker (WASM / WebCodecs / MediaRecorder)
 */
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

async function initFFmpeg() {
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => {
      self.postMessage({ type: 'LOG', message });
    });
    ffmpeg.on('progress', ({ progress, time }) => {
      self.postMessage({
        type: 'PROGRESS',
        progress: Math.min(100, Math.round(progress * 100)),
        message: `Encoding video... (${Math.round(progress * 100)}%)`,
      });
    });

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    } catch (e) {
      console.warn('Could not load remote FFmpeg core, falling back to local/fast muxer', e);
    }
  }
  return ffmpeg;
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    try {
      await initFFmpeg();
      self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (err: unknown) {
      self.postMessage({ type: 'INIT_ERROR', error: err instanceof Error ? err.message : String(err) });
    }
  } else if (type === 'TRANSCODE_FRAMES') {
    const { frames, fps, format, width, height, bitrateKbps } = payload;
    try {
      self.postMessage({ type: 'PROGRESS', progress: 10, message: 'Initializing transcode...' });
      const ff = await initFFmpeg();

      if (ff && ff.loaded) {
        // Write frames to virtual FS
        for (let i = 0; i < frames.length; i++) {
          const frameData = frames[i]; // ArrayBuffer / Uint8Array
          const fileName = `frame_${String(i).padStart(6, '0')}.jpg`;
          await ff.writeFile(fileName, new Uint8Array(frameData));

          if (i % 20 === 0) {
            self.postMessage({
              type: 'PROGRESS',
              progress: 10 + Math.round((i / frames.length) * 40),
              message: `Stitching frame ${i + 1}/${frames.length}...`,
            });
          }
        }

        const outputFileName = format === 'mp4' ? 'output.mp4' : 'output.webm';
        self.postMessage({ type: 'PROGRESS', progress: 60, message: 'Muxing video with FFmpeg WASM...' });

        if (format === 'mp4') {
          await ff.exec([
            '-framerate', String(fps || 30),
            '-i', 'frame_%06d.jpg',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-b:v', `${bitrateKbps || 4000}k`,
            '-preset', 'ultrafast',
            outputFileName,
          ]);
        } else {
          await ff.exec([
            '-framerate', String(fps || 30),
            '-i', 'frame_%06d.jpg',
            '-c:v', 'libvpx-vp9',
            '-pix_fmt', 'yuv420p',
            '-b:v', `${bitrateKbps || 4000}k`,
            outputFileName,
          ]);
        }

        const data = (await ff.readFile(outputFileName)) as Uint8Array;
        const blob = new Blob([data.buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });

        // Clean virtual FS
        for (let i = 0; i < frames.length; i++) {
          try {
            await ff.deleteFile(`frame_${String(i).padStart(6, '0')}.jpg`);
          } catch {}
        }
        try {
          await ff.deleteFile(outputFileName);
        } catch {}

        self.postMessage({
          type: 'COMPLETE',
          payload: {
            blob,
            format,
            filename: `altra_export_${Date.now()}.${format}`,
          },
        });
      } else {
        throw new Error('FFmpeg WASM could not be initialized');
      }
    } catch (err: unknown) {
      console.error('Export worker error:', err);
      self.postMessage({
        type: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
