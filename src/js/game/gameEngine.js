/**
 * ENGLISH QUEST - Game Engine
 * Core game loop orchestrating all 5 game modes.
 * Uses Strategy pattern: each mode is a pluggable strategy.
 * SOLID: Open/Closed — new game modes added without modifying existing code.
 *        Dependency Inversion — depends on abstractions (services), not concretions.
 */

import { GAME_MODES, UI, REWARDS } from '../core/constants.js';
import { shuffle, pickRandom, el } from '../core/helpers.js';
import { getRandomWords } from '../repositories/wordRepository.js';
import { translationService } from '../services/translationService.js';
import { audioService } from '../services/audioService.js';
import { scoreManager } from './scoreManager.js';
import { levelManager } from './levelManager.js';
import { achievementManager } from './achievementManager.js';

class GameEngine {
  constructor() {
    this.mode = null;
    this.words = [];
    this.currentQuestion = 0;
    this.totalQuestions = 0;
    this.score = 0;
    this.correctCount = 0;
    this.answers = [];        // History: { word, correct, timeMs }
    this.timeLeft = 0;
    this.timerInterval = null;
    this.isRunning = false;
    this.callbacks = {};
    this.memoryCards = [];    // For memory mode
    this.memoryFlipped = [];
    this.memoryMatched = 0;
  }

  // ─── Callback registration ───

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  _emit(event, data = {}) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  // ─── Game setup ───

  /**
   * Start a new game in the given mode.
   * mode: 'translation' | 'memory' | 'writing' | 'listening' | 'time_attack'
   * options: { category, questionCount }
   */
  async startGame(mode, options = {}) {
    this.mode = mode;
    const questionCount = options.questionCount || (mode === GAME_MODES.MEMORY ? UI.MEMORY_PAIRS : UI.QUESTION_COUNT);

    // Fetch words
    this.words = getRandomWords(questionCount * 2, options.category || null); // Extra for distractor pool
    this.totalQuestions = mode === GAME_MODES.MEMORY ? questionCount : Math.min(questionCount, this.words.length);
    this.currentQuestion = 0;
    this.score = 0;
    this.correctCount = 0;
    this.answers = [];
    this.isRunning = true;

    // For memory mode, pair up words
    if (mode === GAME_MODES.MEMORY) {
      this._setupMemoryGame();
      return this._getMemoryState();
    }

    // Pre-load translations for first batch
    const firstBatch = this.words.slice(0, questionCount).map(w => w.english);
    await translationService.translateBatch(firstBatch);

    // For time attack, start timer
    if (mode === GAME_MODES.TIME_ATTACK) {
      this.timeLeft = UI.TIME_ATTACK_SECONDS;
      this._startTimer();
    }

    return this._getCurrentQuestion();
  }

  /**
   * Get the current question for display.
   */
  _getCurrentQuestion() {
    if (this.currentQuestion >= this.totalQuestions) {
      return this._endGame();
    }

    const word = this.words[this.currentQuestion];
    const distractorPool = this.words.filter(w => w.english !== word.english);
    const distractors = pickRandom(distractorPool, 3); // 3 wrong + 1 correct
    const options = shuffle([
      { text: word.translation || word.english, correct: true, english: word.english },
      ...distractors.map(d => ({ text: d.translation || d.english, correct: false })),
    ]);

    this._emit('newQuestion', { index: this.currentQuestion, total: this.totalQuestions, word });

    return {
      mode: this.mode,
      questionNumber: this.currentQuestion + 1,
      totalQuestions: this.totalQuestions,
      word: word.english,
      category: word.category,
      difficulty: word.difficulty,
      options,
      timeLeft: this.mode === GAME_MODES.TIME_ATTACK ? this.timeLeft : null,
      score: this.score,
    };
  }

  /**
   * Submit an answer.
   * Returns { correct, correctAnswer, xp, coins, streak, achievement, gameOver }
   */
  async submitAnswer(selectedText) {
    if (!this.isRunning) return { gameOver: true };

    const word = this.words[this.currentQuestion];
    const correctAnswer = word.translation || word.english;
    const isCorrect = selectedText.trim().toLowerCase() === correctAnswer.toLowerCase();

    this.answers.push({ word: word.english, correct: isCorrect, timeMs: 0 });

    let result = { correct: isCorrect, correctAnswer, gameOver: false };

    if (isCorrect) {
      this.correctCount++;
      const rewards = scoreManager.awardCorrectAnswer();
      result = { ...result, ...rewards };
      scoreManager.learnWord(word.english);

      // Check for level up
      if (rewards.leveledUp) {
        result.leveledUp = rewards.leveledUp;
      }

      // Play pronunciation
      await audioService.pronounceWord(word.english);
    } else {
      scoreManager.recordIncorrectAnswer();
    }

    this.currentQuestion++;

    // Check if game should end
    const isLastQuestion = this.currentQuestion >= this.totalQuestions;
    const isTimeUp = this.mode === GAME_MODES.TIME_ATTACK && this.timeLeft <= 0;

    if (isLastQuestion || isTimeUp) {
      const endResult = this._endGame();
      result = { ...result, ...endResult, gameOver: true };
    }

    this._emit('answerSubmitted', result);
    return result;
  }

  /**
   * Get the next question (call after submitAnswer if game isn't over).
   */
  getNextQuestion() {
    return this._getCurrentQuestion();
  }

  // ─── Writing mode: validate typed answer ───

  async submitWritingAnswer(typedText) {
    return this.submitAnswer(typedText);
  }

  // ─── Listening mode: play audio for current word ───

  async playListeningAudio() {
    if (this.mode !== GAME_MODES.LISTENING || !this.isRunning) return;
    const word = this.words[this.currentQuestion];
    await audioService.pronounceWord(word.english);
  }

  // ─── Memory mode ───

  _setupMemoryGame() {
    const pairs = this.words.slice(0, this.totalQuestions);
    this.memoryCards = [];

    for (const word of pairs) {
      const translation = word.translation || word.english;
      this.memoryCards.push({
        id: `${word.english}_en`,
        pairId: word.english,
        text: word.english,
        type: 'english',
        flipped: false,
        matched: false,
      });
      this.memoryCards.push({
        id: `${word.english}_es`,
        pairId: word.english,
        text: translation,
        type: 'spanish',
        flipped: false,
        matched: false,
      });
    }

    this.memoryCards = shuffle(this.memoryCards);
    this.memoryFlipped = [];
    this.memoryMatched = 0;
  }

  flipMemoryCard(cardId) {
    const card = this.memoryCards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return null;
    if (this.memoryFlipped.length >= 2) return null;

    card.flipped = true;
    this.memoryFlipped.push(card);

    if (this.memoryFlipped.length === 2) {
      const [a, b] = this.memoryFlipped;
      const isMatch = a.pairId === b.pairId && a.type !== b.type;

      if (isMatch) {
        a.matched = true;
        b.matched = true;
        this.memoryMatched++;
        this.score += 10;
        scoreManager.awardCorrectAnswer();
        scoreManager.learnWord(a.pairId);
        this.memoryFlipped = [];

        if (this.memoryMatched >= this.totalQuestions) {
          const result = this._endGame();
          return { cards: [a, b], match: true, gameOver: true, ...result };
        }

        return { cards: [a, b], match: true, gameOver: false, score: this.score };
      } else {
        // No match - flip back after delay
        const cardsToFlip = [...this.memoryFlipped];
        this.memoryFlipped = [];
        scoreManager.recordIncorrectAnswer();

        setTimeout(() => {
          cardsToFlip.forEach(c => { c.flipped = false; });
          this._emit('memoryFlipBack', { cards: cardsToFlip.map(c => c.id) });
        }, 800);

        return { cards: [a, b], match: false, gameOver: false, score: this.score };
      }
    }

    return { card, gameOver: false };
  }

  _getMemoryState() {
    return {
      mode: GAME_MODES.MEMORY,
      cards: this.memoryCards,
      matchedPairs: this.memoryMatched,
      totalPairs: this.totalQuestions,
      score: this.score,
    };
  }

  // ─── Timer (Time Attack) ───

  _startTimer() {
    this._stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this._emit('timerTick', { timeLeft: this.timeLeft });

      if (this.timeLeft <= 0) {
        this._stopTimer();
        const result = this._endGame();
        this._emit('timeUp', result);
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ─── End game ───

  _endGame() {
    this._stopTimer();
    this.isRunning = false;

    const accuracy = this.answers.length > 0
      ? Math.round((this.correctCount / this.answers.length) * 100)
      : 0;

    const isPerfect = this.answers.length > 0 && this.correctCount === this.answers.length;
    if (isPerfect) {
      scoreManager.awardPerfectRound();
    }

    // Check achievements
    const fullData = scoreManager.data;
    if (fullData) {
      const newAchievements = achievementManager.checkAchievements(fullData, fullData.achievements || []);
      if (newAchievements.length > 0) {
        this._emit('achievementUnlocked', { achievements: newAchievements });
      }
    }

    const result = {
      gameOver: true,
      mode: this.mode,
      score: this.score,
      correctCount: this.correctCount,
      totalQuestions: this.answers.length,
      accuracy,
      isPerfect,
      answers: this.answers,
    };

    this._emit('gameOver', result);
    return result;
  }

  /**
   * Abort the current game.
   */
  abort() {
    this._stopTimer();
    this.isRunning = false;
    this._emit('gameAborted', {});
  }
}

export const gameEngine = new GameEngine();
