/**
 * Synthesizes a real, royalty-free retro synthwave audio track using Web Audio API
 * Generates an actual playable WAV Blob so <audio> tags and Web Audio can play it seamlessly.
 */
export function generateSynthwaveAudioWavUrl(durationSec: number = 15): Promise<string> {
  return new Promise((resolve) => {
    try {
      const sampleRate = 44100;
      const totalSamples = sampleRate * durationSec;
      const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

      const bpm = 120;
      const beatDuration = 60 / bpm; // 0.5s per beat
      const sixteenth = beatDuration / 4;

      // Master compressor & gain
      const masterGain = offlineCtx.createGain();
      masterGain.gain.setValueAtTime(0.7, 0);
      masterGain.connect(offlineCtx.destination);

      // Chords progression: Am (A-C-E), F (F-A-C), C (C-E-G), G (G-B-D)
      const chordNotes = [
        [220.0, 261.63, 329.63], // Am
        [174.61, 220.0, 261.63], // F
        [130.81, 164.81, 196.0],  // C
        [196.0, 246.94, 293.66], // G
      ];

      // Bassline notes
      const bassNotes = [110.0, 87.31, 65.41, 98.0];

      // 1. Synthesize Chord Pads
      for (let bar = 0; bar < Math.ceil(durationSec / 2); bar++) {
        const chordIndex = bar % chordNotes.length;
        const notes = chordNotes[chordIndex];
        const barStart = bar * 2;

        notes.forEach((freq) => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, barStart);

          // Pad envelope
          gain.gain.setValueAtTime(0.001, barStart);
          gain.gain.linearRampToValueAtTime(0.08, barStart + 0.3);
          gain.gain.setValueAtTime(0.08, barStart + 1.6);
          gain.gain.linearRampToValueAtTime(0.001, barStart + 2.0);

          // Low pass filter
          const filter = offlineCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800 + Math.sin(bar) * 300, barStart);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(barStart);
          osc.stop(barStart + 2.0);
        });

        // 2. Synthesize Bass pulses
        const bassFreq = bassNotes[chordIndex];
        for (let b = 0; b < 8; b++) {
          const bassTime = barStart + b * 0.25;
          if (bassTime >= durationSec) break;

          const bOsc = offlineCtx.createOscillator();
          const bGain = offlineCtx.createGain();
          bOsc.type = 'triangle';
          bOsc.frequency.setValueAtTime(bassFreq, bassTime);

          bGain.gain.setValueAtTime(0.18, bassTime);
          bGain.gain.exponentialRampToValueAtTime(0.001, bassTime + 0.2);

          bOsc.connect(bGain);
          bGain.connect(masterGain);

          bOsc.start(bassTime);
          bOsc.stop(bassTime + 0.22);
        }
      }

      // 3. Synthesize Kick & Snare Drums
      for (let t = 0; t < durationSec; t += beatDuration) {
        // Kick on every beat
        const kickOsc = offlineCtx.createOscillator();
        const kickGain = offlineCtx.createGain();
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(masterGain);

        kickOsc.start(t);
        kickOsc.stop(t + 0.15);

        // Snare on beats 2 and 4
        const beatNum = Math.round(t / beatDuration) % 4;
        if (beatNum === 1 || beatNum === 3) {
          const snareNoise = offlineCtx.createBufferSource();
          const bufferSize = sampleRate * 0.15;
          const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          snareNoise.buffer = noiseBuffer;

          const snareFilter = offlineCtx.createBiquadFilter();
          snareFilter.type = 'highpass';
          snareFilter.frequency.setValueAtTime(1200, t);

          const snareGain = offlineCtx.createGain();
          snareGain.gain.setValueAtTime(0.2, t);
          snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

          snareNoise.connect(snareFilter);
          snareFilter.connect(snareGain);
          snareGain.connect(masterGain);

          snareNoise.start(t);
          snareNoise.stop(t + 0.15);
        }
      }

      // Render to buffer
      offlineCtx.startRendering().then((renderedBuffer) => {
        const wavBlob = audioBufferToWavBlob(renderedBuffer);
        const url = URL.createObjectURL(wavBlob);
        resolve(url);
      }).catch(() => {
        resolve('');
      });
    } catch (err) {
      console.warn('Web Audio synthesis not supported or failed', err);
      resolve('');
    }
  });
}

/**
 * Encodes an AudioBuffer into a standard PCM 16-bit stereo WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const length = buffer.length;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  
  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  
  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Interleave channels
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
