/**
 * ENGLISH QUEST - Notifications / Toast Component
 * Displays toast notifications: XP gains, achievements, errors, info.
 * Supports stacking, auto-dismiss, and manual dismiss.
 */

import { el } from '../core/helpers.js';
import { UI } from '../core/constants.js';

class NotificationManager {
  constructor() {
    this.container = null;
    this.activeToasts = [];
    this.maxVisible = 5;
  }

  _ensureContainer() {
    if (this.container) return;
    this.container = el('div', {
      className: 'notification-container',
      'aria-live': 'polite',
      'aria-atomic': 'false',
    });
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification.
   * @param {Object} options - { message, type, duration, icon, action }
   * types: 'success' | 'error' | 'info' | 'achievement' | 'xp'
   */
  show(options = {}) {
    this._ensureContainer();
    const {
      message,
      type = 'info',
      duration = UI.TOAST_DURATION,
      icon = null,
      action = null,
    } = options;

    // Icon mapping
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      achievement: '🏆',
      xp: '⭐',
    };

    const displayIcon = icon || icons[type] || '';

    const toast = el('div', {
      className: `notification notification--${type}`,
      role: 'status',
    });

    const content = el('div', { className: 'notification__content' }, [
      el('span', { className: 'notification__icon', textContent: displayIcon }),
      el('span', { className: 'notification__message', textContent: message }),
    ]);
    toast.appendChild(content);

    // Optional action button
    if (action) {
      const btn = el('button', {
        className: 'notification__action',
        textContent: action.label,
        onClick: () => {
          action.callback();
          this._dismiss(toast);
        },
      });
      toast.appendChild(btn);
    }

    // Dismiss button
    const dismiss = el('button', {
      className: 'notification__dismiss',
      textContent: '✕',
      'aria-label': 'Dismiss',
      onClick: () => this._dismiss(toast),
    });
    toast.appendChild(dismiss);

    // Limit visible toasts
    if (this.activeToasts.length >= this.maxVisible) {
      this._dismiss(this.activeToasts[0]);
    }

    this.container.appendChild(toast);
    this.activeToasts.push(toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this._dismiss(toast), duration);
    }

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('notification--visible');
    });

    return toast;
  }

  /**
   * Show XP gain notification.
   */
  showXP(xp, coins) {
    const parts = [];
    if (xp) parts.push(`+${xp} XP`);
    if (coins) parts.push(`+${coins} 🪙`);
    return this.show({ message: parts.join(' · '), type: 'xp', duration: 2000 });
  }

  /**
   * Show achievement unlocked notification.
   */
  showAchievement(achievement) {
    return this.show({
      message: `${achievement.icon} ${achievement.name} unlocked!`,
      type: 'achievement',
      duration: 4000,
    });
  }

  /**
   * Show streak bonus notification.
   */
  showStreakBonus(streak, bonus) {
    return this.show({
      message: `🔥 ${streak} streak! +${bonus.xp} XP bonus`,
      type: 'xp',
      duration: 3000,
    });
  }

  /**
   * Show a level-up notification (special style).
   */
  showLevelUp(level) {
    return this.show({
      message: `${level.icon} Level Up! You are now a ${level.name}!`,
      type: 'achievement',
      duration: 5000,
    });
  }

  /**
   * Show an error notification.
   */
  error(message) {
    return this.show({ message, type: 'error', duration: 5000 });
  }

  /**
   * Dismiss a specific toast.
   */
  _dismiss(toast) {
    toast.classList.add('notification--hiding');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.remove();
      }
      this.activeToasts = this.activeToasts.filter(t => t !== toast);
    }, { once: true });
  }

  /**
   * Clear all toasts.
   */
  clearAll() {
    for (const toast of [...this.activeToasts]) {
      this._dismiss(toast);
    }
  }
}

export const notifications = new NotificationManager();
