/**
 * ENGLISH QUEST — Profile Page
 * Player profile: achievements, stats, settings (theme, accessibility).
 */

import { el, formatNumber } from '../core/helpers.js';
import { ACHIEVEMENTS } from '../core/constants.js';
import { achievementManager } from '../game/achievementManager.js';
import { levelManager } from '../game/levelManager.js';
import { storageService } from '../services/storageService.js';
import { notifications } from '../ui/notifications.js';

export function renderProfilePage(playerData) {
  const container = el('div', { className: 'page-enter' });

  // ─── Player Info Section ───
  const level = levelManager.getLevelForXP(playerData.xp);
  const infoSection = el('div', { className: 'profile-section' });
  infoSection.appendChild(el('h3', { className: 'profile-section__title', textContent: '👤 Player Profile' }));

  const infoGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' } });

  const fields = [
    { label: 'Name', value: playerData.name, editable: true, key: 'name' },
    { label: 'Level', value: `${level.icon} ${level.name} (Level ${level.id})` },
    { label: 'Total XP', value: formatNumber(playerData.xp) },
    { label: 'Coins', value: `🪙 ${formatNumber(playerData.coins)}` },
    { label: 'Words Learned', value: formatNumber(playerData.wordsLearned) },
    { label: 'Current Streak', value: `🔥 ${playerData.currentStreak} days` },
    { label: 'Longest Streak', value: `💎 ${playerData.longestStreak} days` },
    { label: 'Games Played', value: formatNumber(playerData.totalGamesPlayed || 0) },
    { label: 'Accuracy', value: playerData.totalCorrect + playerData.totalIncorrect > 0 ? `${Math.round((playerData.totalCorrect / (playerData.totalCorrect + playerData.totalIncorrect)) * 100)}%` : 'N/A' },
    { label: 'Study Time', value: _formatTime(playerData.totalStudyTime || 0) },
  ];

  for (const f of fields) {
    const field = el('div', { className: 'dashboard__stat' }, [
      el('div', { className: 'dashboard__stat-info', style: { width: '100%' } }, [
        el('span', { className: 'dashboard__stat-label', textContent: f.label }),
        el('span', { className: 'dashboard__stat-value', textContent: String(f.value) }),
      ]),
    ]);

    if (f.editable) {
      field.style.cursor = 'pointer';
      field.addEventListener('click', () => _editName(field, f.key));
    }
    infoGrid.appendChild(field);
  }
  infoSection.appendChild(infoGrid);
  container.appendChild(infoSection);

  // ─── Achievements Section ───
  const achSection = el('div', { className: 'profile-section' });
  achSection.appendChild(el('h3', { className: 'profile-section__title', textContent: '🏆 Achievements' }));

  const achievements = achievementManager.getAllWithStatus(playerData.achievements || []);
  const achGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)' } });

  for (const ach of achievements) {
    const card = el('div', {
      className: `achievement-card ${ach.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`,
    }, [
      el('div', { className: 'achievement-card__icon', textContent: ach.icon }),
      el('div', {}, [
        el('div', { className: 'achievement-card__name', textContent: ach.name }),
        el('div', { className: 'achievement-card__desc', textContent: ach.desc }),
        !ach.unlocked ? el('div', { className: 'text-xs text-muted mt-1', textContent: '🔒 Locked' }) : null,
      ]),
    ]);
    achGrid.appendChild(card);
  }

  achSection.appendChild(achGrid);
  container.appendChild(achSection);

  // ─── Settings Section ───
  const settingsSection = el('div', { className: 'profile-section' });
  settingsSection.appendChild(el('h3', { className: 'profile-section__title', textContent: '⚙️ Settings' }));

  // Theme toggle
  const themeToggle = el('div', { className: 'flex items-center justify-between p-4 bg-glass rounded-lg mb-3' }, [
    el('div', {}, [
      el('div', { className: 'font-semibold', textContent: 'Theme' }),
      el('div', { className: 'text-sm text-muted', textContent: playerData.settings?.theme === 'dark' ? 'Dark Mode' : 'Light Mode' }),
    ]),
    el('button', {
      className: 'theme-toggle',
      textContent: playerData.settings?.theme === 'dark' ? '☀️' : '🌙',
      onClick: () => {
        const newTheme = playerData.settings?.theme === 'dark' ? 'light' : 'dark';
        playerData.settings = playerData.settings || {};
        playerData.settings.theme = newTheme;
        const fullData = storageService.load();
        fullData.settings = playerData.settings;
        storageService.save(fullData);

        document.documentElement.setAttribute('data-theme', newTheme);
        // Re-render page
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'profile' } }));
      },
    }),
  ]);
  settingsSection.appendChild(themeToggle);

  // Sound effects toggle
  const soundToggle = el('div', { className: 'flex items-center justify-between p-4 bg-glass rounded-lg mb-3' }, [
    el('div', {}, [
      el('div', { className: 'font-semibold', textContent: 'Sound Effects' }),
      el('div', { className: 'text-sm text-muted', textContent: playerData.settings?.soundEffects !== false ? 'On' : 'Off' }),
    ]),
    el('button', {
      className: 'btn btn--secondary btn--sm',
      textContent: playerData.settings?.soundEffects !== false ? 'Disable' : 'Enable',
      onClick: () => {
        playerData.settings = playerData.settings || {};
        playerData.settings.soundEffects = playerData.settings.soundEffects === false;
        const fullData = storageService.load();
        fullData.settings = playerData.settings;
        storageService.save(fullData);
        notifications.show({ message: `Sound effects ${playerData.settings.soundEffects !== false ? 'enabled' : 'disabled'}`, type: 'info' });
      },
    }),
  ]);
  settingsSection.appendChild(soundToggle);

  // Reset progress button
  const resetSection = el('div', { className: 'text-center mt-6' });
  const resetBtn = el('button', {
    className: 'btn btn--ghost text-danger',
    textContent: '🗑️ Reset All Progress',
    onClick: () => {
      if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
        storageService.clear();
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'home' } }));
      }
    },
  });
  resetSection.appendChild(resetBtn);
  settingsSection.appendChild(resetSection);

  container.appendChild(settingsSection);

  return container;
}

function _editName(fieldEl, key) {
  const currentValue = fieldEl.querySelector('.dashboard__stat-value').textContent;
  const input = el('input', {
    className: 'writing-input',
    type: 'text',
    value: currentValue,
    style: { fontSize: 'var(--font-size-base)', padding: 'var(--space-2)' },
  });

  fieldEl.innerHTML = '';
  fieldEl.appendChild(input);
  input.focus();
  input.select();

  const save = () => {
    const newValue = input.value.trim() || currentValue;
    const fullData = storageService.load();
    fullData.user[key] = newValue;
    storageService.save(fullData);
    notifications.show({ message: `${key} updated!`, type: 'success', duration: 2000 });
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'profile' } }));
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') {
      input.value = currentValue;
      save();
    }
  });
}

function _formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}
