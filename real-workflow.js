(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const state = { online: false, classroom: null, exam: null, scanFiles: [], cameraStream: null, previewUrls: [] };
  const templateQuestions = [
    ['¿Qué fracción es equivalente a 1/2?', ['2/4', '1/3', '3/4', '2/3'], 'A', 'Equivalencias'],
    ['¿Cuál es mayor?', ['2/5', '4/5', '1/5', '3/10'], 'B', 'Comparar fracciones'],
    ['2/7 + 3/7 =', ['5/14', '5/7', '6/7', '1/7'], 'B', 'Suma de fracciones'],
    ['3/4 − 1/4 =', ['1/4', '1/2', '2/8', '3/8'], 'B', 'Resta de fracciones'],
    ['¿Qué fracción representa tres partes de ocho?', ['3/5', '5/8', '3/8', '8/3'], 'C', 'Representar fracciones'],
    ['Ordena de menor a mayor: 1/6, 5/6, 3/6.', ['1/6, 3/6, 5/6', '5/6, 3/6, 1/6', '3/6, 1/6, 5/6', '1/6, 5/6, 3/6'], 'A', 'Ordenar fracciones'],
    ['Marta come 2/8 de una tarta y Luis 3/8. ¿Cuánto comen?', ['5/16', '1/8', '5/8', '6/8'], 'C', 'Problemas con fracciones'],
    ['¿Cuál de estas fracciones equivale a una unidad?', ['4/5', '6/6', '3/6', '1/6'], 'B', 'Unidad fraccionaria'],
  ];

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('El servidor local no está conectado.');
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || `Error local ${response.status}`);
    return data;
  }

  function status(message, kind = '') {
    const root = byId('realCreateResult');
    if (!root) return;
    root.className = `real-result ${kind}`;
    root.textContent = message;
  }

  function renderQuestionEditor() {
    const root = byId('realQuestionRows');
    if (!root) return;
    root.replaceChildren();
    templateQuestions.forEach((question, index) => {
      const row = document.createElement('fieldset');
      row.className = 'real-question-row';
      const legend = document.createElement('legend');
      legend.textContent = `Pregunta ${index + 1}`;
      row.append(legend);
      const fields = [
        ['Enunciado', 'prompt', question[0]],
        ['Opción A', 'optionA', question[1][0]],
        ['Opción B', 'optionB', question[1][1]],
        ['Opción C', 'optionC', question[1][2]],
        ['Opción D', 'optionD', question[1][3]],
        ['Habilidad', 'skill', question[3]],
      ];
      fields.forEach(([labelText, name, value]) => {
        const label = document.createElement('label');
        const span = document.createElement('span');
        const input = document.createElement('input');
        span.textContent = labelText;
        input.name = name;
        input.value = value;
        input.required = true;
        input.maxLength = name === 'prompt' ? 2000 : 500;
        label.append(span, input);
        row.append(label);
      });
      const keyLabel = document.createElement('label');
      const keyTitle = document.createElement('span');
      const keySelect = document.createElement('select');
      keyTitle.textContent = 'Solución';
      keySelect.name = 'answer';
      'ABCD'.split('').forEach(letter => {
        const option = document.createElement('option');
        option.value = option.textContent = letter;
        option.selected = letter === question[2];
        keySelect.append(option);
      });
      keyLabel.append(keyTitle, keySelect);
      row.append(keyLabel);
      root.append(row);
    });
  }

  function collectQuestions() {
    return [...document.querySelectorAll('#realQuestionRows .real-question-row')].map((row, index) => {
      const value = name => row.querySelector(`[name="${name}"]`).value.trim();
      return {
        id: `Q${index + 1}`,
        type: 'choice',
        prompt: value('prompt'),
        options: ['optionA', 'optionB', 'optionC', 'optionD'].map(value),
        answer: value('answer'),
        skill: value('skill'),
        points: 1,
      };
    });
  }

  async function loadClasses(preferred = '') {
    const classes = await api('/api/real/classes');
    const select = byId('realClassSelect');
    select.replaceChildren();
    if (!classes.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Aún no hay clases';
      select.append(option);
      await selectClass('');
      return;
    }
    classes.forEach(classroom => {
      const option = document.createElement('option');
      option.value = classroom.id;
      option.textContent = classroom.name;
      option.selected = classroom.id === preferred;
      select.append(option);
    });
    if (preferred) select.value = preferred;
    await selectClass(select.value);
  }

  async function selectClass(classId) {
    state.classroom = null;
    state.exam = null;
    const studentSelect = byId('realStudentSelect');
    studentSelect.replaceChildren();
    byId('realDownloadPdf').removeAttribute('href');
    byId('realDownloadPdf').classList.add('disabled');
    byId('realDownloadPdf').setAttribute('aria-disabled', 'true');
    if (!classId) {
      byId('realCreateExam').disabled = true;
      studentSelect.disabled = true;
      byId('realLoadHistory').disabled = true;
      return;
    }
    state.classroom = await api(`/api/real/classes/${encodeURIComponent(classId)}`);
    state.classroom.students.forEach(student => {
      const option = document.createElement('option');
      option.value = option.textContent = student.code;
      studentSelect.append(option);
    });
    studentSelect.disabled = false;
    byId('realLoadHistory').disabled = false;
    byId('realCreateExam').disabled = !state.online;
    const exams = await api(`/api/real/classes/${encodeURIComponent(classId)}/exams`);
    if (exams.length) setExam(exams[0]);
  }

  function setExam(exam) {
    state.exam = exam;
    const link = byId('realDownloadPdf');
    link.href = `/api/real/exams/${encodeURIComponent(exam.id)}/pdf`;
    link.classList.remove('disabled');
    link.removeAttribute('aria-disabled');
  }

  async function createClass() {
    status('Creando la clase y sus identificadores…');
    try {
      const classroom = await api('/api/real/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: byId('realClassName').value.trim(),
          studentCount: Number(byId('realStudentCount').value),
        }),
      });
      await loadClasses(classroom.id);
      status(`Clase guardada: ${classroom.students.length} alumnos, de ${classroom.students[0].code} a ${classroom.students.at(-1).code}.`, 'success');
    } catch (error) {
      status(error.message, 'error');
    }
  }

  async function createExam() {
    if (!state.classroom) return status('Primero selecciona o crea una clase.', 'error');
    status('Validando y guardando el examen…');
    try {
      const exam = await api('/api/real/exams', {
        method: 'POST',
        body: JSON.stringify({
          classId: state.classroom.id,
          title: byId('realExamTitle').value.trim(),
          subject: byId('realExamSubject').value.trim(),
          version: byId('realExamVersion').value.trim(),
          questions: collectQuestions(),
        }),
      });
      setExam(exam);
      status(`Examen guardado con ${exam.questions.length} preguntas. El PDF se genera desde SQLite al descargarlo.`, 'success');
    } catch (error) {
      status(error.message, 'error');
    }
  }

  async function loadHistory() {
    if (!state.classroom) return;
    const code = byId('realStudentSelect').value;
    const root = byId('realHistory');
    root.textContent = 'Consultando SQLite…';
    try {
      const history = await api(`/api/real/classes/${encodeURIComponent(state.classroom.id)}/students/${encodeURIComponent(code)}/history`);
      root.replaceChildren();
      if (!history.length) {
        root.textContent = `${code} todavía no tiene resultados guardados.`;
        return;
      }
      history.forEach(attempt => {
        const article = document.createElement('article');
        const title = document.createElement('strong');
        const detail = document.createElement('span');
        title.textContent = `${attempt.title} · ${attempt.score}/${attempt.maximum}`;
        detail.textContent = `${attempt.source} · ${new Date(attempt.created_at).toLocaleString()}`;
        article.append(title, detail);
        root.append(article);
      });
    } catch (error) {
      root.textContent = error.message;
    }
  }

  async function fileBase64(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }

  function renderPhotoPreview() {
    state.previewUrls.forEach(url => URL.revokeObjectURL(url));
    state.previewUrls = [];
    const root = byId('realPhotoPreview');
    root.replaceChildren();
    state.scanFiles.forEach((file, index) => {
      const article = document.createElement('article');
      const image = document.createElement('img');
      const detail = document.createElement('span');
      const remove = document.createElement('button');
      const url = URL.createObjectURL(file);
      state.previewUrls.push(url);
      image.src = url;
      image.alt = `Vista previa de ${file.name}`;
      detail.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
      remove.type = 'button';
      remove.className = 'text-btn';
      remove.textContent = 'Quitar';
      remove.setAttribute('aria-label', `Quitar ${file.name}`);
      remove.addEventListener('click', () => {
        state.scanFiles.splice(index, 1);
        renderPhotoPreview();
      });
      article.append(image, detail, remove);
      root.append(article);
    });
    byId('realProcessScans').disabled = !state.scanFiles.length;
    if (!state.scanFiles.length) root.textContent = 'Todavía no hay fotografías seleccionadas.';
  }

  function addScanFiles(files) {
    const accepted = [...files].filter(file => /^image\/(png|jpeg|webp)$/.test(file.type) && file.size <= 20 * 1024 * 1024);
    const rejected = files.length - accepted.length;
    state.scanFiles.push(...accepted);
    renderPhotoPreview();
    if (rejected) byId('realCameraMessage').textContent = `${rejected} archivo(s) rechazado(s). Usa PNG, JPG o WebP de hasta 20 MB.`;
  }

  function closeCamera() {
    state.cameraStream?.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
    byId('realCameraVideo').srcObject = null;
    byId('realCameraPanel').hidden = true;
  }

  async function openCamera() {
    const message = byId('realCameraMessage');
    if (!navigator.mediaDevices?.getUserMedia) {
      message.textContent = 'Este navegador no ofrece cámara en vivo. Pulsa «Hacer foto» para usar la cámara nativa o «Elegir imágenes».';
      byId('realCameraPanel').hidden = false;
      return;
    }
    try {
      state.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      const video = byId('realCameraVideo');
      video.srcObject = state.cameraStream;
      byId('realCameraPanel').hidden = false;
      message.textContent = 'Coloca la hoja completa dentro de la imagen y evita sombras.';
      await video.play();
    } catch {
      byId('realCameraPanel').hidden = false;
      message.textContent = 'No se pudo abrir la cámara. Revisa el permiso del navegador o usa «Hacer foto»/«Elegir imágenes».';
    }
  }

  function takePhoto() {
    const video = byId('realCameraVideo');
    const canvas = byId('realCameraCanvas');
    if (!video.videoWidth || !video.videoHeight) {
      byId('realCameraMessage').textContent = 'La cámara todavía no está lista.';
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      addScanFiles([new File([blob], `examen-${stamp}.jpg`, { type: 'image/jpeg' })]);
      closeCamera();
    }, 'image/jpeg', 0.9);
  }

  async function processScans() {
    const files = [...state.scanFiles];
    const root = byId('realScanResults');
    root.replaceChildren();
    if (!files.length) {
      root.textContent = 'Haz una foto o selecciona al menos una imagen.';
      return;
    }
    byId('realProcessScans').disabled = true;
    if (!state.online) {
      const file = files[0];
      const row = document.createElement('article');
      row.textContent = `${file.name}: analizando localmente en este dispositivo…`;
      root.append(row);
      try {
        await window.CVCore?.loadScanFile(file);
        window.CVCore?.startScan();
        row.className = 'success';
        row.textContent = files.length > 1
          ? `${file.name}: preparada para revisión local. Procesa las demás fotografías de una en una.`
          : `${file.name}: preparada para revisión local sin subirla a Internet.`;
      } catch (error) {
        row.className = 'error';
        row.textContent = `${file.name}: ${error.message}`;
      }
      byId('realProcessScans').disabled = false;
      return;
    }
    for (const file of files) {
      const row = document.createElement('article');
      row.textContent = `${file.name}: procesando…`;
      root.append(row);
      try {
        const result = await api('/api/real/scans', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, imageBase64: await fileBase64(file) }),
        });
        row.className = result.needs_review ? 'warning' : 'success';
        row.textContent = result.needs_review
          ? `${file.name}: ${result.student}, revisión necesaria en ${result.review_questions.join(', ')}. No se ha guardado nota.`
          : `${file.name}: ${result.student}, página ${result.page}, resultado ${result.score}/${result.maximum}; guardado en su historial.`;
      } catch (error) {
        row.className = 'error';
        row.textContent = `${file.name}: ${error.message}`;
      }
    }
    byId('realProcessScans').disabled = !state.online;
  }

  async function initialize() {
    renderQuestionEditor();
    try {
      await api('/api/classroom/status');
      state.online = true;
      byId('realServerState').className = 'tag success';
      byId('realServerState').textContent = 'Servidor local conectado';
      byId('realCreateClass').disabled = false;
      renderPhotoPreview();
      await loadClasses();
    } catch {
      state.online = false;
      byId('realServerState').className = 'tag';
      byId('realServerState').textContent = 'Modo web · fotos locales';
      status('La web funciona como app desde cualquier dispositivo. Las fotografías se analizan en este navegador; SQLite y el PDF avanzado requieren el servidor LAN.', 'success');
      renderPhotoPreview();
    }
  }

  byId('realCreateClass')?.addEventListener('click', createClass);
  byId('realClassSelect')?.addEventListener('change', event => selectClass(event.target.value));
  byId('realCreateExam')?.addEventListener('click', createExam);
  byId('realLoadHistory')?.addEventListener('click', loadHistory);
  byId('realStudentSelect')?.addEventListener('change', loadHistory);
  byId('realScanFiles')?.addEventListener('change', event => {
    addScanFiles(event.target.files || []);
    event.target.value = '';
  });
  byId('realCameraInput')?.addEventListener('change', event => {
    addScanFiles(event.target.files || []);
    event.target.value = '';
  });
  byId('realOpenNativeCamera')?.addEventListener('click', () => byId('realCameraInput').click());
  byId('realChooseFiles')?.addEventListener('click', () => byId('realScanFiles').click());
  byId('realOpenCamera')?.addEventListener('click', openCamera);
  byId('realTakePhoto')?.addEventListener('click', takePhoto);
  byId('realCloseCamera')?.addEventListener('click', closeCamera);
  byId('realProcessScans')?.addEventListener('click', processScans);
  window.addEventListener('pagehide', closeCamera);
  initialize();
})();
