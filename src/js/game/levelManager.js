/**
 * ENGLISH QUEST - Level Manager
 * Manages RPG level progression, XP thresholds, and level-up events.
 * SOLID: Single Responsibility — ONLY handles level computation and events.
 */

import { LEVELS } from '../core/constants.js';
import { clamp } from '../core/helpers.js';

class LevelManager {
  /**
   * Get the level info for a given XP value.
   */
  getLevelForXP(xp) {
    let current = LEVELS[0];
    for (const level of LEVELS) {
      if (xp >= level.minXP) {
        current = level;
      } else {
        break;
      }
    }
    return { ...current };
  }

  /**
   * Get the next level (or null if at max).
   */
  getNextLevel(xp) {
    const current = this.getLevelForXP(xp);
    const idx = LEVELS.findIndex(l => l.id === current.id);
    return idx < LEVELS.length - 1 ? { ...LEVELS[idx + 1] } : null;
  }

  /**
   * Get progress toward the next level (0-100%).
   */
  getProgress(xp) {
    const current = this.getLevelForXP(xp);
    const next = this.getNextLevel(xp);
    if (!next) return 100;

    const xpInLevel = xp - current.minXP;
    const xpNeeded = next.minXP - current.minXP;
    return clamp(Math.round((xpInLevel / xpNeeded) * 100), 0, 100);
  }

  /**
   * Get XP needed to reach the next level.
   */
  getXPToNextLevel(xp) {
    const next = this.getNextLevel(xp);
    if (!next) return 0;
    return next.minXP - xp;
  }

  /**
   * Check if the player has leveled up given old XP and new XP.
   */
  checkLevelUp(oldXP, newXP) {
    const oldLevel = this.getLevelForXP(oldXP);
    const newLevel = this.getLevelForXP(newXP);
    return newLevel.id > oldLevel.id ? { from: oldLevel, to: newLevel } : null;
  }

  /**
   * Get all level definitions.
   */
  getAllLevels() {
    return LEVELS.map(l => ({ ...l }));
  }
}

export const levelManager = new LevelManager();
