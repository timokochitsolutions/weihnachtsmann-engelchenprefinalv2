/* Weihnachtsmann & Engelchen – Unterseiten
   Galerie mit Filter und Großansicht, Richtwert-Rechner, Anfrage in drei Schritten */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Preise (eine Quelle für Rechner und Anfrage) ---------- */
  const PREISE = {
    videogruss: 25,
    videobotschaft: 60,
    weiterePerson: 10,
    bescherung: 200,
    eventStunde1: 416.5,
    eventStunden2: 714,
    eventJeStundeAb3: 297.5,
    freiKm: 40,
    kmPrivat: 0.38,
    kmEventBrutto: 0.35 * 1.19,
  };

  const euro = (wert) => {
    const ganz = Math.abs(wert % 1) < 0.005;
    return `${wert.toLocaleString('de-DE', { minimumFractionDigits: ganz ? 0 : 2, maximumFractionDigits: 2 })} €`;
  };

  // Liefert die Posten eines Richtwerts als [Bezeichnung, Betrag]
  const rechne = ({ leistung, personen = 1, stunden = 1, km = 0 }) => {
    const posten = [];
    const mehrKm = Math.max(0, km - PREISE.freiKm) * 2;
    if (leistung === 'videogruss') posten.push(['Kurzer Videogruß', PREISE.videogruss]);
    if (leistung === 'videobotschaft') {
      posten.push(['Videobescherung, 1 Person', PREISE.videobotschaft]);
      if (personen > 1) posten.push([`${personen - 1} weitere ${personen === 2 ? 'Person' : 'Personen'}`, (personen - 1) * PREISE.weiterePerson]);
    }
    if (leistung === 'bescherung') {
      posten.push(['Bescherung zu Hause', PREISE.bescherung]);
      if (mehrKm) posten.push([`Anfahrt, ${mehrKm} km zusätzlich`, mehrKm * PREISE.kmPrivat]);
    }
    if (leistung === 'event') {
      const preis = stunden === 1 ? PREISE.eventStunde1 : stunden === 2 ? PREISE.eventStunden2 : stunden * PREISE.eventJeStundeAb3;
      posten.push([`Auftritt, ${stunden} ${stunden === 1 ? 'Stunde' : 'Stunden'}`, preis]);
      if (mehrKm) posten.push([`Anfahrt, ${mehrKm} km zusätzlich`, mehrKm * PREISE.kmEventBrutto]);
    }
    return posten;
  };

  /* ---------- Galerie: Filter und Großansicht ---------- */
  (() => {
    const galerie = $('#galerie');
    const kasten = $('#lichtkasten');
    if (!galerie || !kasten) return;
    const bilder = $$('.galerie__bild', galerie);
    const sichtbare = () => bilder.filter((b) => !b.hidden);

    $$('#filter button').forEach((knopf) => {
      knopf.addEventListener('click', () => {
        $$('#filter button').forEach((k) => k.setAttribute('aria-pressed', String(k === knopf)));
        const art = knopf.dataset.filter;
        bilder.forEach((b, i) => {
          b.hidden = art !== 'alle' && b.dataset.art !== art;
          b.style.animation = 'none';
          void b.offsetWidth;
          b.style.animation = '';
          b.style.animationDelay = `${(i % 6) * 40}ms`;
        });
      });
    });

    const gross = $('#lichtkasten-bild');
    const titel = $('#lichtkasten-titel');
    const jahr = $('#lichtkasten-jahr');
    let aktuell = 0;

    const zeige = (nr) => {
      const liste = sichtbare();
      aktuell = (nr + liste.length) % liste.length;
      const quelle = $('img', liste[aktuell]);
      gross.src = quelle.currentSrc || quelle.src;
      gross.alt = quelle.alt;
      titel.textContent = $('.galerie__text b', liste[aktuell]).textContent;
      jahr.textContent = $('.galerie__text span', liste[aktuell]).textContent;
    };

    bilder.forEach((b) => b.addEventListener('click', () => {
      zeige(sichtbare().indexOf(b));
      if (typeof kasten.showModal === 'function') kasten.showModal();
    }));
    kasten.addEventListener('click', (e) => {
      const schritt = e.target.closest('[data-schritt]');
      if (schritt) { zeige(aktuell + Number(schritt.dataset.schritt)); return; }
      if (e.target === kasten || e.target.closest('[data-zu]')) kasten.close();
    });
    kasten.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') zeige(aktuell + 1);
      if (e.key === 'ArrowLeft') zeige(aktuell - 1);
    });
  })();

  /* ---------- Richtwert-Rechner ---------- */
  (() => {
    const formular = $('#rechner');
    if (!formular) return;
    const summe = $('#summe');
    const postenListe = $('#posten');
    const strecke = $('#strecke');
    const streckeWert = $('#strecke-wert');
    const anfrage = $('#rechner-anfrage');
    const stand = { personen: 1, stunden: 1 };
    let angezeigt = 200;
    let lauf = 0;

    // Zahl läuft weich zum neuen Wert
    const zaehleZu = (ziel) => {
      const start = angezeigt;
      const beginn = performance.now();
      const meiner = ++lauf;
      const schritt = (t) => {
        if (meiner !== lauf) return;
        const f = Math.min((t - beginn) / 450, 1);
        const weich = 1 - Math.pow(1 - f, 3);
        angezeigt = start + (ziel - start) * weich;
        summe.textContent = euro(f === 1 ? ziel : Math.round(angezeigt));
        if (f < 1) requestAnimationFrame(schritt);
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { angezeigt = ziel; summe.textContent = euro(ziel); return; }
      requestAnimationFrame(schritt);
    };

    const aktualisieren = () => {
      const leistung = new FormData(formular).get('leistung');
      $$('.rechner__regler', formular).forEach((r) => { r.hidden = !r.dataset.fuer.split(' ').includes(leistung); });
      const km = Number(strecke.value);
      streckeWert.textContent = `${km} km`;
      const posten = rechne({ leistung, personen: stand.personen, stunden: stand.stunden, km });
      postenListe.replaceChildren(...posten.map(([name, betrag]) => {
        const li = document.createElement('li');
        const a = document.createElement('span');
        const b = document.createElement('span');
        a.textContent = name;
        b.textContent = euro(betrag);
        li.append(a, b);
        return li;
      }));
      zaehleZu(posten.reduce((s, [, betrag]) => s + betrag, 0));
      anfrage.href = anfrage.href.replace(/anlass=[a-z]*/, `anlass=${leistung}`);
    };

    formular.addEventListener('input', aktualisieren);
    formular.addEventListener('click', (e) => {
      const knopf = e.target.closest('[data-zaehler]');
      if (!knopf) return;
      const feld = $(`#${knopf.dataset.zaehler}`);
      const neu = Math.min(Number(feld.dataset.max), Math.max(Number(feld.dataset.min), stand[knopf.dataset.zaehler] + Number(knopf.dataset.um)));
      stand[knopf.dataset.zaehler] = neu;
      feld.textContent = neu;
      aktualisieren();
    });
    formular.addEventListener('submit', (e) => e.preventDefault());
    aktualisieren();
  })();

  /* ---------- Anfrage in drei Schritten (Vorschau, noch ohne Versand) ---------- */
  (() => {
    const formular = $('#anf');
    if (!formular) return;
    const stufen = $$('.stufe', formular);
    const marken = $$('#fortschritt li');
    const zurueck = $('#anf-zurueck');
    const vor = $('#anf-vor');
    const senden = $('#anf-senden');
    const meldung = $('#anf-meldung');
    let stufe = 1;

    const anlass = () => $('input[name="anlass"]:checked', formular);
    const VIDEO = ['videogruss', 'videobotschaft'];

    const felderAnpassen = () => {
      const wert = anlass()?.value;
      $$('[data-fuer]', formular).forEach((f) => { f.hidden = !wert || !f.dataset.fuer.split(' ').includes(wert); });
      const video = VIDEO.includes(wert);
      $('#a-datum-label').textContent = video ? 'Gewünschter Liefertermin' : 'Wunschtermin';
      $('#a-anzahl-label').textContent = wert === 'event' ? 'Ungefähre Gästezahl' : wert === 'videobotschaft' ? 'Personen im Video' : 'Anzahl der Kinder';
      $('#a-details-label').textContent = video ? 'Grußtext oder Stichpunkte' : wert === 'medien' ? 'Ihr Projekt in ein paar Sätzen' : 'Eure Wünsche und wichtige Details';
      $('#a-details-hilfe').textContent = video
        ? 'Zum Beispiel worüber sich der Weihnachtsmann gefreut hat und was er wünschen soll.'
        : wert === 'medien'
          ? 'Zum Beispiel Motiv, Zielgruppe, Veröffentlichungsorte und Nutzungsumfang.'
          : 'Zum Beispiel Namen der Kinder, Besonderheiten zum Ablauf oder Fragen an uns.';
    };

    const setze = (id, text) => {
      const feld = $(id);
      feld.textContent = text || (id === '#m-preis' ? 'nach Auswahl' : 'noch offen');
      feld.classList.toggle('ist-leer', !text);
    };

    const zettel = () => {
      const wahl = anlass();
      const wert = wahl?.value;
      setze('#m-anlass', wahl?.dataset.name);

      let termin = '';
      const datum = $('#a-datum').value;
      if (datum) {
        const tag = new Date(`${datum}T12:00:00`);
        if (!Number.isNaN(tag.getTime())) termin = tag.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
        const zeit = $('#a-zeit').value;
        if (zeit && !VIDEO.includes(wert)) termin += `, ${zeit} Uhr`;
      }
      setze('#m-termin', termin);

      $('#m-ort-zeile').hidden = VIDEO.includes(wert);
      setze('#m-ort', [$('#a-plz').value.trim(), $('#a-ort').value.trim()].filter(Boolean).join(' '));

      let preis = '';
      if (wert === 'kita' || wert === 'medien' || wert === 'anderes') preis = 'individuelles Angebot';
      else if (wert) {
        const anzahl = Math.max(1, Number($('#a-anzahl').value) || 1);
        const stunden = parseInt($('#a-dauer').value, 10) || 1;
        const betrag = rechne({ leistung: wert, personen: anzahl, stunden }).reduce((s, [, b]) => s + b, 0);
        preis = `${wert === 'event' || wert === 'bescherung' ? 'ab ' : ''}${euro(betrag)}`;
      }
      setze('#m-preis', preis);
    };

    const zeigeStufe = (nr) => {
      stufe = nr;
      stufen.forEach((s) => s.classList.toggle('ist-aktiv', Number(s.dataset.stufe) === nr));
      marken.forEach((m, i) => {
        m.classList.toggle('ist-aktiv', i + 1 === nr);
        m.classList.toggle('ist-da', i + 1 <= nr);
        if (i + 1 === nr) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current');
      });
      zurueck.hidden = nr === 1;
      vor.hidden = nr === 3;
      senden.hidden = nr !== 3;
      meldung.hidden = true;
    };

    const melde = (text, feld) => {
      meldung.textContent = text;
      meldung.hidden = false;
      if (feld) feld.focus();
    };

    vor.addEventListener('click', () => {
      if (stufe === 1 && !anlass()) { melde('Bitte wählt zuerst einen Anlass.', $('input[name="anlass"]', formular)); return; }
      zeigeStufe(stufe + 1);
      const erstes = $('.stufe.ist-aktiv input:not([type="radio"]), .stufe.ist-aktiv select', formular);
      formular.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (erstes) erstes.focus({ preventScroll: true });
    });
    zurueck.addEventListener('click', () => zeigeStufe(stufe - 1));

    formular.addEventListener('change', () => { felderAnpassen(); zettel(); meldung.hidden = true; });
    formular.addEventListener('input', zettel);

    formular.addEventListener('submit', (e) => {
      e.preventDefault();
      const pflicht = [['#a-vorname', 'Bitte tragt euren Vornamen ein.'], ['#a-nachname', 'Bitte tragt euren Nachnamen ein.'], ['#a-mail', 'Bitte tragt eine gültige E-Mail-Adresse ein.']];
      for (const [id, text] of pflicht) {
        const feld = $(id);
        if (!feld.value.trim() || !feld.checkValidity()) { melde(text, feld); return; }
      }
      if (!$('#a-zusage').checked) { melde('Bitte bestätigt noch die Datenschutzhinweise.', $('#a-zusage')); return; }

      // Vorschau: Hier wird später an den Server gesendet
      stufen.forEach((s) => s.classList.remove('ist-aktiv'));
      $('#anf-weiter').hidden = true;
      $('#fortschritt').hidden = true;
      meldung.hidden = true;
      const danke = $('#danke');
      danke.hidden = false;
      danke.focus();
    });

    // Vorauswahl über die Adresse, zum Beispiel ?anlass=bescherung
    const gewuenscht = new URLSearchParams(location.search).get('anlass');
    const vorwahl = gewuenscht && $(`input[name="anlass"][value="${CSS.escape(gewuenscht)}"]`, formular);
    if (vorwahl) vorwahl.checked = true;

    const heute = new Date();
    $('#a-datum').min = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;

    felderAnpassen();
    zettel();
    zeigeStufe(1);
  })();
})();
