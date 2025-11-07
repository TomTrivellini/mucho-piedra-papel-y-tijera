window.$ = s => document.querySelector(s);

window.toast = function (msg, opts) {
  const bg =
    (opts && (opts.bg || opts.color || opts.background)) || undefined;

  Toastify({
    text: msg,
    gravity: "top",
    position: "right",
    close: true,

    style: bg ? { background: bg } : undefined
  }).showToast();
};


window.PHRASES = [];

window.setPhrases = arr => {
  if (Array.isArray(arr) && arr.length) window.PHRASES = arr;
};


window.getPhraseObj = (type, name) => {
  const list = (window.PHRASES || []).filter(x => x.type === type);
  const o = list.length ? list[(Math.random() * list.length) | 0] : null;
  return {
    text: (o?.text || defaultTextFor(type)).replace('{name}', name || 'Jugador'),
    color: o?.color
  };
};

function defaultTextFor(type){
  switch(type){
    case 'pointPlayer': return '¡Punto!';
    case 'pointCpu':    return 'CPU +1';
    case 'win':         return '¡Victoria!';
    case 'lose':        return 'Derrota...';
    case 'tie':         return 'Empate';
    case 'newPlayer':   return '{name} quiere reclamar la corona';
    case 'brrHistorial':return 'Historial borrado';
    default:            return '';
  }
}


window.ASSETS = {
  faces:{
    neutral:'style/assets/emotes/empate.png',
    happy:'style/assets/emotes/feliz.png',
    sad:'style/assets/emotes/triste.png',
    win:'style/assets/emotes/ganador.png',
    lose:'style/assets/emotes/perdedor.png',
    tie:'style/assets/emotes/empate.png'
  },
  cards:{
    PIEDRA:'style/assets/piedra.png',
    PAPEL:'style/assets/papel.png',
    TIJERA:'style/assets/tijeras.png',
    X:'style/assets/vacio.png'
  }
};


window.setFace = (imgEl, key)=>{
  if(imgEl) imgEl.src = ASSETS.faces[key] || ASSETS.faces.neutral;
};

window.setPick = (imgEl, sym)=>{
  if(imgEl) imgEl.src = sym ? ASSETS.cards[sym] : ASSETS.cards.X;
};

window.SFX = {
  beep: new Audio('style/assets/sounds/beep.wav'),
  music: new Audio(encodeURI('style/assets/sounds/Zambolino - Above The Sky (freetouse.com).mp3'))
};

SFX.beep.preload = 'auto';
SFX.music.preload = 'auto';
SFX.beep.volume = 1;
SFX.music.volume = 0.35;
SFX.music.loop = true;


window.toggleMusic = function () {
  const btn = document.getElementById('btnMusic');
  if (!btn) return;

  if (SFX.music.paused) {
    SFX.music.play().catch(()=>{});
    btn.textContent = '⏸'; 
    btn.setAttribute('aria-pressed', 'true');
  } else {
    SFX.music.pause();
    btn.textContent = '▶';
    btn.setAttribute('aria-pressed', 'false');
  }
};