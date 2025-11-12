/* main.js — game logic using Phaser and DOM integration */


// Game rules
const CHOICES = ['rock','paper','scissors','lizard','spock'];
const WINS = {
rock: ['scissors','lizard'],
paper: ['rock','spock'],
scissors: ['paper','lizard'],
lizard: ['paper','spock'],
spock: ['rock','scissors']
};


// State
let state = {
playerScore: 0,
computerScore: 0,
roundsPlayed: 0,
roundsMax: 10,
history: [], // {player, computer, result}
difficulty: 'normal'
};


// Persistence
function saveState(){ localStorage.setItem('rpsls_state', JSON.stringify(state)); }
function loadState(){
const s = localStorage.getItem('rpsls_state');
if(s) Object.assign(state, JSON.parse(s));
}


loadState();


document.addEventListener('DOMContentLoaded', ()=>{
// DOM refs
const buttons = document.querySelectorAll('.choice-btn');
const msg = document.getElementById('message');
const scoreP = document.getElementById('score-player');
const scoreC = document.getElementById('score-computer');
const roundsPlayed = document.getElementById('rounds-played');
const roundsMax = document.getElementById('rounds-max');
const historyList = document.getElementById('history');
const restartBtn = document.getElementById('restart-btn');
const difficulty = document.getElementById('difficulty');


roundsMax.textContent = state.roundsMax;
difficulty.value = state.difficulty;


function refreshUI(){
scoreP.textContent = state.playerScore;
scoreC.textContent = state.computerScore;
roundsPlayed.textContent = state.roundsPlayed;
// history
historyList.innerHTML = '';
state.history.slice().reverse().forEach(h => {
const li = document.createElement('li');
li.textContent = `You: ${h.player} — Comp: ${h.computer} → ${h.result}`;
historyList.appendChild(li);
});
}


function determineWinner(player, computer){
if(player===computer) return 'draw';
if(WINS[player].includes(computer)) return 'player';
return 'computer';
}
create: cre