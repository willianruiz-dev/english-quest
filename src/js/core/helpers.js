/**
 * ENGLISH QUEST - Helper Utilities
 * Pure utility functions used across the app.
 * SOLID: Single Responsibility — stateless helpers, no side effects.
 */

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * Returns a new array (does not mutate original).
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick N random distinct items from an array.
 */
export function pickRandom(arr, n = 1) {
  return shuffle(arr).slice(0, n);
}

/**
 * Generate a unique ID (crypto-grade).
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Format a number with commas for display (e.g., 1500 -> "1,500").
 */
export function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate percentage, clamped to 0-100.
 */
export function percent(part, total) {
  if (total === 0) return 0;
  return clamp(Math.round((part / total) * 100), 0, 100);
}

/**
 * Debounce a function call.
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function call.
 */
export function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Escape HTML to prevent XSS.
 */
export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a DOM element with attributes and children (lightweight JSX-like helper).
 * Usage: el('div', { class: 'card', 'data-id': '1' }, [child1, child2])
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  }
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    for (const child of children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }
  } else if (children instanceof Node) {
    element.appendChild(children);
  }
  return element;
}

/**
 * Get the current timestamp in milliseconds.
 */
export function now() {
  return Date.now();
}

/**
 * Check if two dates are the same calendar day.
 */
export function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Pluralize a word based on count.
 */
export function pluralize(count, singular, plural = null) {
  return count === 1 ? singular : (plural || singular + 's');
}
