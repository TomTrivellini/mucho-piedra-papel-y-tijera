/* claves de storage */
const SAVE='rps_save_v1', HIST='rps_history_v1', PHRASES='rps_phrases';

/* estado de partida */
window.saveState = function(s){
  try{ localStorage.setItem(SAVE, JSON.stringify({...s,ts:Date.now()})); }
  catch(_){ toast('No se pudo guardar el estado'); }
};
window.loadState = function(){
  try{ return JSON.parse(localStorage.getItem(SAVE)||'null'); }
  catch(_){ return null; }
};
window.clearSaveState = function(){
  try{ localStorage.removeItem(SAVE); } catch(_){}
};

/* historial de partidas */
window.pushHistory = function(entry){
  try{
    const arr = JSON.parse(localStorage.getItem(HIST)||'[]');
    arr.push({ts:Date.now(), ...entry});
    localStorage.setItem(HIST, JSON.stringify(arr));
  }catch(_){ toast('No se pudo actualizar el historial'); }
};
window.readHistory = function(){
  try{ return JSON.parse(localStorage.getItem(HIST)||'[]'); }
  catch(_){ return []; }
};
window.clearHistory = function(){
  try{ localStorage.removeItem(HIST); } catch(_){}
};
window.fmtDate = ts => new Date(ts).toLocaleDateString();

/* frases (json cacheado) */
window.savePhrases = function(arr){
  try{ localStorage.setItem(PHRASES, JSON.stringify(arr)); } catch(_){}
};
window.loadPhrases = function(){
  try{ return JSON.parse(localStorage.getItem(PHRASES)||'null'); }
  catch(_){ return null; }
};
