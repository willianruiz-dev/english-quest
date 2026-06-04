/**
 * ENGLISH QUEST - Translation Service
 * Integrates with MyMemory Translation API for English → Spanish translations.
 * Includes in-memory LRU cache to minimize API calls.
 * SOLID: Dependency Inversion — depends on CONFIG abstraction, not hardcoded URLs.
 */

import { CONFIG } from '../core/config.js';
import { escapeHTML } from '../core/helpers.js';

class TranslationService {
  constructor() {
    this.cache = new Map();
    this.cacheMaxSize = CONFIG.translationAPI.cacheSize;
  }

  /**
   * Translate an English word to Spanish.
   * Returns the translated word or null on failure.
   */
  async translate(word) {
    const key = word.toLowerCase().trim();
    if (!key) return null;

    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const url = `${CONFIG.translationAPI.baseURL}?q=${encodeURIComponent(key)}&langpair=${CONFIG.translationAPI.langPair}`;

    for (let attempt = 0; attempt <= CONFIG.translationAPI.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), CONFIG.translationAPI.timeout);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          const translated = escapeHTML(data.responseData.translatedText.trim());
          this._addToCache(key, translated);
          return translated;
        }

        // MyMemory sometimes returns status 200 even with no match
        if (data.matches?.length > 0) {
          const translated = escapeHTML(data.matches[0].translation.trim());
          this._addToCache(key, translated);
          return translated;
        }

        return null;
      } catch (err) {
        if (attempt === CONFIG.translationAPI.retries) {
          console.warn(`Translation failed for "${word}": ${err.message}`);
          return null;
        }
        // Exponential backoff before retry
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }

    return null;
  }

  /**
   * Batch translate multiple words (respects API rate limits).
   */
  async translateBatch(words) {
    const results = new Map();
    const toFetch = [];

    // Check cache for each word
    for (const word of words) {
      const key = word.toLowerCase().trim();
      if (this.cache.has(key)) {
        results.set(word, this.cache.get(key));
      } else {
        toFetch.push(word);
      }
    }

    // Fetch uncached words sequentially to respect API limits
    for (const word of toFetch) {
      const translation = await this.translate(word);
      results.set(word, translation);
      // Small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }

    return results;
  }

  /**
   * Add a translation to the LRU cache.
   */
  _addToCache(key, value) {
    if (this.cache.size >= this.cacheMaxSize) {
      // Remove oldest entry (first key in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Pre-load common words into cache to avoid API calls.
   */
  preload(translations) {
    for (const [en, es] of Object.entries(translations)) {
      this._addToCache(en.toLowerCase(), es);
    }
  }
}

// Singleton instance
export const translationService = new TranslationService();
