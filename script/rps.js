/* ===== Estado ===== */
const S={
  playerName:'Jugador',
  player:{hand:[],score:0},
  cpu:{hand:[],score:0},
  gameActive:false,
  roundActive:false,
  countdown:null,
  timeLeft:3
};

/* ===== Refs ===== */
const el={
  playerName:$('#playerName'),
  playerImg:$('#playerImg'), playerScore:$('#playerScore'), playerPick:$('#playerPick'),
  cpuImg:$('#cpuImg'), cpuScore:$('#cpuScore'), cpuPick:$('#cpuPick'),
  cntR:$('#cntR'), cntP:$('#cntP'), cntS:$('#cntS'),
  btnR:$('#btnR'), btnP:$('#btnP'), btnS:$('#btnS'),
  btnStart:$('#btnStart'), btnReset:$('#btnReset'), btnContinue:$('#btnContinue'),
  timer:$('#timer'), timerText:$('#timerText'), timerFace:$('#timerFace'),
  histDetails:$('#histDetails'), historyList:$('#historyList'), btnClearHistory:$('#btnClearHistory')
};

/* ===== Utils ===== */
const count=h=>({R:h.filter(x=>x==='R').length,P:h.filter(x=>x==='P').length,S:h.filter(x=>x==='S').length});
const consume=(h,s)=>{const i=h.indexOf(s); if(i>-1)h.splice(i,1);};
const rand=h=>h[(Math.random()*h.length)|0];
const judge=(p,c)=>p===c?0:((p==='R'&&c==='S')||(p==='P'&&c==='R')||(p==='S'&&c==='P'))?1:-1;
const fmtClock=s=>`00:${String(s).padStart(2,'0')}`;

/* ===== LS Snapshot ===== */
const snap=()=>({
  playerName: el.playerName.value?.trim() || 'Jugador',
  player:S.player, cpu:S.cpu,
  gameActive:S.gameActive, roundActive:S.roundActive,
  timeLeft:S.timeLeft,
  incomplete: S.gameActive || S.roundActive
});
const hasSave=()=>{ const s=loadState(); return !!(s && s.incomplete); };

/* ===== UI ===== */
function updateCounts(){
  const pc=count(S.player.hand);
  el.cntR.textContent=pc.R; el.cntP.textContent=pc.P; el.cntS.textContent=pc.S;
  const on=S.roundActive;
  el.btnR.disabled=!on||pc.R===0; el.btnP.disabled=!on||pc.P===0; el.btnS.disabled=!on||pc.S===0;
}
function setControls(){
  el.btnStart.disabled=!!S.gameActive;
  el.btnReset.disabled=!(S.gameActive||hasSave());
  el.btnContinue.disabled=!hasSave();
  el.playerName.disabled=!!S.gameActive;
}
function neutralBoard(){
  setPick(el.playerPick,''); setPick(el.cpuPick,'');
  setFace(el.playerImg,'neutral'); setFace(el.cpuImg,'neutral');
  el.timerFace.textContent='';                    /* limpiamos carita del contador */
  el.timerText.textContent=fmtClock(S.timeLeft);  /* mostramos 00:03 etc */
}

/* ===== Mazo ===== */
function deck(){
  const d=['R','R','R','R','P','P','P','P','S','S','S','S'];
  for(let i=d.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function deal(){
  const d=deck(),p=[],c=[];
  d.forEach((x,i)=>(i%2?p:c).push(x));
  S.player.hand=p; S.cpu.hand=c; S.player.score=0; S.cpu.score=0;
  el.playerScore.textContent='0'; el.cpuScore.textContent='0';
  S.timeLeft=3;
  neutralBoard(); updateCounts();
}

/* ===== Flujo ===== */
function startGame(){
  if(S.gameActive) return;
  try{
    deal();
    S.gameActive=true; S.roundActive=false;
    setControls(); saveState(snap()); startTurn(true);
  }catch(_){ toast('No se pudo iniciar la partida'); }
}
function startTurn(resetTimer){
  if(!S.player.hand.length && !S.cpu.hand.length) return endGame();
  S.roundActive=true;
  if(resetTimer) S.timeLeft=3;
  if(S.timeLeft<0) S.timeLeft=0;
  neutralBoard(); updateCounts(); setControls(); runTick();
}
function runTick(){
  if(S.countdown) clearInterval(S.countdown);
  S.countdown=setInterval(()=>{
    S.timeLeft=Math.max(0,S.timeLeft-1);
    el.timerText.textContent=fmtClock(S.timeLeft);
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
    setPick(el.playerPick,x);
  }
  const c=cpuChoose();
  setPick(el.cpuPick,c);

  S.cpu.score++; el.cpuScore.textContent=S.cpu.score;
  setFace(el.cpuImg,'happy'); setFace(el.playerImg,'sad');
  toast(getPhrase('lose'));
  finishTurn();
}
function choose(sym){
  if(!S.roundActive || S.timeLeft<=0) return;
  if(!S.player.hand.includes(sym)) return;

  consume(S.player.hand,sym);
  setPick(el.playerPick,sym);

  const c=cpuChoose();
  setPick(el.cpuPick,c);

  const r=judge(sym,c);
  if(r===1){
    S.player.score++; el.playerScore.textContent=S.player.score;
    setFace(el.playerImg,'happy'); setFace(el.cpuImg,'sad');
    toast(getPhrase('win', el.playerName.value));
  }else if(r===-1){
    S.cpu.score++; el.cpuScore.textContent=S.cpu.score;
    setFace(el.cpuImg,'happy'); setFace(el.playerImg,'sad');
    toast(getPhrase('lose'));
  }else{
    setFace(el.playerImg,'tie'); setFace(el.cpuImg,'tie');
    toast(getPhrase('tie'));
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
  if(S.countdown){ clearInterval(S.countown); S.countdown=null; }

  let msg;
  if(S.player.score>S.cpu.score){
    setFace(el.playerImg,'win'); setFace(el.cpuImg,'lose');
    el.timerFace.textContent='>:D';                 /* carita feliz en contador */
    msg='Nuevo rey: '+(el.playerName.value||'Jugador');
  }else if(S.cpu.score>S.player.score){
    setFace(el.playerImg,'lose'); setFace(el.cpuImg,'win');
    el.timerFace.textContent='>:(';                 /* carita triste en contador */
    msg='Nuevo rey: CPU';
  }else{
    setFace(el.playerImg,'tie'); setFace(el.cpuImg,'tie');
    el.timerText.textContent='00:00';              /* empate muestra 00:00 */
    el.timerFace.textContent='';                   /* sin carita en empate */
    msg='Empate';
  }

  toast(msg);
  pushHistory({ n:el.playerName.value||'Jugador', p:S.player.score, c:S.cpu.score });
  clearSaveState(); renderHistory(); setControls();
}

/* ===== Historial ===== */
function renderHistory(){
  const arr = readHistory().slice().reverse();
  el.historyList.innerHTML='';

  if(!arr.length){
    const li=document.createElement('li');
    li.textContent='Sin partidas todavía.';
    el.historyList.appendChild(li);
    return;
  }

  arr.forEach(e=>{
    const li=document.createElement('li');
    li.textContent=`[${fmtDate(e.ts)}] `+(e.h?`${e.n} huyó 🏃‍♂️💨`:`${e.n} ${e.p} — CPU ${e.c}`);
    el.historyList.appendChild(li);
  });
}

/* ===== Eventos ===== */
el.btnStart.onclick = startGame;
el.btnReset.onclick = ()=>{
  if(el.btnReset.disabled) return;
  toast(`${el.playerName.value||'Jugador'} huyó`);
  pushHistory({ n:el.playerName.value||'Jugador', p:S.player.score, c:S.cpu.score, h:true });
  clearSaveState(); renderHistory();
  if(S.countdown){ clearInterval(S.countdown); S.countdown=null; }
  S.gameActive=false; S.roundActive=false; S.timeLeft=3;
  el.playerScore.textContent='0'; el.cpuScore.textContent='0';
  neutralBoard(); updateCounts(); setControls();
};
el.btnContinue.onclick = ()=>{
  if(el.btnContinue.disabled) return;
  const s=loadState(); if(!s||!s.incomplete) return;
  S.playerName=s.playerName||'Jugador'; S.player=s.player||S.player; S.cpu=s.cpu||S.cpu;
  S.gameActive=!!s.gameActive; S.roundActive=!!s.roundActive;
  S.timeLeft=typeof s.timeLeft==='number'?Math.max(0,s.timeLeft):3;
  el.playerName.value=S.playerName;
  el.playerScore.textContent=S.player.score; el.cpuScore.textContent=S.cpu.score;
  el.timerFace.textContent='';
  el.timerText.textContent=fmtClock(S.timeLeft);
  setControls(); updateCounts(); setPick(el.playerPick,''); setPick(el.cpuPick,''); setFace(el.playerImg,'neutral'); setFace(el.cpuImg,'neutral');
  if(!S.roundActive) startTurn(true); else{ runTick(); }
};
el.btnR.onclick=()=>choose('R');
el.btnP.onclick=()=>choose('P');
el.btnS.onclick=()=>choose('S');
el.btnClearHistory.onclick=(ev)=>{
  ev.preventDefault(); ev.stopPropagation();
  try{ clearHistory(); renderHistory(); toast('Historial borrado'); }
  catch(_){ toast('No se pudo borrar'); }
  finally{ if(el.histDetails && !el.histDetails.open) el.histDetails.open=true; }
};

/* ===== Guardado al cerrar ===== */
window.addEventListener('beforeunload', ()=>{ if(S.gameActive||S.roundActive) saveState(snap()); });

/* ===== Frases desde JSON (try/catch/finally en fetch dentro de utils/storage) ===== */
(function(){
  (async ()=>{
    try{
      const res=await fetch('script/phrases.json',{cache:'no-store'});
      if(!res.ok) throw new Error();
      const data=await res.json();
      setPhrases(data); savePhrases(data);
    }catch(_){
      const cached=loadPhrases();
      if(cached) setPhrases(cached);
      else toast('Frases por defecto cargadas');
    }
  })();
})();

/* ===== Init ===== */
(function(){
  setPick(el.playerPick,''); setPick(el.cpuPick,'');
  setFace(el.playerImg,'neutral'); setFace(el.cpuImg,'neutral');
  el.timerText.textContent=fmtClock(S.timeLeft);
  el.timerFace.textContent='';
  renderHistory(); setControls(); updateCounts();
})();
