/* ═══════════════════════════════════════════════════════════════
   TI-312 · Motor de presentaciones (compartido)
   Cada página define window.DECK antes de cargar este archivo:
   {
     title, sub,            // texto de la barra superior
     theme: "cp" | "",      // "cp" = tema verde de caso práctico
     pills: ["Virtual", ...],
     links: [{label, href, cls}],   // botones extra (ej. ir al CP)
     slides: [{kicker, title, desc, html, badges:{ak,av,bk,bv}, img,
               photos:[{src, cap, credit}]   // opcional: galería de fotos reales
             }]
   }
   Teclas: ← → Espacio · Inicio/Fin · F = pantalla completa · L = lápiz
   La slide actual queda en la URL (#3) para compartir o recargar.
═══════════════════════════════════════════════════════════════ */
(function(){
  const D = window.DECK;
  const slides = D.slides;
  const pad2 = n => String(n).padStart(2,"0");
  if (D.theme) document.body.classList.add(D.theme);

  const pills = (D.pills||[]).map((p,i)=>
    `<div class="pill"><span class="miniDot"${i===1?' style="background:rgba(22,163,74,.7)"':''}></span><span>${p}</span></div>`).join("");
  const links = (D.links||[]).map(l=>`<a class="btn ${l.cls||""}" href="${l.href}">${l.label}</a>`).join("");

  document.body.insertAdjacentHTML("afterbegin", `
<div class="shell">
  <div class="topbar">
    <div class="brand">
      <a class="btn home" href="index.html" title="Volver al inicio del curso">← Inicio</a>
      <div class="txt"><b id="topTitle">${D.title}</b><span id="topSub">${D.sub}</span></div>
    </div>
    <div class="topcenter"><div class="counterPill"><span class="dot"></span><span id="counterTxt">01 / ${pad2(slides.length)}</span></div></div>
    <div class="actions">
      ${pills}
      ${links}
      <button class="btn primary" id="penToggle" title="Lápiz (L)">✏️ Lápiz</button>
      <button class="btn danger" id="penClear">Borrar</button>
      <select class="select" id="penSize" title="Grosor"><option value="3">Fino</option><option value="5" selected>Medio</option><option value="8">Grueso</option><option value="12">Extra</option></select>
      <select class="select" id="penColor" title="Color"><option value="#0b66c3" selected>Azul</option><option value="#0f172a">Negro</option><option value="#dc2626">Rojo</option><option value="#16a34a">Verde</option><option value="#f59e0b">Amarillo</option></select>
      <button class="btn" id="fsBtn" title="Pantalla completa (F)">⛶</button>
    </div>
  </div>
  <div class="deck">
    <canvas id="penCanvas" class="penCanvas"></canvas>
    <div class="slide">
      <div class="left">
        <div class="kicker"><div class="bar"></div><span id="kicker"></span></div>
        <h1 id="title"></h1>
        <p class="desc" id="desc"></p>
        <div id="leftBlocks"></div>
      </div>
      <div class="right">
        <div class="media"><img id="slideImg" alt=""/><div class="placeholder" id="placeholder">Imagen de la slide</div><div class="gallery" id="gallery"></div></div>
        <div class="rightBottom" id="rightBottom"></div>
      </div>
    </div>
    <div class="controls">
      <div class="nav">
        <button class="btn" id="prevBtn">← Anterior</button>
        <button class="btn primary" id="nextBtn">Siguiente →</button>
      </div>
      <div class="progressWrap">
        <div class="progressTrack"><div class="progressBar" id="progressBar"></div></div>
        <div class="slideDots" id="dots"></div>
        <div class="hint">← → · F pantalla completa</div>
      </div>
    </div>
  </div>
  <div class="deckFoot"><a href="index.html">← Volver al índice del curso</a><span>TI-312 · Universidad CENFOTEC</span></div>
</div>`);

  const $ = id => document.getElementById(id);
  const elImg=$("slideImg"), elPh=$("placeholder"), left=document.querySelector(".left");

  const dots=$("dots");
  dots.innerHTML = slides.map((s,i)=>`<button title="${pad2(i+1)} · ${(s.title||"").replace(/"/g,"&quot;")}" data-i="${i}"></button>`).join("");
  dots.addEventListener("click",e=>{ const b=e.target.closest("button"); if(b) go(+b.dataset.i); });

  const gal=$("gallery");
  function setPhotos(list){
    gal.innerHTML = (list||[]).map(f=>`<figure>
      <img src="${f.src}" alt="${f.cap}" loading="lazy" onerror="this.closest('figure').classList.add('broken')"/>
      <figcaption>${f.cap}${f.credit?` <a href="${f.credit}" target="_blank" rel="noopener">Foto: Wikimedia Commons</a>`:""}</figcaption>
    </figure>`).join("");
    gal.className = "gallery" + (list&&list.length ? " on n"+list.length : "");
  }
  function setImg(src){
    elImg.style.display="none"; elPh.style.display=src?"block":"none"; elPh.textContent="Imagen de la slide";
    if(!src) return;
    elImg.onload=()=>{ elImg.style.display="block"; elPh.style.display="none"; };
    elImg.onerror=()=>{ elPh.textContent="Imagen no encontrada: "+src; };
    elImg.src=src;
  }
  function badges(b){
    const mk=(l,v)=>`<div class="miniCard"><div class="label">${l}</div><div class="value">${v||""}</div></div>`;
    $("rightBottom").innerHTML=(b?.ak?mk(b.ak,b.av):"")+(b?.bk?mk(b.bk,b.bv):"");
  }
  function wireReveal(){
    document.querySelectorAll("[data-reveal]").forEach(b=>b.onclick=()=>{const el=$(b.dataset.reveal); if(el) el.style.display="block";});
    document.querySelectorAll("[data-hide]").forEach(b=>b.onclick=()=>{const el=$(b.dataset.hide); if(el) el.style.display="none";});
  }

  let idx=0;
  function render(){
    const s=slides[idx];
    $("counterTxt").textContent=`${pad2(idx+1)} / ${pad2(slides.length)}`;
    $("kicker").textContent=s.kicker||"";
    $("title").textContent=s.title||"";
    $("desc").textContent=s.desc||"";
    $("leftBlocks").innerHTML=s.html||"";
    badges(s.badges);
    setPhotos(s.photos); setImg(s.photos&&s.photos.length?"":s.img);
    $("progressBar").style.width=((idx+1)/slides.length*100)+"%";
    $("prevBtn").disabled = idx===0;
    $("nextBtn").textContent = idx===slides.length-1 ? "Fin ✓" : "Siguiente →";
    [...dots.children].forEach((d,i)=>d.classList.toggle("on",i===idx));
    wireReveal(); clearPen(); left.scrollTop=0;
    history.replaceState(null,"","#"+(idx+1));
  }
  function go(i){ idx=Math.max(0,Math.min(slides.length-1,i)); render(); }
  const next=()=>go(idx+1), prev=()=>go(idx-1);
  $("nextBtn").onclick=next; $("prevBtn").onclick=prev;

  function toggleFS(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  $("fsBtn").onclick=toggleFS;

  window.addEventListener("keydown",e=>{
    if(["INPUT","SELECT","TEXTAREA"].includes(e.target.tagName)) return;
    if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){e.preventDefault();next();}
    else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();prev();}
    else if(e.key==="Home"){e.preventDefault();go(0);}
    else if(e.key==="End"){e.preventDefault();go(slides.length-1);}
    else if(e.key==="f"||e.key==="F"){toggleFS();}
    else if(e.key==="l"||e.key==="L"){$("penToggle").click();}
    else if(e.key==="Escape"&&penOn){$("penToggle").click();}
  });

  /* ── Swipe en celular/tablet ── */
  let tx=null;
  const deck=document.querySelector(".deck");
  deck.addEventListener("touchstart",e=>{ if(!penOn) tx=e.touches[0].clientX; },{passive:true});
  deck.addEventListener("touchend",e=>{
    if(penOn||tx===null) return;
    const dx=e.changedTouches[0].clientX-tx; tx=null;
    if(Math.abs(dx)>60) (dx<0?next:prev)();
  });

  /* ── Lápiz ── */
  const canvas=$("penCanvas");
  let penOn=false, drawing=false, last={x:0,y:0};
  function resizeCanvas(){
    const r=deck.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    canvas.width=Math.floor(r.width*dpr); canvas.height=Math.floor(r.height*dpr);
    canvas.style.width=r.width+"px"; canvas.style.height=r.height+"px";
    canvas.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener("resize",resizeCanvas);
  const pos=ev=>{const r=deck.getBoundingClientRect(),s=ev.touches?ev.touches[0]:ev;return{x:s.clientX-r.left,y:s.clientY-r.top}};
  function line(a,b){const c=canvas.getContext("2d");c.lineCap="round";c.lineJoin="round";c.strokeStyle=$("penColor").value;c.lineWidth=+$("penSize").value;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
  function clearPen(){canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);}
  deck.addEventListener("mousedown",e=>{if(!penOn)return;drawing=true;last=pos(e);e.preventDefault();});
  deck.addEventListener("mousemove",e=>{if(!penOn||!drawing)return;const p=pos(e);line(last,p);last=p;e.preventDefault();});
  window.addEventListener("mouseup",()=>drawing=false);
  deck.addEventListener("touchstart",e=>{if(!penOn)return;drawing=true;last=pos(e);e.preventDefault();},{passive:false});
  deck.addEventListener("touchmove",e=>{if(!penOn||!drawing)return;const p=pos(e);line(last,p);last=p;e.preventDefault();},{passive:false});
  window.addEventListener("touchend",()=>drawing=false);
  $("penToggle").onclick=()=>{
    penOn=!penOn; canvas.style.pointerEvents=penOn?"auto":"none";
    $("penToggle").classList.toggle("on",penOn);
    $("penToggle").textContent=penOn?"✏️ Activo":"✏️ Lápiz";
    resizeCanvas();
  };
  $("penClear").onclick=clearPen;

  resizeCanvas();
  const h=parseInt(location.hash.slice(1),10);
  go(Number.isFinite(h)?h-1:0);
})();
