/*
  Phaser 3 single-scene implementation for RPSLS+ (6-choice cyclic rules).
  - Responsive canvas inside #game-container
  - Buttons generated for each choice, with inline SVG avatars as textures
  - Difficulty: easy (random), medium (some pattern matching), hard (adaptive)
  - Score, rounds, tries-left, limited number of tries
  - Session log generation
*/

(() => {
  // Choices — we include 6 options (user asked for "rock, paper, scissor, stone, lizard and spock")
  const CHOICES = [
    { id: 'rock', label: 'Rock', color: 0x8b5a2b },
    { id: 'paper', label: 'Paper', color: 0xffffff },
    { id: 'scissors', label: 'Scissors', color: 0xc0c0c0 },
    { id: 'lizard', label: 'Lizard', color: 0x4caf50 },
    { id: 'spock', label: 'Spock', color: 0x2196f3 },
    { id: 'stone', label: 'Stone', color: 0x6e6e6e }
  ];

  // For a fair 6-item game, use cyclical beats: each item beats next two
  // build a mapping: winsAgainst[id] = [id1,id2]
  const winsAgainst = {};
  for (let i=0;i<CHOICES.length;i++){
    const id = CHOICES[i].id;
    const beats = [CHOICES[(i+1)%6].id, CHOICES[(i+2)%6].id];
    winsAgainst[id] = beats;
  }

  // Utility
  function randInt(n){ return Math.floor(Math.random()*n); }

  // Game state
  let state = {
    round: 0,
    maxRounds: 10,
    triesLeft: 10,
    playerScore: 0,
    aiScore: 0,
    ties: 0,
    difficulty: 'easy',
    history: [], // {player,ai,result}
    sessionLog: []
  };

  // DOM elements
  const dom = {
    controls: document.getElementById('controls'),
    round: document.getElementById('round'),
    maxRounds: document.getElementById('maxRounds'),
    triesLeft: document.getElementById('triesLeft'),
    playerScore: document.getElementById('playerScore'),
    aiScore: document.getElementById('aiScore'),
    ties: document.getElementById('ties'),
    restartBtn: document.getElementById('restartBtn'),
    downloadLog: document.getElementById('downloadLog'),
    diffEasy: document.getElementById('diff-easy'),
    diffMedium: document.getElementById('diff-medium'),
    diffHard: document.getElementById('diff-hard'),
    contrastToggle: document.getElementById('contrastToggle'),
    gameContainer: document.getElementById('game-container'),
    maxRoundsText: document.getElementById('maxRounds')
  };

  dom.maxRounds.textContent = state.maxRounds;

  // Add choice buttons
  CHOICES.forEach(ch => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-dark choice-btn';
    btn.setAttribute('aria-label', `Choose ${ch.label}`);
    btn.innerHTML = `${avatarSvg(ch.label)} <span class="ms-1">${ch.label}</span>`;
    btn.onclick = () => onPlayerChoice(ch.id);
    btn.onkeyup = (e) => { if(e.key === 'Enter') onPlayerChoice(ch.id); };
    dom.controls.appendChild(btn);
  });

  // Difficulty toggles
  function setDifficulty(d){
    state.difficulty = d;
    dom.diffEasy.classList.toggle('active', d==='easy');
    dom.diffMedium.classList.toggle('active', d==='medium');
    dom.diffHard.classList.toggle('active', d==='hard');
  }
  dom.diffEasy.addEventListener('click', ()=>setDifficulty('easy'));
  dom.diffMedium.addEventListener('click', ()=>setDifficulty('medium'));
  dom.diffHard.addEventListener('click', ()=>setDifficulty('hard'));

  // Contrast toggle
  dom.contrastToggle.addEventListener('change', (e)=>{
    document.body.classList.toggle('high-contrast', e.target.checked);
  });

  dom.restartBtn.addEventListener('click', ()=>resetGame());
  dom.downloadLog.addEventListener('click', ()=>downloadLog());

  // Build Phaser game
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 900,
    height: 420,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#0f1720',
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  const game = new Phaser.Game(config);
  let sceneRef;

  function preload(){
    sceneRef = this;

    // Create textures from inline svg data for each avatar
    CHOICES.forEach(ch => {
      const svg = makeAvatarSVG(ch.label, ch.color);
      this.textures.addBase64(ch.id, svg);
    });

    // small particle for animations
    this.load.image('spark', generateCircleBase64(8, '#fff'));
  }

  function create(){
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // friendly label
    this.add.text(18, 12, 'Player', { fontSize: '18px', fill: '#ffffff' });
    this.add.text(this.scale.width-90, 12, 'Computer', { fontSize: '18px', fill: '#ffffff' });

    // placeholders for selected avatars
    this.playerSprite = this.add.sprite(160, centerY, 'rock').setScale(1.2);
    this.aiSprite = this.add.sprite(this.scale.width-160, centerY, 'spock').setScale(1.2);

    // result text
    this.resultText = this.add.text(centerX, centerY+120, '', { fontSize: '20px', fill:'#fff' }).setOrigin(0.5);

    // small confetti emitter
    this.particles = this.add.particles('spark');
    this.emitter = this.particles.createEmitter({
      x: centerX, y: centerY-40, speed: {min: 100, max:300}, angle: {min:0,max:360}, quantity:0,
      lifespan: 700, scale: {start:1, end:0}, gravityY: 400
    });
  }

  function update(){ /* nothing continuous */ }

  // Player action handler
  function onPlayerChoice(playerChoice){
    if(state.triesLeft <= 0 || state.round >= state.maxRounds){
      alert('Game over — restart to play again.');
      return;
    }

    const aiChoice = aiDecision();
    const result = evaluateRound(playerChoice, aiChoice);

    // animate
    animateRound(playerChoice, aiChoice, result);

    // update stats
    state.round++;
    state.triesLeft--;
    if(result === 'win') state.playerScore++;
    else if(result === 'lose') state.aiScore++;
    else state.ties++;

    const entry = { round: state.round, player: playerChoice, ai: aiChoice, result, time: new Date().toISOString() };
    state.history.push(entry);
    state.sessionLog.push(entry);

    // update DOM
    dom.round.textContent = state.round;
    dom.triesLeft.textContent = state.triesLeft;
    dom.playerScore.textContent = state.playerScore;
    dom.aiScore.textContent = state.aiScore;
    dom.ties.textContent = state.ties;

    // End condition
    if(state.triesLeft === 0 || state.round >= state.maxRounds){
      setTimeout(()=> {
        endGameSummary();
      }, 900);
    }
  }

  // Evaluate result using winsAgainst mapping
  function evaluateRound(player, ai){
    if(player === ai) return 'tie';
    if( winsAgainst[player].includes(ai) ) return 'win';
    return 'lose';
  }

  // AI decision logic by difficulty
  function aiDecision(){
    if(state.difficulty === 'easy') {
      return CHOICES[randInt(CHOICES.length)].id;
    } else if(state.difficulty === 'medium'){
      // 60% random, 40% try to counter player's most frequent choice
      if(Math.random() < 0.6) return CHOICES[randInt(CHOICES.length)].id;
      const freq = freqPlayerChoice();
      if(!freq) return CHOICES[randInt(CHOICES.length)].id;
      // choose one that beats the player's most frequent
      const target = freq.choice;
      // pick randomly among choices that beat 'target'
      const counters = Object.keys(winsAgainst).filter(k => winsAgainst[k].includes(target));
      return counters[randInt(counters.length)];
    } else {
      // hard: pattern matching — look for last 3-player choices; if player repeated, pick counter
      const h = state.history.slice(-6).map(s=>s.player);
      if(h.length >= 3){
        const last = h.slice(-3);
        if(last.every(x => x === last[0])) {
          // player repeated last[0], so pick a counter
          const counters = Object.keys(winsAgainst).filter(k => winsAgainst[k].includes(last[0]));
          return counters[randInt(counters.length)];
        }
        // otherwise predict next by cycle (simple heuristic): find last in CHOICES order and pick its counter
        const lastChoice = last[last.length-1];
        const idx = CHOICES.findIndex(c=>c.id===lastChoice);
        if(idx !== -1){
          const predicted = CHOICES[(idx+1)%CHOICES.length].id;
          const counters = Object.keys(winsAgainst).filter(k => winsAgainst[k].includes(predicted));
          return counters[randInt(counters.length)];
        }
      }
      // fallback: choose an item that on average performs well: pick a random, slightly weighted
      const r = Math.random();
      if(r < 0.2) return CHOICES[0].id;
      if(r < 0.6) return CHOICES[2].id;
      return CHOICES[4].id;
    }
  }

  // Frequency of player choices
  function freqPlayerChoice(){
    if(state.history.length === 0) return null;
    const counts = {};
    state.history.forEach(h => counts[h.player] = (counts[h.player]||0)+1);
    let best = null, max=0;
    for(const k in counts){ if(counts[k] > max){ max = counts[k]; best=k; } }
    return { choice: best, count: max };
  }

  function animateRound(playerChoice, aiChoice, result){
    const s = sceneRef;
    // update sprites
    s.playerSprite.setTexture(playerChoice);
    s.aiSprite.setTexture(aiChoice);

    // wiggle animation and flash result
    s.tweens.add({
      targets: [s.playerSprite],
      x: 120,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
    s.tweens.add({
      targets: [s.aiSprite],
      x: s.scale.width-120,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    s.resultText.setText(result === 'win' ? 'You win!' : result === 'lose' ? 'You lose' : 'Tie');

    // particle burst for win
    if(result === 'win') {
      s.emitter.setPosition(s.scale.width/2, s.scale.height/2 - 20);
      s.emitter.explode(30);
    } else if(result === 'lose') {
      // small shake
      s.cameras.main.shake(200, 0.01);
    }
  }

  function endGameSummary(){
    let msg = `Game Over — Final: You ${state.playerScore} - Computer ${state.aiScore} (Ties ${state.ties}).`;
    alert(msg);
  }

  function resetGame(){
    state.round = 0; state.triesLeft = 10;
    state.playerScore = 0; state.aiScore = 0; state.ties = 0;
    state.history = []; state.sessionLog = [];
    dom.round.textContent = state.round;
    dom.triesLeft.textContent = state.triesLeft;
    dom.playerScore.textContent = state.playerScore;
    dom.aiScore.textContent = state.aiScore;
    dom.ties.textContent = state.ties;
  }

  function downloadLog(){
    const blob = new Blob([JSON.stringify(state.sessionLog, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpsls_session_${(new Date()).toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* Utilities to draw inline SVG avatars as data:URIs */
  function makeAvatarSVG(label, color){
    // Minimal circle + label; Phaser supports data-urls for images (base64)
    const bg = colorToHex(color);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
      <rect width='100%' height='100%' rx='20' fill='${bg}' />
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='#111'>${escapeXml(label[0]||'')}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  function avatarSvg(label){
    // small inline SVG for button (not base64)
    const c = { rock:'#8b5a2b', paper:'#ffffff', scissors:'#c0c0c0', lizard:'#4caf50', spock:'#2196f3', stone:'#6e6e6e' }[label.toLowerCase()] || '#ccc';
    return `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">
      <rect rx="14" width="100" height="100" fill="${c}"></rect>
      <text x="50" y="55" font-size="40" text-anchor="middle" fill="${isDark(c)?'#fff':'#000'}" font-family="Arial">${label[0]}</text>
    </svg>`;
  }

  function generateCircleBase64(radius, color){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${radius*2}' height='${radius*2}'>
      <circle cx='${radius}' cy='${radius}' r='${radius}' fill='${color}'/>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  function colorToHex(c){
    if(typeof c === 'number') return '#' + c.toString(16).padStart(6,'0');
    return c;
  }
  function escapeXml(s){ return s.replace(/[<>&'"]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]; });}
  function isDark(hex){
    // simple luminance
    hex = hex.replace('#','');
    const r = parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
    const l = 0.2126*r + 0.7152*g + 0.0722*b;
    return l < 140;
  }

  // export minimal API for tests (optional)
  window.RPSLSPlus = { state, winsAgainst, CHOICES, resetGame, evaluateRound };

})();
