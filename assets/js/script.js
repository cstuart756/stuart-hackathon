// script.js — Rock Paper Scissors Lizard Spock game logic with difficulty and simple pattern matching

const MOVES = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
const BEATS = {
  rock: ['scissors', 'lizard'],
  paper: ['rock', 'spock'],
  scissors: ['paper', 'lizard'],
  lizard: ['paper', 'spock'],
  spock: ['rock', 'scissors']
};

let playerScore = 0;
let computerScore = 0;
let roundsLeft = 10;
let maxRounds = 10;
let history = []; // {player, computer, result}

// Elements
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const roundsLeftEl = document.getElementById('roundsLeft');
const statusMessageEl = document.getElementById('statusMessage');
const roundResultEl = document.getElementById('roundResult');
const historyEl = document.getElementById('history');
const moveBtns = document.querySelectorAll('.move-btn');
const difficultyEl = document.getElementById('difficulty');
const maxRoundsEl = document.getElementById('maxRounds');
const maxRoundsLabel = document.getElementById('maxRoundsLabel');
const resetBtn = document.getElementById('resetBtn');
const gameOverCard = document.getElementById('gameOverCard');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverSummary = document.getElementById('gameOverSummary');
const playAgainBtn = document.getElementById('playAgainBtn');

// Initialize
function init() {
  playerScore = 0;
  computerScore = 0;
  history = [];
  maxRounds = parseInt(maxRoundsEl.value, 10) || 10;
  roundsLeft = maxRounds;
  updateUI();
  roundResultEl.textContent = 'No rounds yet.';
  historyEl.textContent = 'No history yet.';
  statusMessageEl.textContent = 'Choose your move to start';
  gameOverCard.classList.add('d-none');
}

function updateUI() {
  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;
  roundsLeftEl.textContent = roundsLeft;
  maxRoundsLabel.textContent = maxRounds;
}

// --- Difficulty logic ---
function computerChoose() {
  const difficulty = difficultyEl.value;
  if (difficulty === 'easy') return randomChoice();
  if (difficulty === 'medium') return mediumChoice();
  return hardChoice();
}

function randomChoice() {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

function mediumChoice() {
  // Bias towards beating player's most frequent move so far
  if (history.length === 0) return randomChoice();
  const freq = {};
  history.forEach(h => { f
