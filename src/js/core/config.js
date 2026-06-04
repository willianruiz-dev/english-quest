/**
 * ENGLISH QUEST - Application Configuration
 * Runtime configuration: API endpoints, feature flags, environment settings.
 * SOLID: Single Responsibility — this module ONLY holds configurable settings.
 */

export const CONFIG = Object.freeze({
  // ─── Translation API ───
  translationAPI: {
    baseURL:    'https://api.mymemory.translated.net/get',
    langPair:   'en|es',
    timeout:    5000,           // ms
    retries:    2,
    cacheSize:  200,            // words cached in memory
  },

  // ─── Audio / Speech ───
  speech: {
    lang:       'en-US',
    rate:       0.85,
    pitch:      1.0,
    volume:     1.0,
  },

  // ─── Storage ───
  storage: {
    key:        'english_quest_data',
    version:    '1.0.0',
  },

  // ─── Game settings ───
  game: {
    questionsPerRound:  10,
    memoryPairs:        6,
    timeAttackSeconds:  60,
    maxOptions:         4,
  },

  // ─── Theme ───
  theme: {
    default:            'dark',
    storageKey:         'english_quest_theme',
  },

  // ─── Features ───
  features: {
    soundEffects:       true,
    hapticFeedback:     false,
    debugMode:          false,
  },

  // ─── Accessibility ───
  a11y: {
    reduceMotion:       false,
    highContrast:       false,
    fontSizeScale:      1.0,
  },
});
