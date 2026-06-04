/**
 * ENGLISH QUEST - Achievement Manager
 * Tracks and unlocks achievements based on player milestones.
 * Emits events when achievements are unlocked for UI reactivity.
 * SOLID: Open/Closed — new achievements added via ACHIEVEMENTS constant, no code changes.
 */

import { ACHIEVEMENTS } from '../core/constants.js';

class AchievementManager {
  constructor() {
    this.listeners = [];
  }

  /**
   * Register a callback for when an achievement is unlocked.
   * Callback receives { achievement, isNew }.
   */
  onUnlock(callback) {
    this.listeners.push(callback);
  }

  /**
   * Check all achievements against current player data.
   * Returns newly unlocked achievements.
   */
  checkAchievements(playerData, alreadyUnlocked = []) {
    const newlyUnlocked = [];

    for (const achievement of ACHIEVEMENTS) {
      if (alreadyUnlocked.includes(achievement.id)) continue;

      let unlocked = false;

      switch (achievement.type) {
        case 'streak':
          unlocked = playerData.currentStreak >= achievement.target ||
                     playerData.longestStreak >= achievement.target;
          break;
        case 'score':
          unlocked = playerData.totalCorrect >= achievement.target;
          break;
        case 'perfect':
          // Handled externally when a perfect round happens
          break;
        case 'level':
          unlocked = playerData.level >= achievement.target;
          break;
        default:
          // Word count achievements
          unlocked = playerData.wordsLearned >= achievement.target;
      }

      if (unlocked) {
        newlyUnlocked.push(achievement);
        this._notify(achievement, true);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Unlock a specific achievement by type (for event-based achievements).
   */
  unlockByType(type, alreadyUnlocked = []) {
    const achievement = ACHIEVEMENTS.find(a => a.type === type && !alreadyUnlocked.includes(a.id));
    if (achievement) {
      this._notify(achievement, true);
      return achievement;
    }
    return null;
  }

  /**
   * Get all achievements with their unlock status.
   */
  getAllWithStatus(alreadyUnlocked = []) {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: alreadyUnlocked.includes(a.id),
    }));
  }

  /**
   * Get progress for word-count achievements.
   */
  getWordProgress(wordsLearned) {
    return ACHIEVEMENTS
      .filter(a => !a.type || a.type === undefined)
      .map(a => ({
        ...a,
        unlocked: wordsLearned >= a.target,
        progress: Math.min(100, Math.round((wordsLearned / a.target) * 100)),
      }));
  }

  // ─── Private ───

  _notify(achievement, isNew) {
    for (const cb of this.listeners) {
      try {
        cb({ achievement, isNew });
      } catch (e) {
        console.warn('Achievement listener error:', e);
      }
    }
  }
}

export const achievementManager = new AchievementManager();
