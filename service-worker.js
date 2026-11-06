const CACHE='cuaderno-vivo-pro-__BUILD_ID__';
const APP_SHELL=[
  './',
  './index.html',
  './styles.css',
  './product-core.css',
  './app.js',
  './curriculum-engine.js',
  './reinforcement.js',
  './classroom.js',
  './profile-i18n.js',
  './learning-history.js',
  './class-review.js',
  './learning-capsules.js',
  './product-core.js',
  './accessibility-demo.js',
  './real-workflow.js',
  './pwa.js',
  './manifest.webmanifest',
  './vendor/qrcode.min.js',
  './assets/logo-cuaderno-vivo-oficial.png',
  './assets/logo-cuaderno-vivo-icono.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './media/tutorial/poster.png',
  './media/tutorial/subtitulos-es.vtt',
  './media/tutorial/tutorial-cuaderno-vivo.mp4'
];
const APP_SHELL_URLS=new Set(APP_SHELL.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
async function rangeResponse(request,cached){
  const range=request.headers.get('range');
  if(!range)return cached;
  const buffer=await cached.arrayBuffer();
  const match=/bytes=(\d+)-(\d*)/.exec(range);
  if(!match)return cached;
  const start=Number(match[1]);
  const end=match[2]?Math.min(Number(match[2]),buffer.byteLength-1):buffer.byteLength-1;
  if(start>=buffer.byteLength||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${buffer.byteLength}`}});
  const headers=new Headers(cached.headers);
  headers.set('Content-Range',`bytes ${start}-${end}/${buffer.byteLength}`);
  headers.set('Accept-Ranges','bytes');
  headers.set('Content-Length',String(end-start+1));
  return new Response(buffer.slice(start,end+1),{status:206,statusText:'Partial Content',headers});
}
async function networkFirst(request){
  try{
    const response=await fetch(request);
    if(response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
  }catch(error){
    const cached=await caches.match(request,{ignoreSearch:true});
    if(cached)return cached;
    throw error;
  }
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')){
    event.respondWith(fetch(request));
    return;
  }
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const contentType=response.headers.get('content-type')||'';
      if(response.ok&&contentType.includes('text/html')){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
      }
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(request.headers.has('range')){
    event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>cached?rangeResponse(request,cached):fetch(request)));
    return;
  }
  url.search='';
  url.hash='';
  if(APP_SHELL_URLS.has(url.href)){
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>{
    if(cached)return cached;
    return fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    });
  }));
});
