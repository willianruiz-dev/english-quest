/**
 * ENGLISH QUEST — Application Entry Point
 * SPA router, state management, and app initialization.
 * Loads all modules, manages navigation, and persists game state.
 *
 * Architecture: Clean Architecture with SOLID principles.
 * - Router: simple hash-based SPA navigation
 * - State: centralized in storageService
 * - Views: each page is a render function
 */

import { CONFIG } from './core/config.js';
import { generateId } from './core/helpers.js';
import { storageService } from './services/storageService.js';
import { scoreManager } from './game/scoreManager.js';
import { achievementManager } from './game/achievementManager.js';
import { renderHomePage } from './pages/home.js';
import { renderGamePage } from './pages/game.js';
import { renderProfilePage } from './pages/profile.js';
import { renderLeaderboardPage } from './pages/leaderboard.js';
import { notifications } from './ui/notifications.js';

// ─── App State ───
const AppState = {
  currentPage: 'home',
  gameMode: null,
  playerData: null,
  initialized: false,
};

// ─── DOM Cache ───
const DOM = {
  sidebar: null,
  sidebarLinks: null,
  mobileMenuBtn: null,
  themeToggle: null,
  headerTitle: null,
  headerXP: null,
  headerCoins: null,
  headerStreak: null,
  mainContent: null,
};

// ══════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  _cacheDOM();
  _loadState();
  _applySettings();
  _setupNavigation();
  _setupHeader();
  _setupThemeToggle();
  _setupMobileMenu();
  _navigateTo('home');
  AppState.initialized = true;

  if (CONFIG.features.debugMode) {
    console.log('🏰 English Quest initialized', AppState.playerData);
  }
});

// ─── DOM Cache ───
function _cacheDOM() {
  DOM.sidebar = document.querySelector('.app__sidebar');
  DOM.sidebarLinks = document.querySelectorAll('.sidebar__link');
  DOM.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  DOM.themeToggle = document.querySelector('.theme-toggle');
  DOM.headerTitle = document.querySelector('.header__title');
  DOM.headerXP = document.querySelector('.header-xp');
  DOM.headerCoins = document.querySelector('.header-coins');
  DOM.headerStreak = document.querySelector('.header-streak');
  DOM.mainContent = document.querySelector('.app__content');
}

// ─── Load / Initialize User Data ───
function _loadState() {
  let data = storageService.load();
  AppState.playerData = data.user;
  scoreManager.init(data.user);
}

// ─── Apply saved settings ───
function _applySettings() {
  const data = storageService.load();
  const settings = data.settings || {};

  // Theme
  const theme = settings.theme || CONFIG.theme.default;
  document.documentElement.setAttribute('data-theme', theme);

  // Reduced motion
  if (settings.reduceMotion) {
    document.documentElement.setAttribute('data-reduce-motion', 'true');
  }
}

// ══════════════════════════════════════════
// NAVIGATION (SPA Router)
// ══════════════════════════════════════════

function _setupNavigation() {
  // Sidebar link clicks
  DOM.sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (page) _navigateTo(page);
    });
  });

  // Custom events (for in-page navigation)
  window.addEventListener('navigate', (e) => {
    const { page, mode } = e.detail;
    if (page === 'game' && mode) {
      AppState.gameMode = mode;
    }
    _navigateTo(page || 'home');
  });
}

async function _navigateTo(page) {
  AppState.currentPage = page;

  // Update sidebar active state
  DOM.sidebarLinks.forEach(link => {
    link.classList.toggle('sidebar__link--active', link.dataset.page === page);
  });

  // Update header title
  const titles = {
    home: 'Dashboard',
    game: 'Quest',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
  };
  if (DOM.headerTitle) {
    DOM.headerTitle.textContent = titles[page] || 'English Quest';
  }

  // Close mobile sidebar
  DOM.sidebar?.classList.remove('app__sidebar--open');

  // Refresh player data
  const data = storageService.load();
  AppState.playerData = data.user;

  // Render page
  if (DOM.mainContent) {
    DOM.mainContent.innerHTML = '';

    try {
      let content;
      switch (page) {
        case 'home':
          content = renderHomePage(AppState.playerData);
          break;
        case 'game':
          content = await renderGamePage(AppState.gameMode, AppState.playerData);
          break;
        case 'profile':
          content = renderProfilePage(AppState.playerData);
          break;
        case 'leaderboard':
          content = renderLeaderboardPage(AppState.playerData);
          break;
        default:
          content = renderHomePage(AppState.playerData);
      }
      DOM.mainContent.appendChild(content);
    } catch (err) {
      console.error('Page render error:', err);
      DOM.mainContent.innerHTML = `
        <div class="text-center p-8">
          <div class="text-4xl mb-4">😵</div>
          <h2>Something went wrong</h2>
          <p class="text-muted mt-2">${err.message}</p>
          <button class="btn btn--primary mt-4" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail:{page:'home'}}))">Go Home</button>
        </div>
      `;
    }
  }

  _updateHeader();
}

// ══════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════

function _setupHeader() {
  _updateHeader();
}

function _updateHeader() {
  const data = storageService.load().user;
  if (DOM.headerXP) DOM.headerXP.textContent = `${data.xp.toLocaleString()} XP`;
  if (DOM.headerCoins) DOM.headerCoins.textContent = `🪙 ${data.coins.toLocaleString()}`;
  if (DOM.headerStreak) DOM.headerStreak.textContent = `🔥 ${data.currentStreak}`;
}

// ══════════════════════════════════════════
// THEME TOGGLE
// ══════════════════════════════════════════

function _setupThemeToggle() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  if (DOM.themeToggle) {
    DOM.themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    DOM.themeToggle.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      DOM.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

      const data = storageService.load();
      data.settings = data.settings || {};
      data.settings.theme = newTheme;
      storageService.save(data);
    });
  }
}

// ══════════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════════

function _setupMobileMenu() {
  if (DOM.mobileMenuBtn) {
    DOM.mobileMenuBtn.addEventListener('click', () => {
      DOM.sidebar?.classList.toggle('app__sidebar--open');
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      if (DOM.sidebar?.classList.contains('app__sidebar--open') &&
          !DOM.sidebar.contains(e.target) &&
          e.target !== DOM.mobileMenuBtn) {
        DOM.sidebar.classList.remove('app__sidebar--open');
      }
    }
  });
}

// ══════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Ctrl+1-4 navigation
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case '1': e.preventDefault(); _navigateTo('home'); break;
      case '2': e.preventDefault(); _navigateTo('game'); break;
      case '3': e.preventDefault(); _navigateTo('profile'); break;
      case '4': e.preventDefault(); _navigateTo('leaderboard'); break;
    }
  }
});
