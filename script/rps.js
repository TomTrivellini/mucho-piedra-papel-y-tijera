const getById = sel => document.getElementById(sel);

const PIEDRA = 'PIEDRA';
const PAPEL  = 'PAPEL';
const TIJERA = 'TIJERA';


const State = {
  playerName: 'Jugador',
  player: { hand: [], score: 0 },
  cpu:    { hand: [], score: 0 },
  gameActive:  false,
  roundActive: false,
  countdown:   null,
  timeLeft:    3
};


const elements = {
  playerName:  getById('playerName'),
  playerImg:   getById('playerImg'),  playerScore: getById('playerScore'), playerPick: getById('playerPick'),
  cpuImg:      getById('cpuImg'),     cpuScore:    getById('cpuScore'),    cpuPick:    getById('cpuPick'),
  cntPiedra:   getById('cntPiedra'),  cntPapel:    getById('cntPapel'),    cntTijera:  getById('cntTijera'),
  btnPiedra:   getById('btnPiedra'),  btnPapel:    getById('btnPapel'),    btnTijera:  getById('btnTijera'),
  btnStart:    getById('btnStart'),   btnReset:    getById('btnReset'),    btnContinue:getById('btnContinue'),
  timerText:   getById('timerText'),
  histDetails: getById('histDetails'), historyList: getById('historyList'), btnClearHistory: getById('btnClearHistory')
};


const count = hand => ({
  PIEDRA: hand.filter(x=>x===PIEDRA).length,
  PAPEL:  hand.filter(x=>x===PAPEL).length,
  TIJERA: hand.filter(x=>x===TIJERA).length
});
const consume  = (h,s) => { const i=h.indexOf(s); if(i>-1) h.splice(i,1); };
const rand     = h => h[(Math.random()*h.length)|0];
const judge    = (p,c)=> p===c ? 0
  : ((p===PIEDRA&&c===TIJERA)||(p===PAPEL&&c===PIEDRA)||(p===TIJERA&&c===PAPEL)) ? 1 : -1;
const fmtClock = s => `00:${String(s).padStart(2,'0')}`;


const snap = () => ({
  playerName: elements.playerName.value?.trim() || 'Jugador',
  player: State.player, cpu: State.cpu,
  gameActive: State.gameActive, roundActive: State.roundActive,
  timeLeft: State.timeLeft,
  incomplete: State.gameActive || State.roundActive
});
const hasSave = () => { const s = loadState(); return !!(s && s.incomplete); };

function updateCounts(){
  const pc = count(State.player.hand);
  elements.cntPiedra.textContent = pc.PIEDRA;
  elements.cntPapel.textContent  = pc.PAPEL;
  elements.cntTijera.textContent = pc.TIJERA;

  const on = State.roundActive;
  elements.btnPiedra.disabled = !on || pc.PIEDRA===0;
  elements.btnPapel.disabled  = !on || pc.PAPEL===0;
  elements.btnTijera.disabled = !on || pc.TIJERA===0;
}

function previewSavedCounts(){
  const s = loadState();
  if(!s || !s.incomplete || !s.player || !Array.isArray(s.player.hand)) return;


  const pc = count(s.player.hand);
  elements.cntPiedra.textContent = pc.PIEDRA;
  elements.cntPapel.textContent  = pc.PAPEL;
  elements.cntTijera.textContent = pc.TIJERA;


  elements.playerScore.textContent = (s.player && typeof s.player.score==='number') ? s.player.score : 0;
  elements.cpuScore.textContent    = (s.cpu    && typeof s.cpu.score==='number')    ? s.cpu.score    : 0;


  elements.btnPiedra.disabled = true;
  elements.btnPapel.disabled  = true;
  elements.btnTijera.disabled = true;


  if (typeof s.timeLeft === 'number')
    elements.timerText.textContent = fmtClock(Math.max(0, s.timeLeft));
}

function setControls(){
  const saved = hasSave();
  const canContinue = saved && !State.roundActive;

  if(saved && !State.gameActive){
    elements.btnStart.disabled    = true;    
    elements.btnContinue.disabled = !canContinue;
    elements.btnReset.disabled    = false;
  } else {
    elements.btnStart.disabled    = !!State.gameActive;
    elements.btnContinue.disabled = !canContinue;
    elements.btnReset.disabled    = !(State.gameActive || saved);
  }
  elements.playerName.disabled = !!State.gameActive;
}

function neutralBoard(){
  setPick(elements.playerPick,''); setPick(elements.cpuPick,'');
  setFace(elements.playerImg,'neutral'); setFace(elements.cpuImg,'neutral');
  elements.timerText.textContent = fmtClock(State.timeLeft);
}


function deck(){
  const d = [PIEDRA,PIEDRA,PIEDRA,PIEDRA, PAPEL,PAPEL,PAPEL,PAPEL, TIJERA,TIJERA,TIJERA,TIJERA];
  for(let i=d.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function deal(){
  const d=deck(), p=[], c=[];
  d.forEach((x,i)=>(i%2?p:c).push(x));
  State.player.hand=p; State.cpu.hand=c; State.player.score=0; State.cpu.score=0;
  elements.playerScore.textContent='0'; elements.cpuScore.textContent='0';
  State.timeLeft=3;
  neutralBoard(); updateCounts();
}


function startGame(){
  if(State.gameActive) return;
  deal();
  State.gameActive=true; State.roundActive=false;
  setControls(); saveState(snap()); startTurn(true);
}

function startTurn(resetTimer){
  if(!State.player.hand.length && !State.cpu.hand.length) return endGame();
  State.roundActive=true;
  if(resetTimer) State.timeLeft=3;
  neutralBoard(); updateCounts(); setControls(); runTick();
}

function runTick(){
  if(State.countdown) clearInterval(State.countdown);
  State.countdown = setInterval(()=>{
    State.timeLeft = Math.max(0, State.timeLeft-1);
    elements.timerText.textContent = fmtClock(State.timeLeft);

    if (State.timeLeft === 1) {
      try { SFX.beep.currentTime = 0; SFX.beep.play(); } catch(_){}
    }

    saveState(snap());
    if(State.timeLeft===0){
      clearInterval(State.countdown); State.countdown=null;
      onTimeout();
    }
  },1000);
}

function cpuChoose(){ const s=rand(State.cpu.hand); consume(State.cpu.hand,s); return s; }

function onTimeout(){
  if(State.player.hand.length){
    const i=(Math.random()*State.player.hand.length)|0;
    const x=State.player.hand.splice(i,1)[0];
    setPick(elements.playerPick, x);  
  }
  const c=cpuChoose(); setPick(elements.cpuPick, c);
  State.cpu.score++; elements.cpuScore.textContent=State.cpu.score;
  setFace(elements.cpuImg,'happy'); setFace(elements.playerImg,'sad');

  const o = getPhraseObj('pointCpu'); 
  toast(o.text, { bg:o.color });

  finishTurn();
}

function choose(sym){ 
  if(!State.roundActive || State.timeLeft<=0 || !State.player.hand.includes(sym)) return;

  consume(State.player.hand,sym); setPick(elements.playerPick, sym);
  const c=cpuChoose();            setPick(elements.cpuPick,   c);

  const r=judge(sym,c);
  if(r===1){
    State.player.score++; elements.playerScore.textContent=State.player.score;
    setFace(elements.playerImg,'happy'); setFace(elements.cpuImg,'sad');
    const o=getPhraseObj('pointPlayer', elements.playerName.value);
    toast(o.text, { bg:o.color });
  }else if(r===-1){
    State.cpu.score++; elements.cpuScore.textContent=State.cpu.score;
    setFace(elements.cpuImg,'happy'); setFace(elements.playerImg,'sad');
    const o=getPhraseObj('pointCpu');
    toast(o.text, { bg:o.color });
  }else{
    setFace(elements.playerImg,'tie'); setFace(elements.cpuImg,'tie');
    const o=getPhraseObj('tie');
    toast(o.text, { bg:o.color });
  }
  finishTurn();
}

function finishTurn(){
  State.roundActive=false;
  if(State.countdown){ clearInterval(State.countdown); State.countdown=null; }
  updateCounts(); saveState(snap());
  if(!State.player.hand.length && !State.cpu.hand.length) endGame();
  else setTimeout(()=>startTurn(true),700);
}

function endGame(){
  State.gameActive=false; State.roundActive=false;
  if(State.countdown){ clearInterval(State.countdown); State.countdown=null; }

  if(State.player.score>State.cpu.score){
    setFace(elements.playerImg,'win'); setFace(elements.cpuImg,'lose');
    const o = getPhraseObj('win', elements.playerName.value);
    toast(o.text || `Nuevo rey: ${elements.playerName.value||'Jugador'}`, { bg:o.color });
  }else if(State.cpu.score>State.player.score){
    setFace(elements.playerImg,'lose'); setFace(elements.cpuImg,'win');
    const o = getPhraseObj('lose', elements.playerName.value);
    toast(o.text || 'Nuevo rey: CPU', { bg:o.color });
  }else{
    setFace(elements.playerImg,'tie'); setFace(elements.cpuImg,'tie');
    elements.timerText.textContent='00:00';
    const o = getPhraseObj('tie', elements.playerName.value);
    toast(o.text || 'Empate', { bg:o.color });
  }


  pushHistorial({
    nombre: elements.playerName.value || 'Jugador',
    puntosJugador: State.player.score,
    puntosCpu: State.cpu.score,
    huyo: false
  });

  clearSaveState(); renderHistorial(); setControls();
}


function renderHistorial(){
  const arr = leerHistorial().slice().reverse();
  elements.historyList.innerHTML='';
  if(!arr.length){
    const li=document.createElement('li');
    li.textContent='juega conmigo.';
    elements.historyList.appendChild(li);
    return;
  }
  arr.forEach(e=>{
    const li=document.createElement('li');
    li.textContent = e.huyo ? `${e.nombre} huyó 🏃‍♂️💨`
                            : `${e.nombre} ${e.puntosJugador} — CPU ${e.puntosCpu}`;
    elements.historyList.appendChild(li);
  });
}


elements.btnStart.onclick = startGame;

elements.btnReset.onclick = ()=>{
  if(elements.btnReset.disabled) return;
  const nombre = elements.playerName.value || 'Jugador';
  toast(`${nombre} huyó`);
  pushHistorial({
    nombre,
    puntosJugador: State.player.score,
    puntosCpu: State.cpu.score,
    huyo: true
  });
  clearSaveState(); renderHistorial();
  if(State.countdown){ clearInterval(State.countdown); State.countdown=null; }
  State.gameActive=false; State.roundActive=false; State.timeLeft=3;
  elements.playerScore.textContent='0'; elements.cpuScore.textContent='0';
  neutralBoard(); updateCounts(); setControls();
};

elements.btnContinue.onclick = ()=>{
  if(elements.btnContinue.disabled) return;
  const s=loadState(); if(!s||!s.incomplete) return;

  State.playerName = s.playerName || 'Jugador';
  State.player     = s.player     || State.player;
  State.cpu        = s.cpu        || State.cpu;
  State.player.hand = Array.isArray(State.player.hand) ? State.player.hand : [];
  State.cpu.hand    = Array.isArray(State.cpu.hand) ? State.cpu.hand : [];

  State.gameActive = !!s.gameActive;
  State.roundActive= !!s.roundActive;
  State.timeLeft   = typeof s.timeLeft==='number' ? Math.max(0,s.timeLeft) : 3;

  elements.playerName.value = State.playerName;
  elements.playerScore.textContent = State.player.score;
  elements.cpuScore.textContent    = State.cpu.score;
  elements.timerText.textContent   = fmtClock(State.timeLeft);

  setControls(); updateCounts(); setPick(elements.playerPick,''), setPick(elements.cpuPick,'');
  if(!State.roundActive) startTurn(true); else { runTick(); };
};

elements.btnPiedra.onclick = ()=>choose(PIEDRA);
elements.btnPapel.onclick  = ()=>choose(PAPEL);
elements.btnTijera.onclick = ()=>choose(TIJERA);

elements.btnClearHistory.onclick = (ev)=>{
  ev.preventDefault(); ev.stopPropagation();
  borrarHistorial(); renderHistorial();
  const o = getPhraseObj('brrHistorial');
  toast(o.text, { bg:o.color });
  if(elements.histDetails && !elements.histDetails.open) elements.histDetails.open = true;
};


window.addEventListener('beforeunload', ()=>{ if(State.gameActive||State.roundActive) saveState(snap()); });


(function(){
  const savedName = cargarNombreJugador();
  if(savedName){ elements.playerName.value = savedName; State.playerName = savedName; }

  setPick(elements.playerPick,''); setPick(elements.cpuPick,'');   // “vacio.png”
  elements.timerText.textContent = fmtClock(State.timeLeft);

  setControls();
  if (hasSave() && !State.gameActive) previewSavedCounts();

  renderHistorial(); updateCounts();
})();


elements.playerName.addEventListener('change', ()=>{
  let max = elements.playerName.maxLength || 13;
  let n = elements.playerName.value.trim() || 'Jugador';
  if(n.length>max) n=n.slice(0,max);
  elements.playerName.value = n;
  if(n !== State.playerName){
    State.playerName = n;
    guardarNombreJugador(n);
    const o = getPhraseObj('newPlayer', n);
    toast(o.text, { bg:o.color });
  }
});


(async ()=>{
  try{
    const res = await fetch('script/phrases.json',{cache:'no-store'});
    if(!res.ok) throw new Error();
    const data = await res.json();
    setPhrases(data);
  }catch(_){
    toast('No se pudieron cargar las frases');
  }
})();
