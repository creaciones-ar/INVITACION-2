/* ===== CONFIGURACIÓN (editar solo acá) ===== */
const CONFIG = {
  fecha: "February 21, 2027 21:00:00",
  youtubeId: "rtOvBOTyX00",
  whatsapp: "5491178501814", // 54 + 9 + número
  albumUrl: "https://photos.app.goo.gl/GriDHPSV9NEhcxSk6", // álbum compartido
  playlistUrl: "https://open.spotify.com/playlist/17ImBOYgtzpeEXi9pUZCVB?si=5138f4da72f34aaa&pt=59f5216a742de494a345b4397de74166", // LINK DE INVITACIÓN de la playlist colaborativa de Spotify (pegalo entre las comillas). Si queda vacío, la sección "Nuestra playlist" no aparece.
  mensajeWa: "Hola! Confirmo mi asistencia a los XV de Priscila"
};

const $ = id => document.getElementById(id);

/* ===== Links, QR ===== */
$('album-link').href = CONFIG.albumUrl;
$('wa-btn').href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.mensajeWa)}`;

/* El QR se genera en el propio celular (no depende de ningún servicio externo).
   Si por alguna razón la librería no carga, usa el servicio online como respaldo. */
(function makeQR() {
  const img = $('qr');
  try {
    const qr = qrcode(0, 'M');           // 'M' = corrección de errores media
    qr.addData(CONFIG.albumUrl);
    qr.make();
    img.src = qr.createDataURL(8, 0);    // 8 = tamaño de cada cuadradito, 0 = sin margen (el marco blanco ya lo da el CSS)
    img.style.imageRendering = 'pixelated';
  } catch (err) {
    console.warn('QR local falló, uso servicio online', err);
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=' + encodeURIComponent(CONFIG.albumUrl);
  }
})();

/* ===== Playlist colaborativa: la sección solo aparece si hay link en playlistUrl ===== */
if (CONFIG.playlistUrl) {
  $('playlist-link').href = CONFIG.playlistUrl;
  $('playlist-section').classList.remove('hidden');
  $('playlist-respiro').classList.remove('hidden');
}

/* ===== Música (YouTube oculto + reproductor propio) ===== */
let yt, ticker, ready = false, wantPlay = false;
const playBtn = $('btn-play'), bar = $('progress');

const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = () => {
  yt = new YT.Player('yt-player', {
    height: '1', width: '1', videoId: CONFIG.youtubeId,
    playerVars: { playsinline: 1, controls: 0, loop: 1, playlist: CONFIG.youtubeId },
    events: {
      onReady: () => { ready = true; if (wantPlay) yt.playVideo(); },
      onStateChange: e => {
        const playing = e.data === YT.PlayerState.PLAYING;
        playBtn.classList.toggle('playing', playing);
        clearInterval(ticker);
        if (playing) ticker = setInterval(() => {
          bar.value = (yt.getCurrentTime() / yt.getDuration()) * 100 || 0;
        }, 500);
      }
    }
  });
};
const isPlaying = () => ready && yt.getPlayerState() === 1;
playBtn.onclick = () => ready && (isPlaying() ? yt.pauseVideo() : yt.playVideo());
bar.oninput = () => ready && yt.seekTo(yt.getDuration() * bar.value / 100, true);
$('btn-prev').onclick = $('btn-next').onclick = () => ready && (yt.seekTo(0, true), yt.playVideo());
$('btn-repeat').onclick = e => e.currentTarget.classList.toggle('on');
$('btn-shuffle').onclick = e => e.currentTarget.classList.toggle('on');
$('yt-player').style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px';

/* ===== Abrir sobre: tocar el sello -> se rompe, se abre la solapa, sube la carta, entra la invitación ===== */
$('open-btn').addEventListener('click', function () {
  const env = $('envelope'), screen = $('welcome-screen');
  if (env.classList.contains('open')) return;      // evita doble toque
  env.classList.add('open');
  screen.classList.add('opening');
  wantPlay = true; if (ready) yt.playVideo();      // la música arranca con el toque
  setTimeout(() => {
    screen.style.opacity = '0';
    setTimeout(() => {
      screen.classList.add('hidden');
      $('main-content').classList.remove('hidden');
      fitStory();
      window.scrollTo(0, 0);
    }, 600);
  }, 2900);                                         // tiempo que dura la animación del sobre
});

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

/* ===== Copiar alias ===== */
$('copy-alias').onclick = async e => {
  const btn = e.currentTarget, txt = $('alias').textContent.trim();
  try {
    await navigator.clipboard.writeText(txt);
  } catch {
    const t = document.createElement('textarea');
    t.value = txt; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch { }
    t.remove();
  }
  btn.textContent = '¡Copiado!';
  setTimeout(() => btn.textContent = 'Copiar alias', 2000);
};

/* ===== Fotos: busca automáticamente el archivo correcto =====
   Prueba: foto3.png, "foto 3.png", foto_3.png, .jpg, .jpeg, .webp (y mayúsculas).
   Las que tienen data-framed (marco de Canva) reciben la clase "framed". */
const V = '15';
const NAMES = n => [`foto${n}`, `foto ${n}`, `foto_${n}`];
const EXTS = ['png', 'jpg', 'jpeg', 'webp', 'PNG', 'JPG', 'JPEG'];

function candidates(n) {
  const list = [];
  NAMES(n).forEach(name => EXTS.forEach(ext => list.push(encodeURI(`${name}.${ext}`) + '?v=' + V)));
  return list;
}

function loadPhoto(img) {
  const list = candidates(img.dataset.foto);
  const framed = img.hasAttribute('data-framed');
  let i = 0;
  const next = () => {
    if (i >= list.length) { console.warn('No se encontró la foto', img.dataset.foto); return; }
    const probe = new Image();
    const url = list[i++];
    probe.onload = () => { img.src = url; if (framed) img.classList.add('framed'); };
    probe.onerror = next;
    probe.src = url;
  };
  next();
}

document.querySelectorAll('img[data-foto]').forEach(loadPhoto);


/* ===== Texto de la historia: mismo alto que las dos fotos =====
   Ajusta el tamaño de letra hasta que el texto empiece a la altura de la 1ª foto
   y termine a la altura de la 2ª (en cualquier celular). */
function fitStory() {
  const t = document.querySelector('.story-text');
  const box = document.querySelector('.story-photos');
  if (!t || !box || !box.offsetHeight) return;      // todavía oculto o sin cargar
  const target = box.offsetHeight * 0.90;           // 0.90 = descuenta el borde transparente de los marcos
  let lo = 11, hi = 24;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    t.style.fontSize = mid + 'px';
    if (t.scrollHeight > target) hi = mid; else lo = mid;
  }
  t.style.fontSize = lo + 'px';
}
document.querySelectorAll('.story-photos img').forEach(i => i.addEventListener('load', fitStory));
window.addEventListener('resize', fitStory);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitStory);
