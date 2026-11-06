(() => {
  'use strict';

  const letters = ['A', 'B', 'C', 'D'];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

  function bandFor(level) {
    if (/^[ACB][12]$/.test(level)) return `cefr-${level.toLowerCase()}`;
    if (/^[12]\.º de Primaria$/.test(level)) return 'lower-primary';
    if (/^[34]\.º de Primaria$/.test(level)) return 'middle-primary';
    if (/^[56]\.º de Primaria$/.test(level)) return 'upper-primary';
    if (/^[12]\.º ESO$/.test(level)) return 'lower-secondary';
    if (/^[34]\.º ESO$/.test(level)) return 'upper-secondary';
    if (/Bachillerato$/.test(level)) return 'bachillerato';
    return 'general';
  }

  function question(meta, index, text, options, key, skill, error, explanation, difficulty = 'media') {
    return {
      n: index + 1,
      text,
      options: [...options],
      key,
      skill,
      error,
      explanation,
      difficulty,
      subject: meta.subject,
      level: meta.level,
      levelBand: bandFor(meta.level),
      topic: meta.topic,
    };
  }

  function fromRows(meta, rows) {
    return rows.map((row, index) => question(meta, index, ...row));
  }

  function lowerPrimaryMath(meta) {
    const topic = meta.topic;
    const packs = {
      'Numeración': [
        ['¿Qué número viene después del 7?', ['6', '8', '9', '10'], 'B', 'Contar', 'Orden de la serie numérica', 'Después del 7 viene el 8.', 'fácil'],
        ['¿Cuántos puntos hay: ● ● ● ● ●?', ['4', '5', '6', '7'], 'B', 'Contar', 'Correspondencia uno a uno', 'Hay cinco puntos; se cuenta cada uno una sola vez.', 'fácil'],
        ['¿Qué número es mayor?', ['3', '9', '5', '7'], 'B', 'Comparar', 'Comparación de cantidades', 'Nueve es el número mayor.', 'fácil'],
        ['Completa: 4, 5, 6, __.', ['5', '6', '7', '8'], 'C', 'Secuenciar', 'Continuación de la serie', 'La serie aumenta de uno en uno: sigue el 7.', 'fácil'],
        ['¿Qué número representa diez?', ['1', '10', '20', '100'], 'B', 'Representar', 'Lectura de números', 'El número diez se escribe 10.', 'fácil'],
        ['¿Cuál tiene menos?', ['8 lápices', '2 lápices', '6 lápices', '5 lápices'], 'B', 'Comparar', 'Menor cantidad', 'Dos lápices es la cantidad menor.', 'fácil'],
        ['¿Qué número falta? 1, 2, __, 4.', ['0', '2', '3', '5'], 'C', 'Secuenciar', 'Número intermedio', 'Entre 2 y 4 está el 3.', 'fácil'],
        ['Ana tiene 3 pegatinas y recibe 1 más. ¿Cuántas tiene?', ['2', '3', '4', '5'], 'C', 'Resolver problemas', 'Suma en contexto', 'Tres y una más son cuatro.', 'media'],
      ],
      'Cálculo': [
        ['2 + 3 = …', ['4', '5', '6', '7'], 'B', 'Sumar', 'Conteo total', 'Dos más tres son cinco.', 'fácil'],
        ['6 − 2 = …', ['3', '4', '5', '8'], 'B', 'Restar', 'Retirada de elementos', 'Si quitamos dos a seis quedan cuatro.', 'fácil'],
        ['¿Qué suma da 8?', ['3 + 3', '4 + 4', '5 + 2', '6 + 1'], 'B', 'Sumar', 'Descomposición', 'Cuatro más cuatro son ocho.', 'media'],
        ['5 + 1 = …', ['4', '5', '6', '7'], 'C', 'Sumar', 'Siguiente número', 'Añadir uno lleva al número siguiente: seis.', 'fácil'],
        ['9 − 1 = …', ['7', '8', '9', '10'], 'B', 'Restar', 'Anterior número', 'Quitar uno a nueve deja ocho.', 'fácil'],
        ['Completa: 3 + __ = 7.', ['2', '3', '4', '5'], 'C', 'Completar', 'Término desconocido', 'Tres más cuatro son siete.', 'media'],
        ['Luis tiene 4 coches y le dan 2. ¿Cuántos tiene?', ['5', '6', '7', '8'], 'B', 'Resolver problemas', 'Suma en contexto', 'Cuatro más dos son seis.', 'media'],
        ['Había 7 globos y se rompe 1. ¿Cuántos quedan?', ['5', '6', '7', '8'], 'B', 'Resolver problemas', 'Resta en contexto', 'Siete menos uno son seis.', 'media'],
      ],
    };
    return fromRows(meta, packs[topic] || packs.Numeración);
  }

  function physicsCinematics(meta) {
    const bach = bandFor(meta.level) === 'bachillerato';
    if (!bach) {
      return fromRows(meta, [
        ['Un ciclista recorre 100 m en 20 s. ¿Cuál es su rapidez media?', ['2 m/s', '5 m/s', '20 m/s', '120 m/s'], 'B', 'Calcular velocidad', 'Confunde distancia y tiempo', 'v = d/t = 100/20 = 5 m/s.', 'media'],
        ['¿Qué magnitud indica lo rápido que cambia la posición?', ['Masa', 'Velocidad', 'Temperatura', 'Volumen'], 'B', 'Identificar magnitudes', 'Confunde magnitudes', 'La velocidad relaciona el cambio de posición con el tiempo.', 'fácil'],
        ['En una gráfica posición-tiempo, una línea horizontal indica…', ['aceleración constante', 'reposo', 'velocidad creciente', 'caída libre'], 'B', 'Interpretar gráficas', 'Interpreta pendiente nula', 'La posición no cambia: el móvil está en reposo.', 'media'],
        ['¿Cuál es una unidad de velocidad?', ['m', 's', 'm/s', 'm/s²'], 'C', 'Usar unidades', 'Confunde unidades', 'La velocidad se expresa como distancia dividida por tiempo.', 'fácil'],
        ['Si un móvil aumenta su velocidad, está…', ['en reposo', 'acelerando', 'perdiendo masa', 'reduciendo distancia'], 'B', 'Razonar', 'Confunde velocidad y aceleración', 'Cambiar la velocidad implica aceleración.', 'media'],
        ['Un coche mantiene 10 m/s durante 3 s. ¿Qué distancia recorre?', ['3 m', '10 m', '30 m', '100 m'], 'C', 'Aplicar modelos', 'Multiplica o divide incorrectamente', 'd = v·t = 10·3 = 30 m.', 'media'],
        ['¿Qué instrumento mide intervalos de tiempo?', ['Dinamómetro', 'Cronómetro', 'Probeta', 'Balanza'], 'B', 'Medir', 'Selecciona instrumento incorrecto', 'El cronómetro mide intervalos de tiempo.', 'fácil'],
        ['Dos móviles recorren la misma distancia. El que tarda menos tiene…', ['menor rapidez', 'mayor rapidez', 'igual aceleración', 'más masa'], 'B', 'Comparar', 'Invierte la relación', 'Para igual distancia, menos tiempo significa mayor rapidez.', 'media'],
      ]);
    }
    return fromRows(meta, [
      ['Un móvil parte del reposo y acelera a 2 m/s² durante 4 s. ¿Qué velocidad alcanza?', ['2 m/s', '6 m/s', '8 m/s', '16 m/s'], 'C', 'Aplicar MRUA', 'Confunde aceleración, tiempo y velocidad', 'v = v₀ + at = 0 + 2·4 = 8 m/s.', 'media'],
      ['¿Qué representa la pendiente de una gráfica posición-tiempo?', ['La aceleración', 'La velocidad', 'La masa', 'La energía'], 'B', 'Interpretar gráficas', 'Confunde pendientes cinemáticas', 'La pendiente Δx/Δt de la gráfica posición-tiempo es la velocidad.', 'media'],
      ['Un coche viaja a 72 km/h. ¿Cuál es su velocidad en m/s?', ['10 m/s', '20 m/s', '36 m/s', '72 m/s'], 'B', 'Convertir unidades', 'No convierte km/h a m/s', '72 ÷ 3,6 = 20 m/s.', 'media'],
      ['En un movimiento rectilíneo uniforme, la aceleración es…', ['0 m/s²', '1 m/s²', 'igual a la velocidad', 'variable y positiva'], 'A', 'Identificar modelos', 'Confunde MRU y MRUA', 'En MRU la velocidad es constante, por tanto a = 0.', 'fácil'],
      ['Se deja caer un objeto desde el reposo. Sin rozamiento, su velocidad…', ['permanece constante', 'aumenta aproximadamente 9,8 m/s cada segundo', 'disminuye 9,8 m/s', 'es siempre cero'], 'B', 'Razonar sobre caída libre', 'Interpreta mal la aceleración gravitatoria', 'La gravedad produce una aceleración aproximada de 9,8 m/s².', 'media'],
      ['Un móvil tiene v₀ = 5 m/s y a = −1 m/s². ¿Qué velocidad lleva a los 3 s?', ['2 m/s', '3 m/s', '7 m/s', '8 m/s'], 'A', 'Aplicar MRUA', 'Ignora el signo de la aceleración', 'v = 5 + (−1)·3 = 2 m/s.', 'media'],
      ['¿Qué ecuación permite hallar la posición en un MRUA?', ['x = x₀ + vt', 'x = x₀ + v₀t + ½at²', 'F = ma', 'E = mc²'], 'B', 'Elegir modelos', 'Selecciona una relación ajena', 'La posición en MRUA incluye velocidad inicial y término cuadrático de aceleración.', 'media'],
      ['Un resultado de −4 m/s indica que el móvil…', ['se mueve en el sentido negativo elegido', 'tiene rapidez negativa', 'está necesariamente frenando', 'ha recorrido −4 metros'], 'A', 'Interpretar signos', 'Confunde velocidad con rapidez', 'El signo de la velocidad indica el sentido respecto al eje elegido.', 'alta'],
    ]);
  }

  const genericProfiles = {
    literature: {
      skill: 'Comprender y justificar',
      errors: ['Idea principal', 'Evidencia textual', 'Vocabulario en contexto', 'Organización del texto'],
      terms: ['evidencia del texto', 'opinión sin justificar', 'dato ajeno al texto', 'resumen incompleto'],
      stem: topic => `Al trabajar ${topic.toLowerCase()}, ¿qué respuesta está mejor justificada?`,
    },
    science: {
      skill: 'Razonamiento científico',
      errors: ['Observación y explicación', 'Variables', 'Evidencia', 'Predicción'],
      terms: ['una conclusión apoyada por los datos', 'una opinión sin medir', 'un dato inventado', 'una conclusión contraria al resultado'],
      stem: topic => `En una investigación sobre ${topic.toLowerCase()}, ¿qué conclusión es científicamente válida?`,
    },
    biology: {
      skill: 'Relacionar estructura y función',
      errors: ['Clasificación', 'Estructura y función', 'Relación causal', 'Evidencia biológica'],
      terms: ['relaciona estructura, función y consecuencia', 'enumera partes sin relacionarlas', 'usa una causa ajena al sistema', 'confunde organismo y hábitat'],
      stem: topic => `Sobre ${topic.toLowerCase()}, ¿qué explicación conecta mejor estructura y función?`,
    },
    history: {
      skill: 'Pensamiento histórico',
      errors: ['Cronología', 'Causalidad', 'Análisis de fuentes', 'Contextualización'],
      terms: ['usa la fuente y su contexto', 'confunde anterioridad con causa', 'ignora quién creó la fuente', 'aplica una fecha de otro periodo'],
      stem: topic => `Al estudiar ${topic.toLowerCase()}, ¿qué interpretación histórica es más rigurosa?`,
    },
    technology: {
      skill: 'Diseñar y comprobar',
      errors: ['Criterio de éxito', 'Prueba', 'Iteración', 'Seguridad'],
      terms: ['define un criterio, prueba y mejora', 'construye sin comprobar', 'cambia todo a la vez', 'ignora los datos de la prueba'],
      stem: topic => `En una actividad de ${topic.toLowerCase()}, ¿qué proceso tecnológico es más adecuado?`,
    },
  };

  function genericSubject(meta, key) {
    const profile = genericProfiles[key] || genericProfiles.science;
    const band = bandFor(meta.level);
    const intro = band === 'lower-primary' ? 'Elige la opción correcta.' : band === 'bachillerato' ? 'Selecciona la respuesta mejor fundamentada.' : 'Elige la respuesta más adecuada.';
    const prompts = [
      () => profile.stem(meta.topic),
      () => `En ${meta.topic.toLowerCase()}, ¿qué opción demuestra mejor «${profile.skill.toLowerCase()}»?`,
      () => `¿Qué respuesta evitaría un error frecuente al trabajar ${meta.topic.toLowerCase()}?`,
      () => `Un alumno debe justificar una respuesta sobre ${meta.topic.toLowerCase()}. ¿Qué debería hacer?`,
      () => `¿Qué estrategia permite comprobar una conclusión sobre ${meta.topic.toLowerCase()}?`,
      () => `Ante un caso nuevo de ${meta.topic.toLowerCase()}, ¿qué procedimiento se puede transferir?`,
      () => `¿Qué explicación ofrece una evidencia suficiente en ${meta.topic.toLowerCase()}?`,
      () => `Para revisar una respuesta de ${meta.topic.toLowerCase()}, ¿qué criterio es el más fiable?`,
    ];
    return fromRows(meta, Array.from({ length: 8 }, (_, index) => {
      const shift = index % 4;
      const correct = profile.terms[0];
      const options = [...profile.terms.slice(shift), ...profile.terms.slice(0, shift)];
      const key = letters[options.indexOf(correct)];
      return [
        `${intro} ${prompts[index]()}`,
        options,
        key,
        profile.skill,
        profile.errors[index % profile.errors.length],
        `La opción ${key}, «${correct}», aplica ${profile.skill.toLowerCase()} al contenido ${meta.topic}; las demás omiten la evidencia o el proceso necesario.`,
        index < 2 ? 'fácil' : index > 5 ? 'alta' : 'media',
      ];
    }));
  }

  function englishQuestions(meta) {
    const level = meta.level;
    const rows = {
      A1: [
        ['Choose the correct morning greeting.', ['Good morning', 'Good night', 'Goodbye', 'See you yesterday'], 'A', 'Everyday communication', 'Basic greeting', '“Good morning” is used in the morning.'],
        ['She ___ from Spain.', ['am', 'is', 'are', 'be'], 'B', 'Grammar', 'Verb to be', 'With “she” we use “is”.'],
        ['Choose the place where students learn.', ['hospital', 'school', 'station', 'market'], 'B', 'Vocabulary', 'Basic places', 'Students learn at school.'],
        ['I ___ two brothers.', ['has', 'have', 'am', 'is'], 'B', 'Grammar', 'Have', 'With “I” we use “have”.'],
        ['What is the plural of “child”?', ['childs', 'children', 'childes', 'child'], 'B', 'Vocabulary', 'Irregular plural', 'The irregular plural is “children”.'],
        ['What time ___ you get up?', ['do', 'does', 'are', 'is'], 'A', 'Grammar', 'Question form', 'With “you” in the present simple we use “do”.'],
        ['Choose the best reply: “How are you?”', ['I am fine, thanks.', 'I am twelve o’clock.', 'At school.', 'Yesterday.'], 'A', 'Communication', 'Social response', '“I am fine, thanks” answers how someone feels.'],
        ['Which word is a colour?', ['table', 'blue', 'run', 'teacher'], 'B', 'Vocabulary', 'Basic words', 'Blue is a colour.'],
      ],
      B2: [
        ['If they had left earlier, they ___ the train.', ['would catch', 'would have caught', 'caught', 'had caught'], 'B', 'Grammar', 'Third conditional', 'Third conditional uses would have + past participle.'],
        ['Choose the word closest in meaning to “reliable”.', ['temporary', 'dependable', 'careless', 'doubtful'], 'B', 'Vocabulary', 'Meaning in context', '“Dependable” is closest to “reliable”.'],
        ['The new policy will ___ effect next month.', ['take', 'make', 'do', 'bring'], 'A', 'Vocabulary', 'Collocation', 'The fixed collocation is “take effect”.'],
        ['Hardly ___ arrived when the meeting started.', ['we had', 'had we', 'we have', 'did we'], 'B', 'Use of English', 'Inversion', 'After “hardly”, formal inversion gives “had we arrived”.'],
        ['If I ___ more time, I would learn another language.', ['have', 'had', 'would have', 'will have'], 'B', 'Grammar', 'Second conditional', 'Second conditional uses past simple after “if”.'],
        ['Choose the most appropriate formal request.', ['Send me that.', 'Could you please send me the document?', 'You send it now.', 'Give document.'], 'B', 'Communication', 'Register', 'The modal and “please” create an appropriate formal request.'],
        ['The proposal was widely ___. (ACCEPT)', ['accept', 'accepting', 'accepted', 'acceptance'], 'C', 'Use of English', 'Word formation', 'The passive form requires the past participle “accepted”.'],
        ['Which connector introduces a contrast?', ['therefore', 'however', 'because', 'for example'], 'B', 'Writing', 'Cohesion', '“However” introduces contrast.'],
      ],
    };
    const selected = rows[level] || rows.B2;
    return fromRows(meta, selected.map(row => [...row, level === 'A1' ? 'fácil' : 'media']));
  }

  function fallbackMath(meta) {
    if (bandFor(meta.level) === 'lower-primary') return lowerPrimaryMath(meta);
    if (meta.level === '5.º de Primaria' && meta.topic === 'Fracciones') {
      return fromRows(meta, [
        ['¿Qué fracción representa la zona coloreada?', ['1/4', '3/4', '2/3', '4/3'], 'B', 'Identificar', 'Lectura de representación', 'Tres de cuatro partes iguales están coloreadas: 3/4.', 'fácil'],
        ['Selecciona la fracción equivalente a 1/2.', ['1/3', '3/5', '2/4', '4/6'], 'C', 'Identificar', 'Equivalencia visual', 'Multiplicar 1/2 por 2/2 produce 2/4.', 'fácil'],
        ['¿Cuál es mayor: 3/4 o 2/4?', ['3/4', '2/4', 'Son iguales', 'No se puede saber'], 'A', 'Comparar', 'Compara numeradores', 'Con el mismo denominador, es mayor la fracción con mayor numerador.', 'media'],
        ['Ordena 1/5, 4/5 y 3/5.', ['4/5 < 3/5 < 1/5', '3/5 < 1/5 < 4/5', '1/5 < 4/5 < 3/5', '1/5 < 3/5 < 4/5'], 'D', 'Comparar', 'Orden y magnitud', 'Al tener el mismo denominador, ordenamos los numeradores: 1 < 3 < 4.', 'media'],
        ['2/7 + 3/7 = …', ['5/14', '5/7', '6/7', '2/10'], 'B', 'Operar', 'Suma denominadores', 'Las partes siguen siendo séptimos: sumamos 2 + 3 y mantenemos el 7.', 'media'],
        ['2/5 + 1/5 = …', ['3/10', '3/25', '3/5', '2/5'], 'C', 'Operar', 'Suma denominadores', 'Las partes siguen siendo quintos: sumamos 2 + 1 y mantenemos el 5.', 'media'],
        ['Marta recorre 2/8 por la mañana y 3/8 por la tarde. Total:', ['5/8', '5/16', '6/8', '1/8'], 'A', 'Problemas', 'Traducción a operación', 'Sumamos las partes recorridas: 2/8 + 3/8 = 5/8.', 'media'],
        ['Quedan 3/6 de una tarta. ¿Qué afirmación es correcta?', ['Queda menos de un tercio', 'Queda toda la tarta', 'Queda más de la mitad', 'Queda la mitad'], 'D', 'Problemas', 'Interpretación contextual', '3/6 se simplifica a 1/2: queda la mitad.', 'media'],
      ]);
    }
    const topic = meta.topic;
    const bach = bandFor(meta.level) === 'bachillerato';
    const rows = bach ? [
      [`En ${topic}, ¿qué procedimiento conserva la equivalencia de una expresión?`, ['Aplicar la misma operación válida en ambos miembros', 'Cambiar solo un término sin justificar', 'Eliminar todos los signos', 'Sustituir datos por unidades'], 'A', 'Razonar', 'Equivalencia', 'Una transformación equivalente conserva el conjunto de soluciones.'],
      ['Resuelve 2x + 5 = 17.', ['x = 5', 'x = 6', 'x = 7', 'x = 11'], 'B', 'Álgebra', 'Despeje', '2x = 12, por tanto x = 6.'],
      ['¿Cuál es el dominio de f(x)=1/(x−3)?', ['Todos los reales', 'x ≠ 3', 'x > 3', 'x = 3'], 'B', 'Funciones', 'Dominio', 'El denominador no puede ser cero.'],
      ['Si una función tiene pendiente positiva, al aumentar x…', ['y tiende a aumentar', 'y siempre vale cero', 'x disminuye', 'la función no tiene dominio'], 'A', 'Interpretar', 'Variación', 'Una pendiente positiva describe crecimiento local.'],
      ['¿Cuál es la solución de x² = 9?', ['x = 3', 'x = −3', 'x = ±3', 'x = 9'], 'C', 'Resolver', 'Dos raíces', 'Tanto 3 como −3 tienen cuadrado 9.'],
      ['La media de 4, 6 y 8 es…', ['5', '6', '7', '18'], 'B', 'Estadística', 'Media aritmética', '(4+6+8)/3 = 6.'],
      ['En un triángulo rectángulo con catetos 3 y 4, la hipotenusa mide…', ['5', '6', '7', '12'], 'A', 'Geometría', 'Pitágoras', '√(3²+4²)=5.'],
      ['¿Qué comprobación mejora la fiabilidad del resultado?', ['Sustituir la solución en la expresión original', 'Ignorar unidades', 'Redondear antes de calcular', 'Elegir la opción más larga'], 'A', 'Comprobar', 'Validación', 'Sustituir permite verificar que la igualdad se cumple.'],
    ] : [
      [`¿Qué estrategia es adecuada en ${topic.toLowerCase()}?`, ['Identificar datos y operación antes de calcular', 'Elegir una respuesta al azar', 'Ignorar las unidades', 'Cambiar el enunciado'], 'A', 'Resolver problemas', 'Planificación', 'Separar datos, pregunta y operación ayuda a resolver.'],
      ['3/4 equivale a…', ['6/8', '4/7', '3/8', '7/4'], 'A', 'Fracciones', 'Equivalencia', 'Multiplicar numerador y denominador por 2 da 6/8.'],
      ['−3 + 8 = …', ['−11', '−5', '5', '11'], 'C', 'Cálculo', 'Enteros', 'Desde −3 avanzamos ocho unidades y llegamos a 5.'],
      ['2(x + 3) = …', ['2x + 3', '2x + 6', 'x + 6', '5x'], 'B', 'Álgebra', 'Distributiva', 'El 2 multiplica a x y a 3.'],
      ['Un ángulo llano mide…', ['45°', '90°', '180°', '360°'], 'C', 'Geometría', 'Tipos de ángulo', 'Un ángulo llano forma una línea recta: 180°.'],
      ['La moda de 2, 3, 3, 5 es…', ['2', '3', '4', '5'], 'B', 'Estadística', 'Moda', 'El valor que más se repite es 3.'],
      ['Si 5 cuadernos cuestan 10 €, uno cuesta…', ['1 €', '2 €', '5 €', '10 €'], 'B', 'Proporcionalidad', 'Valor unitario', '10 ÷ 5 = 2 €.'],
      ['¿Cuál es una comprobación razonable?', ['Estimar el resultado antes de aceptar la respuesta', 'Borrar los datos', 'Cambiar las unidades', 'Repetir sin revisar'], 'A', 'Comprobar', 'Estimación', 'La estimación permite detectar resultados imposibles.'],
    ];
    return fromRows(meta, rows.map(row => [...row, 'media']));
  }

  function generate(meta) {
    const key = profileFor(meta.subject).key;
    if (key === 'math') return fallbackMath(meta);
    if (key === 'physics' && meta.topic === 'Cinemática') return physicsCinematics(meta);
    if (key === 'english') return englishQuestions(meta);
    if (key === 'physics') return genericSubject(meta, 'science').map(item => ({ ...item, skill: 'Aplicación de modelos', subject: meta.subject }));
    return genericSubject(meta, key);
  }

  function validateQuestions(items, expectedMeta = null) {
    const errors = [];
    const context = expectedMeta || (items?.[0] ? { subject: items[0].subject, level: items[0].level, topic: items[0].topic } : null);
    if (!Array.isArray(items) || items.length !== 8) errors.push('La actividad debe contener ocho preguntas.');
    (items || []).forEach((item, index) => {
      if (!item.text?.trim()) errors.push(`P${index + 1}: enunciado vacío.`);
      if (!Array.isArray(item.options) || item.options.length !== 4) errors.push(`P${index + 1}: necesita cuatro opciones.`);
      const normalized = (item.options || []).map(option => String(option).trim().toLowerCase());
      if (normalized.some(option => !option)) errors.push(`P${index + 1}: hay opciones vacías.`);
      if (new Set(normalized).size !== 4) errors.push(`P${index + 1}: hay opciones duplicadas.`);
      if (!letters.includes(item.key)) errors.push(`P${index + 1}: la clave no es válida.`);
      if (!item.explanation?.trim()) errors.push(`P${index + 1}: falta la explicación.`);
      if (!item.subject?.trim() || !item.level?.trim() || !item.topic?.trim()) errors.push(`P${index + 1}: falta el contexto curricular.`);
      if (context && (item.subject !== context.subject || item.level !== context.level || item.topic !== context.topic)) errors.push(`P${index + 1}: contexto curricular desincronizado.`);
    });
    return { valid: errors.length === 0, errors };
  }

  function validateCatalog(catalog = subjectCatalog) {
    const combinations = [];
    Object.entries(catalog).forEach(([subject, profile]) => {
      profile.levels.forEach(level => profile.topics.forEach(topic => {
        const meta = { subject, level, topic };
        const items = generate(meta);
        combinations.push({ ...meta, ...validateQuestions(items, meta), count: items.length });
      }));
    });
    return {
      total: combinations.length,
      valid: combinations.every(item => item.valid && item.count === 8),
      failures: combinations.filter(item => !item.valid || item.count !== 8),
    };
  }

  bankFor = function curriculumBank(subject = $('#easySubject')?.value, level = $('#easyLevel')?.value) {
    const profile = profileFor(subject);
    const topic = $('#easyTopic')?.value || defaultTopic(profile, level);
    return generate({ subject, level, topic });
  };

  renderQuestions = function renderCurriculumQuestions() {
    const root = $('#questionTable');
    if (!root) return;
    root.innerHTML = questions.map(item => `
      <article class="q-card q-row" data-question="${item.n}">
        <header><span class="q-number">${String(item.n).padStart(2, '0')}</span><div><strong>${escapeHtml(item.skill)}</strong><small>${escapeHtml(item.level)} · ${escapeHtml(item.difficulty)}</small></div><button class="q-delete" type="button" aria-label="Eliminar pregunta ${item.n}">×</button></header>
        <label class="q-prompt"><span>Enunciado</span><input data-field="text" aria-label="Enunciado pregunta ${item.n}" value="${escapeHtml(item.text)}"></label>
        <fieldset class="q-options"><legend>Opciones de respuesta</legend>${letters.map((letter, index) => `<label><b>${letter}</b><input data-option="${letter}" aria-label="Opción ${letter} pregunta ${item.n}" value="${escapeHtml(item.options[index])}"></label>`).join('')}</fieldset>
        <div class="q-card-meta"><label><span>Habilidad</span><input data-field="skill" aria-label="Habilidad pregunta ${item.n}" value="${escapeHtml(item.skill)}"></label><label><span>Respuesta correcta</span><select data-field="key" aria-label="Respuesta correcta pregunta ${item.n}">${letters.map(letter => `<option ${letter === item.key ? 'selected' : ''}>${letter}</option>`).join('')}</select><label><span>Dificultad</span><select data-field="difficulty" aria-label="Dificultad pregunta ${item.n}">${['fácil','media','alta'].map(value => `<option ${value === item.difficulty ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div>
        <label class="q-explanation"><span>Explicación para después de responder</span><textarea data-field="explanation" aria-label="Explicación pregunta ${item.n}" rows="2">${escapeHtml(item.explanation)}</textarea></label>
      </article>`).join('');
    $$('.q-delete', root).forEach((button, index) => button.addEventListener('click', () => toast(`La pregunta ${index + 1} se mantiene para conservar ocho evidencias comparables.`)));
    const advancedLevel = $('#advancedLevel');
    if (advancedLevel) {
      advancedLevel.innerHTML = `<option>${escapeHtml(activityMeta().level)}</option>`;
      advancedLevel.value = activityMeta().level;
    }
  };

  const baseBuildPrintRoot = buildPrintRoot;
  buildPrintRoot = function buildCurriculumPrintRoot() {
    const root = $('#printRoot');
    const count = getStudentCount();
    const meta = activityMeta();
    root.innerHTML = '';
    for (let index = 1; index <= count; index++) {
      const code = `A${String(index).padStart(2, '0')}`;
      const page = document.createElement('section');
      page.className = 'print-page';
      page.innerHTML = `<div class="print-page-head"><div><h1>${escapeHtml(meta.topic)} · Actividad inicial</h1><p>${escapeHtml(meta.level)} · ${escapeHtml(meta.code)} · Versión 1 · Alumno ${code}</p><p>Marca una única respuesta en cada pregunta.</p></div><div class="print-qr" id="pqr-${code}"></div></div>${questions.map(item => `<div class="print-question"><strong>${item.n}. ${escapeHtml(item.text)}</strong><div class="print-options">${letters.map((letter, optionIndex) => `<span class="print-option">${letter} ○ ${escapeHtml(item.options[optionIndex])}</span>`).join('')}</div></div>`).join('')}`;
      root.appendChild(page);
      makeQr($(`#pqr-${code}`), `cv:${meta.code}:v1:${code}`, 106);
    }
  };

  function refresh() {
    questions = bankFor();
    renderQuestions();
    renderPaperAnswers();
    populateBatch();
  }

  ['easySubject', 'easyLevel', 'easyTopic'].forEach(id => document.getElementById(id)?.addEventListener('change', () => setTimeout(() => {
    refresh();
    const level = $('#advancedLevel');
    if (level) level.value = activityMeta().level;
  }, 0)));

  window.CVCurriculum = {
    bandFor,
    generateQuestions: generate,
    currentQuestions: () => questions,
    validateQuestions,
    validateCatalog,
    refresh,
  };

  refresh();
})();
