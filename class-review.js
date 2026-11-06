(() => {
  'use strict';

  const STORAGE_KEY = 'cv-pro-class-reviews-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const subjectReviews = {
    math: {
      focus: 'Representar → razonar → resolver → comprobar',
      objectives: [
        ['Representó el concepto', 'Usó dibujos, materiales o símbolos con sentido.'],
        ['Explicó el procedimiento', 'Justificó los pasos y no solo el resultado.'],
        ['Resolvió una situación nueva', 'Transfirió la estrategia a otro problema.'],
        ['Comprobó el resultado', 'Detectó o corrigió errores de forma autónoma.'],
      ],
      next: 'Comienza con una recuperación breve, modela un ejemplo y termina con una pregunta nueva.',
    },
    literature: {
      focus: 'Leer → localizar evidencia → interpretar → comunicar',
      objectives: [
        ['Comprendió la idea principal', 'Diferenció información central y secundaria.'],
        ['Localizó evidencia textual', 'Señaló fragmentos que sostienen su respuesta.'],
        ['Interpretó con justificación', 'Explicó el significado usando el texto.'],
        ['Comunicó una respuesta clara', 'Organizó su explicación oral o escrita.'],
      ],
      next: 'Recupera una idea clave y pide justificar una interpretación con una evidencia nueva.',
    },
    science: {
      focus: 'Observar → predecir → comprobar → concluir',
      objectives: [
        ['Describió la observación', 'Separó los datos de sus explicaciones.'],
        ['Formuló una predicción', 'Anticipó un resultado con una razón.'],
        ['Interpretó datos', 'Relacionó la evidencia con la pregunta.'],
        ['Construyó una conclusión', 'La conclusión respondió a los datos disponibles.'],
      ],
      next: 'Presenta un dato nuevo y pide una predicción antes de revelar el resultado.',
    },
    biology: {
      focus: 'Estructura → función → relación → consecuencia',
      objectives: [
        ['Identificó estructuras', 'Reconoció los elementos relevantes del sistema.'],
        ['Relacionó estructura y función', 'Explicó para qué sirve cada elemento.'],
        ['Conectó niveles biológicos', 'Vinculó célula, organismo o ecosistema.'],
        ['Predijo una consecuencia', 'Razonó qué cambia cuando se altera el sistema.'],
      ],
      next: 'Recupera la relación estructura-función y aplica el modelo a un caso distinto.',
    },
    physics: {
      focus: 'Representar → modelizar → calcular → justificar',
      objectives: [
        ['Identificó magnitudes y unidades', 'Seleccionó los datos relevantes.'],
        ['Representó la situación', 'Usó esquema, gráfica o modelo de partículas.'],
        ['Aplicó el modelo', 'Eligió una relación o procedimiento adecuado.'],
        ['Justificó con unidades', 'Interpretó el resultado y comprobó su sentido.'],
      ],
      next: 'Empieza con una estimación, resuelve un caso paralelo y comprueba unidades y sentido físico.',
    },
    history: {
      focus: 'Fuente → contexto → causalidad → perspectiva',
      objectives: [
        ['Situó el contexto', 'Ubicó el proceso en tiempo y espacio.'],
        ['Analizó una fuente', 'Distinguió autoría, propósito y evidencia.'],
        ['Explicó causas y consecuencias', 'Construyó relaciones y no una lista de hechos.'],
        ['Comparó perspectivas', 'Reconoció interpretaciones diferentes.'],
      ],
      next: 'Abre con una fuente breve y pide conectar una evidencia con una causa y una consecuencia.',
    },
    english: {
      focus: 'Comprender → practicar forma → comunicar → transferir',
      objectives: [
        ['Comprendió el mensaje', 'Identificó la intención y la información clave.'],
        ['Usó la forma objetivo', 'Aplicó vocabulario o gramática con precisión.'],
        ['Participó en comunicación', 'Produjo un mensaje con propósito real.'],
        ['Transfirió a otro contexto', 'Usó el aprendizaje en una situación nueva.'],
      ],
      next: 'Inicia con recuperación oral, practica la forma en contexto y cierra con comunicación libre breve.',
    },
    technology: {
      focus: 'Definir → diseñar → probar → iterar',
      objectives: [
        ['Definió el problema', 'Identificó necesidad, límites y criterio de éxito.'],
        ['Diseñó una solución', 'Propuso pasos, componentes o algoritmo.'],
        ['Probó con evidencia', 'Comprobó el funcionamiento con un caso.'],
        ['Iteró la propuesta', 'Usó el error para mejorar el diseño.'],
      ],
      next: 'Recupera el criterio de éxito, prueba un caso límite y pide una mejora justificada.',
    },
  };

  const ratingLabels = {
    1: 'Necesita replantearse',
    2: 'Costó avanzar',
    3: 'Cumplió lo esencial',
    4: 'Funcionó bien',
    5: 'Excelente sesión',
  };

  const pulseLabels = {
    engaged: 'Grupo implicado',
    calm: 'Grupo seguro',
    mixed: 'Pulso mixto',
    blocked: 'Grupo bloqueado',
  };

  const draft = { rating: 0, pulse: '' };

  function readReviews() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeReviews(reviews) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  }

  function currentProfile() {
    const meta = activityMeta();
    const profile = profileFor(meta.subject);
    return { meta, key: profile.key, review: subjectReviews[profile.key] || subjectReviews.math };
  }

  function renderContext() {
    const { meta, review } = currentProfile();
    const context = $('#classReviewContext');
    if (!context) return;
    $('h2', context).textContent = `${meta.subject} · ${meta.topic}`;
    $('div:first-child p', context).textContent = `${meta.level} · ${getStudentCount()} alumnos · hoy`;
    $('.review-context-focus strong', context).textContent = review.focus;
  }

  function renderObjectives() {
    const { review } = currentProfile();
    const root = $('#reviewObjectives');
    if (!root) return;
    root.replaceChildren();
    review.objectives.forEach(([title, help], index) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = title;
      input.id = `review-objective-${index}`;
      const copy = document.createElement('span');
      const strong = document.createElement('strong');
      const small = document.createElement('small');
      strong.textContent = title;
      small.textContent = help;
      copy.append(strong, small);
      label.append(input, copy);
      root.appendChild(label);
    });
  }

  function appendText(parent, tag, text, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderHistory() {
    const timeline = $('#reviewTimeline');
    const reviews = readReviews();
    $('#reviewCount').textContent = String(reviews.length);
    timeline.replaceChildren();
    if (!reviews.length) {
      appendText(timeline, 'p', 'Todavía no hay revisiones guardadas.', 'empty-evidence');
      return;
    }
    reviews.slice(0, 8).forEach(review => {
      const card = document.createElement('article');
      card.className = 'review-history-card';
      const header = document.createElement('header');
      appendText(header, 'strong', `${review.subject} · ${review.topic}`);
      appendText(header, 'span', `${review.rating}/5`);
      card.appendChild(header);
      appendText(card, 'small', `${review.level} · ${review.dateLabel} · ${pulseLabels[review.pulse] || review.pulse}`);
      const worked = appendText(card, 'p', '');
      appendText(worked, 'b', 'Funcionó: ');
      worked.append(document.createTextNode(review.worked));
      const next = appendText(card, 'p', '');
      appendText(next, 'b', 'Siguiente paso: ');
      next.append(document.createTextNode(review.nextStep));
      const footer = document.createElement('footer');
      review.objectives.forEach(objective => appendText(footer, 'span', objective));
      card.appendChild(footer);
      timeline.appendChild(card);
    });
  }

  function updateInsight(record) {
    const { review } = currentProfile();
    $('#reviewInsightTitle').textContent = record.rating >= 4 ? 'Mantén lo que funcionó y transfiere' : 'Ajusta el apoyo antes de avanzar';
    $('#reviewInsightText').textContent = record.rating >= 4
      ? `${record.objectives.length} objetivos observados. Conviene comprobarlos con una situación nueva.`
      : `La sesión necesita otro apoyo. El pulso “${pulseLabels[record.pulse]}” aconseja reducir carga y modelar.`;
    $('#reviewSuggestedAction span').textContent = record.nextStep || review.next;
  }

  function renderReview() {
    renderContext();
    renderObjectives();
    renderHistory();
  }

  function selectRating(value) {
    draft.rating = Number(value);
    $$('#lessonRating [data-rating]').forEach(button => {
      const selected = Number(button.dataset.rating) === draft.rating;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-checked', String(selected));
    });
    $('#lessonRatingLabel').textContent = ratingLabels[draft.rating] || 'Sin valorar';
  }

  function selectPulse(value) {
    draft.pulse = value;
    $$('#classPulse [data-pulse]').forEach(button => {
      const selected = button.dataset.pulse === value;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function showError(message) {
    const error = $('#classReviewError');
    error.textContent = message;
    error.hidden = false;
    error.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function saveReview(event) {
    event.preventDefault();
    const objectives = $$('#reviewObjectives input:checked').map(input => input.value);
    const worked = $('#reviewWorked').value.trim();
    const improve = $('#reviewImprove').value.trim();
    const nextStep = $('#reviewNextStep').value.trim();
    if (!draft.rating || !draft.pulse) return showError('Valora la clase y selecciona el pulso del grupo.');
    if (!objectives.length) return showError('Marca al menos un objetivo observado.');
    if (!worked || !improve || !nextStep) return showError('Completa las tres notas para dejar una decisión útil.');

    const { meta } = currentProfile();
    const now = new Date();
    const record = {
      id: `${meta.code}:${now.toISOString()}`,
      subject: meta.subject,
      topic: meta.topic,
      level: meta.level,
      activity: meta.code,
      rating: draft.rating,
      pulse: draft.pulse,
      objectives,
      worked,
      improve,
      nextStep,
      createdAt: now.toISOString(),
      dateLabel: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(now),
    };
    const reviews = readReviews();
    reviews.unshift(record);
    writeReviews(reviews.slice(0, 50));
    $('#classReviewError').hidden = true;
    const state = $('#reviewSaveState');
    state.textContent = 'Guardada localmente';
    state.classList.add('saved');
    updateInsight(record);
    renderHistory();
    toast('Revisión guardada. La próxima acción queda preparada.');
  }

  $('#lessonRating')?.addEventListener('click', event => {
    const button = event.target.closest('[data-rating]');
    if (button) selectRating(button.dataset.rating);
  });
  $('#classPulse')?.addEventListener('click', event => {
    const button = event.target.closest('[data-pulse]');
    if (button) selectPulse(button.dataset.pulse);
  });
  $('#classReviewForm')?.addEventListener('submit', saveReview);
  ['easySubject', 'easyLevel', 'easyTopic'].forEach(id => {
    $('#' + id)?.addEventListener('change', () => setTimeout(renderReview, 0));
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-view="class-review"]')) setTimeout(renderReview, 0);
  });

  const baseSetView = window.setView;
  window.setView = function classReviewAwareSetView(name, focus = true) {
    baseSetView(name, focus);
    if (name === 'class-review') renderReview();
  };

  window.CVClassReview = { readReviews, render: renderReview };
  renderReview();
})();
