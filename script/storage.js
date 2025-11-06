/* ===== Claves de LocalStorage (humanas) ===== */
const SAVE       = 'rps_save_v1';         // estado de partida para "Continuar"
const HISTORIAL  = 'rps_historial_v1';    // historial de partidas
const PREFERENCIAS = 'rps_prefs_v1';      // preferencias de usuario (nombre)

/* ===== Estado de partida ===== */
window.saveState = function (estado) {
  try {
    localStorage.setItem(SAVE, JSON.stringify({ ...estado, ts: Date.now() }));
  } catch (_) { /* silencioso */ }
};

window.loadState = function () {
  try { return JSON.parse(localStorage.getItem(SAVE) || 'null'); }
  catch (_) { return null; }
};

window.clearSaveState = function () {
  try { localStorage.removeItem(SAVE); } catch (_) {}
};

/* ===== Historial =====
   Estructura de cada entrada:
   { ts:Number, nombre:String, puntosJugador:Number, puntosCpu:Number, huyo:Boolean }
*/
window.pushHistorial = function (entrada) {
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORIAL) || '[]');
    arr.push({ ts: Date.now(), ...entrada });
    localStorage.setItem(HISTORIAL, JSON.stringify(arr));
  } catch (_) { /* silencioso */ }
};

window.leerHistorial = function () {
  try { return JSON.parse(localStorage.getItem(HISTORIAL) || '[]'); }
  catch (_) { return []; }
};

window.borrarHistorial = function () {
  try { localStorage.removeItem(HISTORIAL); } catch (_) {}
};

window.formatearFecha = ts => new Date(ts).toLocaleDateString();

/* ===== Preferencias ===== */
window.guardarNombreJugador = function (nombre) {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFERENCIAS) || '{}');
    prefs.playerName = nombre;
    localStorage.setItem(PREFERENCIAS, JSON.stringify(prefs));
  } catch (_) {}
};

window.cargarNombreJugador = function () {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFERENCIAS) || 'null');
    return prefs && prefs.playerName;
  } catch (_) { return null; }
};
