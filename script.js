const rounds = [
  {
    category: "Crime and Criminals",
    correct: ["Burglar", "Robber", "Thief", "Detective", "Witness"],
    distractors: ["Airport", "Laptop", "Bottle", "Window", "Pasta", "Helmet", "River", "Teacher", "Camera", "Desk", "Shampoo"]
  },
  {
    category: "Social Media",
    correct: ["Post", "Follower", "Hashtag", "Comment", "Profile"],
    distractors: ["Airport", "Laptop", "Bottle", "Window", "Pasta", "Helmet", "River", "Teacher", "Camera", "Desk", "Shampoo"]
  },
  {
    category: "Technology",
    correct: ["Software", "Keyboard", "Screen", "Device", "Application"],
    distractors: ["Airport", "Bottle", "Window", "Pasta", "Helmet", "River", "Teacher", "Camera", "Desk", "Shampoo", "Banana"]
  },
  {
    category: "Healthy Habits",
    correct: ["Exercise", "Sleep", "Hydration", "Balanced diet", "Routine"],
    distractors: ["Airport", "Laptop", "Bottle", "Window", "Pasta", "Helmet", "River", "Teacher", "Camera", "Desk", "Shampoo"]
  },
  {
    category: "Airports and Flying",
    correct: ["Runway", "Passport", "Gate", "Luggage", "Boarding pass"],
    distractors: ["Laptop", "Bottle", "Window", "Pasta", "Helmet", "River", "Teacher", "Camera", "Desk", "Shampoo", "Banana"]
  }
];

const state = {
  deck: [...rounds],
  currentIndex: 0,
  score: 0,
  seconds: 45,
  roundLimit: rounds.length,
  timerId: null,
  playing: false,
  checked: false,
  selected: new Set()
};

const els = {
  totalScore: document.getElementById("totalScore"),
  bestScore: document.getElementById("bestScore"),
  secondsInput: document.getElementById("roundSeconds"),
  limitInput: document.getElementById("roundLimit"),
  promptText: document.getElementById("promptText"),
  roundCounter: document.getElementById("roundCounter"),
  timer: document.getElementById("timer"),
  statusText: document.getElementById("statusText"),
  selectedCounter: document.getElementById("selectedCounter"),
  feedbackText: document.getElementById("feedbackText"),
  wordGrid: document.getElementById("wordGrid"),
  tray: document.getElementById("categoryTray"),
  resultDialog: document.getElementById("resultDialog"),
  resultTitle: document.getElementById("resultTitle"),
  resultDetails: document.getElementById("resultDetails"),
  startGame: document.getElementById("startGame"),
  shuffleCards: document.getElementById("shuffleCards"),
  checkBtn: document.getElementById("checkBtn"),
  clearBtn: document.getElementById("clearBtn"),
  nextBtn: document.getElementById("nextBtn"),
  resetGame: document.getElementById("resetGame"),
  playAgain: document.getElementById("playAgain")
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function currentRound() {
  return state.deck[state.currentIndex] || state.deck[0];
}

function readSettings() {
  state.seconds = clamp(Number(els.secondsInput.value), 10, 120);
  state.roundLimit = clamp(Number(els.limitInput.value), 1, rounds.length);
  els.secondsInput.value = state.seconds;
  els.limitInput.value = state.roundLimit;
}

function renderScoreboard() {
  els.totalScore.textContent = state.score;
  els.bestScore.textContent = state.roundLimit * 5;
  els.statusText.textContent = state.playing ? "Choose exactly five words" : "Ready to play";
}

function renderTray() {
  els.tray.innerHTML = "";
  state.deck.slice(0, state.roundLimit).forEach((round, index) => {
    const pill = document.createElement("span");
    pill.className = `category-pill${index < state.currentIndex ? " used" : ""}`;
    pill.textContent = round.category;
    els.tray.appendChild(pill);
  });
}

function renderSelectionStatus() {
  els.selectedCounter.textContent = `${state.selected.size} / 5 selected`;
  els.checkBtn.disabled = state.selected.size !== 5 || state.checked || !state.playing;
  els.clearBtn.disabled = state.checked || !state.playing;
  els.nextBtn.disabled = !state.playing || !state.checked;
}

function renderRound() {
  const round = currentRound();
  const words = shuffle([...round.correct, ...round.distractors]);
  state.selected.clear();
  state.checked = false;

  els.promptText.textContent = round.category;
  els.roundCounter.textContent = `Round ${Math.min(state.currentIndex + 1, state.roundLimit)} / ${state.roundLimit}`;
  els.feedbackText.textContent = "Choose five words that belong to the category.";
  els.wordGrid.innerHTML = "";

  words.forEach(word => {
    const button = document.createElement("button");
    button.className = "word-tile";
    button.type = "button";
    button.textContent = word;
    button.dataset.word = word;
    button.addEventListener("click", () => toggleWord(button));
    els.wordGrid.appendChild(button);
  });

  renderTray();
  renderSelectionStatus();
}

function toggleWord(button) {
  if (!state.playing || state.checked) return;
  const word = button.dataset.word;

  if (state.selected.has(word)) {
    state.selected.delete(word);
    button.classList.remove("selected");
  } else if (state.selected.size < 5) {
    state.selected.add(word);
    button.classList.add("selected");
  } else {
    els.feedbackText.textContent = "You can only choose five words.";
  }

  if (state.selected.size < 5) {
    els.feedbackText.textContent = "Choose five words that belong to the category.";
  }
  renderSelectionStatus();
}

function startTimer() {
  clearInterval(state.timerId);
  let remaining = state.seconds;
  els.timer.textContent = remaining;
  els.timer.parentElement.classList.remove("warning");

  state.timerId = setInterval(() => {
    remaining -= 1;
    els.timer.textContent = remaining;
    els.timer.parentElement.classList.toggle("warning", remaining <= 5);
    if (remaining <= 0) {
      clearInterval(state.timerId);
      checkSelection();
    }
  }, 1000);
}

function startGame(shuffleDeck = true) {
  readSettings();
  state.deck = shuffleDeck ? shuffle(rounds) : [...state.deck];
  state.currentIndex = 0;
  state.score = 0;
  state.playing = true;
  els.resultDialog.close();
  renderScoreboard();
  renderRound();
  startTimer();
}

function checkSelection() {
  if (!state.playing || state.checked) return;
  clearInterval(state.timerId);
  state.checked = true;

  const round = currentRound();
  const correctSet = new Set(round.correct);
  let correctCount = 0;

  document.querySelectorAll(".word-tile").forEach(tile => {
    const word = tile.dataset.word;
    const isSelected = state.selected.has(word);
    const isCorrect = correctSet.has(word);

    tile.disabled = true;
    if (isCorrect) tile.classList.add("answer");
    if (isSelected && isCorrect) {
      tile.classList.add("right");
      correctCount += 1;
    }
    if (isSelected && !isCorrect) tile.classList.add("wrong");
  });

  state.score += correctCount;
  els.feedbackText.textContent = `You scored ${correctCount} out of 5.`;
  els.statusText.textContent = `${correctCount} / 5 this round`;
  renderScoreboard();
  els.statusText.textContent = `${correctCount} / 5 this round`;
  renderSelectionStatus();
}

function clearSelection() {
  if (state.checked || !state.playing) return;
  state.selected.clear();
  document.querySelectorAll(".word-tile").forEach(tile => tile.classList.remove("selected"));
  els.feedbackText.textContent = "Choose five words that belong to the category.";
  renderSelectionStatus();
}

function nextRound() {
  if (!state.checked && state.playing) return;
  state.currentIndex += 1;

  if (state.currentIndex >= state.roundLimit) {
    finishGame();
    return;
  }

  state.playing = true;
  renderScoreboard();
  renderRound();
  startTimer();
}

function finishGame() {
  state.playing = false;
  clearInterval(state.timerId);
  renderTray();
  renderSelectionStatus();

  const best = state.roundLimit * 5;
  els.resultTitle.textContent = state.score === best ? "Perfect score!" : "Final score";
  els.resultDetails.textContent = `${state.score} / ${best}`;
  els.resultDialog.showModal();
}

function resetGame() {
  clearInterval(state.timerId);
  state.deck = [...rounds];
  state.currentIndex = 0;
  state.score = 0;
  state.playing = false;
  state.checked = false;
  state.selected.clear();
  readSettings();
  renderScoreboard();
  renderRound();
  els.timer.textContent = state.seconds;
  els.timer.parentElement.classList.remove("warning");
}

els.startGame.addEventListener("click", () => startGame(true));
els.shuffleCards.addEventListener("click", () => {
  state.deck = shuffle(rounds);
  state.currentIndex = 0;
  renderRound();
});
els.checkBtn.addEventListener("click", checkSelection);
els.clearBtn.addEventListener("click", clearSelection);
els.nextBtn.addEventListener("click", nextRound);
els.resetGame.addEventListener("click", resetGame);
els.playAgain.addEventListener("click", () => startGame(true));
els.secondsInput.addEventListener("change", resetGame);
els.limitInput.addEventListener("change", resetGame);

resetGame();
