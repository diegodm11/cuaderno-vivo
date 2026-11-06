(() => {
  'use strict';

  const STORAGE_KEY = 'cv-pro-learning-capsules-v1';
  const REACTION_KEY = 'cv-pro-capsule-reactions-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const subjectCapsules = {
    math: {
      hook: 'El truco visual para no volver a sumar denominadores',
      idea: 'Si las partes tienen el mismo tamaño, el denominador se conserva.',
      example: '2/5 + 1/5 = 3/5. Juntas dos partes y una parte: siguen siendo quintos.',
      challenge: 'Ahora tú: 3/7 + 2/7. ¿Qué número debe mantenerse?',
      accent: '#22c6b5', icon: '⅗',
    },
    literature: {
      hook: 'Una respuesta de lectura vale más cuando trae una prueba',
      idea: 'Interpretar no es adivinar: afirmación y evidencia deben ir juntas.',
      example: '“Está preocupado” + una frase concreta del texto que lo demuestra.',
      challenge: 'Elige una afirmación y localiza la línea que mejor la sostiene.',
      accent: '#f59e7a', icon: '“ ”',
    },
    science: {
      hook: '¿Dato o conclusión? Parecen lo mismo, pero no lo son',
      idea: 'El dato describe lo observado; la conclusión explica qué significa.',
      example: 'Dato: la planta creció 4 cm. Conclusión: la luz favoreció su crecimiento.',
      challenge: 'Lee un resultado nuevo y separa observación de explicación.',
      accent: '#7dd3a7', icon: '⚗',
    },
    biology: {
      hook: 'La forma de una estructura te da una pista sobre su función',
      idea: 'En biología, estructura y función se explican juntas.',
      example: 'Los alvéolos tienen gran superficie para facilitar el intercambio de gases.',
      challenge: 'Elige otra estructura y explica qué permite hacer su forma.',
      accent: '#9bd06f', icon: '⌬',
    },
    physics: {
      hook: 'Antes de calcular, pregunta: ¿qué representa cada dato?',
      idea: 'Un resultado físico necesita magnitud, unidad y una interpretación.',
      example: 'v = d/t: 100 m ÷ 20 s = 5 m/s. No basta con escribir “5”.',
      challenge: 'Estima primero y comprueba después si el resultado tiene sentido.',
      accent: '#74b9ff', icon: '∑',
    },
    history: {
      hook: 'Una fuente histórica nunca habla sola',
      idea: 'Pregunta quién la creó, cuándo, para quién y con qué propósito.',
      example: 'Un cartel de propaganda informa del periodo y también intenta convencer.',
      challenge: 'Analiza una fuente nueva: contexto, propósito y evidencia.',
      accent: '#e9b96e', icon: '⌛',
    },
    english: {
      hook: 'Third conditional en una sola idea: un pasado que ya no puedes cambiar',
      idea: 'If + had + participle, then would have + participle.',
      example: 'If I had studied, I would have passed the exam.',
      challenge: 'Complete: If we had left earlier, we ___ the train.',
      accent: '#b6a2ff', icon: 'EN',
    },
    technology: {
      hook: 'Tu primer diseño no tiene que ser perfecto: tiene que poder probarse',
      idea: 'Define, diseña, prueba y mejora usando evidencia.',
      example: 'Si el prototipo falla en un caso límite, el fallo señala qué iterar.',
      challenge: 'Elige un criterio de éxito y diseña una prueba concreta.',
      accent: '#62c6d8', icon: '</>',
    },
  };

  const sceneMeta = [
    ['GANCHO', 'Detén el scroll con una pregunta o sorpresa'],
    ['IDEA CLAVE', 'Una sola explicación que pueda recordarse'],
    ['EJEMPLO', 'Haz visible el procedimiento'],
    ['RETO', 'Termina con una acción del alumno'],
  ];

  const capsuleState = { scene: 0, template: 'flash', timer: null };

  function readCapsules() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function writeCapsules(capsules) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  }

  function currentSubject() {
    const meta = activityMeta();
    const profile = profileFor(meta.subject);
    return { meta, profile, preset: subjectCapsules[profile.key] || subjectCapsules.math };
  }

  function fieldValues() {
    return [
      $('#capsuleHook').value.trim(),
      $('#capsuleIdea').value.trim(),
      $('#capsuleExample').value.trim(),
      $('#capsuleChallenge').value.trim(),
    ];
  }

  function fillFromSubject(force = false) {
    const { meta, preset } = currentSubject();
    const fields = ['#capsuleHook', '#capsuleIdea', '#capsuleExample', '#capsuleChallenge'];
    const values = [preset.hook, preset.idea, preset.example, preset.challenge];
    fields.forEach((selector, index) => {
      const field = $(selector);
      if (force || !field.value.trim()) field.value = values[index];
    });
    $('#capsuleSubjectBadge').textContent = `${meta.subject} · ${meta.topic}`;
    $('#capsulePhone').style.setProperty('--capsule-accent', preset.accent);
    renderScenes();
  }

  function renderScenes() {
    const values = fieldValues();
    const { preset } = currentSubject();
    const root = $('#capsuleScenes');
    root.replaceChildren();
    values.forEach((text, index) => {
      const scene = document.createElement('section');
      scene.className = `capsule-scene${index === capsuleState.scene ? ' active' : ''}`;
      scene.dataset.scene = String(index);
      const eyebrow = document.createElement('span');
      eyebrow.textContent = sceneMeta[index][0];
      const icon = document.createElement('b');
      icon.textContent = index === 0 ? preset.icon : String(index + 1).padStart(2, '0');
      const title = document.createElement(index === 0 ? 'h2' : 'h3');
      title.id = index === capsuleState.scene ? 'capsuleSceneTitle' : '';
      title.textContent = text || sceneMeta[index][1];
      const help = document.createElement('p');
      help.textContent = sceneMeta[index][1];
      scene.append(eyebrow, icon, title, help);
      root.appendChild(scene);
    });
    $('#capsuleSceneCounter').textContent = `${capsuleState.scene + 1} / 4`;
    $$('#capsuleProgress i').forEach((bar, index) => bar.classList.toggle('active', index <= capsuleState.scene));
    $('#capsulePrev').disabled = capsuleState.scene === 0;
  }

  function goToScene(next) {
    capsuleState.scene = (next + 4) % 4;
    renderScenes();
  }

  function playCapsule() {
    clearInterval(capsuleState.timer);
    capsuleState.scene = 0;
    renderScenes();
    $('#capsulePlay').textContent = '■ Pausar';
    capsuleState.timer = setInterval(() => {
      if (capsuleState.scene === 3) {
        clearInterval(capsuleState.timer);
        capsuleState.timer = null;
        $('#capsulePlay').textContent = '↻ Reproducir';
        return;
      }
      goToScene(capsuleState.scene + 1);
    }, 1800);
  }

  function togglePlay() {
    if (capsuleState.timer) {
      clearInterval(capsuleState.timer);
      capsuleState.timer = null;
      $('#capsulePlay').textContent = '▶ Reproducir';
    } else playCapsule();
  }

  function setTemplate(name) {
    capsuleState.template = name;
    $$('#capsuleTemplates [data-capsule-template]').forEach(button => button.classList.toggle('active', button.dataset.capsuleTemplate === name));
    $('#capsulePhone').dataset.template = name;
    capsuleState.scene = 0;
    renderScenes();
  }

  function saveCapsule() {
    const values = fieldValues();
    if (values.some(value => !value)) {
      toast('Completa las cuatro escenas antes de guardar.');
      return;
    }
    const { meta, profile, preset } = currentSubject();
    const record = {
      id: `${meta.code}:${Date.now()}`,
      subject: meta.subject,
      subjectKey: profile.key,
      topic: meta.topic,
      level: meta.level,
      template: capsuleState.template,
      accent: preset.accent,
      scenes: values,
      createdAt: new Date().toISOString(),
    };
    const capsules = readCapsules();
    capsules.unshift(record);
    writeCapsules(capsules.slice(0, 30));
    const state = $('#capsuleSaveState');
    state.textContent = 'Guardada localmente';
    state.classList.add('saved');
    renderLibrary();
    toast('Cápsula guardada en tu biblioteca local.');
  }

  function loadCapsule(record) {
    ['#capsuleHook', '#capsuleIdea', '#capsuleExample', '#capsuleChallenge'].forEach((selector, index) => {
      $(selector).value = record.scenes[index] || '';
    });
    setTemplate(record.template || 'flash');
    $('#capsuleSubjectBadge').textContent = `${record.subject} · ${record.topic}`;
    $('#capsulePhone').style.setProperty('--capsule-accent', record.accent || '#22c6b5');
    capsuleState.scene = 0;
    renderScenes();
    toast('Cápsula abierta en el estudio.');
  }

  function renderLibrary() {
    const capsules = readCapsules();
    const root = $('#capsuleLibrary');
    $('#capsuleCount').textContent = String(capsules.length);
    root.replaceChildren();
    if (!capsules.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-evidence';
      empty.textContent = 'Todavía no has guardado ninguna cápsula.';
      root.appendChild(empty);
      return;
    }
    capsules.forEach(record => {
      const card = document.createElement('article');
      card.className = 'capsule-library-card';
      card.style.setProperty('--card-accent', record.accent || '#22c6b5');
      const meta = document.createElement('span');
      meta.textContent = `${record.subject} · ${record.topic}`;
      const title = document.createElement('strong');
      title.textContent = record.scenes[0];
      const help = document.createElement('small');
      help.textContent = `${record.level} · 4 escenas · ${record.template}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'text-btn';
      button.textContent = 'Abrir →';
      button.addEventListener('click', () => loadCapsule(record));
      card.append(meta, title, help, button);
      root.appendChild(card);
    });
  }

  function downloadScript() {
    const { meta } = currentSubject();
    const values = fieldValues();
    const labels = ['GANCHO · 3 s', 'IDEA CLAVE · 10 s', 'EJEMPLO · 12 s', 'RETO · 10 s'];
    const text = [`CUADERNO VIVO · GUION DE CÁPSULA`, `${meta.subject} · ${meta.level} · ${meta.topic}`, '', ...values.flatMap((value, index) => [labels[index], value, '']), 'Nota: guion local; revisar antes de grabar o compartir.'].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `capsula-${meta.code.toLowerCase()}.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    toast('Guion descargado. No se ha publicado en ninguna red.');
  }

  function recordReaction(kind) {
    let reactions = {};
    try { reactions = JSON.parse(localStorage.getItem(REACTION_KEY)) || {}; } catch {}
    reactions[kind] = (reactions[kind] || 0) + 1;
    localStorage.setItem(REACTION_KEY, JSON.stringify(reactions));
    toast(kind === 'understood' ? 'Respuesta registrada: lo entendí.' : 'Respuesta registrada: necesita otra explicación.');
  }

  ['#capsuleHook', '#capsuleIdea', '#capsuleExample', '#capsuleChallenge'].forEach(selector => $(selector)?.addEventListener('input', renderScenes));
  $('#capsuleTemplates')?.addEventListener('click', event => {
    const button = event.target.closest('[data-capsule-template]');
    if (button) setTemplate(button.dataset.capsuleTemplate);
  });
  $('#capsulePrev')?.addEventListener('click', () => goToScene(capsuleState.scene - 1));
  $('#capsuleNext')?.addEventListener('click', () => goToScene(capsuleState.scene + 1));
  $('#capsulePlay')?.addEventListener('click', togglePlay);
  $('#saveCapsule')?.addEventListener('click', saveCapsule);
  $('#downloadCapsuleScript')?.addEventListener('click', downloadScript);
  $$('.capsule-reactions [data-reaction]').forEach(button => button.addEventListener('click', () => recordReaction(button.dataset.reaction)));
  ['easySubject', 'easyLevel', 'easyTopic'].forEach(id => $('#' + id)?.addEventListener('change', () => setTimeout(() => fillFromSubject(true), 0)));
  document.addEventListener('click', event => {
    if (event.target.closest('[data-view="capsules"]')) setTimeout(() => { fillFromSubject(false); renderLibrary(); }, 0);
  });

  const baseSetView = window.setView;
  window.setView = function capsuleAwareSetView(name, focus = true) {
    baseSetView(name, focus);
    if (name === 'capsules') {
      fillFromSubject(false);
      renderLibrary();
    }
  };

  window.CVLearningCapsules = { readCapsules, render: () => { fillFromSubject(false); renderLibrary(); } };
  fillFromSubject(true);
  renderLibrary();
})();
