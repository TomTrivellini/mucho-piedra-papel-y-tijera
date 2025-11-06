/* selector corto */
window.$ = s => document.querySelector(s);

/* toast: usa Toastify si está; si no, fallback DOM (sin console) */
(function(){
  function fallbackToast(msg){
    const t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;top:12px;right:12px;background:#111;color:#fff;padding:10px 12px;border-radius:10px;font:600 13px/1.2 system-ui;z-index:9999;opacity:0;transition:opacity .15s';
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.style.opacity=1);
    setTimeout(()=>{t.style.opacity=0;setTimeout(()=>t.remove(),180)},1800);
  }
  window.toast = function(msg){
    try{
      if(window.Toastify){ Toastify({text:msg,gravity:'top',position:'right',close:true}).showToast(); }
      else{ fallbackToast(msg); }
    }catch(_){ fallbackToast(msg); }
  };
})();

/* rutas de imágenes */
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
    R:'style/assets/piedra.png',
    P:'style/assets/papel.png',
    S:'style/assets/tijeras.png',
    X:'style/assets/vacio.png' /* carta vacía */
  }
};

/* setters de imagen (jugador/cpu y jugadas) */
window.setFace = (img, key)=>{ img.src = ASSETS.faces[key] || ASSETS.faces.neutral; };
window.setPick = (img, sym)=>{ img.src = sym ? ASSETS.cards[sym] : ASSETS.cards.X; };

/* frases (pueden venir de JSON o defaults) */
window.PHRASES = [
  {type:'win',  text:'¡Punto para {name}!'},
  {type:'win',  text:'{name} domina la ronda 👑'},
  {type:'lose', text:'CPU +1 💥'},
  {type:'tie',  text:'Empate 🤝'}
];
window.setPhrases = arr => { if(Array.isArray(arr) && arr.length){ window.PHRASES = arr; } };
window.getPhrase = (type, name) => {
  const pool = window.PHRASES.filter(x=>x.type===type);
  const item = pool[(Math.random()*pool.length)|0] || {text:''};
  return (item.text||'').replace('{name}', name||'Jugador');
};
