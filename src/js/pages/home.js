/**
 * ENGLISH QUEST — Home Page
 * Landing page: welcome message, game mode selection, quick stats.
 */

import { GAME_MODES } from '../core/constants.js';
import { el } from '../core/helpers.js';
import { dashboard } from '../ui/dashboard.js';

export function renderHomePage(playerData) {
  const container = el('div', { className: 'page-enter' });

  // Dashboard
  container.appendChild(dashboard.render(playerData));

  // Game mode selection
  const title = el('h2', { textContent: 'Choose Your Quest', className: 'mb-6' });
  container.appendChild(title);

  const modes = [
    { mode: GAME_MODES.TRANSLATION, icon: '📝', title: 'Translation', desc: 'Match English words to Spanish', color: '#58CC02' },
    { mode: GAME_MODES.MEMORY, icon: '🧠', title: 'Memory Cards', desc: 'Find matching pairs', color: '#1CB0F6' },
    { mode: GAME_MODES.WRITING, icon: '✍️', title: 'Writing', desc: 'Type the translation', color: '#FF9600' },
    { mode: GAME_MODES.LISTENING, icon: '🎧', title: 'Listening', desc: 'Hear the word, pick the match', color: '#9C27B0' },
    { mode: GAME_MODES.DEEP_SEEK, icon: '🔎', title: 'Deep Seek', desc: 'Explore vocabulary with intelligent search', color: '#00BFA5' },
    { mode: GAME_MODES.TIME_ATTACK, icon: '⏱️', title: 'Time Attack', desc: '60 seconds, max score!', color: '#F44336' },
  ];

  const grid = el('div', { className: 'stagger-children', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' } });

  for (const m of modes) {
    const card = el('div', {
      className: 'game-card',
      'data-mode': m.mode,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'game', mode: m.mode } }));
      },
    }, [
      el('div', { className: 'game-card__icon', textContent: m.icon }),
      el('div', { className: 'game-card__title', textContent: m.title }),
      el('div', { className: 'game-card__desc', textContent: m.desc }),
    ]);
    grid.appendChild(card);
  }

  container.appendChild(grid);

  // Quick stats
  const statsSection = el('div', { className: 'mt-8' });
  const statsTitle = el('h3', { textContent: 'Your Journey', className: 'mb-4' });
  statsSection.appendChild(statsTitle);

  const quickStats = el('div', { className: 'dashboard__stats' }, [
    _statCard('🎮', 'Games Played', playerData.totalGamesPlayed || 0),
    _statCard('✅', 'Correct', playerData.totalCorrect || 0),
    _statCard('🏆', 'Longest Streak', `${playerData.longestStreak} days`),
    _statCard('⏰', 'Study Time', _formatTime(playerData.totalStudyTime || 0)),
  ]);
  statsSection.appendChild(quickStats);
  container.appendChild(statsSection);

  return container;
}

function _statCard(icon, label, value) {
  return el('div', { className: 'dashboard__stat' }, [
    el('span', { className: 'dashboard__stat-icon', textContent: icon }),
    el('div', { className: 'dashboard__stat-info' }, [
      el('span', { className: 'dashboard__stat-value', textContent: String(value) }),
      el('span', { className: 'dashboard__stat-label', textContent: label }),
    ]),
  ]);
}

function _formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
