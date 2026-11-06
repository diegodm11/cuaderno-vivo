(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'cv-pro-accessibility-v1';
  const defaults = { text: 'normal', contrast: false, easy: false, reduce: false };
  let accessibility = { ...defaults };
  let previousFocus = null;
  let speech = null;

  function loadAccessibility() {
    try {
      accessibility = { ...defaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
    } catch {
      accessibility = { ...defaults };
    }
  }

  function applyAccessibility(save = true) {
    const root = document.documentElement;
    root.classList.remove('a11y-text-large', 'a11y-text-xlarge');
    if (accessibility.text !== 'normal') root.classList.add(`a11y-text-${accessibility.text}`);
    root.classList.toggle('a11y-high-contrast', accessibility.contrast);
    root.classList.toggle('a11y-easy-read', accessibility.easy);
    root.classList.toggle('a11y-reduce-motion', accessibility.reduce);
    $$('[data-a11y-text]').forEach(button => {
      const active = button.dataset.a11yText === accessibility.text;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if ($('#a11yContrast')) $('#a11yContrast').checked = accessibility.contrast;
    if ($('#a11yEasy')) $('#a11yEasy').checked = accessibility.easy;
    if ($('#a11yReduce')) $('#a11yReduce').checked = accessibility.reduce;
    const status = $('#a11yStatus');
    if (status) status.textContent = 'Preferencias aplicadas en toda la aplicación.';
    if (save) localStorage.setItem(STORAGE_KEY, JSON.stringify(accessibility));
  }

  function openAccessibility() {
    previousFocus = document.activeElement;
    $('#accessibilityModal')?.classList.add('open');
    document.body.classList.add('modal-open');
    setTimeout(() => $('[data-a11y-text].active, #accessibilityModal button')?.focus(), 20);
  }

  function closeAccessibility() {
    $('#accessibilityModal')?.classList.remove('open');
    document.body.classList.remove('modal-open');
    stopReading();
    previousFocus?.focus?.();
  }

  function stopReading() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speech = null;
    const button = $('#a11yReadPage');
    if (button) button.textContent = '🔊 Leer esta pantalla en voz alta';
  }

  function readCurrentView() {
    if (!('speechSynthesis' in window)) {
      $('#a11yStatus').textContent = 'La lectura en voz alta no está disponible en este navegador.';
      return;
    }
    if (speech) {
      stopReading();
      $('#a11yStatus').textContent = 'Lectura detenida.';
      return;
    }
    const view = $('.view.active');
    const text = [
      $('h1', view)?.textContent,
      ...$$('p', view).slice(0, 5).map(item => item.textContent),
    ].filter(Boolean).join('. ');
    speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'es-ES';
    speech.rate = 0.92;
    speech.onend = () => {
      speech = null;
      $('#a11yReadPage').textContent = '🔊 Leer esta pantalla en voz alta';
      $('#a11yStatus').textContent = 'Lectura terminada.';
    };
    $('#a11yReadPage').textContent = '■ Detener lectura';
    $('#a11yStatus').textContent = 'Leyendo la pantalla actual.';
    window.speechSynthesis.speak(speech);
  }

  loadAccessibility();
  applyAccessibility(false);
  $('#accessibilityBtn')?.addEventListener('click', openAccessibility);
  $$('.close-accessibility').forEach(button => button.addEventListener('click', closeAccessibility));
  $('#accessibilityModal')?.addEventListener('click', event => {
    if (event.target.id === 'accessibilityModal') closeAccessibility();
  });
  $$('[data-a11y-text]').forEach(button => button.addEventListener('click', () => {
    accessibility.text = button.dataset.a11yText;
    applyAccessibility();
  }));
  [['#a11yContrast', 'contrast'], ['#a11yEasy', 'easy'], ['#a11yReduce', 'reduce']].forEach(([selector, key]) => {
    $(selector)?.addEventListener('change', event => {
      accessibility[key] = event.target.checked;
      applyAccessibility();
    });
  });
  $('#a11yReset')?.addEventListener('click', () => {
    accessibility = { ...defaults };
    applyAccessibility();
  });
  $('#a11yReadPage')?.addEventListener('click', readCurrentView);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#accessibilityModal')?.classList.contains('open')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeAccessibility();
    }
  }, true);
  $('#accessibilityModal')?.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = $$('button:not([disabled]), input:not([disabled])', event.currentTarget)
      .filter(control => control.offsetParent !== null);
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const stages = [
    { id: 'sheet', title: 'Prepara la ficha', copy: 'Imprime una ficha con ocho preguntas y cuatro referencias negras.' },
    { id: 'photo', title: 'Haz la foto', copy: 'Coloca la ficha completa dentro del marco del teléfono y evita sombras fuertes.' },
    { id: 'upload', title: 'Carga la imagen', copy: 'Pulsa «Subir zona de respuestas» y elige la fotografía.' },
    { id: 'process', title: 'Procesa la plantilla', copy: 'La app valida las cuatro esquinas y mide las 32 zonas de respuesta en el dispositivo.' },
    { id: 'review', title: 'Revisa la duda', copy: 'Si dos marcas se parecen, la app se detiene y el profesor confirma la respuesta.' },
    { id: 'reinforce', title: 'Prepara el refuerzo', copy: 'Con la respuesta confirmada se explica el error y se propone práctica específica.' },
    { id: 'check', title: 'Comprueba la mejora', copy: 'Una pregunta nueva sobre la misma habilidad muestra si el refuerzo funcionó.' },
  ];
  let currentStage = 0;
  let autoTimer = null;

  function drawSample(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 800;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 400, 800);
    ctx.fillStyle = '#102a2d';
    [[0, 0], [360, 0], [0, 760], [360, 760]].forEach(([x, y]) => ctx.fillRect(x, y, 40, 40));
    ctx.font = 'bold 19px Arial';
    ctx.fillText('FRACCIONES · A07', 62, 55);
    ctx.font = '13px Arial';
    ctx.fillText('Marca una respuesta por fila', 98, 78);
    const picks = [0, 1, 2, 3, 0, 2, 2, 1];
    picks.forEach((pick, row) => {
      const y = 100 + row * 85;
      [0, 1, 2, 3].forEach(column => {
        const x = 80 + column * 80;
        ctx.strokeStyle = '#66777a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#425356';
        ctx.font = '13px Arial';
        ctx.fillText(['A', 'B', 'C', 'D'][column], x - 4, y + 38);
      });
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(80 + pick * 80, y, 16, 0, Math.PI * 2);
      ctx.fill();
      if (row === 5) {
        ctx.beginPath();
        ctx.arc(160, y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function renderStage(index) {
    currentStage = (index + stages.length) % stages.length;
    const stage = stages[currentStage];
    const scene = $('#situScene');
    if (scene) scene.dataset.stage = stage.id;
    $('#situProgress').textContent = `Paso ${currentStage + 1} de ${stages.length}`;
    $('#situSceneTitle').textContent = stage.title;
    $('#situSceneCopy').textContent = stage.copy;
    $$('#situSteps .situ-step').forEach((button, buttonIndex) => {
      const active = buttonIndex === currentStage;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
    const button = $('#situDemoStart');
    if (button) button.textContent = '▶ Ver demostración automática';
  }

  function startAuto() {
    stopAuto();
    renderStage(0);
    $('#situDemoStart').textContent = '■ Pausar demostración';
    autoTimer = setInterval(() => {
      if (currentStage === stages.length - 1) {
        stopAuto();
        return;
      }
      renderStage(currentStage + 1);
    }, accessibility.reduce ? 5000 : 2600);
  }

  $('#situDemoStart')?.addEventListener('click', () => autoTimer ? stopAuto() : startAuto());
  $('#situDemoNext')?.addEventListener('click', () => { stopAuto(); renderStage(currentStage + 1); });
  $('#situDemoPrev')?.addEventListener('click', () => { stopAuto(); renderStage(currentStage - 1); });
  $$('#situSteps .situ-step').forEach((button, index) => button.addEventListener('click', () => {
    stopAuto();
    renderStage(index);
  }));

  async function loadSamplePhoto() {
    stopAuto();
    renderStage(2);
    const canvas = document.createElement('canvas');
    drawSample(canvas);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'ficha-ejemplo-A07.png', { type: 'image/png' });
    window.setView?.('scan');
    await window.CVCore?.loadScanFile(file);
    const title = $('#queueTitle');
    const subtitle = $('#queueSub');
    if (title) title.textContent = 'Foto de ejemplo preparada';
    if (subtitle) subtitle.textContent = 'Pulsa «Procesar A07» para ver la revisión docente';
    $('#startScan')?.focus();
    $('#scanValidation')?.scrollIntoView({ block: 'center', behavior: accessibility.reduce ? 'auto' : 'smooth' });
  }

  ['#useSamplePhoto', '#useSamplePhotoInline', '#useSamplePhotoScan'].forEach(selector => $(selector)?.addEventListener('click', loadSamplePhoto));
  drawSample($('#situSampleCanvas'));
  drawSample($('#situPhoneCanvas'));
  renderStage(0);

  window.CVAccessibility = {
    getSettings: () => ({ ...accessibility }),
    apply: next => { accessibility = { ...accessibility, ...next }; applyAccessibility(); },
  };
})();
