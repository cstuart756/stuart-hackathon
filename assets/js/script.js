// script.js — RPSLS game logic with difficulty and simple pattern matching


const MOVES = ['rock','paper','scissors','lizard','spock'];
const BEATS = {
rock: ['scissors','lizard'],
paper: ['rock','spock'],
scissors: ['paper','lizard'],
lizard: ['paper','spock'],
spock: ['rock','scissors']
};


let playerScore = 0, computerScore = 0, roundsLeft = 10, maxRounds = 10;
let history = []; // {player, computer, result}


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


function init() {
playerScore = 0; computerScore = 0; history = [];
maxRounds = parseInt(maxRoundsEl.value,10) || 10;
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


// Difficulty strategies
function computerChoose() {
const difficulty = difficultyEl.value;
if (difficulty === 'easy') return randomChoice();
if (difficulty === 'medium') return mediumChoice();
return hardChoice();
}


function randomChoice() { return MOVES[Math.floor(Math.random()*MOVES.length)]; }


function mediumChoice() {
// bias towards beating player's most frequent move so far
if (history.length === 0) return randomChoice();
const freq = {};
history.forEach(h => { freq[h.player] = (freq[h.player]||0)+1; });
const most = Object.keys(freq).reduce((a,b)=> freq[a]>=freq[b]?a:b);
// choose a move that beats the most frequent
const counters = MOVES.filter(m => BEATS[m].includes(most));
return counters.length? counters[Math.floor(Math.random()*counters.length)] : randomChoice();
}


function predictPlayerNext() {
// simple pattern detection: if player repeated last two moves, predict same; if cycle of length 3 detect simple cycle
if (history.length >= 2) {
const last = history[history.length-1].player;
const prev = history[history.length-2].player;
if (last === prev) return last; // repeating
}
if (history.length >= 3) {
const a = history[history.length-3].player;
const b = history[history.length-2].player;
const c = history[history.length-1].player;
// detect simple rotation a->b->c and predict next as a
if (a !== b && b !== c && c !== a) return a;
}
// fallback to most frequent
const freq = {};
if (player === computer) return 'draw';