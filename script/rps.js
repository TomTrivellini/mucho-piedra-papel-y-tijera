//Helper 
const id = sel => document.getElementById(sel);

// constantes de juego (palabras)
const PIEDRA = 'PIEDRA';
const PAPEL  = 'PAPEL';
const TIJERA = 'TIJERA';

// normalizadores (para pintar assets que usan R/P/S)
const toKey = w => (w===PIEDRA?'R' : w===PAPEL?'P' : w===TIJERA?'S' : null);
const normalizeHand = arr => Array.isArray(arr) ? arr.map(x=>{
  if (x==='R') return PIEDRA; if (x==='P') return PAPEL; if (x==='S') return TIJERA;
  return (x===PIEDRA||x===PAPEL||x===TIJERA) ? x : null;
}).filter(Boolean) : [];

// memoria
const S = {
  playerName: 'Jugador',
  player: { hand: [], score: 0 },
  cpu:    { hand: [], score: 0 },
  gameActive:  false,
  roundActive: false,
  countdown:   null,
  timeLeft:    3
};

// DOM
const el = {
  playerName:  id('playerName'),
  playerImg:   id('playerImg'),  playerScore: id('playerScore'), playerPick: id('playerPick'),
  cpuImg:      id('cpuImg'),     cpuScore:    id('cpuScore'),    cpuPick:    id('cpuPick'),
  cntPiedra:   id('cntPiedra'),  cntPapel:    id('cntPapel'),    cntTijera:  id('cntTijera'),
  btnPiedra:   id('btnPiedra'),  btnPapel:    id('btnPapel'),    btnTijera:  id('btnTijera'),
  btnStart:    id('btnStart'),   btnReset:    id('btnReset'),    btnContinue:id('btnContinue'),
  timerText:   id('timerText'),
  histDetails: id('histDetails'), historyList: id('historyList'), btnClearHistory: id('btnClearHistory')
};

// util
const count = hand => {
  const h = normalizeHand(hand);
  return {
    PIEDRA: h.filter(x=>x===PIEDRA).length,
    PAPEL:  h.filter(x=>x===PAPEL).length,
    TIJERA: h.filter(x=>x===TIJERA).length
  };
};
const consume  = (h,s) => { const i=h.indexOf(s); if(i>-1) h.splice(i,1); };
const rand     = h => h[(Math.random()*h.length)|0];
const judge    = (p,c)=> p===c ? 0
  : ((p===PIEDRA&&c===TIJERA)||(p===PAPEL&&c===PIEDRA)||(p===TIJERA&&c===PAPEL)) ? 1 : -1;
const fmtClock = s => `00:${String(s).padStart(2,'0')}`;

// snapshot y carga
const snap = () => ({
  playerName: el.playerName.value?.trim() || 'Jugador',
  player: S.player, cpu: S.cpu,
  gameActive: S.gameActive, roundActive: S.roundActive,
  timeLeft: S.timeLeft,
  incomplete: S.gameActive || S.roundActive
});
const hasSave = () => { const s = loadState(); return !!(s && s.incomplete); };

//ui
function updateCounts(){
  const pc = count(S.player.hand);
  el.cntPiedra.textContent = pc.PIEDRA;
  el.cntPapel.textContent  = pc.PAPEL;
  el.cntTijera.textContent = pc.TIJERA;

  const on = S.roundActive;
  el.btnPiedra.disabled = !on || pc.PIEDRA===0;
  el.btnPapel.disabled  = !on || pc.PAPEL===0;
  el.btnTijera.disabled = !on || pc.TIJERA===0;
}

function previewSavedCounts(){
  const s = loadState();
  if(!s || !s.incomplete || !s.player || !Array.isArray(s.player.hand)) return;

  // contadores desde el SAVE (sin tocar S)
  const pc = count(s.player.hand);
  el.cntPiedra.textContent = pc.PIEDRA;
  el.cntPapel.textContent  = pc.PAPEL;
  el.cntTijera.textContent = pc.TIJERA;

  // puntajes actuales del SAVE
  el.playerScore.textContent = (s.player && typeof s.player.score==='number') ? s.player.score : 0;
  el.cpuScore.textContent    = (s.cpu    && typeof s.cpu.score==='number')    ? s.cpu.score    : 0;

  // elecciones bloqueadas hasta continuar
  el.btnPiedra.disabled = true;
  el.btnPapel.disabled  = true;
  el.btnTijera.disabled = true;

  // reloj con tiempo restante real
  if (typeof s.timeLeft === 'number')
    el.timerText.textContent = fmtClock(Math.max(0, s.timeLeft));
}

function setControls(){
  const saved = hasSave();

  if(saved && !S.gameActive){
    el.btnStart.disabled    = true;    // hay SAVE → no Repartir
    el.btnContinue.disabled = false;
    el.btnReset.disabled    = false;
  } else {
    el.btnStart.disabled    = !!S.gameActive;
    el.btnContinue.disabled = !saved;
    el.btnReset.disabled    = !(S.gameActive || saved);
  }
  el.playerName.disabled = !!S.gameActive;
}

function neutralBoard(){
  setPick(el.playerPick,''); setPick(el.cpuPick,'');
  setFace(el.playerImg,'neutral'); setFace(el.cpuImg,'neutral');
  el.timerText.textContent = fmtClock(S.timeLeft);
}

// mazo y reparto
function deck(){
  const d = [PIEDRA,PIEDRA,PIEDRA,PIEDRA, PAPEL,PAPEL,PAPEL,PAPEL, TIJERA,TIJERA,TIJERA,TIJERA];
  for(let i=d.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function deal(){
  const d=deck(), p=[], c=[];
  d.forEach((x,i)=>(i%2?p:c).push(x));
  S.player.hand=p; S.cpu.hand=c; S.player.score=0; S.cpu.score=0;
  el.playerScore.textContent='0'; el.cpuScore.textContent='0';
  S.timeLeft=3;
  neutralBoard(); updateCounts();
}

// juego
function startGame(){
  if(S.gameActive) return;
  deal();
  S.gameActive=true; S.roundActive=false;
  setControls(); saveState(snap()); startTurn(true);
}

function startTurn(resetTimer){
  if(!S.player.hand.length && !S.cpu.hand.length) return endGame();
  S.roundActive=true;
  if(resetTimer) S.timeLeft=3;
  neutralBoard(); updateCounts(); setControls(); runTick();
}

function runTick(){
  if(S.countdown) clearInterval(S.countdown);
  S.countdown = setInterval(()=>{
    S.timeLeft = Math.max(0, S.timeLeft-1);
    el.timerText.textContent = fmtClock(S.timeLeft);

    if (S.timeLeft === 1) {
      try { SFX.beep.currentTime = 0; SFX.beep.play(); } catch(_){}
    }

    saveState(snap());
    if(S.timeLeft===0){
      clearInterval(S.countdown); S.countdown=null;
      onTimeout();
    }
  },1000);
}

function cpuChoose(){ const s=rand(S.cpu.hand); consume(S.cpu.hand,s); return s; }

function onTimeout(){
  if(S.player.hand.length){
    const i=(Math.random()*S.player.hand.length)|0;
    const x=S.player.hand.splice(i,1)[0];
    setPick(el.playerPick, toKey(x));  // assets usan R/P/S
  }
  const c=cpuChoose(); setPick(el.cpuPick, toKey(c));
  S.cpu.score++; el.cpuScore.textContent=S.cpu.score;
  setFace(el.cpuImg,'happy'); setFace(el.playerImg,'sad');

  const o = getPhraseObj('pointCpu'); 
  toast(o.text, { bg:o.color });

  finishTurn();
}

function choose(sym){ // sym = PIEDRA/PAPEL/TIJERA
  if(!S.roundActive || S.timeLeft<=0 || !S.player.hand.includes(sym)) return;

  consume(S.player.hand,sym); setPick(el.playerPick, toKey(sym));
  const c=cpuChoose();        setPick(el.cpuPick,   toKey(c));

  const r=judge(sym,c);
  if(r===1){
    S.player.score++; el.playerScore.textContent=S.player.score;
    setFace(el.playerImg,'happy'); setFace(el.cpuImg,'sad');
    const o=getPhraseObj('pointPlayer', el.playerName.value);
    toast(o.text, { bg:o.color });
  }else if(r===-1){
    S.cpu.score++; el.cpuScore.textContent=S.cpu.score;
    setFace(el.cpuImg,'happy'); setFace(el.playerImg,'sad');
    const o=getPhraseObj('pointCpu');
    toast(o.text, { bg:o.color });
  }else{
    setFace(el.playerImg,'tie'); setFace(el.cpuImg,'tie');
    const o=getPhraseObj('tie');
    toast(o.text, { bg:o.color });
  }
  finishTurn();
}

function finishTurn(){
  S.roundActive=false;
  if(S.countdown){ clearInterval(S.countdown); S.countdown=null; }
  updateCounts(); saveState(snap());
  if(!S.player.hand.length && !S.cpu.hand.length) endGame();
  else setTimeout(()=>startTurn(true),700);
}

function endGame(){
  S.gameActive=false; S.roundActive=false;
  if(S.countdown){ clearInterval(S.countdown); S.countdown=null; }

  if(S.player.score>S.cpu.score){
    setFace(el.playerImg,'win'); setFace(el.cpuImg,'lose');
    const o = getPhraseObj('win', el.playerName.value);
    toast(o.text || `Nuevo rey: ${el.playerName.value||'Jugador'}`, { bg:o.color });
  }else if(S.cpu.score>S.player.score){
    setFace(el.playerImg,'lose'); setFace(el.cpuImg,'win');
    const o = getPhraseObj('lose', el.playerName.value);
    toast(o.text || 'Nuevo rey: CPU', { bg:o.color });
  }else{
    setFace(el.playerImg,'tie'); setFace(el.cpuImg,'tie');
    el.timerText.textContent='00:00';
    const o = getPhraseObj('tie', el.playerName.value);
    toast(o.text || 'Empate', { bg:o.color });
  }

  // Registrar resultado en historial
  pushHistorial({
    nombre: el.playerName.value || 'Jugador',
    puntosJugador: S.player.score,
    puntosCpu: S.cpu.score,
    huyo: false
  });

  clearSaveState(); renderHistorial(); setControls();
}

//render historial
function renderHistorial(){
  const arr = leerHistorial().slice().reverse();
  el.historyList.innerHTML='';
  if(!arr.length){
    const li=document.createElement('li');
    li.textContent='Sin partidas todavía.';
    el.historyList.appendChild(li);
    return;
  }
  arr.forEach(e=>{
    const li=document.createElement('li');
    li.textContent = `[${formatearFecha(e.ts)}] ` +
                    (e.huyo ? `${e.nombre} huyó 🏃‍♂️💨`
                            : `${e.nombre} ${e.puntosJugador} — CPU ${e.puntosCpu}`);
    el.historyList.appendChild(li);
  });
}

//eventos
el.btnStart.onclick = startGame;

el.btnReset.onclick = ()=>{
  if(el.btnReset.disabled) return;
  const nombre = el.playerName.value || 'Jugador';
  toast(`${nombre} huyó`);
  pushHistorial({
    nombre,
    puntosJugador: S.player.score,
    puntosCpu: S.cpu.score,
    huyo: true
  });
  clearSaveState(); renderHistorial();
  if(S.countdown){ clearInterval(S.countdown); S.countdown=null; }
  S.gameActive=false; S.roundActive=false; S.timeLeft=3;
  el.playerScore.textContent='0'; el.cpuScore.textContent='0';
  neutralBoard(); updateCounts(); setControls();
};

el.btnContinue.onclick = ()=>{
  if(el.btnContinue.disabled) return;
  const s=loadState(); if(!s||!s.incomplete) return;

  S.playerName = s.playerName || 'Jugador';
  S.player     = s.player     || S.player;
  S.cpu        = s.cpu        || S.cpu;
  S.player.hand = normalizeHand(S.player.hand);
  S.cpu.hand    = normalizeHand(S.cpu.hand);

  S.gameActive = !!s.gameActive;
  S.roundActive= !!s.roundActive;
  S.timeLeft   = typeof s.timeLeft==='number' ? Math.max(0,s.timeLeft) : 3;

  el.playerName.value = S.playerName;
  el.playerScore.textContent = S.player.score;
  el.cpuScore.textContent    = S.cpu.score;
  el.timerText.textContent   = fmtClock(S.timeLeft);

  setControls(); updateCounts(); setPick(el.playerPick,''), setPick(el.cpuPick,'');
  if(!S.roundActive) startTurn(true); else { runTick(); }
};

el.btnPiedra.onclick = ()=>choose(PIEDRA);
el.btnPapel.onclick  = ()=>choose(PAPEL);
el.btnTijera.onclick = ()=>choose(TIJERA);

el.btnClearHistory.onclick = (ev)=>{
  ev.preventDefault(); ev.stopPropagation();
  borrarHistorial(); renderHistorial();
  const o = getPhraseObj('brrHistorial');
  toast(o.text, { bg:o.color });
  if(el.histDetails && !el.histDetails.open) el.histDetails.open = true;
};

// guardar al cerrar
window.addEventListener('beforeunload', ()=>{ if(S.gameActive||S.roundActive) saveState(snap()); });

//inicialización
(function(){
  const savedName = cargarNombreJugador();
  if(savedName){ el.playerName.value = savedName; S.playerName = savedName; }

  setPick(el.playerPick,''); setPick(el.cpuPick,'');   // “vacio.png”
  el.timerText.textContent = fmtClock(S.timeLeft);

  setControls();
  if (hasSave() && !S.gameActive) previewSavedCounts();

  renderHistorial(); updateCounts();
})();

//cambio de nombre 
el.playerName.addEventListener('change', ()=>{
  let max = el.playerName.maxLength || 20;
  let n = el.playerName.value.trim() || 'Jugador';
  if(n.length>max) n=n.slice(0,max);
  el.playerName.value = n;
  if(n !== S.playerName){
    S.playerName = n;
    guardarNombreJugador(n);
    const o = getPhraseObj('newPlayer', n);
    toast(o.text, { bg:o.color });
  }
});

//Frases de JSON 
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
