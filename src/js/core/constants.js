/**
 * ENGLISH QUEST - Core Constants
 * Game-wide immutable values: levels, XP thresholds, achievements, and game modes.
 * SOLID: Single Responsibility — this module ONLY holds constant data.
 */

// ─── Level definitions (RPG progression) ───
export const LEVELS = Object.freeze([
  { id: 1, name: 'Beginner', minXP: 0, icon: '🌱', color: '#4CAF50' },
  { id: 2, name: 'Explorer', minXP: 500, icon: '🔍', color: '#2196F3' },
  { id: 3, name: 'Adventurer', minXP: 1500, icon: '⚔️', color: '#FF9800' },
  { id: 4, name: 'Warrior', minXP: 3500, icon: '🛡️', color: '#9C27B0' },
  { id: 5, name: 'Master', minXP: 7000, icon: '👑', color: '#F44336' },
  { id: 6, name: 'Legend', minXP: 15000, icon: '🌟', color: '#FFD700' },
]);

// ─── XP & Coin rewards ───
export const REWARDS = Object.freeze({
  CORRECT_ANSWER: { xp: 10, coins: 5 },
  STREAK_BONUS_5: { xp: 50, coins: 25 },
  STREAK_BONUS_10: { xp: 100, coins: 60 },
  PERFECT_ROUND: { xp: 30, coins: 15 },
  DAILY_LOGIN: { xp: 20, coins: 10 },
});

// ─── Achievement definitions ───
export const ACHIEVEMENTS = Object.freeze([
  { id: 'first_step', name: 'First Step', desc: 'Learn 10 words', target: 10, icon: '👣' },
  { id: 'explorer', name: 'Explorer', desc: 'Learn 100 words', target: 100, icon: '🧭' },
  { id: 'word_warrior', name: 'Word Warrior', desc: 'Learn 500 words', target: 500, icon: '⚡' },
  { id: 'master', name: 'Master', desc: 'Learn 1000 words', target: 1000, icon: '🎓' },
  { id: 'streak_7', name: 'Weekly Streak', desc: '7-day streak', target: 7, icon: '🔥', type: 'streak' },
  { id: 'streak_30', name: 'Monthly Legend', desc: '30-day streak', target: 30, icon: '💎', type: 'streak' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Score 200+ in Time Attack', target: 200, icon: '⚡', type: 'score' },
  { id: 'perfect_round', name: 'Perfect Round', desc: '100% accuracy in a round', target: 1, icon: '🎯', type: 'perfect' },
  { id: 'legend', name: 'Legend', desc: 'Reach Legend level', target: 6, icon: '🌟', type: 'level' },
]);

// ─── Game modes ───
export const GAME_MODES = Object.freeze({
  TRANSLATION: 'translation',
  MEMORY: 'memory',
  WRITING: 'writing',
  LISTENING: 'listening',
  TIME_ATTACK: 'time_attack',
  DEEP_SEEK: 'deep_seek',
});

// ─── UI constants ───
export const UI = Object.freeze({
  ANIMATION_DURATION: 300,          // ms
  TOAST_DURATION: 3000,         // ms
  TIME_ATTACK_SECONDS: 60,          // s
  QUESTION_COUNT: 10,          // questions per round
  MEMORY_PAIRS: 6,           // pairs in memory game
  LOCAL_STORAGE_KEY: 'english_quest_data',
});
