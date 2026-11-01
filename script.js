/* ===== CONFIGURACIÓN (editar solo acá) ===== */
const CONFIG = {
  fecha: "April 16, 2027 21:00:00",
  youtubeId: "j3ObHjm1fAE",                        // Tiempo de vals - Chayanne
  inicio: 30,                                      // segundo desde el que empieza la canción (30 = minuto 0:30)
  whatsapp: "549XXXXXXXXXX",                       // 54 + 9 + código de área + número (REEMPLAZAR)
  mapsUrl: "https://maps.app.goo.gl/gSovV3jMHaxYqXNNA",
  alias: "vanessa.m",
  galeria: 6,                                      // cantidad de fotos del álbum deslizable (foto2, foto3...)
  mensajeWa: "Hola! Confirmo mi asistencia a los XV de Vanessa ❤️",
  // Trivia: q = pregunta, o = opciones, a = número de la opción correcta (0 es la primera). REEMPLAZAR por preguntas reales.
  trivia: [
    { q: "¿Cuál es mi comida favorita?", o: ["Pizza", "Empanadas", "Milanesa"], a: 0 },
    { q: "¿Cuál es mi color favorito?", o: ["Rojo", "Azul", "Verde"], a: 0 },
    { q: "¿Cuál es mi frase más repetida?", o: ["Ya voy", "Tengo hambre", "No sé qué ponerme"], a: 1 }
  ]
};

const $ = id => document.getElementById(id);
$('maps').href = CONFIG.mapsUrl;
$('wa-btn').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensajeWa)}`;
$('alias').textContent = CONFIG.alias;

/* ===== Música (YouTube oculto + reproductor propio) ===== */
let yt, ticker, ready = false, wantPlay = false;
const playBtn = $('btn-play'), bar = $('progress');
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);
window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player('yt-player', {
    height: '1', width: '1', videoId: CONFIG.youtubeId,
    playerVars: { playsinline: 1, controls: 0, start: CONFIG.inicio },
    events: {
      onReady: () => { ready = true; if (wantPlay) yt.playVideo(); },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED && $('btn-repeat').classList.contains('on')) { yt.seekTo(CONFIG.inicio, true); yt.playVideo(); return; }   // al terminar, vuelve a empezar desde el segundo de inicio
        const playing = e.data === YT.PlayerState.PLAYING;
        playBtn.classList.toggle('playing', playing);
        clearInterval(ticker);
        if (playing) ticker = setInterval(() => { bar.value = (yt.getCurrentTime() / yt.getDuration()) * 100 || 0; }, 500);
      }
    }
  });
};
const isPlaying = () => ready && yt.getPlayerState() === 1;
let userPaused = false, needResume = false;     // userPaused: ella pausó a propósito
playBtn.onclick = () => { if (!ready) return; if (isPlaying()) { userPaused = true; yt.pauseVideo(); } else { userPaused = false; yt.playVideo(); } };
bar.oninput = () => ready && yt.seekTo(yt.getDuration() * bar.value / 100, true);
$('btn-prev').onclick = $('btn-next').onclick = () => { if (!ready) return; userPaused = false; yt.seekTo(CONFIG.inicio, true); yt.playVideo(); };
$('btn-repeat').onclick = e => e.currentTarget.classList.toggle('on');
$('btn-shuffle').onclick = e => e.currentTarget.classList.toggle('on');
$('yt-player').style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px';

/* ===== Entrar: la música arranca con el toque ===== */
$('enter').onclick = () => {
  wantPlay = true; if (ready) yt.playVideo();
  $('welcome').classList.add('hide');
  setTimeout(() => { $('welcome').remove(); $('main').classList.remove('hidden'); window.scrollTo(0, 0); }, 500);
};

/* ===== Cuenta regresiva ===== */
const eventDate = new Date(CONFIG.fecha).getTime();
const pad = n => String(n).padStart(2, '0');
const tick = () => {
  const d = eventDate - Date.now();
  if (d < 0) { clearInterval(timer); $('countdown').textContent = '¡Llegó el gran día!'; return; }
  $('days').textContent = pad(Math.floor(d / 864e5));
  $('hours').textContent = pad(Math.floor(d % 864e5 / 36e5));
  $('minutes').textContent = pad(Math.floor(d % 36e5 / 6e4));
  $('seconds').textContent = pad(Math.floor(d % 6e4 / 1e3));
};
const timer = setInterval(tick, 1000);
tick();

/* ===== Regalos (ventana con el alias) ===== */
const modal = $('modal');
$('gift-btn').onclick = () => modal.classList.remove('hidden');
$('close').onclick = () => modal.classList.add('hidden');
modal.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };
$('copy-alias').onclick = async e => {
  const btn = e.currentTarget, txt = CONFIG.alias;
  try { await navigator.clipboard.writeText(txt); }
  catch { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
  btn.textContent = '¡Copiado!';
  setTimeout(() => btn.textContent = 'Copiar alias', 2000);
};

/* ===== Trivia ===== */
let qi = 0, score = 0;
function showQ() {
  const box = $('trivia-box'), T = CONFIG.trivia;
  if (qi >= T.length) {
    box.innerHTML = `<p class="q">¡Acertaste ${score} de ${T.length}!</p><p>Gracias por jugar ❤️</p><button id="again" class="btn light">Jugar de nuevo</button>`;
    $('again').onclick = () => { qi = 0; score = 0; showQ(); };
    return;
  }
  const t = T[qi];
  box.innerHTML = `<p class="q">${t.q}</p>` + t.o.map((x, k) => `<button class="opt" data-k="${k}">${x}</button>`).join('');
  box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const ok = +b.dataset.k === t.a;
    if (ok) score++;
    b.classList.add(ok ? 'ok' : 'bad');
    box.querySelectorAll('.opt').forEach(o => o.disabled = true);
    box.querySelector(`[data-k="${t.a}"]`).classList.add('ok');
    setTimeout(() => { qi++; showQ(); }, 1200);
  });
}
$('trivia-start').onclick = () => { qi = 0; score = 0; showQ(); };

/* ===== Galería deslizable: se crean foto2 ... foto(1+galeria). La última foto de la lista es la del cierre ===== */
for (let n = 2; n < 2 + CONFIG.galeria; n++) {
  const d = document.createElement('div'); d.className = 'slide ph';
  d.innerHTML = `<img data-foto="${n}" alt="Vanessa">`;
  $('gal').appendChild(d);
}
$('closing-img').dataset.foto = 2 + CONFIG.galeria;

/* ===== Fotos: foto1 (portada), foto2... (galería) y la siguiente (cierre) en .jpg .jpeg .png .webp ===== */
const V = '1', EXTS = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
document.querySelectorAll('img[data-foto]').forEach(img => {
  const list = EXTS.map(e => `foto${img.dataset.foto}.${e}?v=${V}`);
  let i = 0;
  const next = () => {
    if (i >= list.length) return;
    const probe = new Image(), url = list[i++];
    probe.onload = () => { img.src = url; };
    probe.onerror = next;
    probe.src = url;
  };
  next();
});


/* ===== Íconos que se animan una sola vez (calendario): se reinician al llegar a verlos ===== */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const im = e.target; im.src = im.src.split('?')[0] + '?t=' + Date.now(); }
  }), { threshold: 0.6 });
  document.querySelectorAll('img[data-replay]').forEach(i => io.observe(i));
}


/* ===== Al volver de Google Maps (u otra app), la música sigue sola ===== */
function resumeMusic() {
  if (!ready || !wantPlay || userPaused || isPlaying()) return;
  yt.playVideo();
  needResume = true;                              // si el celular lo bloquea, se reanuda con el próximo toque
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(resumeMusic, 300); });
window.addEventListener('pageshow', () => setTimeout(resumeMusic, 300));
document.addEventListener('touchend', e => {
  if (!needResume || e.target.closest('.controls')) return;
  needResume = false;
  if (!userPaused && !isPlaying()) yt.playVideo();
}, { passive: true });

/* ===== Galería automática: las fotos pasan solas; si las tocan, espera 5 segundos ===== */
(function () {
  const track = $('gal');
  if (!track || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let visible = false, hold = 0;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.3 }).observe(track);
  ['touchstart', 'pointerdown', 'wheel'].forEach(ev => track.addEventListener(ev, () => { hold = Date.now() + 5000; }, { passive: true }));
  setInterval(() => {
    const s = track.children;
    if (!visible || Date.now() < hold || !s.length) return;
    let i = Math.round(track.scrollLeft / (s[0].offsetWidth + 8)) + 1;   // 8 = separación entre fotos
    if (i >= s.length) i = 0;                                            // al final vuelve a la primera
    s[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, 3000);                                                              // 3000 = 3 segundos por foto
})();
