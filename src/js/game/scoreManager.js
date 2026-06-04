/**
 * ENGLISH QUEST - Score Manager
 * Manages XP, coins, streaks, and daily login bonuses.
 * SOLID: Single Responsibility — ONLY handles scoring/RPG currency logic.
 */

import { REWARDS, LEVELS } from '../core/constants.js';
import { clamp } from '../core/helpers.js';
import { storageService } from '../services/storageService.js';

class ScoreManager {
  constructor() {
    this.data = null;
  }

  /**
   * Initialize with user data reference.
   */
  init(userData) {
    this.data = userData;
    this._checkDailyLogin();
  }

  /**
   * Award points for a correct answer.
   * Returns the rewards object { xp, coins, streak }.
   */
  awardCorrectAnswer() {
    if (!this.data) return null;

    let xp = REWARDS.CORRECT_ANSWER.xp;
    let coins = REWARDS.CORRECT_ANSWER.coins;

    this.data.currentStreak++;
    this.data.totalCorrect++;

    // Streak bonuses
    if (this.data.currentStreak === 5) {
      xp += REWARDS.STREAK_BONUS_5.xp;
      coins += REWARDS.STREAK_BONUS_5.coins;
    } else if (this.data.currentStreak === 10) {
      xp += REWARDS.STREAK_BONUS_10.xp;
      coins += REWARDS.STREAK_BONUS_10.coins;
    } else if (this.data.currentStreak > 10 && this.data.currentStreak % 5 === 0) {
      xp += REWARDS.STREAK_BONUS_5.xp;
      coins += REWARDS.STREAK_BONUS_5.coins;
    }

    this._addXP(xp);
    this._addCoins(coins);
    this._updateLongestStreak();
    this._save();

    return { xp, coins, streak: this.data.currentStreak };
  }

  /**
   * Handle an incorrect answer (resets streak).
   */
  recordIncorrectAnswer() {
    if (!this.data) return;
    this.data.totalIncorrect++;
    this.data.currentStreak = 0;
    this._save();
  }

  /**
   * Award perfect round bonus.
   */
  awardPerfectRound() {
    if (!this.data) return null;
    this._addXP(REWARDS.PERFECT_ROUND.xp);
    this._addCoins(REWARDS.PERFECT_ROUND.coins);
    this._save();
    return { xp: REWARDS.PERFECT_ROUND.xp, coins: REWARDS.PERFECT_ROUND.coins };
  }

  /**
   * Record a word as learned.
   */
  learnWord(wordId) {
    if (!this.data) return;
    if (!this.data.wordsLearnedIds.includes(wordId)) {
      this.data.wordsLearnedIds.push(wordId);
      this.data.wordsLearned = this.data.wordsLearnedIds.length;
    }
    this._save();
  }

  /**
   * Get current level info.
   */
  getLevel() {
    if (!this.data) return LEVELS[0];
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (this.data.xp >= level.minXP) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  /**
   * Get XP progress toward next level (percentage).
   */
  getLevelProgress() {
    const current = this.getLevel();
    const nextIndex = LEVELS.indexOf(current) + 1;
    if (nextIndex >= LEVELS.length) return 100; // Max level

    const nextLevel = LEVELS[nextIndex];
    const xpInLevel = this.data.xp - current.minXP;
    const xpNeeded = nextLevel.minXP - current.minXP;
    return clamp(Math.round((xpInLevel / xpNeeded) * 100), 0, 100);
  }

  /**
   * Check for daily login streak (should be called once per day).
   */
  _checkDailyLogin() {
    if (!this.data) return;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (this.data.lastLoginDate === todayStr) return; // Already logged in today

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (this.data.lastLoginDate === yesterdayStr) {
      // Consecutive day
      this.data.currentStreak++;
    } else if (this.data.lastLoginDate !== null) {
      // Streak broken
      this.data.currentStreak = 1;
    } else {
      // First login ever
      this.data.currentStreak = 1;
    }

    this.data.lastLoginDate = todayStr;
    this._updateLongestStreak();

    // Daily login bonus
    this._addXP(REWARDS.DAILY_LOGIN.xp);
    this._addCoins(REWARDS.DAILY_LOGIN.coins);
    this._save();
  }

  // ─── Private helpers ───

  _addXP(amount) {
    const oldLevel = this.getLevel();
    this.data.xp += amount;
    this._save();

    const newLevel = this.getLevel();
    if (newLevel.id !== oldLevel.id) {
      return { leveledUp: true, from: oldLevel, to: newLevel };
    }
    return { leveledUp: false };
  }

  _addCoins(amount) {
    this.data.coins += amount;
  }

  _updateLongestStreak() {
    if (this.data.currentStreak > this.data.longestStreak) {
      this.data.longestStreak = this.data.currentStreak;
    }
  }

  _save() {
    const fullData = storageService.load();
    fullData.user = { ...this.data };
    storageService.save(fullData);
  }
}

// Singleton instance
export const scoreManager = new ScoreManager();
