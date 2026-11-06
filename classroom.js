(()=>{
'use strict';
const letters=['A','B','C','D'];
const api={
  async request(path,options={}){const response=await fetch(path,{headers:{'Content-Type':'application/json'},...options});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'No se pudo conectar con el aula local.');return data},
  status(){return this.request('/api/classroom/status')},
  create(payload){return this.request('/api/classroom/session',{method:'POST',body:JSON.stringify(payload)})},
  session(id){return this.request(`/api/classroom/session/${encodeURIComponent(id)}`)},
  answer(id,payload){return this.request(`/api/classroom/session/${encodeURIComponent(id)}/answers`,{method:'POST',body:JSON.stringify(payload)})},
  results(id){return this.request(`/api/classroom/session/${encodeURIComponent(id)}/results`)}
};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const params=new URLSearchParams(location.search);
const studentSession=params.get('student');
let activeSession='';
let pollTimer=null;

function reinforcementQuestions(){
  let available=window.CVCurriculum?.currentQuestions?.()||[];
  if(available.some(item=>!Array.isArray(item.options)||item.options.length!==4))available=window.CVCurriculum?.generateQuestions?.(typeof activityMeta==='function'?activityMeta():{})||available;
  const selected=(available.length>=7?available.slice(4,7):available.slice(0,3));
  return selected.map((item,index)=>({
    id:`R${index+1}`,
    prompt:item.text,
    options:item.options?.length===4?item.options:['Opción A','Opción B','Opción C','Opción D'],
    correct:item.key,
    explanation:item.explanation||`La respuesta correcta es ${item.key}.`,
    skill:item.skill||'Habilidad de refuerzo'
  }));
}
function setLanState(message,type='info'){
  const element=document.getElementById('lanState');
  if(!element)return;
  element.className=`lan-state ${type}`;
  element.textContent=message;
}
function renderResults(results){
  const root=document.getElementById('lanResults');
  if(!root)return;
  if(!results.length){root.innerHTML='<p class="lan-empty">Esperando respuestas del alumnado…</p>';return}
  root.innerHTML=results.map(item=>`<article><strong>${escapeHtml(item.student)}</strong><span>${item.score} de ${item.total}</span><small>${new Date(item.submittedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></article>`).join('');
}
async function refreshResults(){
  if(!activeSession)return;
  try{const data=await api.results(activeSession);renderResults(data.results||[]);document.getElementById('lanResponseCount').textContent=String((data.results||[]).length)}catch(error){setLanState(error.message,'error')}
}
async function startClassroom(){
  const button=document.getElementById('startLanClass');
  button.disabled=true;
  setLanState('Preparando una sesión solo dentro de esta red local…');
  try{
    await api.status();
    const meta=typeof activityMeta==='function'?activityMeta():{subject:'Asignatura',level:'Nivel',topic:'Refuerzo'};
    const data=await api.create({title:`${meta.subject} · ${meta.topic}`,level:meta.level,questions:reinforcementQuestions()});
    activeSession=data.id;
    const link=new URL(location.href);link.search='';link.hash='';link.searchParams.set('student',data.id);
    document.getElementById('lanJoinUrl').textContent=link.href;
    document.getElementById('lanJoinUrl').href=link.href;
    document.getElementById('lanSessionCode').textContent=data.id;
    document.getElementById('lanReady').hidden=false;
    document.getElementById('lanSetup').hidden=true;
    setLanState('Aula abierta. Ya pueden entrar los alumnos desde sus dispositivos.','success');
    clearInterval(pollTimer);pollTimer=setInterval(refreshResults,2000);refreshResults();
  }catch(error){
    setLanState('Para usar varios dispositivos, inicia primero “python3 classroom_server.py” en el ordenador del profesor.','error');
    document.getElementById('lanServerHelp').hidden=false;
    button.disabled=false;
  }
}
function copyJoinUrl(){
  const value=document.getElementById('lanJoinUrl')?.href;
  if(!value)return;
  navigator.clipboard?.writeText(value).then(()=>toast?.('Enlace del aula copiado.')).catch(()=>toast?.('Selecciona y copia el enlace mostrado.'));
}
function closeClassroom(){clearInterval(pollTimer);pollTimer=null;activeSession='';document.getElementById('lanReady').hidden=true;document.getElementById('lanSetup').hidden=false;setLanState('La sesión deja de mostrarse aquí; los datos siguen solo en el servidor local hasta cerrarlo.');}

async function renderStudentPortal(id){
  const portal=document.getElementById('studentPortal');
  portal.hidden=false;document.body.classList.add('student-mode');
  const content=document.getElementById('studentContent');
  try{
    const session=await api.session(id);
    content.innerHTML=`<header class="student-head"><span>CUADERNO VIVO · AULA LOCAL</span><h1>${escapeHtml(session.title)}</h1><p>${escapeHtml(session.level)} · ${session.questions.length} preguntas · sin Internet y sin cuenta</p></header><form id="studentTest" class="student-test"><label class="student-code">Tu código de clase<input name="student" required maxlength="12" pattern="[A-Za-z0-9_-]+" placeholder="Ejemplo: A07" autocomplete="off"><small>Usa el código que te indique el profesor, no tu nombre.</small></label>${session.questions.map((question,index)=>`<fieldset><legend><span>${index+1}</span>${escapeHtml(question.prompt)}</legend><div class="student-options">${question.options.map((option,optionIndex)=>{const letter=letters[optionIndex];return `<label><input type="radio" name="${escapeHtml(question.id)}" value="${letter}" required><b>${letter}</b><span>${escapeHtml(option)}</span></label>`}).join('')}</div></fieldset>`).join('')}<button class="btn primary student-submit" type="submit">Entregar y ver soluciones</button><p class="student-privacy">Las respuestas se envían únicamente al ordenador del profesor dentro de la red local.</p></form>`;
    document.getElementById('studentTest').addEventListener('submit',async event=>{
      event.preventDefault();const form=new FormData(event.currentTarget);const submit=event.currentTarget.querySelector('[type="submit"]');submit.disabled=true;submit.textContent='Comprobando…';
      const answers=Object.fromEntries(session.questions.map(question=>[question.id,form.get(question.id)]));
      try{const result=await api.answer(id,{student:String(form.get('student')).trim(),answers});renderStudentSolutions(result)}catch(error){submit.disabled=false;submit.textContent='Entregar y ver soluciones';alert(error.message)}
    });
  }catch(error){content.innerHTML=`<div class="student-error"><h1>No se puede abrir este refuerzo</h1><p>${escapeHtml(error.message)}</p><p>Comprueba que estás en la misma red local que el ordenador del profesor.</p></div>`}
}
function renderStudentSolutions(result){
  const content=document.getElementById('studentContent');
  content.innerHTML=`<header class="student-head result"><span>RESULTADO Y SOLUCIONES</span><h1>${result.score} de ${result.total} correctas</h1><p>${result.score===result.total?'Buen trabajo. Ahora explica una respuesta con tus propias palabras.':'Revisa cada explicación y vuelve a intentarlo con una pregunta nueva.'}</p></header><div class="solution-list">${result.solutions.map((item,index)=>`<article class="${item.isCorrect?'correct':'incorrect'}"><div class="solution-title"><span>${index+1}</span><div><strong>${escapeHtml(item.prompt)}</strong><small>${item.isCorrect?'Respuesta correcta':'Necesita revisión'}</small></div></div><p><b>Tu respuesta:</b> ${escapeHtml(item.selected||'Sin responder')} · ${escapeHtml(item.selectedText||'')}</p><p><b>Solución:</b> ${escapeHtml(item.correct)} · ${escapeHtml(item.correctText)}</p><div class="solution-explanation"><b>Por qué:</b> ${escapeHtml(item.explanation)}</div></article>`).join('')}</div><p class="student-finished">Respuesta enviada al profesor. Puedes cerrar esta pestaña.</p>`;
}

document.getElementById('startLanClass')?.addEventListener('click',startClassroom);
document.getElementById('copyLanUrl')?.addEventListener('click',copyJoinUrl);
document.getElementById('closeLanClass')?.addEventListener('click',closeClassroom);
if(studentSession)renderStudentPortal(studentSession);
window.CVClassroom={reinforcementQuestions,startClassroom};
})();
