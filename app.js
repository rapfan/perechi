'use strict';

const LEVELS = {
  easy:   { label: 'Ușor',  pairs: 6,  columns: 4 },
  medium: { label: 'Mediu', pairs: 8,  columns: 4 },
  hard:   { label: 'Greu',  pairs: 10, columns: 5 },
};
const SYMBOLS = ['🍉','🌈','🚀','🦊','🌸','⭐','🐧','🎨','🦋','🍀','🐼','🍩'];
const STORAGE_KEY = 'perechi-pwa-best-v1';
const SOUND_KEY = 'perechi-pwa-sound-v1';
const $ = (selector) => document.querySelector(selector);

let level = 'easy';
let cards = [];
let chosen = [];
let matchedPairs = 0;
let moves = 0;
let startedAt = null;
let elapsedSeconds = 0;
let ticker = null;
let flipTimeout = null;
let locked = false;
let running = false;
let audioContext = null;
let soundOn = localStorage.getItem(SOUND_KEY) === 'true';
let deferredInstallPrompt = null;
let previousFocus = null;

function getBests() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch { return {}; }
}
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
function shuffle(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function playTone(frequency = 540, duration = 0.08) {
  if (!soundOn) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.055, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + duration);
  } catch { /* Audio is optional. */ }
}
function updateSoundButton() {
  $('#soundLabel').textContent = soundOn ? 'Sunet pornit' : 'Sunet oprit';
  $('#soundButton').setAttribute('aria-pressed', String(soundOn));
  $('#soundIcon').textContent = soundOn ? '♫' : '♪';
}
function updateStatistics() {
  $('#moves').textContent = moves;
  $('#timer').textContent = formatTime(elapsedSeconds);
  $('#progressText').textContent = `${matchedPairs} / ${LEVELS[level].pairs} perechi`;
  $('#progressFill').style.width = `${100 * matchedPairs / LEVELS[level].pairs}%`;
  const best = getBests()[level];
  $('#best').textContent = best && Number.isInteger(best.moves) ? best.moves : '—';
}
function updateTimer() {
  if (startedAt !== null) {
    elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    $('#timer').textContent = formatTime(elapsedSeconds);
  }
}
function startClock() {
  if (running) return;
  running = true;
  startedAt = Date.now();
  ticker = window.setInterval(updateTimer, 250);
}
function stopClock() {
  updateTimer();
  window.clearInterval(ticker);
  ticker = null;
  running = false;
  startedAt = null;
}
function makeTile(symbol, index) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tile';
  button.dataset.index = String(index);
  button.setAttribute('aria-label', `Cartonașul ${index + 1}, ascuns`);
  button.setAttribute('aria-pressed', 'false');
  const back = document.createElement('span');
  back.className = 'tile-face tile-back';
  back.setAttribute('aria-hidden', 'true');
  const mark = document.createElement('span');
  mark.textContent = '✦';
  back.append(mark);
  const front = document.createElement('span');
  front.className = 'tile-face tile-front';
  front.setAttribute('aria-hidden', 'true');
  front.textContent = symbol;
  button.append(back, front);
  button.addEventListener('click', () => flipCard(index));
  return button;
}
function hideWin() {
  $('#winModal').hidden = true;
}
function newGame(newLevel = level) {
  if (!LEVELS[newLevel]) return;
  window.clearTimeout(flipTimeout);
  window.clearInterval(ticker);
  ticker = null; flipTimeout = null;
  startedAt = null;
  elapsedSeconds = 0; running = false; locked = false;
  moves = 0; matchedPairs = 0; chosen = []; level = newLevel;
  const symbols = SYMBOLS.slice(0, LEVELS[level].pairs);
  cards = shuffle([...symbols, ...symbols]);
  const board = $('#board');
  board.style.setProperty('--cols', LEVELS[level].columns);
  board.replaceChildren(...cards.map(makeTile));
  document.querySelectorAll('[data-level]').forEach(btn => {
    const active = btn.dataset.level === level;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  $('#statusText').textContent = 'Găsește prima pereche!';
  hideWin();
  updateStatistics();
}
function flipCard(index) {
  if (locked || chosen.includes(index)) return;
  const tile = $('#board').children[index];
  if (!tile || tile.classList.contains('matched') || tile.classList.contains('flipped')) return;
  if (!running) startClock();
  tile.classList.add('flipped');
  tile.setAttribute('aria-label', `Cartonașul ${index + 1}: ${cards[index]}`);
  tile.setAttribute('aria-pressed', 'true');
  chosen.push(index);
  playTone(460, 0.07);
  if (chosen.length !== 2) return;
  moves++;
  updateStatistics();
  const [a, b] = chosen;
  if (cards[a] === cards[b]) {
    locked = true;
    $('#statusText').textContent = 'Perfect! Ai găsit o pereche.';
    flipTimeout = window.setTimeout(() => {
      for (const cardIndex of [a, b]) {
        const match = $('#board').children[cardIndex];
        match.classList.add('matched');
        match.disabled = true;
        match.setAttribute('aria-label', `Cartonașul ${cardIndex + 1}, pereche găsită: ${cards[cardIndex]}`);
      }
      matchedPairs++;
      chosen = []; locked = false; flipTimeout = null;
      updateStatistics();
      playTone(720, 0.13);
      if (matchedPairs === LEVELS[level].pairs) finishGame();
    }, 300);
  } else {
    locked = true;
    $('#statusText').textContent = 'Nu se potrivesc. Încearcă din nou!';
    flipTimeout = window.setTimeout(() => {
      for (const cardIndex of [a, b]) {
        const card = $('#board').children[cardIndex];
        card.classList.remove('flipped');
        card.setAttribute('aria-label', `Cartonașul ${cardIndex + 1}, ascuns`);
        card.setAttribute('aria-pressed', 'false');
      }
      chosen = []; locked = false; flipTimeout = null;
    }, 850);
  }
}
function finishGame() {
  stopClock();
  $('#statusText').textContent = 'Felicitări! Ai terminat jocul.';
  const bests = getBests();
  const previous = bests[level];
  const isBest = !previous || moves < previous.moves || (moves === previous.moves && elapsedSeconds < previous.seconds);
  if (isBest) {
    bests[level] = {moves, seconds: elapsedSeconds};
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bests)); } catch { /* Storage is optional. */ }
  }
  updateStatistics();
  $('#winDetail').textContent = `Ai terminat nivelul ${LEVELS[level].label.toLowerCase()} în ${formatTime(elapsedSeconds)}, cu ${moves} mutări.`;
  $('#newRecord').hidden = !isBest;
  previousFocus = document.activeElement;
  $('#winModal').hidden = false;
  $('#playAgainButton').focus();
  playTone(870, 0.19);
}
function closeDialog(dialog) {
  dialog.hidden = true;
  if (previousFocus?.isConnected) previousFocus.focus();
}
function explainInstall() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  $('#installInstructions').textContent = ios
    ? 'Pe iPhone: deschide acest joc în Safari, apasă butonul Partajare (pătrat cu săgeată) și alege „Adaugă pe ecranul principal”.'
    : 'Pe Android: în Chrome, deschide meniul ⋮ și alege „Instalează aplicația” sau „Adaugă pe ecranul principal”. Pe calculator, caută opțiunea de instalare în bara browserului.';
  previousFocus = document.activeElement;
  $('#installModal').hidden = false;
  $('#closeInstallButton').focus();
}

$('#resetButton').addEventListener('click', () => newGame());
$('#playAgainButton').addEventListener('click', () => newGame());
$('#closeWinButton').addEventListener('click', () => closeDialog($('#winModal')));
$('#closeInstallButton').addEventListener('click', () => closeDialog($('#installModal')));
$('#soundButton').addEventListener('click', () => {
  soundOn = !soundOn;
  try { localStorage.setItem(SOUND_KEY, String(soundOn)); } catch { /* Storage is optional. */ }
  updateSoundButton();
  if (soundOn) playTone(650, 0.13);
});
document.querySelectorAll('[data-level]').forEach(btn => {
  btn.addEventListener('click', () => newGame(btn.dataset.level));
});
document.querySelectorAll('.modal-backdrop').forEach(modal => {
  modal.addEventListener('click', event => {
    if (event.target === modal) closeDialog(modal);
  });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    for (const dialog of document.querySelectorAll('.modal-backdrop:not([hidden])')) closeDialog(dialog);
  }
});
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
$('#installButton').addEventListener('click', async () => {
  if (deferredInstallPrompt) {
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    try { await prompt.prompt(); } catch { explainInstall(); }
  } else explainInstall();
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  $('#installButton').hidden = true;
});
if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
  $('#installButton').hidden = true;
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
updateSoundButton();
newGame('easy');
