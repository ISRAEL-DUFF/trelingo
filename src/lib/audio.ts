/**
 * Audio playback (spec §4 Phase 5).
 *
 * Two layers, deliberately:
 *
 *  1. The manifest fetch and per-word URLs go through the API exactly as they
 *     will with a real CDN, so the data path is exercised now rather than
 *     discovered later. The mock currently answers with a silent clip.
 *  2. Actual sound comes from the Web Speech API, flagged as synthetic — the
 *     spec's own TTS-fallback design. When real recordings exist, layer 1 starts
 *     returning audible files and this fallback stops firing, with no call-site
 *     changes.
 */
import { api } from "@/api/client";
import type { AudioManifestEntry, PronunciationVariant } from "@/api/types";
import { scriptOf } from "@/content/course";

let manifest: Map<string, AudioManifestEntry> | null = null;
let manifestVariant: PronunciationVariant | null = null;

export async function loadAudioManifest(variant: PronunciationVariant): Promise<void> {
  if (manifest && manifestVariant === variant) return;
  try {
    const res = await api.getAudioManifest(variant);
    manifest = new Map(res.entries.map((e) => [e.wordId, e]));
    manifestVariant = variant;
  } catch {
    // Offline or no server: speech synthesis alone still gives the learner audio.
    manifest = manifest ?? new Map();
  }
}

export function audioEntryFor(wordId: string): AudioManifestEntry | undefined {
  return manifest?.get(wordId);
}

/** A voice matching the active course's language, if the platform ships one. */
function voiceForCourse(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  const lang = scriptOf().lang.toLowerCase();
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang?.toLowerCase().startsWith(lang)) ?? null;
}

export function speechSupported(): boolean {
  return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";
}

export function courseVoiceAvailable(): boolean {
  return voiceForCourse() !== null;
}

let currentAudio: HTMLAudioElement | null = null;

export interface PlayResult {
  played: boolean;
  /** How the sound was produced, for the "synthetic audio" disclosure in the UI. */
  source: "recording" | "speech" | "none";
}

/**
 * Play a word. Tries the recorded/CDN clip first, falls back to speech.
 *
 * Returns rather than throws — audio failing is a degraded experience, not an
 * error the learner should be interrupted by.
 */
export async function playWord(
  wordId: string,
  text: string,
  opts: { rate?: number; enabled?: boolean } = {},
): Promise<PlayResult> {
  const { rate = 1, enabled = true } = opts;
  if (!enabled) return { played: false, source: "none" };

  stopAudio();

  const entry = audioEntryFor(wordId);
  if (entry && !entry.synthetic) {
    try {
      const audio = new Audio(entry.url);
      audio.playbackRate = rate;
      currentAudio = audio;
      await audio.play();
      return { played: true, source: "recording" };
    } catch {
      // Fall through to speech.
    }
  }

  return speak(text, rate);
}

export async function speak(text: string, rate = 1): Promise<PlayResult> {
  if (!speechSupported()) return { played: false, source: "none" };
  try {
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = voiceForCourse();
    if (voice) utter.voice = voice;
    utter.lang = scriptOf().lang;
    utter.rate = rate;
    speechSynthesis.speak(utter);
    return { played: true, source: "speech" };
  } catch {
    return { played: false, source: "none" };
  }
}

export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (speechSupported()) speechSynthesis.cancel();
}
