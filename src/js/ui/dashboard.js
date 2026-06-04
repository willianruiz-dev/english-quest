/**
 * ENGLISH QUEST - Dashboard UI Component
 * Renders the main player dashboard: level, XP bar, coins, streak, stats.
 */

import { el, formatNumber } from '../core/helpers.js';
import { LEVELS } from '../core/constants.js';
import { levelManager } from '../game/levelManager.js';

export class Dashboard {
  /**
   * Render the full dashboard into a container element.
   * @param {Object} playerData - { xp, coins, level, currentStreak, longestStreak, wordsLearned, totalCorrect, totalIncorrect }
   * @returns {HTMLElement}
   */
  render(playerData) {
    const level = levelManager.getLevelForXP(playerData.xp);
    const progress = levelManager.getProgress(playerData.xp);
    const xpToNext = levelManager.getXPToNextLevel(playerData.xp);
    const accuracy = playerData.totalCorrect + playerData.totalIncorrect > 0
      ? Math.round((playerData.totalCorrect / (playerData.totalCorrect + playerData.totalIncorrect)) * 100)
      : 0;

    const container = el('div', { className: 'dashboard' });

    // ─── Level Badge ───
    const badge = el('div', { className: 'dashboard__level-badge', style: { background: `linear-gradient(135deg, ${level.color}, ${level.color}88)` } }, [
      el('span', { className: 'dashboard__level-icon', textContent: level.icon }),
      el('div', { className: 'dashboard__level-info' }, [
        el('span', { className: 'dashboard__level-name', textContent: `Level ${level.id}` }),
        el('span', { className: 'dashboard__level-title', textContent: level.name }),
      ]),
    ]);

    // ─── XP Bar ───
    const xpBar = el('div', { className: 'dashboard__xp-section' }, [
      el('div', { className: 'dashboard__xp-header' }, [
        el('span', { textContent: `${formatNumber(playerData.xp)} XP` }),
        xpToNext > 0
          ? el('span', { textContent: `${formatNumber(xpToNext)} XP to next level` })
          : el('span', { textContent: 'MAX LEVEL! 🌟' }),
      ]),
      el('div', { className: 'dashboard__xp-bar' }, [
        el('div', {
          className: 'dashboard__xp-fill',
          style: { width: `${progress}%`, background: level.color },
        }),
      ]),
    ]);

    // ─── Stats Grid ───
    const stats = el('div', { className: 'dashboard__stats' }, [
      this._statCard('🪙', 'Coins', formatNumber(playerData.coins)),
      this._statCard('🔥', 'Streak', `${playerData.currentStreak} days`),
      this._statCard('📚', 'Words', formatNumber(playerData.wordsLearned)),
      this._statCard('🎯', 'Accuracy', `${accuracy}%`),
    ]);

    container.appendChild(badge);
    container.appendChild(xpBar);
    container.appendChild(stats);

    return container;
  }

  _statCard(icon, label, value) {
    return el('div', { className: 'dashboard__stat' }, [
      el('span', { className: 'dashboard__stat-icon', textContent: icon }),
      el('div', { className: 'dashboard__stat-info' }, [
        el('span', { className: 'dashboard__stat-value', textContent: value }),
        el('span', { className: 'dashboard__stat-label', textContent: label }),
      ]),
    ]);
  }

  /**
   * Update the XP bar only (for animations after answering).
   */
  updateXPBar(container, playerData) {
    const progress = levelManager.getProgress(playerData.xp);
    const fill = container.querySelector('.dashboard__xp-fill');
    const header = container.querySelector('.dashboard__xp-header span:first-child');
    if (fill) fill.style.width = `${progress}%`;
    if (header) header.textContent = `${formatNumber(playerData.xp)} XP`;
  }
}

export const dashboard = new Dashboard();
