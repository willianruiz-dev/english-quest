/**
 * ENGLISH QUEST - Modal Component
 * Accessible modal dialog with backdrop, focus trap, and keyboard support (ESC to close).
 */

import { el } from '../core/helpers.js';

export class Modal {
  constructor() {
    this.overlay = null;
    this.content = null;
    this.isOpen = false;
    this.onClose = null;
    this._keyHandler = this._handleKey.bind(this);
  }

  /**
   * Create the modal DOM (called once).
   */
  _ensureDOM() {
    if (this.overlay) return;

    this.overlay = el('div', {
      className: 'modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
    });
    this.content = el('div', { className: 'modal-content' });
    this.overlay.appendChild(this.content);

    // Close on backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.body.appendChild(this.overlay);
  }

  /**
   * Open the modal with custom content.
   * @param {Object} options - { title, body, footer, size, onClose }
   */
  open(options = {}) {
    this._ensureDOM();
    const { title, body, footer, size = 'md', onClose } = options;

    this.onClose = onClose;
    this.content.innerHTML = '';
    this.content.className = `modal-content modal-content--${size}`;

    // Header
    if (title) {
      const header = el('div', { className: 'modal-header' }, [
        el('h2', { className: 'modal-title', textContent: title }),
        el('button', {
          className: 'modal-close',
          textContent: '✕',
          'aria-label': 'Close modal',
          onClick: () => this.close(),
        }),
      ]);
      this.content.appendChild(header);
    }

    // Body
    if (body) {
      const bodyEl = el('div', { className: 'modal-body' });
      if (typeof body === 'string') {
        bodyEl.innerHTML = body;
      } else if (body instanceof HTMLElement) {
        bodyEl.appendChild(body);
      }
      this.content.appendChild(bodyEl);
    }

    // Footer
    if (footer) {
      const footerEl = el('div', { className: 'modal-footer' });
      if (typeof footer === 'string') {
        footerEl.innerHTML = footer;
      } else if (footer instanceof HTMLElement) {
        footerEl.appendChild(footer);
      }
      this.content.appendChild(footerEl);
    }

    // Show
    this.overlay.classList.add('modal-overlay--open');
    document.addEventListener('keydown', this._keyHandler);
    document.body.style.overflow = 'hidden';
    this.isOpen = true;

    // Focus trap
    setTimeout(() => {
      const firstFocusable = this.content.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }, 100);
  }

  /**
   * Close the modal.
   */
  close() {
    if (!this.isOpen) return;
    this.overlay.classList.remove('modal-overlay--open');
    document.removeEventListener('keydown', this._keyHandler);
    document.body.style.overflow = '';
    this.isOpen = false;

    if (this.onClose) {
      this.onClose();
      this.onClose = null;
    }
  }

  _handleKey(e) {
    if (e.key === 'Escape') {
      this.close();
    }
    // Tab trap could be added here for full WCAG compliance
  }
}

export const modal = new Modal();
