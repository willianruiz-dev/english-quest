/**
 * ENGLISH QUEST — Leaderboard Page
 * Local leaderboard ranking players by XP with medals for top 3.
 * Also shows stats charts using Canvas API.
 */

import { el, formatNumber } from '../core/helpers.js';

export function renderLeaderboardPage(playerData) {
  const container = el('div', { className: 'page-enter' });

  // ─── Leaderboard ───
  const boardSection = el('div', { className: 'profile-section' });
  boardSection.appendChild(el('h3', { className: 'profile-section__title', textContent: '🏅 Leaderboard' }));

  // Build leaderboard from stored data + current player
  const entries = [...(playerData.leaderboard || [])];
  // Ensure current player is in the leaderboard
  const currentEntry = {
    name: playerData.name || 'You',
    xp: playerData.xp,
    level: playerData.level,
    isCurrentUser: true,
  };
  const existingIdx = entries.findIndex(e => e.isCurrentUser);
  if (existingIdx >= 0) {
    entries[existingIdx] = currentEntry;
  } else {
    entries.push(currentEntry);
  }

  // Sort by XP descending
  entries.sort((a, b) => b.xp - a.xp);

  if (entries.length === 0) {
    boardSection.appendChild(el('p', { className: 'text-muted text-center p-6', textContent: 'No leaderboard data yet. Play some games!' }));
  } else {
    const leaderboard = el('div', { className: 'leaderboard' });

    // Header
    leaderboard.appendChild(
      el('div', { className: 'leaderboard__header' }, [
        el('span', { textContent: 'Rank' }),
        el('span', { textContent: 'Player' }),
        el('span', { textContent: 'XP' }),
        el('span', { textContent: 'Level' }),
      ])
    );

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      const rankClass = rank === 1 ? 'leaderboard__rank--gold'
        : rank === 2 ? 'leaderboard__rank--silver'
        : rank === 3 ? 'leaderboard__rank--bronze'
        : '';

      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

      const row = el('div', {
        className: `leaderboard__row ${entry.isCurrentUser ? 'leaderboard__row--highlight' : ''}`,
      }, [
        el('span', { className: `leaderboard__rank ${rankClass}`, textContent: medal }),
        el('span', { className: 'font-semibold', textContent: entry.name }),
        el('span', { className: 'font-bold', textContent: formatNumber(entry.xp) }),
        el('span', { className: 'text-sm text-muted', textContent: `Lv.${entry.level || 1}` }),
      ]);
      leaderboard.appendChild(row);
    }

    boardSection.appendChild(leaderboard);
  }

  container.appendChild(boardSection);

  // ─── Statistics Charts (Canvas API) ───
  const statsSection = el('div', { className: 'profile-section' });
  statsSection.appendChild(el('h3', { className: 'profile-section__title', textContent: '📊 Statistics' }));

  const chartsGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' } });

  // Accuracy gauge
  const accuracyChart = el('div', { className: 'stats-chart' });
  accuracyChart.appendChild(el('h4', { className: 'mb-3 text-center', textContent: 'Accuracy' }));
  const accuracyCanvas = el('canvas', { width: '200', height: '200' });
  accuracyChart.appendChild(accuracyCanvas);
  chartsGrid.appendChild(accuracyChart);
  _drawAccuracyGauge(accuracyCanvas, playerData);

  // Words learned bar
  const wordsChart = el('div', { className: 'stats-chart' });
  wordsChart.appendChild(el('h4', { className: 'mb-3 text-center', textContent: 'Words Learned' }));
  const wordsCanvas = el('canvas', { width: '280', height: '200' });
  wordsChart.appendChild(wordsCanvas);
  chartsGrid.appendChild(wordsChart);
  _drawWordsBar(wordsCanvas, playerData);

  // XP progress pie
  const xpChart = el('div', { className: 'stats-chart' });
  xpChart.appendChild(el('h4', { className: 'mb-3 text-center', textContent: 'XP Distribution' }));
  const xpCanvas = el('canvas', { width: '280', height: '200' });
  xpChart.appendChild(xpCanvas);
  chartsGrid.appendChild(xpChart);
  _drawXPPie(xpCanvas, playerData);

  statsSection.appendChild(chartsGrid);
  container.appendChild(statsSection);

  return container;
}

// ─── Canvas Charts ───

function _drawAccuracyGauge(canvas, playerData) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 70;
  const lineWidth = 16;

  const total = (playerData.totalCorrect || 0) + (playerData.totalIncorrect || 0);
  const accuracy = total > 0 ? (playerData.totalCorrect / total) : 0;

  ctx.clearRect(0, 0, w, h);

  // Background arc
  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#334155';
  ctx.stroke();

  // Value arc
  const angle = Math.PI + (accuracy * Math.PI);
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, '#58CC02');
  gradient.addColorStop(1, '#1CB0F6');

  ctx.beginPath();
  ctx.arc(cx, cy, radius, Math.PI, angle);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = gradient;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Center text
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#F1F5F9';
  ctx.font = 'bold 28px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${Math.round(accuracy * 100)}%`, cx, cy);

  ctx.font = '12px system-ui';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94A3B8';
  ctx.fillText(`${playerData.totalCorrect || 0} / ${total}`, cx, cy + 24);
}

function _drawWordsBar(canvas, playerData) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };

  ctx.clearRect(0, 0, w, h);

  const wordsLearned = playerData.wordsLearned || 0;
  const maxWords = 1000;
  const barWidth = 50;
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  // Background bar
  const barX = pad.left + (chartW - barWidth) / 2;
  const barHeight = (wordsLearned / maxWords) * chartH;

  // Max bar outline
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim() || '#334155';
  _roundRect(ctx, barX, pad.top, barWidth, chartH, 8);
  ctx.fill();

  // Filled bar
  const gradient = ctx.createLinearGradient(0, pad.top + chartH, 0, pad.top);
  gradient.addColorStop(0, '#58CC02');
  gradient.addColorStop(1, '#7BE03A');
  ctx.fillStyle = gradient;
  _roundRect(ctx, barX, pad.top + chartH - barHeight, barWidth, barHeight, 8);
  ctx.fill();

  // Value label
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#F1F5F9';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(wordsLearned, barX + barWidth / 2, pad.top + chartH - barHeight - 10);

  // Labels
  ctx.font = '12px system-ui';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94A3B8';
  ctx.fillText(`Goal: ${maxWords}`, barX + barWidth / 2, pad.top + chartH + 20);
}

function _drawXPPie(canvas, playerData) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2 - 30;
  const cy = h / 2;
  const radius = 70;

  ctx.clearRect(0, 0, w, h);

  const correct = playerData.totalCorrect || 0;
  const incorrect = playerData.totalIncorrect || 0;
  const total = correct + incorrect || 1;

  const slices = [
    { value: correct, color: '#58CC02', label: 'Correct' },
    { value: incorrect, color: '#FF4B4B', label: 'Incorrect' },
  ];

  let startAngle = -Math.PI / 2;
  for (const slice of slices) {
    const sliceAngle = (slice.value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    // Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0F172A';
    ctx.stroke();

    startAngle += sliceAngle;
  }

  // Legend
  const legendX = cx + radius + 30;
  let legendY = cy - 20;
  for (const slice of slices) {
    ctx.fillStyle = slice.color;
    ctx.fillRect(legendX, legendY, 12, 12);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#F1F5F9';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${slice.label}: ${slice.value}`, legendX + 18, legendY + 6);
    legendY += 22;
  }
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
