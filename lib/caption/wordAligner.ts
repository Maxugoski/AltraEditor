import { SubtitleCue, SubtitleWord } from '@/types/editor';

export type CaptionCadence = 'tiktok' | 'viral' | 'standard';

export interface CadenceSettings {
  id: CaptionCadence;
  label: string;
  description: string;
  minWords: number;
  maxWords: number;
  maxCharsPerLine: number;
}

export const CADENCE_PRESETS: Record<CaptionCadence, CadenceSettings> = {
  tiktok: {
    id: 'tiktok',
    label: 'Shorts & TikTok (1-2 Words)',
    description: 'High impact fast retention, rapid word bounce',
    minWords: 1,
    maxWords: 2,
    maxCharsPerLine: 16,
  },
  viral: {
    id: 'viral',
    label: 'Viral Social (3-4 Words)',
    description: 'CapCut standard cadence for reels and talking heads',
    minWords: 3,
    maxWords: 4,
    maxCharsPerLine: 28,
  },
  standard: {
    id: 'standard',
    label: 'Standard Subtitle (5-7 Words)',
    description: 'Full sentence phrasing for documentaries and podcasts',
    minWords: 5,
    maxWords: 7,
    maxCharsPerLine: 45,
  },
};

/**
 * Groups timestamped words into CapCut subtitle cues based on cadence preset
 */
export function chunkWordsIntoCues(
  words: Array<{ text: string; startMs: number; endMs: number }>,
  cadence: CaptionCadence = 'viral'
): SubtitleCue[] {
  if (!words || words.length === 0) return [];

  const preset = CADENCE_PRESETS[cadence] || CADENCE_PRESETS.viral;
  const cues: SubtitleCue[] = [];
  let currentGroup: Array<{ text: string; startMs: number; endMs: number }> = [];

  const flushGroup = () => {
    if (currentGroup.length === 0) return;

    const startMs = currentGroup[0].startMs;
    const endMs = currentGroup[currentGroup.length - 1].endMs;
    const text = currentGroup.map((w) => w.text).join(' ');

    const subtitleWords: SubtitleWord[] = currentGroup.map((w, idx) => ({
      id: `w_${Date.now()}_${cues.length}_${idx}`,
      text: w.text,
      startMs: w.startMs,
      endMs: w.endMs,
    }));

    cues.push({
      id: `cue_${Date.now()}_${cues.length}`,
      startMs,
      endMs: Math.max(startMs + 500, endMs),
      text,
      words: subtitleWords,
    });

    currentGroup = [];
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = currentGroup[currentGroup.length - 1];

    // Check punctuation break or long silence (> 600ms) between words
    const isSilenceBreak = prevWord && word.startMs - prevWord.endMs > 600;
    const isPunctuationBreak =
      prevWord && /[.?!]$/.test(prevWord.text.trim());

    if (
      currentGroup.length >= preset.maxWords ||
      (currentGroup.length >= preset.minWords && (isSilenceBreak || isPunctuationBreak))
    ) {
      flushGroup();
    }

    currentGroup.push(word);
  }

  flushGroup();
  return cues;
}

/**
 * Intelligent acoustic syllable aligner
 * Breaks a phrase into words with proportional syllable timestamps
 */
export function alignWordsInPhrase(
  phrase: string,
  startMs: number,
  endMs: number
): SubtitleWord[] {
  const cleanTokens = phrase
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (cleanTokens.length === 0) return [];

  const totalDuration = Math.max(200, endMs - startMs);

  // Approximate syllable count from vowel patterns and length
  const weights = cleanTokens.map((token) => {
    const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    const syllables = Math.max(1, (clean.match(/[aeiouy]{1,2}/g) || []).length);
    return syllables * 0.7 + clean.length * 0.3;
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let currentOffset = startMs;

  return cleanTokens.map((token, idx) => {
    const wordDuration = Math.round((weights[idx] / totalWeight) * totalDuration);
    const wordStart = currentOffset;
    const wordEnd = Math.min(endMs, wordStart + wordDuration);
    currentOffset = wordEnd;

    return {
      id: `w_aligned_${idx}_${Date.now()}`,
      text: token,
      startMs: wordStart,
      endMs: wordEnd,
    };
  });
}
