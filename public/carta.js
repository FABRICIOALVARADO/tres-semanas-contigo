(() => {
  'use strict';
  const dialog = document.getElementById('reader');
  const pages = [...document.querySelectorAll('[data-page]')];
  const content = document.getElementById('page-content');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const folio = document.getElementById('folio');
  const petals = dialog.querySelector('.petals');
  const playerLink = document.getElementById('reader-player-link');
  const playerHelp = document.getElementById('player-help');
  const soundControls = [...document.querySelectorAll('[data-sound]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const track = '0zLr0KLp3KUKGRBzgsrVK2';
  const nextLabels = ['Abrir el segundo sobre', 'Abrir el tercer sobre', 'Leer tu carta', 'Volver a la portada'];
  const folios = ['Sobre I de III', 'Sobre II de III', 'Sobre III de III', 'La carta de Fabri'];
  const spotifyEmbed = 'https://open.spotify.com/embed/track/' + track + '?theme=0';
  let page = 0;
  let opener = null;
  let controller = null;
  let ready = false;
  let playing = false;
  let hasPlayed = false;
  let voluntarilyPaused = false;
  let playCheck = 0;

  function paintSound() {
    const label = playing ? 'Pausar sonido' : 'Activar sonido';
    for (const button of soundControls) {
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? 'Pausar Morfina de HUMBE' : 'Reproducir Morfina de HUMBE');
      button.querySelector('[data-sound-label]').textContent = label;
    }
  }

  function offerPlayer() {
    playerHelp.textContent = 'Toca ▶ en el reproductor si la música aún no empezó.';
    playerLink.hidden = false;
  }

  function attemptPlay() {
    if (voluntarilyPaused || playing) return;
    if (controller && ready) {
      try {
        const result = controller.play();
        if (result && typeof result.catch === 'function') result.catch(offerPlayer);
      } catch { offerPlayer(); }
    }
    clearTimeout(playCheck);
    playCheck = window.setTimeout(() => { if (!playing && !voluntarilyPaused) offerPlayer(); }, 1600);
  }

  function goToPlayer() {
    if (dialog.open) dialog.close();
    document.getElementById('cancion').scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' });
    const iframe = document.querySelector('#player-slot iframe');
    if (iframe) iframe.focus({preventScroll:true});
  }

  for (const button of soundControls) {
    button.addEventListener('click', () => {
      if (playing) {
        voluntarilyPaused = true;
        controller?.pause();
      } else {
        voluntarilyPaused = false;
        attemptPlay();
        if (!ready) { offerPlayer(); goToPlayer(); }
      }
    });
  }
  playerLink.addEventListener('click', (event) => {
    event.preventDefault();
    goToPlayer();
  });

  function standardPlayer() {
    if (controller || document.querySelector('#player-slot iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.title = 'Morfina de HUMBE en Spotify';
    iframe.src = spotifyEmbed;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    document.getElementById('player-slot').replaceChildren(iframe);
    offerPlayer();
  }

  window.onSpotifyIframeApiReady = (api) => {
    const slot = document.getElementById('player-slot');
    const target = document.createElement('div');
    slot.replaceChildren(target);
    try {
      api.createController(target, {
        uri: 'spotify:track:' + track,
        width: '100%',
        height: 80
      }, (control) => {
        controller = control;
        const iframe = slot.querySelector('iframe');
        if (iframe) {
          iframe.title = 'Morfina de HUMBE en Spotify';
          iframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
        }
        control.addListener('ready', () => {
          ready = true;
          attemptPlay();
        });
        control.addListener('playback_update', (event) => {
          const data = event.data;
          if (!data || typeof data.isPaused !== 'boolean') return;
          // Also respect a pause made in the official Spotify player.
          if (playing && data.isPaused) voluntarilyPaused = true;
          playing = !data.isPaused;
          if (playing) {
            hasPlayed = true;
            voluntarilyPaused = false;
            playerLink.hidden = true;
            clearTimeout(playCheck);
          }
          if (playing || hasPlayed) playerHelp.textContent = playing ? 'Está sonando mientras lees.' : 'La canción está en pausa.';
          paintSound();
        });
      });
    } catch { standardPlayer(); }
  };
  const spotify = document.createElement('script');
  spotify.src = 'https://open.spotify.com/embed/iframe-api/v1';
  spotify.async = true;
  spotify.onerror = standardPlayer;
  document.head.append(spotify);
  window.setTimeout(standardPlayer, 6000);

  function scatterPetals() {
    petals.replaceChildren();
    if (motion.matches) return;
    for (let i = 0; i < 12; i++) {
      const petal = document.createElement('i');
      petal.style.setProperty('--x', (5 + (i * 29) % 92) + '%');
      petal.style.setProperty('--duration', (1.55 + (i % 4) * .22) + 's');
      petal.style.setProperty('--delay', ((i % 5) * .1) + 's');
      petal.style.setProperty('--drift', ((i % 2 === 0 ? 1 : -1) * (19 + i * 3)) + 'px');
      petal.style.setProperty('--petal', ['#c86d7b', '#dbad92', '#94384b'][i % 3]);
      petal.addEventListener('animationend', () => petal.remove(), {once:true});
      petals.append(petal);
    }
  }

  function showPage(index) {
    page = index;
    const article = pages[index].cloneNode(true);
    article.removeAttribute('id');
    article.removeAttribute('data-page');
    content.replaceChildren(article);
    folio.textContent = folios[index];
    next.textContent = nextLabels[index];
    previous.disabled = index === 0;
    dialog.querySelectorAll('.progress i').forEach((dot, i) => dot.classList.toggle('on', i <= index));
    content.classList.remove('turn');
    void content.offsetWidth;
    content.classList.add('turn');
    dialog.scrollTop = 0;
    if (index === pages.length - 1) scatterPetals();
    else petals.replaceChildren();
    const heading = article.querySelector('h2, blockquote');
    heading.setAttribute('tabindex', '-1');
    heading.focus({preventScroll:true});
  }

  function openReader(index, trigger) {
    opener = trigger;
    attemptPlay();
    if (!dialog.open) dialog.showModal();
    showPage(index);
  }

  if (typeof dialog.showModal === 'function') {
    document.documentElement.classList.add('enhanced');
    document.querySelectorAll('[data-open]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        openReader(Number(link.dataset.open), link);
      });
    });
    next.addEventListener('click', () => {
      if (page < pages.length - 1) showPage(page + 1);
      else {
        dialog.close();
        document.getElementById('portada').scrollIntoView({block:'start', behavior:motion.matches ? 'instant' : 'smooth'});
      }
    });
    previous.addEventListener('click', () => { if (page > 0) showPage(page - 1); });
    dialog.querySelector('.close-reader').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      petals.replaceChildren();
      opener?.focus({preventScroll:true});
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' && page < pages.length - 1) { event.preventDefault(); showPage(page + 1); }
      if (event.key === 'ArrowLeft' && page > 0) { event.preventDefault(); showPage(page - 1); }
    });
  }
})();
