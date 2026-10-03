const META=window.BOOK_META;
const pdfjsLib=window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const state={pages:[],index:0,zoom:1,pdfs:{}};
const $=id=>document.getElementById(id);
const pageEl=$('page'), loading=$('loading');
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function lecturePage(pdfPage){return state.pages.findIndex(p=>p.type==='pdf'&&p.doc==='lectures'&&p.pdfPage===pdfPage)}
function labPage(pdfPage){return state.pages.findIndex(p=>p.type==='pdf'&&p.doc==='labs'&&p.pdfPage===pdfPage)}
function buildPages(){
  state.pages=[{type:'cover'},{type:'title'},{type:'toc',part:'lectures'},{type:'toc',part:'labs'}];
  for(let p=1;p<=META.lecturePdfPages;p++)state.pages.push({type:'pdf',doc:'lectures',pdfPage:p});
  for(let p=1;p<=META.labPdfPages;p++){
    state.pages.push({type:'pdf',doc:'labs',pdfPage:p});
    const nextLab=META.labs.findIndex(x=>x[0]===p+1);
    if(nextLab>=0)state.pages.push({type:'video',lab:META.labs[nextLab-1]});
  }
  // Add a video page after the final lab section as well.
  const last=META.labs[META.labs.length-1];
  if(last)state.pages.push({type:'video',lab:last});
}
function tocHTML(part){
  const arr=part==='lectures'?META.lectures:META.labs;
  const title=part==='lectures'?'Дәрістер':'Зертханалық жұмыстар';
  const rows=arr.map((x,i)=>{const target=part==='lectures'?lecturePage(x[0]):labPage(x[0]);return `<div class="toc-row" data-target="${target}"><span class="toc-text">${esc(part==='lectures'?x[1]:x[1])}</span><span class="dots"></span><span class="toc-page-no">${target+1}</span></div>`}).join('');
  return `<div class="html-inner toc-page"><h1>МАЗМҰНЫ</h1><section class="toc-section"><h2>${title}</h2>${rows}</section></div>`;
}
function sideHTML(){
  let h='<div class="side-title">ДӘРІСТЕР</div>';
  h+=META.lectures.map((x,i)=>`<button class="side-link" data-target="${lecturePage(x[0])}">${i+1}. ${esc(x[1])}</button>`).join('');
  h+='<div class="side-title">ЗЕРТХАНАЛЫҚ ЖҰМЫСТАР</div>';
  h+=META.labs.map((x,i)=>`<button class="side-link" data-target="${labPage(x[0])}">${esc(x[1])}</button>`).join('');
  return h;
}
function videosFor(key){
 const data={
  intro:[['C++ бағдарламалау тіліне кіріспе — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+бағдарламалау+қазақша']],
  if:[['C++ if else — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+if+else+қазақша']],
  loop:[['C++ циклдері — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+цикл+қазақша']],
  array:[['C++ массивтер — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+массив+қазақша']],
  function:[['C++ функциялар — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+функция+қазақша']],
  struct:[['C++ құрылымдар (struct) — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+struct+қазақша']],
  graphics:[['C++ графика — қазақша сабақ','https://www.youtube.com/results?search_query=C%2B%2B+графика+қазақша']]
 };return data[key]||[['C++ тақырыбы бойынша қазақша сабақтарды іздеу','https://www.youtube.com/results?search_query=C%2B%2B+қазақша+сабақ']];
}
function videoHTML(lab){return `<div class="html-inner video-page"><h1>${esc(lab[1])}</h1><p>Қосымша бейнесабақтар</p>${videosFor(lab[3]).map(v=>`<a class="video-card" href="${v[1]}" target="_blank" rel="noopener"><b>${esc(v[0])}</b><small>YouTube</small></a>`).join('')}<a class="pdf-link" href="source/labs.pdf" target="_blank" rel="noopener">Зертханалық жұмыстардың PDF нұсқасын ашу</a></div>`}
function renderHTML(){const p=state.pages[state.index];pageEl.className='page html-page';
 if(p.type==='cover')pageEl.innerHTML='<img class="cover-page" src="assets/cover-final-2026.jpg" alt="C++ машинаға бағытталған бағдарламалау, Астана 2026">';
 else if(p.type==='title')pageEl.innerHTML='<div class="html-inner title-page"><div class="title">C++ машинаға бағытталған бағдарламалау</div><div class="sub">Электронды оқу құралы</div><div class="city">Астана 2026</div></div>';
 else if(p.type==='toc')pageEl.innerHTML=tocHTML(p.part);
 else if(p.type==='video')pageEl.innerHTML=videoHTML(p.lab);
 bindLinks();
}
async function loadPDFs(){state.pdfs.lectures=await pdfjsLib.getDocument('source/lectures.pdf').promise;state.pdfs.labs=await pdfjsLib.getDocument('source/labs.pdf').promise;}
async function renderPDF(p){
 pageEl.className='page';pageEl.innerHTML='';
 const canvas=document.createElement('canvas');pageEl.appendChild(canvas);
 const pdf=state.pdfs[p.doc];const pdfPage=await pdf.getPage(p.pdfPage);
 const base=pdfPage.getViewport({scale:1});
 const wrapW=pageEl.clientWidth;const dpr=Math.min(window.devicePixelRatio||1,2);
 const scale=(wrapW/base.width)*state.zoom*dpr;const vp=pdfPage.getViewport({scale});
 canvas.width=Math.floor(vp.width);canvas.height=Math.floor(vp.height);canvas.style.width='100%';canvas.style.height='100%';
 await pdfPage.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:vp}).promise;
 const n=document.createElement('div');n.className='page-number';n.textContent=String(state.index+1);pageEl.appendChild(n);
}
async function render(){
 $('counter').textContent=`${state.index+1} / ${state.pages.length}`;$('total').textContent=state.pages.length;$('pageInput').value=state.index+1;loading.style.display='flex';
 try{const p=state.pages[state.index];if(p.type==='pdf')await renderPDF(p);else renderHTML();}
 catch(e){console.error(e);pageEl.className='page html-page';pageEl.innerHTML='<div class="html-inner"><h1>Бетті ашу мүмкін болмады</h1><p>PDF файлдары source папкасында бар екенін тексеріңіз.</p></div>'}
 loading.style.display='none';
}
function go(i){if(i<0||i>=state.pages.length)return;state.index=i;render()}
function bindLinks(){document.querySelectorAll('[data-target]').forEach(el=>el.onclick=()=>go(Number(el.dataset.target)))}
function openSide(){$('sidebar').classList.add('open');$('overlay').classList.add('show')}
function closeSide(){$('sidebar').classList.remove('open');$('overlay').classList.remove('show')}
function setZoom(z){state.zoom=Math.max(.75,Math.min(1.5,z));$('zoomLabel').textContent=Math.round(state.zoom*100)+'%';render()}
function search(q){q=q.trim().toLowerCase();if(!q)return;let i=META.lectures.findIndex(x=>x[1].toLowerCase().includes(q));if(i>=0)return go(lecturePage(META.lectures[i][0]));i=META.labs.findIndex(x=>x[1].toLowerCase().includes(q));if(i>=0)return go(labPage(META.labs[i][0]));alert('Іздеу бойынша нәтиже табылмады.')}
$('menuBtn').onclick=openSide;$('close').onclick=closeSide;$('overlay').onclick=closeSide;$('prev').onclick=()=>go(state.index-1);$('next').onclick=()=>go(state.index+1);$('prevBottom').onclick=()=>go(state.index-1);$('nextBottom').onclick=()=>go(state.index+1);$('bottomToc').onclick=openSide;$('bottomFull').onclick=()=>document.documentElement.requestFullscreen?.();$('zoomOut').onclick=()=>setZoom(state.zoom-.1);$('zoomIn').onclick=()=>setZoom(state.zoom+.1);$('fit').onclick=()=>setZoom(1);$('theme').onclick=()=>{document.body.classList.toggle('dark');$('theme').textContent=document.body.classList.contains('dark')?'Жарық':'Қараңғы'};$('full').onclick=()=>document.documentElement.requestFullscreen?.();$('go').onclick=()=>go(Number($('pageInput').value)-1);$('pageInput').onkeydown=e=>{if(e.key==='Enter')$('go').click()};$('search').onkeydown=e=>{if(e.key==='Enter')search(e.target.value)};
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight'||e.key===' ') {e.preventDefault();go(state.index+1)}if(e.key==='ArrowLeft'){e.preventDefault();go(state.index-1)}if(e.key==='Escape')closeSide()});
(async()=>{buildPages();$('tocSide').innerHTML=sideHTML();document.querySelector('.side-home').onclick=()=>go(0);bindLinks();await render();try{await loadPDFs();await render()}catch(e){console.error(e)}})();
