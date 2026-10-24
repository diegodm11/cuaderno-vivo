(() => {
  'use strict';

  const DOMAIN_KEY = 'cv-pro-domain-v1';
  const DELETE_MARKER = 'cv-delete-all-once';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));

  function readDomain() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DOMAIN_KEY));
      if (parsed && parsed.version === 1) return parsed;
    } catch {}
    return { version: 1, activities: {}, scan: null, diagnoses: [], reinforcement: {}, exitEvidence: null };
  }

  let domain = readDomain();
  let scanCanvas = null;
  let scanObjectUrl = null;
  const originalSave = window.save || save;

  if (sessionStorage.getItem(DELETE_MARKER)) {
    Object.keys(localStorage).filter(key => key.startsWith('cv-')).forEach(key => localStorage.removeItem(key));
  }

  function persist() {
    localStorage.setItem(DOMAIN_KEY, JSON.stringify(domain));
  }

  function activityKey() {
    return activityMeta().code;
  }

  function activityRecord(create = true) {
    const key = activityKey();
    if (!domain.activities[key] && create) {
      domain.activities[key] = {
        meta: activityMeta(),
        title: $('#activityTitle')?.value || `${activityMeta().topic} · Actividad inicial`,
        questions: clone(questions),
        updatedAt: new Date().toISOString(),
      };
    }
    return domain.activities[key] || null;
  }

  function storeQuestions() {
    const record = activityRecord();
    record.meta = activityMeta();
    record.title = $('#activityTitle')?.value || record.title;
    record.questions = clone(questions);
    record.updatedAt = new Date().toISOString();
    persist();
  }

  function restoreQuestions() {
    const record = activityRecord(false);
    if (!record?.questions?.length) {
      storeQuestions();
      return;
    }
    questions = clone(record.questions);
    renderQuestions();
    renderPaperAnswers();
    if ($('#activityTitle')) $('#activityTitle').value = record.title || `${activityMeta().topic} · Actividad inicial`;
    populateBatch();
  }

  function syncQuestionFromControl(control) {
    const rows = $$('#questionTable .q-row:not(.header)');
    const row = control.closest('.q-row');
    const index = rows.indexOf(row);
    if (index < 0 || !questions[index]) return;
    if (control.matches('input')) questions[index].text = control.value.trim();
    if (control.matches('select')) {
      const selects = $$('select', row);
      if (control === selects[0]) questions[index].skill = control.value;
      if (control === selects[1]) questions[index].key = control.value;
    }
    renderPaperAnswers();
    storeQuestions();
  }

  $('#questionTable')?.addEventListener('input', event => syncQuestionFromControl(event.target));
  $('#questionTable')?.addEventListener('change', event => syncQuestionFromControl(event.target));
  $('#activityTitle')?.addEventListener('input', storeQuestions);
  ['easySubject', 'easyLevel', 'easyTopic'].forEach(id => {
    $('#' + id)?.addEventListener('change', () => setTimeout(restoreQuestions, 0));
  });

  const originalBuildPrintRoot = buildPrintRoot;
  buildPrintRoot = function buildPersistentPrintRoot() {
    storeQuestions();
    originalBuildPrintRoot();
    const title = activityRecord().title;
    $$('#printRoot .print-page').forEach((page, index) => {
      const heading = $('h1', page);
      if (heading) heading.textContent = title;
      appendOmrStrip(page, `A${String(index + 1).padStart(2, '0')}`);
    });
  };

  function appendOmrStrip(page, studentCode) {
    const old = $('.omr-strip', page);
    if (old) old.remove();
    const strip = document.createElement('section');
    strip.className = 'omr-strip';
    strip.innerHTML = `<div class="omr-fiducial tl"></div><div class="omr-fiducial tr"></div>
      <div class="omr-strip-head"><strong>ZONA DE RESPUESTAS · ${studentCode}</strong><small>Para lectura automática, fotografía solo este recuadro completo.</small></div>
      <div class="omr-grid">${questions.map(q => `<div class="omr-row"><b>${q.n}</b>${['A','B','C','D'].map(letter => `<span><i></i>${letter}</span>`).join('')}</div>`).join('')}</div>
      <div class="omr-fiducial bl"></div><div class="omr-fiducial br"></div>`;
    page.appendChild(strip);
  }

  function darkRatio(data, width, height, cx, cy, radius) {
    let dark = 0;
    let total = 0;
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > radius * radius) continue;
        const offset = (y * width + x) * 4;
        const luminance = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
        if (luminance < 120 && data[offset + 3] > 100) dark++;
        total++;
      }
    }
    return total ? dark / total : 0;
  }

  function cornerRatio(data, width, height, left, top) {
    let dark = 0;
    let total = 0;
    const x0 = left ? 0 : Math.floor(width * 0.90);
    const x1 = left ? Math.ceil(width * 0.10) : width;
    const y0 = top ? 0 : Math.floor(height * 0.95);
    const y1 = top ? Math.ceil(height * 0.05) : height;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const offset = (y * width + x) * 4;
        const luminance = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
        if (luminance < 100 && data[offset + 3] > 100) dark++;
        total++;
      }
    }
    return total ? dark / total : 0;
  }

  function analyzeCanvas(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    if (width < 200 || height < 400) throw new Error('La imagen es demasiado pequeña. Usa al menos 200 × 400 píxeles.');
    const image = ctx.getImageData(0, 0, width, height);
    const corners = [
      cornerRatio(image.data, width, height, true, true),
      cornerRatio(image.data, width, height, false, true),
      cornerRatio(image.data, width, height, true, false),
      cornerRatio(image.data, width, height, false, false),
    ];
    if (corners.some(value => value < 0.45)) throw new Error('No se reconocen las cuatro referencias negras. Fotografía el recuadro completo.');

    const letters = ['A', 'B', 'C', 'D'];
    const answers = [];
    for (let row = 0; row < 8; row++) {
      const y = height * ((100 + row * 85) / 800);
      const ratios = [0, 1, 2, 3].map(column => darkRatio(
        image.data,
        width,
        height,
        width * ((80 + column * 80) / 400),
        y,
        Math.max(6, Math.min(width / 400, height / 800) * 18),
      ));
      const ranked = ratios.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score);
      const best = ranked[0];
      const second = ranked[1];
      const margin = best.score - second.score;
      const blank = best.score < 0.18;
      const uncertain = !blank && margin < 0.14;
      const confidence = blank ? 100 : Math.round(Math.min(99, 55 + margin * 100));
      answers.push({
        question: row + 1,
        answer: blank ? 'blank' : letters[best.index],
        confidence,
        uncertain,
        densities: ratios.map(value => Number(value.toFixed(3))),
      });
    }
    return { answers, corners: corners.map(value => Number(value.toFixed(3))) };
  }

  function showScanMessage(message, type = 'error') {
    const box = $('#scanValidation');
    if (!box) return;
    box.hidden = false;
    box.className = `scan-validation ${type}`;
    box.textContent = message;
  }

  async function loadScanFile(file) {
    domain.scan = null;
    scanCanvas = null;
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 12 * 1024 * 1024) {
      showScanMessage('Selecciona una imagen válida PNG, JPG o WebP de hasta 12 MB.');
      return;
    }
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      showScanMessage('No se pudo abrir una imagen válida. El archivo puede estar dañado.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close?.();
    try {
      const analysis = analyzeCanvas(canvas);
      scanCanvas = canvas;
      domain.scan = { ...analysis, student: 'A07', activity: activityKey(), capturedAt: new Date().toISOString() };
      persist();
      if (scanObjectUrl) URL.revokeObjectURL(scanObjectUrl);
      scanObjectUrl = URL.createObjectURL(file);
      const stage = $('.camera-stage');
      stage.style.backgroundImage = `linear-gradient(rgba(15,35,37,.18),rgba(15,35,37,.18)),url("${scanObjectUrl}")`;
      stage.style.backgroundSize = 'cover';
      showScanMessage('Plantilla reconocida. Las ocho filas se han leído localmente; revisa cualquier marca dudosa.', 'success');
      $('#scannerState span').textContent = 'Imagen validada · lista para procesar';
    } catch (error) {
      showScanMessage(error.message || 'No se reconoce la plantilla controlada.');
    }
  }

  function updateReviewFromScan(item) {
    if (!item) return;
    const question = questions[item.question - 1] || questions[0];
    $('#reviewPrompt').textContent = question.text;
    $('.evidence-top>div:nth-child(2) strong').textContent = `${item.question} de 8`;
    $('.evidence-top .amber').textContent = `${item.confidence} %`;
    const proposal = item.answer === 'blank' ? 'No se detecta una marca válida' : `La respuesta más probable es ${item.answer}`;
    $('#reviewProposal').textContent = proposal;
    const ranked = item.densities.map((density, index) => ({ density, index })).sort((a, b) => b.density - a.density);
    const evidenceOptions = $$('.crop-options span');
    evidenceOptions.forEach(option => option.classList.remove('selected', 'faint'));
    if (item.answer !== 'blank' && evidenceOptions[ranked[0].index]) evidenceOptions[ranked[0].index].classList.add('selected');
    if (evidenceOptions[ranked[1].index] && ranked[1].density > 0.02) evidenceOptions[ranked[1].index].classList.add('faint');
    const densityText = item.densities.map((density, index) => `${['A', 'B', 'C', 'D'][index]} ${Math.round(density * 100)} %`).join(' · ');
    const explanation = $('.decision-pane > p:not(.kicker)');
    if (explanation) explanation.textContent = `Densidad oscura medida: ${densityText}. Confianza relativa: ${item.confidence} %.`;
    const steps = $$('.processing-note li');
    const dynamicSteps = [
      'Ha validado las cuatro referencias negras de la plantilla controlada.',
      `Ha localizado la fila de la pregunta ${item.question} y medido sus cuatro zonas.`,
      item.answer === 'blank' ? 'No ha encontrado una separación suficiente entre marcas.' : `La mayor densidad corresponde a ${item.answer}.`,
      'Ha enviado la lectura a revisión docente antes de generar el diagnóstico.'
    ];
    steps.forEach((step, index) => { if (dynamicSteps[index]) step.textContent = dynamicSteps[index]; });
    const container = $('.decision-buttons');
    container.replaceChildren();
    ['A', 'B', 'C', 'D', 'blank'].forEach(answer => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `option${answer === item.answer ? ' recommended' : ''}`;
      button.dataset.answer = answer;
      const copy = document.createElement('span');
      const dot = document.createElement('i');
      const label = document.createElement('b');
      const help = document.createElement('small');
      label.textContent = answer === 'blank' ? 'Marcar en blanco' : `${answer === item.answer ? 'Confirmar' : 'Elegir'} ${answer}`;
      help.textContent = answer === item.answer ? 'Coincide con la lectura local' : 'Corrección manual del profesor';
      copy.append(dot, label, help);
      button.appendChild(copy);
      if (answer === item.answer) {
        const badge = document.createElement('em');
        badge.textContent = 'Propuesta';
        button.appendChild(badge);
      }
      container.appendChild(button);
    });
  }

  $('.decision-buttons')?.addEventListener('click', event => {
    const button = event.target.closest('.option');
    if (!button) return;
    event.preventDefault();
    $$('.decision-buttons .option').forEach(option => option.classList.toggle('selected', option === button));
    state.reviewAnswer = button.dataset.answer;
    $('#confirmAnswer').disabled = false;
    save();
  });

  function startScan() {
    if (!domain.scan?.answers?.length) {
      showScanMessage('Primero sube una imagen válida de la zona de respuestas. No se generarán resultados sin evidencia.');
      return;
    }
    const stage = $('.camera-stage');
    stage.classList.add('scanning');
    $('#queueTitle').textContent = 'Analizando 32 zonas de marca';
    $('#queueSub').textContent = 'Cálculo local sobre los píxeles de la imagen';
    const uncertain = domain.scan.answers.find(item => item.uncertain || item.answer === 'blank') || [...domain.scan.answers].sort((a, b) => a.confidence - b.confidence)[0];
    setTimeout(() => {
      stage.classList.remove('scanning');
      const reviewCount = domain.scan.answers.filter(item => item.uncertain || item.answer === 'blank').length;
      $('#queueTitle').textContent = `8 respuestas leídas · ${reviewCount || 1} para revisión`;
      $('#queueSub').textContent = `Confianza mínima ${Math.min(...domain.scan.answers.map(item => item.confidence))} %`;
      $('#queueIcon').textContent = '!';
      updateReviewFromScan(uncertain);
      state.reviewAnswer = null;
      save();
      setView('review');
    }, 700);
  }

  $('#photoInput')?.addEventListener('change', event => {
    event.stopImmediatePropagation();
    loadScanFile(event.target.files?.[0]);
    event.target.value = '';
  }, true);
  $('#startScan')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    startScan();
  }, true);

  function diagnosisFromReview(answer) {
    const scanItem = domain.scan?.answers?.find(item => item.uncertain || item.answer === 'blank') || domain.scan?.answers?.[5];
    const question = questions[(scanItem?.question || 6) - 1] || questions[5] || questions[0];
    const correct = answer === question.key;
    return {
      student: domain.scan?.student || 'A07',
      question: question.n,
      skill: question.skill,
      observed: answer,
      expected: question.key,
      status: correct ? 'confirmed-correct' : 'needs-support',
      error: correct ? 'Respuesta confirmada; comprobar transferencia.' : `Respondió ${answer === 'blank' ? 'en blanco' : answer}; la clave es ${question.key}.`,
      reviewedAt: new Date().toISOString(),
    };
  }

  $('#confirmAnswer')?.addEventListener('click', () => {
    setTimeout(() => {
      const diagnosis = diagnosisFromReview(state.reviewAnswer);
      domain.diagnoses = domain.diagnoses.filter(item => item.student !== diagnosis.student);
      domain.diagnoses.push(diagnosis);
      persist();
      const students = domain.diagnoses.filter(item => item.status === 'needs-support').map(item => item.student);
      if ($('#reinforceGroupStudents')) $('#reinforceGroupStudents').textContent = students.join(' · ') || 'Sin alumnos pendientes';
      const count = $('.reinforce-banner>div>span');
      if (count) count.textContent = String(students.length);
      if ($('#reinforceNeed')) $('#reinforceNeed').textContent = diagnosis.error;
      if ($('#reinforceSkill')) $('#reinforceSkill').textContent = diagnosis.skill;
      if (scanObjectUrl) { URL.revokeObjectURL(scanObjectUrl); scanObjectUrl = null; }
      $('.camera-stage')?.style.removeProperty('background-image');
      scanCanvas = null;
    }, 0);
  });

  function reinforcementKey() {
    return `${activityKey()}:${window.rstate?.group || 'focus'}`;
  }

  function taskTexts() {
    return $$('#taskList .task p').map(item => item.textContent.trim());
  }

  function saveReinforcement() {
    const texts = taskTexts();
    if (!texts.length) return;
    domain.reinforcement[reinforcementKey()] = {
      tasks: texts,
      updatedAt: new Date().toISOString(),
    };
    persist();
  }

  function restoreReinforcement() {
    const saved = domain.reinforcement[reinforcementKey()];
    if (!saved?.tasks) return;
    $$('#taskList .task p').forEach((item, index) => {
      if (saved.tasks[index]) item.textContent = saved.tasks[index];
    });
  }

  $('#taskList')?.addEventListener('input', saveReinforcement);
  $('#taskList')?.addEventListener('click', event => {
    if (event.target.closest('.edit-task')) setTimeout(saveReinforcement, 0);
  });
  ['durationChoices', 'reinforceModes', 'supportChoices'].forEach(id => {
    $('#' + id)?.addEventListener('click', () => setTimeout(restoreReinforcement, 0));
  });
  $('.strategy-tabs')?.addEventListener('click', () => setTimeout(restoreReinforcement, 0));
  $('#regeneratePlan')?.addEventListener('click', () => setTimeout(restoreReinforcement, 0));

  $('#previewMaterial')?.addEventListener('click', () => {
    const target = $('#previewSheetTasks');
    if (target) {
      target.innerHTML = '';
      taskTexts().slice(0, 5).forEach((text, index) => {
        const line = document.createElement('p');
        const number = document.createElement('b');
        number.textContent = `${index + 1}. `;
        line.append(number, document.createTextNode(text));
        target.appendChild(line);
      });
    }
  });

  $('#printReinforcement')?.addEventListener('click', () => {
    saveReinforcement();
    setTimeout(() => {
      const tasks = taskTexts();
      $$('#printRoot .print-question').forEach((item, index) => {
        const text = $('span', item);
        if (text && tasks[index]) text.textContent = tasks[index];
      });
    }, 0);
  });

  function paintExitEvidence(result) {
    const score = `${result.score}/2`;
    $('.comparison-pro .green').textContent = score;
    if ($('#tableExitScore')) $('#tableExitScore').textContent = score;
    const stateElement = $('#progressState');
    const tableState = $('#tableExitState');
    if (result.score === 2) {
      stateElement.textContent = 'Mejora inmediata observada';
      stateElement.className = 'tag success';
      if (tableState) { tableState.textContent = 'Provisional'; tableState.className = 'tag success'; }
    } else if (result.score === 1) {
      stateElement.textContent = 'Progreso parcial';
      stateElement.className = 'tag warning';
      if (tableState) { tableState.textContent = 'Observar'; tableState.className = 'tag warning'; }
    } else {
      stateElement.textContent = 'Necesita otro apoyo';
      stateElement.className = 'tag danger';
      if (tableState) { tableState.textContent = 'Reforzar'; tableState.className = 'tag danger'; }
    }
  }

  $('#simulateExit')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    $('#exitEvidenceForm').hidden = false;
    $('#exitEvidenceForm select').first?.focus();
  }, true);

  $('#exitEvidenceForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const responses = [data.get('exit1'), data.get('exit2')];
    const keys = ['C', 'B'];
    const score = responses.reduce((total, answer, index) => total + Number(answer === keys[index]), 0);
    domain.exitEvidence = { student: 'A07', responses, keys, score, capturedAt: new Date().toISOString() };
    persist();
    paintExitEvidence(domain.exitEvidence);
    event.currentTarget.hidden = true;
    toast(`Exit ticket registrado: ${score}/2. La decisión final sigue siendo docente.`);
  });

  $('#deleteDemo')?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    sessionStorage.setItem(DELETE_MARKER, '1');
    Object.keys(localStorage).filter(key => key.startsWith('cv-')).forEach(key => localStorage.removeItem(key));
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('cuaderno-vivo')).map(name => caches.delete(name)));
    }
    location.reload();
  }, true);

  $('#resetDemo')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    localStorage.removeItem(DOMAIN_KEY);
    localStorage.removeItem('cv-pro-state');
    location.reload();
  }, true);

  $('#exportData')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const storage = Object.fromEntries(Object.keys(localStorage).filter(key => key.startsWith('cv-')).map(key => {
      let value = localStorage.getItem(key);
      try { value = JSON.parse(value); } catch {}
      return [key, value];
    }));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), schema: 1, storage }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuaderno-vivo-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, true);

  restoreQuestions();
  restoreReinforcement();
  if (domain.exitEvidence) paintExitEvidence(domain.exitEvidence);
  if (sessionStorage.getItem(DELETE_MARKER)) {
    Object.keys(localStorage).filter(key => key.startsWith('cv-')).forEach(key => localStorage.removeItem(key));
    const quietSave = save;
    save = () => {};
    setTimeout(() => {
      sessionStorage.removeItem(DELETE_MARKER);
      save = quietSave;
    }, 1500);
  }

  window.CVCore = {
    analyzeCanvas,
    getDomain: () => clone(domain),
    loadScanFile,
    startScan,
  };
})();
