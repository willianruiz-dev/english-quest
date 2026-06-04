/**
 * ENGLISH QUEST - Progress Bar Component
 * Animated, accessible progress bar with label and optional icon.
 */

import { el, clamp } from '../core/helpers.js';

export class ProgressBar {
  /**
   * Create a progress bar.
   * @param {Object} options - { value, max, label, showPercent, color, height, animated, className }
   * @returns {HTMLElement}
   */
  create(options = {}) {
    const {
      value = 0,
      max = 100,
      label = '',
      showPercent = true,
      color = 'var(--color-primary)',
      height = '10px',
      animated = true,
      className = '',
    } = options;

    const percent = clamp(Math.round((value / max) * 100), 0, 100);

    const container = el('div', {
      className: `progress-bar ${animated ? 'progress-bar--animated' : ''} ${className}`,
      role: 'progressbar',
      'aria-valuenow': String(value),
      'aria-valuemin': '0',
      'aria-valuemax': String(max),
      'aria-label': label || `${percent}%`,
    });

    if (label) {
      const labelEl = el('div', { className: 'progress-bar__header' }, [
        el('span', { className: 'progress-bar__label', textContent: label }),
        showPercent ? el('span', { className: 'progress-bar__percent', textContent: `${percent}%` }) : null,
      ].filter(Boolean));
      container.appendChild(labelEl);
    }

    const track = el('div', { className: 'progress-bar__track', style: { height } });
    const fill = el('div', {
      className: 'progress-bar__fill',
      style: { width: `${percent}%`, background: color },
    });
    track.appendChild(fill);
    container.appendChild(track);

    return container;
  }

  /**
   * Update an existing progress bar's value.
   */
  update(container, value, max = 100) {
    const percent = clamp(Math.round((value / max) * 100), 0, 100);
    const fill = container.querySelector('.progress-bar__fill');
    const percentEl = container.querySelector('.progress-bar__percent');

    if (fill) fill.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${percent}%`;

    container.setAttribute('aria-valuenow', String(value));
    container.setAttribute('aria-valuemax', String(max));
  }
}

export const progressBar = new ProgressBar();
