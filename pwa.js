(()=>{
'use strict';
if(!('serviceWorker' in navigator))return;
if(location.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(location.hostname))return;
window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).then(registration=>{
    registration.update().catch(()=>{});
  }).catch(error=>console.warn('PWA no disponible:',error.message));
});
})();
