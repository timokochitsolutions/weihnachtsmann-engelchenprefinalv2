/* Weihnachtsmann & Engelchen – alle Seiten
   Menü, Angebots-Menü, Einblenden beim Scrollen, Filmstreifen, WhatsApp-Knopf */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-jahr]').forEach((e) => { e.textContent = new Date().getFullYear(); });

  /* ---------- WhatsApp-Knopf: erscheint nach dem ersten Bildschirm, weicht dem Fuß ---------- */
  const wa = $('#wa');
  const fuss = $('.fuss');
  if (wa && fuss) {
    const beimScrollen = () => {
      const fussSichtbar = fuss.getBoundingClientRect().top < innerHeight - 60;
      wa.classList.toggle('wa--da', scrollY > innerHeight * 0.6 && !fussSichtbar);
    };
    addEventListener('scroll', beimScrollen, { passive: true });
    beimScrollen();
  }

  /* ---------- Menü (Handy und Tablet) ---------- */
  const menue = $('#menue');
  const nav = $('#nav');
  if (menue && nav) {
    const offen = () => menue.getAttribute('aria-expanded') === 'true';
    const setze = (an) => {
      menue.setAttribute('aria-expanded', String(an));
      nav.classList.toggle('nav--offen', an);
      document.body.style.overflow = an ? 'hidden' : '';
    };
    menue.addEventListener('click', () => setze(!offen()));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setze(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && offen()) { setze(false); menue.focus(); } });
    matchMedia('(min-width: 1061px)').addEventListener('change', (e) => { if (e.matches) setze(false); });
  }

  /* ---------- Angebots-Menü (Desktop: Hover oder Klick) ---------- */
  const gruppe = $('#nav-angebote');
  if (gruppe) {
    const auf = $('.nav__auf', gruppe);
    const setze = (an) => {
      gruppe.classList.toggle('nav__gruppe--offen', an);
      auf.setAttribute('aria-expanded', String(an));
    };
    auf.addEventListener('click', () => setze(!gruppe.classList.contains('nav__gruppe--offen')));
    gruppe.addEventListener('focusout', (e) => { if (!gruppe.contains(e.relatedTarget)) setze(false); });
    document.addEventListener('click', (e) => { if (!gruppe.contains(e.target)) setze(false); });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gruppe.classList.contains('nav__gruppe--offen')) { setze(false); auf.focus(); }
    });
  }

  /* ---------- Einblenden beim Scrollen ---------- */
  const zeigen = $$('.zeig');
  if ('IntersectionObserver' in window && !ruhig) {
    const waechter = new IntersectionObserver((treffer) => {
      treffer.forEach((t) => {
        if (!t.isIntersecting) return;
        t.target.classList.add('sichtbar');
        waechter.unobserve(t.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    zeigen.forEach((e) => waechter.observe(e));
  } else {
    zeigen.forEach((e) => e.classList.add('sichtbar'));
  }

  /* ---------- Filmstreifen mit der Maus ziehen ---------- */
  const film = $('#film');
  if (film) {
    let zug = null;
    film.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      zug = { x: e.clientX, links: film.scrollLeft, bewegt: false };
    });
    addEventListener('pointermove', (e) => {
      if (!zug) return;
      const dx = e.clientX - zug.x;
      if (!zug.bewegt && Math.abs(dx) > 4) { zug.bewegt = true; film.classList.add('film--zieht'); }
      if (zug.bewegt) film.scrollLeft = zug.links - dx;
    });
    const ende = () => { if (zug) { film.classList.remove('film--zieht'); zug = null; } };
    addEventListener('pointerup', ende);
    addEventListener('pointercancel', ende);
  }
})();
