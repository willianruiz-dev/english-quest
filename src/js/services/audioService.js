/**
 * ENGLISH QUEST - Audio Service
 * Wraps the Web Speech Synthesis API for in-game pronunciation.
 * Manages voice selection, queuing, and playback settings.
 * SOLID: Single Responsibility — ONLY handles audio output.
 */

import { CONFIG } from '../core/config.js';

class AudioService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voice = null;
    this.speaking = false;
    this.queue = [];
    this.voiceLoadAttempted = false;

    // Attempt to load voices immediately and on change
    this._loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this._loadVoices();
    }
  }

  /**
   * Load and select the best English voice.
   */
  _loadVoices() {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Prefer a high-quality English voice
    const preferred = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );

    this.voice = preferred || voices.find(v => v.lang.startsWith('en')) || voices[0];
    this.voiceLoadAttempted = true;
  }

  /**
   * Speak a word or phrase in English.
   * Returns a Promise that resolves when speech ends.
   */
  speak(text, options = {}) {
    return new Promise((resolve) => {
      if (!text || !this.synth) {
        resolve();
        return;
      }

      // Cancel any current speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || CONFIG.speech.lang;
      utterance.rate = options.rate ?? CONFIG.speech.rate;
      utterance.pitch = options.pitch ?? CONFIG.speech.pitch;
      utterance.volume = options.volume ?? CONFIG.speech.volume;

      if (this.voice) {
        utterance.voice = this.voice;
      }

      utterance.onend = () => {
        this.speaking = false;
        resolve();
      };

      utterance.onerror = (e) => {
        // Ignore 'interrupted' errors (caused by cancel())
        if (e.error !== 'interrupted') {
          console.warn('Speech error:', e.error);
        }
        this.speaking = false;
        resolve();
      };

      this.speaking = true;
      this.synth.speak(utterance);
    });
  }

  /**
   * Pronounce a word - convenience method with default settings.
   */
  async pronounceWord(word) {
    await this.speak(word, { rate: 0.8 });
  }

  /**
   * Cancel any ongoing speech.
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.speaking = false;
  }

  /**
   * Check if speech synthesis is available.
   */
  isAvailable() {
    return !!this.synth;
  }
}

// Singleton instance
export const audioService = new AudioService();
