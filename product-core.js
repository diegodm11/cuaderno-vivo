(() => {
  'use strict';

  const DOMAIN_KEY = 'cv-pro-domain-v1';
  const DELETE_MARKER = 'cv-delete-all-once';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));

  function normalizeDomain(value) {
    const next = value && typeof value === 'object' ? value : {};
    next.version = 1;
    next.activities = next.activities || {};
    next.scan = next.scan || null;
    next.diagnoses = Array.isArray(next.diagnoses) ? next.diagnoses : [];
    next.reinforcement = next.reinforcement || {};
    next.exitEvidence = next.exitEvidence || null;
    next.evidence = Array.isArray(next.evidence) ? next.evidence : [];
    next.comments = next.comments || {};
    next.externalCases = Array.isArray(next.externalCases) ? next.externalCases : [];
    return next;
  }

  function readDomain() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DOMAIN_KEY));
      if (parsed && parsed.version === 1) return normalizeDomain(parsed);
    } catch {}
    return normalizeDomain({ version: 1, activities: {}, scan: null, diagnoses: [], reinforcement: {}, exitEvidence: null });
  }

  let domain = readDomain();
  let scanCanvas = null;
  let scanObjectUrl = null;
  let externalObjectUrl = null;
  const originalSave = window.save || save;

  if (sessionStorage.getItem(DELETE_MARKER)) {
    Object.keys(localStorage).filter(key => key.startsWith('cv-')).forEach(key => localStorage.removeItem(key));
  }

  function persist() {
    if (sessionStorage.getItem(DELETE_MARKER)) return;
    localStorage.setItem(DOMAIN_KEY, JSON.stringify(domain));
    window.CVLearningStore?.writeDomain(domain).catch(error => console.warn('No se pudo guardar en IndexedDB', error));
  }

  function activityKey() {
    const meta = activityMeta();
    return `${meta.code}::${meta.topic}`;
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
    const option = control.dataset.option;
    const field = control.dataset.field;
    if (option) {
      const optionIndex = ['A', 'B', 'C', 'D'].indexOf(option);
      if (optionIndex >= 0) questions[index].options[optionIndex] = control.value.trim();
    } else if (field && ['text', 'skill', 'key', 'difficulty', 'explanation'].includes(field)) {
      questions[index][field] = control.value.trim();
    } else {
      return;
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

  function cornerRatio(data, width, height, left, top, xSpan = 0.10, ySpan = 0.05) {
    let dark = 0;
    let total = 0;
    const x0 = left ? 0 : Math.floor(width * (1 - xSpan));
    const x1 = left ? Math.ceil(width * xSpan) : width;
    const y0 = top ? 0 : Math.floor(height * (1 - ySpan));
    const y1 = top ? Math.ceil(height * ySpan) : height;
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

  function cropToOmrInk(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const image = ctx.getImageData(0, 0, width, height);
    const step = Math.max(1, Math.floor(Math.max(width, height) / 1600));
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const offset = (y * width + x) * 4;
        const luminance = 0.2126 * image.data[offset] + 0.7152 * image.data[offset + 1] + 0.0722 * image.data[offset + 2];
        if (luminance >= 80 || image.data[offset + 3] <= 100) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) return canvas;
    const cropWidth = Math.min(width - minX, maxX - minX + step);
    const cropHeight = Math.min(height - minY, maxY - minY + step);
    if (cropWidth < width * 0.35 || cropHeight < height * 0.20) return canvas;
    if (minX <= step && minY <= step && maxX >= width - step * 2 && maxY >= height - step * 2) return canvas;
    const cropped = document.createElement('canvas');
    cropped.width = cropWidth;
    cropped.height = cropHeight;
    cropped.getContext('2d').drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    return cropped;
  }

  function analyzeCanvas(sourceCanvas) {
    const canvas = cropToOmrInk(sourceCanvas);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    if (width < 200 || height < 150) throw new Error('La imagen es demasiado pequeña. Usa al menos 200 × 150 píxeles.');
    const image = ctx.getImageData(0, 0, width, height);
    const landscape = width / height > 1.45;
    const cornerX = landscape ? 0.05 : 0.10;
    const cornerY = landscape ? 0.12 : 0.05;
    const corners = [
      cornerRatio(image.data, width, height, true, true, cornerX, cornerY),
      cornerRatio(image.data, width, height, false, true, cornerX, cornerY),
      cornerRatio(image.data, width, height, true, false, cornerX, cornerY),
      cornerRatio(image.data, width, height, false, false, cornerX, cornerY),
    ];
    const cornerThreshold = landscape ? 0.12 : 0.45;
    if (corners.some(value => value < cornerThreshold)) throw new Error('No se reconocen las cuatro referencias negras. Fotografía el recuadro completo.');

    const letters = ['A', 'B', 'C', 'D'];
    const answers = [];
    for (let row = 0; row < 8; row++) {
      const y = landscape ? height * (0.218 + row * 0.0937) : height * ((100 + row * 85) / 800);
      const ratios = [0, 1, 2, 3].map(column => darkRatio(
        image.data,
        width,
        height,
        landscape ? width * (0.226 + column * 0.1983) : width * ((80 + column * 80) / 400),
        y,
        landscape ? Math.max(4, Math.min(width * 0.008, height * 0.016)) : Math.max(6, Math.min(width / 400, height / 800) * 18),
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
    return { answers, corners: corners.map(value => Number(value.toFixed(3))), layout: landscape ? 'printed-strip' : 'canonical' };
  }

  function showScanMessage(message, type = 'error') {
    const box = $('#scanValidation');
    if (!box) return;
    box.hidden = false;
    box.className = `scan-validation ${type}`;
    box.textContent = message;
  }

  function selectedScanStudent(fileName = '') {
    const picker = $('#scanStudentCode');
    const fromName = String(fileName).toUpperCase().match(/(?:^|[^A-Z0-9])(A(?:0[1-9]|1\d|2[0-4]))(?:[^A-Z0-9]|$)/)?.[1];
    if (fromName && picker) picker.value = fromName;
    return picker?.value || fromName || 'A01';
  }

  function syncScanStudentUi(student) {
    const code = student || selectedScanStudent();
    if ($('#scanStudentCode')) $('#scanStudentCode').value = code;
    if ($('#externalStudent')) $('#externalStudent').value = code;
    if ($('#scanPaperTitle')) $('#scanPaperTitle').textContent = `${activityMeta().topic} · ${code}`.toUpperCase();
    const queueCode = $('.queue-item.active > span');
    if (queueCode) queueCode.textContent = code;
    const reviewStudent = $('.evidence-top > div:first-child strong');
    if (reviewStudent) reviewStudent.textContent = code;
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
      const student = selectedScanStudent(file.name);
      syncScanStudentUi(student);
      scanCanvas = canvas;
      domain.scan = { ...analysis, student, activity: activityKey(), capturedAt: new Date().toISOString() };
      persist();
      if (scanObjectUrl) URL.revokeObjectURL(scanObjectUrl);
      scanObjectUrl = URL.createObjectURL(file);
      const stage = $('.camera-stage');
      stage.style.backgroundImage = `linear-gradient(rgba(15,35,37,.18),rgba(15,35,37,.18)),url("${scanObjectUrl}")`;
      stage.style.backgroundSize = 'cover';
      showScanMessage('Plantilla reconocida. Las ocho filas se han leído localmente; revisa cualquier marca dudosa.', 'success');
      $('#scannerState span').textContent = 'Imagen validada · lista para procesar';
    } catch (error) {
      syncScanStudentUi(selectedScanStudent(file.name));
      openExternalTestFile(
        file,
        'La foto no corresponde a la plantilla controlada. Se ha abierto automáticamente como test externo: confirma la respuesta observada y la clave para corregirlo sin volver a subirla.',
      );
    }
  }

  function renderScanSummary() {
    const root = $('#scanAnswerSummary');
    const body = $('#scanAnswerSummary tbody');
    if (!root || !body || !domain.scan?.answers?.length) return;
    body.replaceChildren();
    let correctCount = 0;
    let incorrectCount = 0;
    let reviewCount = 0;
    domain.scan.answers.forEach(item => {
      const question = questions[item.question - 1] || questions[0];
      const needsReview = item.uncertain || item.answer === 'blank';
      const correct = !needsReview && item.answer === question.key;
      if (needsReview) reviewCount++;
      else if (correct) correctCount++;
      else incorrectCount++;
      const row = document.createElement('tr');
      const values = [
        `P${item.question}`,
        item.answer === 'blank' ? 'En blanco' : item.answer,
        question.key,
      ];
      values.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      const stateCell = document.createElement('td');
      const state = document.createElement('span');
      state.className = `scan-summary-state ${needsReview ? 'review' : correct ? 'correct' : 'incorrect'}`;
      state.textContent = needsReview ? 'Revisar' : correct ? 'Correcta' : 'Incorrecta';
      stateCell.appendChild(state);
      row.appendChild(stateCell);
      body.appendChild(row);
    });
    $('#scanSummaryScore').textContent = `${correctCount} correctas · ${incorrectCount} incorrectas · ${reviewCount} revisar`;
    root.hidden = false;
  }

  function updateReviewFromScan(item) {
    if (!item) return;
    renderScanSummary();
    syncScanStudentUi(domain.scan?.student);
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

  $('#scanStudentCode')?.addEventListener('change', event => {
    syncScanStudentUi(event.target.value);
    if (domain.scan?.answers?.length) {
      domain.scan.student = event.target.value;
      persist();
    }
  });
  syncScanStudentUi(selectedScanStudent());

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

  function writeExternalStatus(element, title, detail, className = '') {
    if (!element) return;
    element.hidden = false;
    element.className = `${element.id === 'externalProgress' ? 'external-progress' : 'external-result'}${className ? ` ${className}` : ''}`;
    const heading = document.createElement('strong');
    heading.textContent = title;
    const copy = document.createElement('span');
    copy.textContent = detail;
    element.replaceChildren(heading, copy);
  }

  function readExternalValue(id) {
    return String($('#' + id)?.value || '').trim();
  }

  function openExternalTestFile(file, notice = 'Test externo cargado. Confirma la respuesta observada y la clave para corregirlo y guardar el seguimiento.') {
    const result = $('#externalResult');
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 12 * 1024 * 1024) {
      writeExternalStatus(result, 'No se puede abrir la foto', 'Selecciona una imagen PNG, JPG o WebP de hasta 12 MB.', 'incorrect');
      return false;
    }
    if (externalObjectUrl) URL.revokeObjectURL(externalObjectUrl);
    externalObjectUrl = URL.createObjectURL(file);
    $('#externalPhotoPreview').src = externalObjectUrl;
    $('#externalPhotoName').textContent = file.name;
    const panel = $('#externalTestPanel');
    panel.hidden = false;
    panel.dataset.photoName = file.name;
    delete panel.dataset.caseId;
    result.hidden = true;
    $('#externalFollowupPanel').hidden = true;
    const flowNotice = $('#externalFlowNotice');
    flowNotice.textContent = notice;
    flowNotice.hidden = false;
    const scanValidation = $('#scanValidation');
    if (scanValidation) scanValidation.hidden = true;
    if ($('#scannerState span')) $('#scannerState span').textContent = 'Test externo cargado · completa los datos de corrección';
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  }

  $('#externalTestPhoto')?.addEventListener('change', event => {
    openExternalTestFile(event.target.files?.[0]);
    event.target.value = '';
  });

  $('#gradeExternalTest')?.addEventListener('click', () => {
    const panel = $('#externalTestPanel');
    const result = $('#externalResult');
    const student = readExternalValue('externalStudent').toUpperCase();
    const prompt = readExternalValue('externalQuestion');
    const skill = readExternalValue('externalSkill');
    const observed = readExternalValue('externalObserved');
    const expected = readExternalValue('externalExpected');
    if (!panel?.dataset.photoName || !student || !prompt || !skill || !observed || !expected) {
      writeExternalStatus(result, 'Faltan datos por confirmar', 'Carga la foto y completa alumno, pregunta, habilidad, respuesta observada y respuesta correcta.', 'incorrect');
      return;
    }
    const correct = observed === expected;
    const capturedAt = new Date().toISOString();
    const caseId = panel.dataset.caseId || `external-${Date.now()}`;
    panel.dataset.caseId = caseId;
    const record = {
      id: caseId,
      student,
      prompt,
      skill,
      observed,
      expected,
      correct,
      photoName: panel.dataset.photoName,
      capturedAt,
      followup: null,
    };
    domain.externalCases = domain.externalCases.filter(item => item.id !== caseId).concat(record);
    const evidence = {
      id: `${caseId}:initial`,
      activity: caseId,
      student,
      phase: 'initial',
      question: 'EXT-1',
      prompt,
      skill,
      observed,
      expected,
      correct,
      errorCode: correct ? '' : 'Respuesta incorrecta en un test externo; interpretación conceptual pendiente del profesor',
      confidence: null,
      reviewed: true,
      source: 'external-photo',
      capturedAt,
    };
    domain.evidence = domain.evidence.filter(item => item.id !== evidence.id).concat(evidence);
    domain.diagnoses = domain.diagnoses.filter(item => !(item.student === student && item.source === 'external-photo'));
    domain.diagnoses.push({
      student,
      question: 'EXT-1',
      skill,
      observed,
      expected,
      status: correct ? 'confirmed-correct' : 'needs-support',
      error: correct ? 'Respuesta inicial correcta; comprobar transferencia con una pregunta distinta.' : `Respondió ${observed === 'blank' ? 'en blanco' : observed}; la respuesta correcta confirmada es ${expected}.`,
      source: 'external-photo',
      reviewedAt: capturedAt,
    });
    writeExternalStatus(
      result,
      correct ? 'Correcta · evidencia inicial guardada' : 'Incorrecta · evidencia inicial guardada',
      `Respuesta observada: ${observed === 'blank' ? 'en blanco' : observed}. Respuesta correcta confirmada: ${expected}. La interpretación pedagógica sigue siendo decisión del profesor.`,
      correct ? '' : 'incorrect',
    );
    $('#externalFollowupPanel').hidden = false;
    $('#externalProgress').hidden = true;
    if ($('#reinforceGroupStudents')) $('#reinforceGroupStudents').textContent = student;
    if ($('#reinforceSkill')) $('#reinforceSkill').textContent = skill;
    if ($('#reinforceNeed')) $('#reinforceNeed').textContent = correct
      ? 'Comprobar transferencia con una pregunta distinta.'
      : `Revisar por qué eligió ${observed === 'blank' ? 'en blanco' : observed} cuando la clave confirmada es ${expected}.`;
    if ($('#reinforceTitle')) $('#reinforceTitle').textContent = `Refuerzo de ${skill}`;
    persist();
    window.CVLearningDashboard?.render();
  });

  $('#saveExternalFollowup')?.addEventListener('click', () => {
    const panel = $('#externalTestPanel');
    const progress = $('#externalProgress');
    const caseId = panel?.dataset.caseId;
    const record = domain.externalCases.find(item => item.id === caseId);
    const prompt = readExternalValue('externalFollowupQuestion');
    const observed = readExternalValue('externalFollowupObserved');
    const expected = readExternalValue('externalFollowupExpected');
    if (!record || !prompt || !observed || !expected) {
      writeExternalStatus(progress, 'Faltan datos de seguimiento', 'Escribe una pregunta distinta y confirma la respuesta del alumno y su clave.', 'incorrect');
      return;
    }
    const correct = observed === expected;
    const capturedAt = new Date().toISOString();
    record.followup = { prompt, observed, expected, correct, capturedAt };
    const evidence = {
      id: `${caseId}:exit`,
      activity: caseId,
      student: record.student,
      phase: 'exit',
      question: 'EXT-R1',
      prompt,
      skill: record.skill,
      observed,
      expected,
      correct,
      errorCode: correct ? '' : 'La habilidad todavía no se demuestra en una pregunta diferente',
      confidence: null,
      reviewed: true,
      source: 'external-photo',
      capturedAt,
    };
    domain.evidence = domain.evidence.filter(item => item.id !== evidence.id).concat(evidence);
    const before = record.correct ? 100 : 0;
    const after = correct ? 100 : 0;
    const change = after - before;
    const direction = change > 0 ? `+${change} puntos porcentuales` : change < 0 ? `${change} puntos porcentuales` : 'sin cambio';
    writeExternalStatus(
      progress,
      `${before} % → ${after} % · ${direction}`,
      correct
        ? 'La respuesta posterior es correcta en una pregunta distinta. Es mejora inmediata, todavía provisional hasta una comprobación demorada.'
        : 'La respuesta posterior sigue siendo incorrecta. Cambia el apoyo y registra otra evidencia distinta; no marques dominio.',
    );
    persist();
    window.CVLearningDashboard?.render();
  });

  window.addEventListener('beforeunload', () => {
    if (externalObjectUrl) URL.revokeObjectURL(externalObjectUrl);
  });

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

  function recordInitialEvidence(reviewedAnswer) {
    if (!domain.scan?.answers?.length) return;
    const reviewedItem = domain.scan.answers.find(item => item.uncertain || item.answer === 'blank') || domain.scan.answers[5];
    const student = domain.scan.student || 'A07';
    const activity = domain.scan.activity || activityKey();
    const capturedAt = new Date().toISOString();
    const additions = domain.scan.answers.map(item => {
      const question = questions[item.question - 1] || questions[0];
      const reviewed = item.question === reviewedItem?.question;
      const observed = reviewed ? reviewedAnswer : item.answer;
      const correct = observed === question.key;
      return {
        id: `${activity}:${student}:initial:${item.question}`,
        activity,
        student,
        phase: 'initial',
        question: item.question,
        skill: question.skill,
        observed,
        expected: question.key,
        correct,
        errorCode: correct ? '' : question.error,
        confidence: item.confidence,
        reviewed,
        capturedAt,
      };
    });
    const ids = new Set(additions.map(item => item.id));
    domain.evidence = domain.evidence.filter(item => !ids.has(item.id)).concat(additions);
  }

  $('#confirmAnswer')?.addEventListener('click', () => {
    setTimeout(() => {
      const diagnosis = diagnosisFromReview(state.reviewAnswer);
      domain.diagnoses = domain.diagnoses.filter(item => item.student !== diagnosis.student);
      domain.diagnoses.push(diagnosis);
      recordInitialEvidence(state.reviewAnswer);
      persist();
      const students = domain.diagnoses.filter(item => item.status === 'needs-support').map(item => item.student);
      if ($('#reinforceGroupStudents')) $('#reinforceGroupStudents').textContent = students.join(' · ') || 'Sin alumnos pendientes';
      const count = $('.reinforce-banner>div>span');
      if (count) count.textContent = String(students.length);
      if ($('#reinforceNeed')) $('#reinforceNeed').textContent = diagnosis.error;
      if ($('#reinforceSkill')) $('#reinforceSkill').textContent = diagnosis.skill;
      const pattern = window.CVLearningEngine?.summarize(domain.evidence, diagnosis.student).patterns[0];
      if (pattern) {
        if ($('#reinforceTitle')) $('#reinforceTitle').textContent = `Trabajar patrón: ${pattern.label}`;
        if ($('#reinforceNeed')) $('#reinforceNeed').textContent = pattern.explanation;
      }
      if (scanObjectUrl) { URL.revokeObjectURL(scanObjectUrl); scanObjectUrl = null; }
      $('.camera-stage')?.style.removeProperty('background-image');
      scanCanvas = null;
      window.CVLearningDashboard?.render();
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
      const lines = $$('.preview-step', target);
      taskTexts().slice(0, 5).forEach((text, index) => {
        const line = lines[index];
        if (!line) return;
        line.innerHTML = '';
        const number = document.createElement('b');
        number.textContent = `${index + 1}. `;
        line.append(number, document.createTextNode(text));
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
    const percent = Math.round((result.score / 2) * 100);
    $('.comparison-pro .green').textContent = score;
    if ($('#tableExitScore')) $('#tableExitScore').textContent = score;

    const afterRing = $('#resultAfterRing');
    const afterCard = $('#resultAfterCard');
    const changeCard = $('#resultChangeCard');
    const guidance = $('#resultGuidance');
    if (afterRing) {
      afterRing.style.setProperty('--score', String(percent));
      afterRing.classList.remove('pending');
    }
    if ($('#resultAfterPercent')) $('#resultAfterPercent').textContent = `${percent} %`;
    if ($('#resultAfterFraction')) $('#resultAfterFraction').textContent = `${result.score} de 2 correctas`;
    if ($('#resultDelta')) $('#resultDelta').textContent = `+${percent}`;
    if (afterCard) afterCard.dataset.score = String(percent);
    if (changeCard) changeCard.dataset.score = String(percent);

    const stateElement = $('#progressState');
    const tableState = $('#tableExitState');
    if (result.score === 2) {
      stateElement.textContent = 'Mejora inmediata observada';
      stateElement.className = 'tag success';
      if (tableState) { tableState.textContent = 'Provisional'; tableState.className = 'tag success'; }
      if ($('#resultAfterExplanation')) $('#resultAfterExplanation').textContent = 'Ha resuelto correctamente las 2 preguntas nuevas: 100 % de aciertos.';
      if ($('#resultChangeTitle')) $('#resultChangeTitle').textContent = 'Mejora completa en esta comprobación';
      if ($('#resultChangeExplanation')) $('#resultChangeExplanation').textContent = 'Pasa del 0 % al 100 %: mejora de 100 puntos porcentuales.';
      if (guidance) guidance.className = 'result-guidance success';
      if ($('.result-guidance-icon')) $('.result-guidance-icon').textContent = '✓';
      if ($('#resultGuidanceTitle')) $('#resultGuidanceTitle').textContent = 'Siguiente paso recomendado';
      if ($('#resultGuidanceText')) $('#resultGuidanceText').textContent = 'La mejora inmediata está observada, pero todavía es provisional. Programa una pregunta diferente para mañana y otra dentro de 7 días. Si mantiene al menos un 80 %, marca dominio estable.';
    } else if (result.score === 1) {
      stateElement.textContent = 'Progreso parcial';
      stateElement.className = 'tag warning';
      if (tableState) { tableState.textContent = 'Observar'; tableState.className = 'tag warning'; }
      if ($('#resultAfterExplanation')) $('#resultAfterExplanation').textContent = 'Ha resuelto 1 de 2 preguntas nuevas: 50 % de aciertos.';
      if ($('#resultChangeTitle')) $('#resultChangeTitle').textContent = 'Mejora parcial';
      if ($('#resultChangeExplanation')) $('#resultChangeExplanation').textContent = 'Pasa del 0 % al 50 %: mejora de 50 puntos porcentuales.';
      if (guidance) guidance.className = 'result-guidance warning';
      if ($('.result-guidance-icon')) $('.result-guidance-icon').textContent = '!';
      if ($('#resultGuidanceTitle')) $('#resultGuidanceTitle').textContent = 'Revisar antes de avanzar';
      if ($('#resultGuidanceText')) $('#resultGuidanceText').textContent = 'Revisa cuál de las dos preguntas falló, pide que explique por qué conserva el denominador y ofrece una práctica guiada. Después registra dos preguntas nuevas; no marques todavía el dominio.';
    } else {
      stateElement.textContent = 'Necesita otro apoyo';
      stateElement.className = 'tag danger';
      if (tableState) { tableState.textContent = 'Reforzar'; tableState.className = 'tag danger'; }
      if ($('#resultAfterExplanation')) $('#resultAfterExplanation').textContent = 'No ha resuelto correctamente ninguna de las 2 preguntas nuevas: 0 %.';
      if ($('#resultChangeTitle')) $('#resultChangeTitle').textContent = 'Sin cambio observado';
      if ($('#resultChangeExplanation')) $('#resultChangeExplanation').textContent = 'Permanece en el 0 %: el refuerzo aún no se transfiere a preguntas nuevas.';
      if (guidance) guidance.className = 'result-guidance danger';
      if ($('.result-guidance-icon')) $('.result-guidance-icon').textContent = '↻';
      if ($('#resultGuidanceTitle')) $('#resultGuidanceTitle').textContent = 'Cambiar la forma de apoyo';
      if ($('#resultGuidanceText')) $('#resultGuidanceText').textContent = 'No repitas la misma ficha. Vuelve al modelo visual de quintos, resuelve un ejemplo en voz alta y guía otro paso a paso. Comprueba de nuevo con dos preguntas diferentes antes de avanzar.';
    }
    if ($('#resultStartAction')) {
      $('#resultStartAction').textContent = 'Registrar otra comprobación →';
      $('#resultStartAction').hidden = false;
    }
  }

  function openExitEvidence(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    $('#exitEvidenceForm').hidden = false;
    $('#exitEvidenceForm select')?.focus();
    $('#exitEvidenceForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  $('#simulateExit')?.addEventListener('click', openExitEvidence, true);
  $('#resultStartAction')?.addEventListener('click', openExitEvidence);

  $('#exitEvidenceForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const responses = [data.get('exit1'), data.get('exit2')];
    const keys = ['C', 'B'];
    const score = responses.reduce((total, answer, index) => total + Number(answer === keys[index]), 0);
    domain.exitEvidence = { student: 'A07', responses, keys, score, capturedAt: new Date().toISOString() };
    const diagnosis = domain.diagnoses.find(item => item.student === 'A07');
    const skill = diagnosis?.skill || 'Operar';
    const activity = activityKey();
    const exitRecords = responses.map((answer, index) => ({
      id: `${activity}:A07:exit:R${index + 1}`,
      activity,
      student: 'A07',
      phase: 'exit',
      question: `R${index + 1}`,
      skill,
      observed: answer,
      expected: keys[index],
      correct: answer === keys[index],
      errorCode: answer === keys[index] ? '' : 'La estrategia todavía no se transfiere a una pregunta nueva',
      reviewed: true,
      capturedAt: domain.exitEvidence.capturedAt,
    }));
    const exitIds = new Set(exitRecords.map(item => item.id));
    domain.evidence = domain.evidence.filter(item => !exitIds.has(item.id)).concat(exitRecords);
    persist();
    paintExitEvidence(domain.exitEvidence);
    event.currentTarget.hidden = true;
    toast(`Exit ticket registrado: ${score}/2. La decisión final sigue siendo docente.`);
    window.CVLearningDashboard?.render();
  });

  $('#deleteDemo')?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    sessionStorage.setItem(DELETE_MARKER, '1');
    Object.keys(localStorage).filter(key => key.startsWith('cv-')).forEach(key => localStorage.removeItem(key));
    await window.CVLearningStore?.clear();
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.filter(name => name.startsWith('cuaderno-vivo')).map(name => caches.delete(name)));
    }
    location.reload();
  }, true);

  $('#resetDemo')?.addEventListener('click', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    localStorage.removeItem(DOMAIN_KEY);
    localStorage.removeItem('cv-pro-state');
    await window.CVLearningStore?.clear();
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
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), schema: 2, storage, indexedDB: clone(domain) }, null, 2)], { type: 'application/json' });
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
    async setTeacherComment(student, comment) {
      domain.comments[student] = { text: String(comment || '').slice(0, 500), reviewedAt: new Date().toISOString() };
      persist();
      return clone(domain.comments[student]);
    },
  };

  if (!sessionStorage.getItem(DELETE_MARKER)) window.CVLearningStore?.initialize(domain).then(saved => {
    if (!saved) return;
    domain = normalizeDomain(saved);
    localStorage.setItem(DOMAIN_KEY, JSON.stringify(domain));
    restoreQuestions();
    restoreReinforcement();
    if (domain.exitEvidence) paintExitEvidence(domain.exitEvidence);
    window.CVLearningDashboard?.render();
  }).catch(error => console.warn('IndexedDB no disponible; se mantiene la copia local compatible.', error));
})();
