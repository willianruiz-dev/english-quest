/**
 * ENGLISH QUEST - Storage Service
 * Manages all localStorage persistence for user data.
 * Handles serialization, migration, and fallback gracefully.
 * SOLID: Single Responsibility — ONLY persists/retrieves data.
 */

import { CONFIG } from '../core/config.js';

class StorageService {
  constructor() {
    this.key = CONFIG.storage.key;
    this.version = CONFIG.storage.version;
  }

  /**
   * Load user data from localStorage.
   * Returns default data structure if nothing is stored.
   */
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return this._defaultData();

      const data = JSON.parse(raw);

      // Version migration support
      if (data._version !== this.version) {
        return this._migrate(data);
      }

      return data;
    } catch (err) {
      console.warn('Storage load failed:', err.message);
      return this._defaultData();
    }
  }

  /**
   * Save user data to localStorage.
   */
  save(data) {
    try {
      data._version = this.version;
      data._lastSaved = Date.now();
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Storage save failed:', err.message);
      return false;
    }
  }

  /**
   * Clear all stored data (factory reset).
   */
  clear() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if localStorage is available and has space.
   */
  isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage info (approximate).
   */
  getUsage() {
    try {
      const raw = localStorage.getItem(this.key);
      return {
        used: raw ? new Blob([raw]).size : 0,
        key: this.key,
      };
    } catch {
      return { used: 0, key: this.key };
    }
  }

  // ─── Private helpers ───

  _defaultData() {
    return {
      _version: this.version,
      _lastSaved: null,
      user: {
        id: crypto.randomUUID(),
        name: 'Adventurer',
        level: 1,
        xp: 0,
        coins: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: null,
        wordsLearned: 0,
        wordsLearnedIds: [],
        totalGamesPlayed: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        totalStudyTime: 0,         // seconds
      },
      achievements: [],
      settings: {
        theme: CONFIG.theme.default,
        soundEffects: CONFIG.features.soundEffects,
        reduceMotion: CONFIG.a11y.reduceMotion,
        fontSizeScale: CONFIG.a11y.fontSizeScale,
      },
      leaderboard: [],
      lastGameStats: null,
    };
  }

  /**
   * Handle version migrations (future-proofing).
   */
  _migrate(oldData) {
    console.info(`Migrating storage from ${oldData._version || 'unknown'} to ${this.version}`);
    // Merge old data into new default structure
    const fresh = this._defaultData();
    if (oldData.user) {
      fresh.user = { ...fresh.user, ...oldData.user };
      // Preserve new fields that didn't exist in old versions
      fresh.user.id = oldData.user.id || fresh.user.id;
    }
    if (oldData.achievements) fresh.achievements = oldData.achievements;
    if (oldData.settings) fresh.settings = { ...fresh.settings, ...oldData.settings };
    if (oldData.leaderboard) fresh.leaderboard = oldData.leaderboard;
    return fresh;
  }
}

// Singleton instance
export const storageService = new StorageService();
