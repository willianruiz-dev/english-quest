/**
 * ENGLISH QUEST — Game Page
 * The core gameplay UI: renders questions, options, timer, and score.
 * Supports all 5 game modes via the GameEngine.
 */

import { GAME_MODES, UI } from '../core/constants.js';
import { el } from '../core/helpers.js';
import { gameEngine } from '../game/gameEngine.js';
import { modal } from '../ui/modal.js';
import { notifications } from '../ui/notifications.js';

/**
 * Render the game page for a specific mode.
 * @param {string} mode - Game mode key
 * @param {Object} playerData - Current player data
 * @returns {Promise<HTMLElement>}
 */
export async function renderGamePage(mode, playerData) {
  const container = el('div', { className: 'page-enter' });

  // Mode header
  const modeInfo = _getModeInfo(mode);
  const header = el('div', { className: 'flex items-center justify-between mb-6' }, [
    el('div', {}, [
      el('h2', { textContent: modeInfo.title, style: { color: modeInfo.color } }),
      el('p', { className: 'text-muted text-sm', textContent: modeInfo.desc }),
    ]),
    el('button', {
      className: 'btn btn--ghost btn--sm',
      textContent: '← Back',
      onClick: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'home' } })),
    }),
  ]);
  container.appendChild(header);

  // Game area
  const gameArea = el('div', { className: 'game-area glass-card' });
  container.appendChild(gameArea);

  // Timer (Time Attack only)
  if (mode === GAME_MODES.TIME_ATTACK) {
    const timerEl = el('div', { className: 'timer mb-4', textContent: formatTime(UI.TIME_ATTACK_SECONDS) });
    gameArea.appendChild(timerEl);
  }

  // Score display
  const scoreEl = el('div', { className: 'text-center mb-4' }, [
    el('span', { className: 'text-muted text-sm', textContent: 'Score: ' }),
    el('span', { className: 'text-2xl font-bold', textContent: '0' }),
  ]);
  gameArea.appendChild(scoreEl);

  // Question area (will be populated by engine)
  const questionArea = el('div', { className: 'question-area' });
  gameArea.appendChild(questionArea);

  // Initialize game engine callbacks
  _setupEngineCallbacks(gameArea, questionArea, scoreEl, container, mode, playerData);

  // Start the game
  try {
    const gameState = await gameEngine.startGame(mode);

    // Special mode rendering
    if (mode === GAME_MODES.MEMORY) {
      _renderMemoryGame(questionArea, gameState, gameArea, scoreEl, container, mode, playerData);
    } else if (mode === GAME_MODES.DEEP_SEEK) {
      _renderDeepSeekMode(questionArea, gameState, container);
    } else {
      _renderQuestion(questionArea, gameState, mode, gameArea);
    }
  } catch (err) {
    questionArea.innerHTML = '';
    questionArea.appendChild(
      el('div', { className: 'text-center p-6' }, [
        el('p', { className: 'text-danger text-lg', textContent: 'Failed to start game. Please try again.' }),
        el('button', {
          className: 'btn btn--primary mt-4',
          textContent: 'Go Back',
          onClick: () => window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'home' } })),
        }),
      ])
    );
  }

  return container;
}

// ─── Engine event callbacks ───

function _setupEngineCallbacks(gameArea, questionArea, scoreEl, container, mode, playerData) {
  gameEngine.on('timerTick', (data) => {
    const timerEl = gameArea.querySelector('.timer');
    if (timerEl) {
      timerEl.textContent = formatTime(data.timeLeft);
      if (data.timeLeft <= 10) {
        timerEl.classList.add('timer--urgent');
      }
    }
  });

  gameEngine.on('timeUp', (result) => {
    _showGameOverModal(result, mode, container);
  });

  gameEngine.on('gameOver', (result) => {
    _showGameOverModal(result, mode, container);
  });

  gameEngine.on('achievementUnlocked', (data) => {
    for (const ach of data.achievements) {
      notifications.showAchievement(ach);
    }
  });

  gameEngine.on('newQuestion', () => {
    // Score update happens after answer
  });
}

// ─── Render a question ───

function _renderQuestion(questionArea, question, mode, gameArea) {
  questionArea.innerHTML = '';

  if (!question || question.gameOver) return;

  const wordDisplay = el('div', { className: 'text-center mb-6' });

  if (mode === GAME_MODES.LISTENING) {
    wordDisplay.appendChild(el('div', { className: 'text-3xl mb-4', textContent: '🔊' }));
    wordDisplay.appendChild(el('button', {
      className: 'btn btn--primary btn--lg mb-4',
      textContent: '🔊 Play Audio',
      onClick: () => gameEngine.playListeningAudio(),
    }));
  } else if (mode === GAME_MODES.WRITING) {
    wordDisplay.appendChild(el('p', { className: 'text-muted mb-2', textContent: 'Translate this word:' }));
    wordDisplay.appendChild(el('div', { className: 'text-4xl font-bold mb-6', style: { color: 'var(--color-secondary)' }, textContent: question.word }));
  } else if (mode === GAME_MODES.TIME_ATTACK || mode === GAME_MODES.TRANSLATION) {
    wordDisplay.appendChild(el('p', { className: 'text-muted mb-2', textContent: 'What does this mean?' }));
    wordDisplay.appendChild(el('div', { className: 'text-4xl font-bold mb-2', textContent: question.word }));
    wordDisplay.appendChild(el('p', { className: 'text-xs text-muted', textContent: `Category: ${question.category || 'General'}` }));
  }

  questionArea.appendChild(wordDisplay);

  // Progress indicator
  const progress = el('div', { className: 'text-center text-sm text-muted mb-4', textContent: `${question.questionNumber} / ${question.totalQuestions}` });
  questionArea.appendChild(progress);

  // Writing mode: text input
  if (mode === GAME_MODES.WRITING) {
    _renderWritingInput(questionArea);
    return;
  }

  // Options (for translation, listening, time attack)
  if (question.options) {
    const optionsGrid = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' } });
    for (const opt of question.options) {
      const btn = el('button', {
        className: 'option-btn',
        textContent: opt.text,
        onClick: async () => {
          await _handleAnswer(btn, opt, questionArea, question, mode);
        },
      });
      optionsGrid.appendChild(btn);
    }
    questionArea.appendChild(optionsGrid);
  }
}

function _renderDeepSeekMode(questionArea, gameState, container, selectedResult = null) {
  questionArea.innerHTML = '';

  const intro = el('div', { className: 'mb-6' }, [
    el('p', { className: 'text-muted mb-2', textContent: 'Search the vocabulary bank and discover new words with Deep Seek.' }),
    el('p', { className: 'text-sm text-muted', textContent: 'Each new discovery gives you XP and coins while you learn.' }),
  ]);
  questionArea.appendChild(intro);

  const form = el('form', { className: 'deep-seek-form mb-6' });
  const input = el('input', {
    className: 'writing-input',
    type: 'search',
    placeholder: 'Search for a word, translation, or category',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    value: gameState.query || '',
  });
  const button = el('button', { className: 'btn btn--primary ml-3', type: 'submit', textContent: 'Seek' });
  form.appendChild(input);
  form.appendChild(button);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nextState = await gameEngine.searchDeepSeek(input.value);
    _renderDeepSeekMode(questionArea, nextState, container);
  });
  questionArea.appendChild(form);

  if (!gameState.results || gameState.results.length === 0) {
    questionArea.appendChild(el('p', {
      className: 'text-muted',
      textContent: gameState.query
        ? 'No matches found. Try a different search term.'
        : 'Search for a word to begin your Deep Seek quest.',
    }));
    return;
  }

  const list = el('div', { className: 'grid gap-3' },
    gameState.results.map(word => el('button', {
      className: 'game-card game-card--link text-left',
      type: 'button',
      onClick: async () => {
        const selected = await gameEngine.selectDeepSeekWord(word.english);
        _renderDeepSeekMode(questionArea, gameState, container, selected);
      },
    }, [
      el('div', { className: 'font-bold', textContent: word.english }),
      el('div', { className: 'text-sm text-muted', textContent: word.category }),
      el('div', { className: 'text-xs text-muted', textContent: word.translation || 'Translation pending' }),
    ])));

  questionArea.appendChild(list);

  if (selectedResult) {
    const statusText = selectedResult.alreadyLearned
      ? 'Already learned — keep exploring more words.'
      : `Discovery reward: +${selectedResult.reward.xp} XP · +${selectedResult.reward.coins} coins`;

    const detail = el('div', { className: 'glass-card mt-6 p-6' }, [
      el('h4', { className: 'mb-2', textContent: `${selectedResult.word.english}` }),
      el('p', { className: 'text-muted mb-2', textContent: `Category: ${selectedResult.word.category}` }),
      el('p', { className: 'text-muted mb-2', textContent: `Translation: ${selectedResult.translation}` }),
      el('p', { className: 'text-sm', textContent: statusText }),
    ]);
    questionArea.appendChild(detail);
  }
}

// ─── Writing input ───

function _renderWritingInput(questionArea) {
  const form = el('form', { className: 'flex flex-col items-center gap-4 mt-6' });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('.writing-input');
    const answer = input.value.trim();
    if (!answer) return;

    const result = await gameEngine.submitWritingAnswer(answer);

    // Show feedback
    const feedback = el('div', {
      className: `text-center text-lg font-bold mt-4 ${result.correct ? 'text-success' : 'text-danger'}`,
      textContent: result.correct ? '✅ Correct!' : `❌ The answer was: ${result.correctAnswer}`,
    });
    questionArea.appendChild(feedback);

    if (result.xp) notifications.showXP(result.xp, result.coins);
    input.disabled = true;

    setTimeout(() => {
      if (!result.gameOver) {
        const next = gameEngine.getNextQuestion();
        _renderQuestion(questionArea, next, GAME_MODES.WRITING);
      }
    }, 1500);
  });

  const input = el('input', {
    className: 'writing-input',
    type: 'text',
    placeholder: 'Type the translation...',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
  });
  form.appendChild(input);

  const submitBtn = el('button', { className: 'btn btn--primary btn--lg mt-4', textContent: 'Check Answer', type: 'submit' });
  form.appendChild(submitBtn);

  questionArea.appendChild(form);

  // Auto-focus
  setTimeout(() => input.focus(), 100);
}

// ─── Handle answer click ───

async function _handleAnswer(btn, selectedOpt, questionArea, question, mode) {
  // Disable all buttons
  const allBtns = questionArea.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.classList.add('option-btn--disabled'));

  // Highlight correct/incorrect
  for (const b of allBtns) {
    if (b.textContent === selectedOpt.text && selectedOpt.correct) {
      b.classList.add('option-btn--correct');
    } else if (b.textContent === selectedOpt.text && !selectedOpt.correct) {
      b.classList.add('option-btn--incorrect');
    }
    // Also highlight the correct answer
    const opt = question.options.find(o => o.text === b.textContent);
    if (opt && opt.correct) {
      b.classList.add('option-btn--correct');
    }
  }

  const result = await gameEngine.submitAnswer(selectedOpt.text);

  // Update score display
  const scoreSpan = document.querySelector('.game-area .text-2xl');
  if (scoreSpan) {
    scoreSpan.textContent = gameEngine.score;
  }

  if (result.xp) notifications.showXP(result.xp, result.coins);
  if (result.leveledUp) notifications.showLevelUp(result.leveledUp.to);

  if (result.gameOver) return; // Modal handled by callback

  // Show next question after delay
  setTimeout(() => {
    const next = gameEngine.getNextQuestion();
    const qArea = document.querySelector('.question-area');
    const gArea = document.querySelector('.game-area');
    if (qArea && next) _renderQuestion(qArea, next, mode, gArea);
  }, 1200);
}

// ─── Memory Mode Rendering ───

function _renderMemoryGame(questionArea, gameState, gameArea, scoreEl, container, mode, playerData) {
  questionArea.innerHTML = '';

  if (!gameState || gameState.gameOver) return;

  // Progress indicator
  const progressEl = el('div', { className: 'text-center text-sm text-muted mb-4', textContent: `Matched: ${gameState.matchedPairs} / ${gameState.totalPairs}` });
  questionArea.appendChild(progressEl);

  // Card grid
  const cardGrid = el('div', { className: 'memory-grid' });
  for (const card of gameState.cards) {
    const cardEl = el('div', {
      className: `memory-card ${card.flipped ? 'memory-card--flipped' : ''} ${card.matched ? 'memory-card--matched' : ''}`,
      'data-card-id': card.id,
      onClick: () => _handleMemoryFlip(cardEl, card.id, questionArea, gameArea, scoreEl, container, mode, playerData),
    });
    // Inner content (hidden when not flipped)
    const inner = el('div', { className: 'memory-card__inner' });
    const front = el('div', { className: 'memory-card__front', textContent: '?' });
    const back = el('div', {
      className: `memory-card__back ${card.type === 'english' ? 'memory-card__back--en' : 'memory-card__back--es'}`,
      textContent: card.text,
    });
    inner.appendChild(front);
    inner.appendChild(back);
    cardEl.appendChild(inner);
    cardGrid.appendChild(cardEl);
  }
  questionArea.appendChild(cardGrid);

  // Score display
  const memScore = el('div', { className: 'text-center mt-4 text-lg font-bold', textContent: `Score: ${gameState.score}` });
  questionArea.appendChild(memScore);
}

async function _handleMemoryFlip(cardEl, cardId, questionArea, gameArea, scoreEl, container, mode, playerData) {
  const result = gameEngine.flipMemoryCard(cardId);
  if (!result) return;

  // Flip the clicked card visually
  if (result.card) {
    cardEl.classList.add('memory-card--flipped');
  }

  if (result.cards && result.cards.length === 2) {
    const [cardA, cardB] = result.cards;
    const elA = questionArea.querySelector(`[data-card-id="${cardA.id}"]`);
    const elB = questionArea.querySelector(`[data-card-id="${cardB.id}"]`);

    if (elA) elA.classList.add('memory-card--flipped');
    if (elB) elB.classList.add('memory-card--flipped');

    if (result.match) {
      // Match found
      setTimeout(() => {
        if (elA) elA.classList.add('memory-card--matched');
        if (elB) elB.classList.add('memory-card--matched');
      }, 500);

      if (result.xp) notifications.showXP(result.xp, result.coins);
      if (result.leveledUp) notifications.showLevelUp(result.leveledUp.to);

      // Update score
      const memScore = questionArea.querySelector('.text-lg');
      if (memScore) memScore.textContent = `Score: ${result.score || gameEngine.score}`;

      // Update match count
      const progressEl = questionArea.querySelector('.text-muted');
      if (progressEl) {
        const matchedNow = gameEngine.memoryMatched;
        progressEl.textContent = `Matched: ${matchedNow} / ${gameEngine.totalQuestions}`;
      }

      if (result.gameOver) return; // Modal handled by callback
    } else {
      // No match - flip back after delay
      setTimeout(() => {
        if (elA) elA.classList.remove('memory-card--flipped');
        if (elB) elB.classList.remove('memory-card--flipped');
      }, 800);
    }
  }
}

// ─── Game Over Modal ───

function _showGameOverModal(result, mode, container) {
  const stats = [
    { label: 'Score', value: result.score },
    { label: 'Correct', value: `${result.correctCount}/${result.totalQuestions}` },
    { label: 'Accuracy', value: `${result.accuracy}%` },
  ];

  const body = el('div', { className: 'text-center' });

  // Result banner
  const emoji = result.accuracy >= 90 ? '🌟' : result.accuracy >= 70 ? '👏' : result.accuracy >= 50 ? '💪' : '📚';
  body.appendChild(el('div', { className: 'text-5xl mb-4', textContent: emoji }));
  body.appendChild(el('div', { className: 'text-2xl font-bold mb-2', textContent: result.isPerfect ? 'PERFECT ROUND!' : 'Game Over!' }));
  body.appendChild(el('p', { className: 'text-muted mb-6', textContent: result.isPerfect ? 'You got everything right!' : 'Great effort! Keep practicing.' }));

  // Stats grid
  const statsGrid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' } });
  for (const s of stats) {
    statsGrid.appendChild(el('div', { className: 'dashboard__stat', style: { flexDirection: 'column', textAlign: 'center' } }, [
      el('span', { className: 'text-2xl font-bold', textContent: String(s.value) }),
      el('span', { className: 'text-xs text-muted', textContent: s.label }),
    ]));
  }
  body.appendChild(statsGrid);

  // Answers review
  if (result.answers && result.answers.length > 0) {
    const answersTitle = el('h4', { textContent: 'Review', className: 'mb-3' });
    body.appendChild(answersTitle);

    for (const a of result.answers.slice(0, 10)) {
      const row = el('div', { className: 'flex items-center gap-2 py-1 text-sm' }, [
        el('span', { textContent: a.correct ? '✅' : '❌' }),
        el('span', { className: 'font-semibold', textContent: a.word }),
      ]);
      body.appendChild(row);
    }
  }

  const footer = el('div', { className: 'flex gap-3 justify-center' }, [
    el('button', {
      className: 'btn btn--secondary',
      textContent: 'Back to Home',
      onClick: () => {
        modal.close();
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'home' } }));
      },
    }),
    el('button', {
      className: 'btn btn--primary',
      textContent: 'Play Again',
      onClick: () => {
        modal.close();
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'game', mode } }));
      },
    }),
  ]);

  modal.open({ title: 'Quest Complete!', body, footer, size: 'md' });
}

// ─── Helpers ───

function _getModeInfo(mode) {
  const map = {
    [GAME_MODES.TRANSLATION]: { title: 'Translation Quest', desc: 'Match English words to their Spanish translations', color: 'var(--color-primary)' },
    [GAME_MODES.MEMORY]: { title: 'Memory Challenge', desc: 'Find matching English-Spanish pairs', color: 'var(--color-secondary)' },
    [GAME_MODES.WRITING]: { title: 'Writing Quest', desc: 'Type the Spanish translation', color: 'var(--color-accent)' },
    [GAME_MODES.LISTENING]: { title: 'Listening Quest', desc: 'Hear the word and pick the correct translation', color: 'var(--level-4)' },
    [GAME_MODES.DEEP_SEEK]: { title: 'Deep Seek', desc: 'Search words, discover meanings, and earn rewards', color: 'var(--color-info)' },
    [GAME_MODES.TIME_ATTACK]: { title: 'Time Attack!', desc: '60 seconds — answer as many as you can!', color: 'var(--color-danger)' },
  };
  return map[mode] || { title: 'Game', desc: '', color: 'var(--color-primary)' };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
