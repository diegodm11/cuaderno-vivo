(() => {
  'use strict';

  const DB_NAME = 'cuaderno-vivo-pro';
  const DB_VERSION = 1;
  const STORE_NAME = 'state';
  const DOMAIN_KEY = 'domain';

  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => String(value ?? '');

  function normalizeDomain(value) {
    const domain = value && typeof value === 'object' ? clone(value) : {};
    domain.version = 1;
    domain.activities = domain.activities || {};
    domain.scan = domain.scan || null;
    domain.diagnoses = Array.isArray(domain.diagnoses) ? domain.diagnoses : [];
    domain.reinforcement = domain.reinforcement || {};
    domain.exitEvidence = domain.exitEvidence || null;
    domain.evidence = Array.isArray(domain.evidence) ? domain.evidence : [];
    domain.comments = domain.comments || {};
    return domain;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, operation) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  const store = {
    async readDomain() {
      const value = await withStore('readonly', objectStore => objectStore.get(DOMAIN_KEY));
      return value ? normalizeDomain(value) : null;
    },
    async writeDomain(domain) {
      const normalized = normalizeDomain(domain);
      await withStore('readwrite', objectStore => objectStore.put(normalized, DOMAIN_KEY));
      return normalized;
    },
    async initialize(fallback) {
      const saved = await this.readDomain();
      if (saved) return saved;
      return this.writeDomain(normalizeDomain(fallback));
    },
    async clear() {
      await withStore('readwrite', objectStore => objectStore.clear());
    },
    databaseName: DB_NAME,
  };

  function masteryFor(items) {
    if (!items.length) return { level: 'Sin evidencia', ratio: 0, explanation: 'Todavía no hay respuestas registradas.' };
    const reviewed = items.filter(item => item.reviewed);
    const exit = reviewed.filter(item => item.phase === 'exit');
    const retention = reviewed.filter(item => item.phase === 'retention');
    const correct = reviewed.filter(item => item.correct).length;
    const ratio = reviewed.length ? Math.round(correct / reviewed.length * 100) : 0;
    if (retention.length && retention.every(item => item.correct)) {
      return { level: 'Consolidado', ratio, explanation: 'Hay evidencia correcta y revisada en una comprobación de retención.' };
    }
    if (exit.length >= 2 && exit.every(item => item.correct)) {
      return { level: 'Dominio provisional', ratio, explanation: 'Supera dos preguntas posteriores; falta comprobar la retención.' };
    }
    if (!reviewed.length) {
      return { level: 'Inicial', ratio: 0, explanation: 'Solo hay lecturas automáticas pendientes de revisión docente.' };
    }
    if (ratio >= 60) return { level: 'En progreso', ratio, explanation: 'Combina aciertos y errores revisados; necesita más evidencia.' };
    return { level: 'Inicial', ratio, explanation: 'La evidencia revisada muestra que todavía necesita apoyo.' };
  }

  function summarize(evidence, student) {
    const records = (Array.isArray(evidence) ? evidence : []).filter(item => item.student === student);
    const skillNames = [...new Set(records.map(item => item.skill).filter(Boolean))];
    const skills = skillNames.map(skill => {
      const items = records.filter(item => item.skill === skill);
      return { skill, ...masteryFor(items), evidenceCount: items.length };
    }).sort((a, b) => a.skill.localeCompare(b.skill, 'es'));

    const grouped = new Map();
    records.filter(item => item.correct === false && item.errorCode).forEach(item => {
      const key = `${item.skill}::${item.errorCode}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    });
    const patterns = [...grouped.values()].filter(items => items.length >= 2).map(items => {
      const reviewedCount = items.filter(item => item.reviewed).length;
      const questions = items.map(item => item.question);
      const evidenceState = reviewedCount === items.length ? 'revisados por el docente' : `${reviewedCount} revisados y ${items.length - reviewedCount} pendientes`;
      return {
        skill: items[0].skill,
        label: items[0].errorCode,
        count: items.length,
        questions,
        reviewStatus: reviewedCount === items.length ? 'confirmed' : 'provisional',
        explanation: `${items.length} errores con la misma etiqueta (${evidenceState}) en ${questions.map(value => `P${value}`).join(' y ')}. Es una sugerencia pedagógica, no un diagnóstico clínico.`,
      };
    });
    return { student, records: records.sort((a, b) => text(a.capturedAt).localeCompare(text(b.capturedAt))), skills, patterns };
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function renderSkills(root, skills) {
    root.replaceChildren();
    if (!skills.length) {
      root.append(element('p', 'empty-evidence', 'Todavía no hay evidencias reales para este código.'));
      return;
    }
    skills.forEach(item => {
      const card = element('article', 'learning-skill-card');
      const heading = element('div', 'learning-skill-heading');
      heading.append(element('strong', '', item.skill), element('span', `mastery-level level-${item.level.toLowerCase().replaceAll(' ', '-')}`, item.level));
      const bar = element('div', 'learning-progress-bar');
      const fill = element('i');
      fill.style.width = `${item.ratio}%`;
      bar.append(fill);
      card.append(heading, bar, element('small', '', `${item.ratio} % de aciertos revisados · ${item.evidenceCount} evidencias`), element('p', '', item.explanation));
      root.append(card);
    });
  }

  function renderPatterns(root, patterns) {
    root.replaceChildren();
    if (!patterns.length) {
      root.append(element('p', 'empty-evidence', 'No hay dos errores equivalentes suficientes para sugerir un patrón.'));
      return;
    }
    patterns.forEach(pattern => {
      const card = element('article', `pattern-card ${pattern.reviewStatus}`);
      const top = element('div', 'pattern-top');
      top.append(element('strong', '', pattern.label), element('span', '', pattern.reviewStatus === 'confirmed' ? 'Confirmado' : 'Revisar'));
      card.append(top, element('small', '', pattern.skill), element('p', '', pattern.explanation));
      root.append(card);
    });
  }

  function renderTimeline(root, records) {
    root.replaceChildren();
    if (!records.length) {
      root.append(element('p', 'empty-evidence', 'El historial aparecerá después de revisar una ficha.'));
      return;
    }
    records.forEach(record => {
      const row = element('li', 'timeline-entry');
      const mark = element('span', record.correct ? 'ok' : 'needs', record.correct ? '✓' : '!');
      const body = element('div');
      const phase = record.phase === 'exit' ? 'Evaluación posterior' : record.phase === 'retention' ? 'Retención' : 'Actividad inicial';
      body.append(element('strong', '', `${phase} · ${record.skill}`), element('p', '', `P${record.question}: ${record.correct ? 'respuesta correcta' : `error “${record.errorCode || 'sin clasificar'}”`} · ${record.reviewed ? 'revisada' : 'lectura automática pendiente'}`));
      row.append(mark, body);
      root.append(row);
    });
  }

  async function renderDashboard() {
    const panel = document.querySelector('#learningHistoryPanel');
    if (!panel || !window.CVCore) return;
    const domain = window.CVCore.getDomain();
    const students = [...new Set((domain.evidence || []).map(item => item.student).filter(Boolean))].sort();
    const select = document.querySelector('#historyStudent');
    const previous = select.value;
    select.replaceChildren();
    (students.length ? students : ['A07']).forEach(code => {
      const option = element('option', '', code);
      option.value = code;
      select.append(option);
    });
    select.value = students.includes(previous) ? previous : (students[0] || 'A07');
    const summary = summarize(domain.evidence || [], select.value);
    renderSkills(document.querySelector('#learningSkills'), summary.skills);
    renderPatterns(document.querySelector('#learningPatterns'), summary.patterns);
    renderTimeline(document.querySelector('#learningTimeline'), summary.records);
    const comment = document.querySelector('#teacherComment');
    comment.value = domain.comments?.[select.value]?.text || '';
    const suggested = document.querySelector('#suggestedComment');
    const firstPattern = summary.patterns[0];
    suggested.textContent = firstPattern
      ? `Sugerencia editable: conviene trabajar “${firstPattern.label}” en ${firstPattern.skill} y volver a comprobarlo con una pregunta diferente.`
      : 'La sugerencia aparecerá cuando existan al menos dos errores relacionados.';
    document.querySelector('#realEvidenceCount').textContent = String(summary.records.length);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#historyStudent')?.addEventListener('change', renderDashboard);
    document.querySelector('#saveTeacherComment')?.addEventListener('click', async () => {
      const student = document.querySelector('#historyStudent').value;
      const comment = document.querySelector('#teacherComment').value.trim();
      await window.CVCore.setTeacherComment(student, comment);
      if (typeof window.toast === 'function') window.toast('Comentario docente guardado localmente.');
      renderDashboard();
    });
    renderDashboard();
  });

  window.CVLearningStore = store;
  window.CVLearningEngine = { summarize, masteryFor };
  window.CVLearningDashboard = { render: renderDashboard };
})();
