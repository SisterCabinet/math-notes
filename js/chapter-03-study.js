(()=>{'use strict';
const key='math-notes-ch3-book-v2', $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={version:2,examples:{},exercises:{}};
try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x?.version===2&&x.examples&&x.exercises)state=x;}catch{}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{notice('当前浏览器无法保存进度，可用“导出进度”保留记录。');}}
let toastTimer;function notice(t){const el=$('#toast');if(!el)return;el.textContent=t;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4000);}
function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
const planEl=$('#plan-data');
if(planEl){
 const p=JSON.parse(planEl.textContent);p.days.forEach(d=>{const need=d.core.concat(d.supplements),n=need.filter(x=>state.exercises[x]?.status==='independent'||state.exercises[x]?.redo).length;const ex=d.examples.filter(x=>state.examples[x]).length;const el=document.getElementById('progress-'+d.date);if(el)el.textContent=`当前记录：例题 ${ex}/${d.examples.length} · 核心过关 ${n}/${need.length}（含闭卷复做）`;});
 const match=p.days.find(x=>x.date===today());if(match){const el=document.getElementById('day-'+match.date);el?.classList.add('selected');$('#plan-today').href='#day-'+match.date;}
 return;
}
const dataEl=$('#study-data');if(!dataEl)return;const data=JSON.parse(dataEl.textContent),examples=data.examples,exercises=data.exercises,supplements=data.supplements;
const byDom=new Map([...examples,...exercises].map(x=>[x.dom_id,x]));
let activeSection=data.sections[0].id,pool='K',activeMother='',activePanel='book',selectedDay='';
let mathQueue=Promise.resolve();
function math(el){if(!el||el.dataset.mathDone)return;el.dataset.mathDone='yes';mathQueue=mathQueue.then(async()=>{try{await window.MathJax?.startup?.promise;if(window.MathJax?.typesetPromise)await MathJax.typesetPromise([el]);}catch{el.dataset.mathDone='';}});}
function refresh(){
 const needed=examples.filter(x=>!['C','D'].includes(x.level));$('#example-progress').textContent=needed.filter(x=>state.examples[x.id]).length+' / '+needed.length;
 const core=exercises.filter(x=>x.level==='K');$('#exercise-progress').textContent=core.filter(x=>state.exercises[x.id]?.status==='independent'||state.exercises[x.id]?.redo).length+' / '+core.length;
 $('#first-progress').textContent=core.filter(x=>state.exercises[x.id]?.status==='independent').length;
 $('#supp-progress').textContent=supplements.filter(x=>state.exercises[x.id]?.status==='independent'||state.exercises[x.id]?.redo).length+' / '+supplements.length;
 $$('[data-example-done]').forEach(el=>{const id=el.dataset.exampleDone;el.checked=!!state.examples[id];const card=el.closest('.example-card');const tag=card.querySelector('.item-status');if(tag){tag.textContent=el.checked?'已达到要求':'';tag.classList.toggle('done',el.checked);}});
 $$('[data-exercise-record]').forEach(el=>{
  const id=el.dataset.exerciseRecord,x=state.exercises[id]||{},card=el.closest('.exercise-card'),can=!x.revealed||x.firstSucceeded;
  el.value=x.status||'new';el.querySelector('option[value=independent]').disabled=!can;
  const tag=card.querySelector('.item-status'),labels={new:'未记录',stuck:'独立尝试未完成',independent:'首次独立完成',hinted:'已看提示／待复做',solution:'已看解答／待复做'};
  if(tag)tag.textContent=labels[x.status||'new'];card.classList.toggle('is-done',x.status==='independent');card.classList.toggle('is-assisted',['hinted','solution'].includes(x.status));
  const note=card.querySelector('[data-note]');if(document.activeElement!==note&&note)note.value=x.note||'';
  const redo=card.querySelector('[data-redo]');if(redo)redo.checked=!!x.redo;
 });
 data.days.forEach(d=>{const el=document.getElementById('day-progress-'+d.date);if(!el)return;const all=d.core.concat(d.supplements),n=all.filter(x=>state.exercises[x]?.status==='independent'||state.exercises[x]?.redo).length;el.textContent=`例题 ${d.examples.filter(x=>state.examples[x]).length}/${d.examples.length} · 核心过关 ${n}/${all.length}（含闭卷复做）`;});
 filterExercises();
}
function markRevealed(id,kind){if(!id)return;const x=state.exercises[id]||(state.exercises[id]={});x.revealed=true;if(x.status!=='independent')x.status=kind;x.viewedAt=new Date().toISOString();save();refresh();}
function panel(name){activePanel=name;$$('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==name);$$('[data-tab]').forEach(x=>{const yes=x.dataset.tab===name;x.classList.toggle('active',yes);x.setAttribute('aria-selected',String(yes));x.tabIndex=yes?0:-1;});
 if(name==='book')selectSection(activeSection);if(name==='practice')filterExercises();if(name==='methods')searchResults();
 if(name==='daily')selectDay(selectedDay||today());
 math(document.querySelector(`[data-panel="${name}"] .initial-math`));
}
function selectSection(id){if(!data.sections.some(x=>x.id===id))return;activeSection=id;$$('[data-book-section]').forEach(x=>x.hidden=x.id!==id);$$('[data-section]').forEach(x=>{const yes=x.dataset.section===id;x.classList.toggle('active',yes);x.setAttribute('aria-current',yes?'step':'false');});math(document.querySelector('#'+id+' .initial-math'));filterExamples();}
function filterExamples(){const only=$('#example-filter').value==='required';$$('.example-card').forEach(el=>{const x=byDom.get(el.id);el.hidden=only&&['C','D'].includes(x.level);});}
function filterExercises(){const status=$('#exercise-status').value,topic=$('#exercise-topic').value;let n=0;
 $$('.exercise-card').forEach(el=>{const id=el.dataset.exerciseId,x=state.exercises[id]||{},isSupp=el.dataset.supp==='yes';let hit=(pool==='all'||(pool==='supp'?isSupp:!isSupp&&el.dataset.level===pool));
  if(topic!=='all')hit=hit&&el.dataset.topic===topic;
  if(status==='new')hit=hit&&(!x.status||x.status==='new');else if(status==='independent')hit=hit&&x.status==='independent';else if(status==='review')hit=hit&&['stuck','hinted','solution'].includes(x.status)&&!x.redo;
  el.hidden=!hit;if(hit)n++;
 });
 $$('[data-exercise-group]').forEach(el=>el.hidden=![...el.querySelectorAll('.exercise-card')].some(x=>!x.hidden));
 $('#exercise-count').textContent=`显示 ${n} 个训练单元 · 原书共121个，补充5个`;
 $('#exercise-empty').hidden=n>0;$$('[data-pool]').forEach(b=>{b.classList.toggle('active',b.dataset.pool===pool);b.setAttribute('aria-pressed',String(b.dataset.pool===pool));});
}
const norm=s=>String(s).toLowerCase().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/[（]/g,'(').replace(/[）]/g,')').replace(/[．。]/g,'.').replace(/\s+/g,'');
function searchResults(){const q=norm($('#global-search').value),kind=$('#result-kind').value,m=activeMother;let out=[];
 const qex=q.replace(/^例题?/,'');const qhw=q.replace(/^(课后)?习题/,'');
 if(kind!=='exercise')examples.forEach(x=>{let hit=!m||x.mother_ids.includes(m);if(q){const exact=/^3\.\d+$/.test(qex);hit=hit&&(exact?x.id===qex:norm([x.id,x.method,x.target,x.group,x.bridge].join(' ')).includes(qex));}if(hit)out.push({id:x.dom_id,label:'例'+x.id+' · '+x.method,sub:x.level+' · '+x.section,kind:'例题'});});
 if(kind!=='example')exercises.forEach(x=>{let hit=!m||x.mother_ids.includes(m);if(q){const exact=/^\d+(?:\(\d+\))?$/.test(qhw);hit=hit&&(exact?x.id===qhw:norm([x.id,x.label,x.reason,x.hint].join(' ')).includes(qhw));}if(hit)out.push({id:x.dom_id,label:'习题'+x.id+' · '+x.label,sub:x.level+' · '+({K:'核心',J:'巩固',T:'挑战',R:'复现',Z:'暂缓'}[x.level]),kind:'习题'});});
 if(!q&&!m)out=[];
 $('#method-results').innerHTML=out.map(x=>`<button class="result-link" data-goto="${esc(x.id)}"><b>${esc(x.label)}</b><br><span>${esc(x.sub)}</span></button>`).join('');
 $('#method-result-count').textContent=(q||m)?`找到 ${out.length} 个条目`:'选一个方法，或输入例题号、习题号、知识点。';
 $('#method-empty').hidden=!(q||m)||out.length>0;
 const mother=data.mothers.find(x=>x.id===m);$('#selected-method').textContent=mother?mother.title:'全部方法';
 $$('[data-method]').forEach(b=>{b.classList.toggle('active',b.dataset.method===m);b.setAttribute('aria-pressed',String(b.dataset.method===m));});
}
function reveal(id,scroll=true){const el=document.getElementById(id);if(!el)return false;
 if(id.startsWith('example-')){const x=byDom.get(id);activeSection=x.section_id;panel('book');$('#example-filter').value='all';filterExamples();el.open=true;math(el.querySelector('.item-body'));}
 else if(id.startsWith('exercise-')||id.startsWith('supp-')){pool='all';$('#exercise-status').value='all';$('#exercise-topic').value='all';panel('practice');el.open=true;math(el.querySelector('.item-body'));}
 else if(id.startsWith('bridge-')){panel('basics');el.open=true;math(el.querySelector('.bridge-body'));}
 else if(id.startsWith('day-')){selectedDay=id.slice(4);panel('daily');}
 else if(data.sections.some(x=>x.id===id)){panel('book');selectSection(id);}
 else{const parent=el.closest('[data-panel]');if(parent)panel(parent.dataset.panel);if(el.tagName==='DETAILS')el.open=true;math(el);}
 if(scroll)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),30);return true;
}
function go(id,scroll=true,push=true){if(push)history.pushState(null,'','#'+id);if(/^i\d+$/.test(id)&&data.mothers.some(x=>x.id===id)){activeMother=id;$('#global-search').value='';panel('methods');if(scroll)$('#method-grid').scrollIntoView({behavior:'smooth'});return;}
 const tabs={book:'book',practice:'practice',methods:'methods',basics:'basics',daily:'daily'};if(tabs[id]){panel(tabs[id]);if(scroll)$('#tab-bar').scrollIntoView({behavior:'smooth',block:'start'});return;}reveal(id,scroll);}
function selectDay(wanted){const match=data.days.find(x=>x.date===wanted)||data.days.find(d=>d.core.concat(d.supplements).some(id=>state.exercises[id]?.status!=='independent'&&!state.exercises[id]?.redo))||data.days[0];selectedDay=match.date;$('#day-select').value=match.date;$$('[data-day-date]').forEach(x=>x.classList.toggle('selected',x.dataset.dayDate===match.date));}
$$('[data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));
$$('[data-section]').forEach(b=>b.onclick=()=>go(b.dataset.section));
$('#example-filter').onchange=filterExamples;
$$('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;filterExercises();});
$('#exercise-status').onchange=filterExercises;$('#exercise-topic').onchange=filterExercises;
$('#global-search').addEventListener('input',()=>{activeMother='';panel('methods');searchResults();});
$('#global-search').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';activeMother='';searchResults();}});
$('#result-kind').onchange=searchResults;
$('#clear-method').onclick=()=>{activeMother='';$('#global-search').value='';searchResults();};
$('#day-select').onchange=e=>go('day-'+e.target.value);
$('#today-button').onclick=()=>{selectDay(today());go('day-'+selectedDay);};
document.addEventListener('click',e=>{
 const method=e.target.closest('[data-method]');if(method){activeMother=method.dataset.method;$('#global-search').value='';go(activeMother,false);searchResults();$('#method-results').scrollIntoView({behavior:'smooth',block:'start'});return;}
 const jump=e.target.closest('[data-goto]');if(jump){e.preventDefault();go(jump.dataset.goto);return;}
 const src=e.target.closest('[data-source-page]');if(src){if(src.dataset.readerMode==='solution')markRevealed(src.dataset.exerciseTarget,'solution');openReader(src.dataset.readerMode,+src.dataset.sourcePage,src.dataset.readerLabel||'',src.dataset.exerciseTarget||'');return;}
 const clear=e.target.closest('[data-clear-record]');if(clear){delete state.exercises[clear.dataset.clearRecord];save();refresh();notice('已更正这道题的记录。');return;}
 const link=e.target.closest('a[href^="#"]');if(link&&link.getAttribute('href')!=='#'){e.preventDefault();go(decodeURIComponent(link.hash.slice(1)));}
});
document.addEventListener('change',e=>{const el=e.target;
 if(el.matches('[data-example-done]')){state.examples[el.dataset.exampleDone]=el.checked;save();refresh();}
 if(el.matches('[data-exercise-record]')){const id=el.dataset.exerciseRecord,x=state.exercises[id]||(state.exercises[id]={});if(el.value==='independent'&&x.revealed&&!x.firstSucceeded){el.value=x.status||'hinted';return;}x.status=el.value;if(el.value==='independent')x.firstSucceeded=true;if(['hinted','solution'].includes(el.value))x.revealed=true;x.updatedAt=new Date().toISOString();save();refresh();}
 if(el.matches('[data-redo]')){const x=state.exercises[el.dataset.redo]||(state.exercises[el.dataset.redo]={});x.redo=el.checked;x.redoAt=el.checked?new Date().toISOString():null;save();refresh();}
});
document.addEventListener('input',e=>{if(e.target.matches('[data-note]')){const x=state.exercises[e.target.dataset.note]||(state.exercises[e.target.dataset.note]={});x.note=e.target.value.slice(0,1000);save();}});
document.addEventListener('toggle',e=>{const el=e.target;if(!el.open)return;if(el.matches('.example-card,.exercise-card'))math(el.querySelector('.item-body'));if(el.matches('.bridge-card'))math(el.querySelector('.bridge-body'));if(el.hasAttribute('data-hint-for'))markRevealed(el.dataset.hintFor,'hinted');el.querySelectorAll('img[data-image-src]').forEach(x=>{x.src=x.dataset.imageSrc;x.removeAttribute('data-image-src');});},true);
$('#export-progress').onclick=()=>{const payload={...state,chapter:3,exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='第三章-按书复习进度.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import-progress').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1500000)throw new Error();const x=JSON.parse(await file.text());if(x.version!==2||x.chapter!==3||!x.examples||!x.exercises)throw new Error();const next={version:2,examples:{},exercises:{}};examples.forEach(t=>{if(x.examples[t.id]===true)next.examples[t.id]=true;});[...exercises,...supplements].forEach(t=>{const v=x.exercises[t.id];if(!v||!['new','stuck','independent','hinted','solution',undefined].includes(v.status))return;next.exercises[t.id]={status:v.status||'new',revealed:!!v.revealed,firstSucceeded:!!v.firstSucceeded,note:String(v.note||'').slice(0,1000),redo:!!v.redo};if(next.exercises[t.id].status==='independent')next.exercises[t.id].firstSucceeded=true;});state=next;save();refresh();notice('进度已导入。');}catch{notice('请选择此版第三章导出的进度文件；旧版记录仍可在保留版查看。');}e.target.value='';};
$('#print-page').onclick=()=>window.print();
// 原题模式只翻阅经过裁切的题干页；解答由独立按钮打开。
let readerMode='book',readerPage=178,readerLabel='';const reader=$('#source-reader');
function openReader(mode,page,label){readerMode=mode||'book';readerPage=page;readerLabel=label;renderReader();reader.showModal();document.body.classList.add('reader-open');}
function range(){return readerMode==='question'?[242,249]:readerMode==='solution'?[249,265]:[178,265];}
function renderReader(){const [a,b]=range();readerPage=Math.min(b,Math.max(a,readerPage));const img=$('#reader-image');img.classList.remove('zoomed');img.hidden=false;$('#reader-image-error').hidden=true;img.src='../../images/chapter-02-03/'+(readerMode==='question'?'questions-':'book-')+readerPage+'.webp';img.alt=`${readerMode==='question'?'课后习题题干':'教材原页'} PDF ${readerPage}页`;
 $('#reader-title').textContent=readerLabel||'教程上册';$('#reader-page').textContent=`印刷P${readerPage-8} / PDF${readerPage}`;$('#reader-prev').disabled=readerPage<=a;$('#reader-next').disabled=readerPage>=b;$('#reader-jump').min=a;$('#reader-jump').max=b;$('#reader-jump').value=readerPage;
 $('#reader-note').textContent=readerMode==='question'?'这里只显示题干；跨页时可前后翻阅。题号请按原书小问定位。':readerMode==='solution'?'原页可能同时含其他题答案；看过的题请按实际情况记录为复现。':'教材原页含解答；本区用于例题学习，可前后翻阅。';
}
$('#reader-prev').onclick=()=>{readerPage--;renderReader();};$('#reader-next').onclick=()=>{readerPage++;renderReader();};$('#reader-jump').onchange=e=>{readerPage=Number(e.target.value)||range()[0];renderReader();};$('#reader-close').onclick=()=>reader.close();$('#reader-image').onclick=()=>$('#reader-image').classList.toggle('zoomed');$('#reader-image').onerror=()=>{$('#reader-image').hidden=true;$('#reader-image-error').hidden=false;};reader.addEventListener('close',()=>document.body.classList.remove('reader-open'));reader.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&readerPage>range()[0]){e.preventDefault();readerPage--;renderReader();}if(e.key==='ArrowRight'&&readerPage<range()[1]){e.preventDefault();readerPage++;renderReader();}});
window.addEventListener('hashchange',()=>go(decodeURIComponent(location.hash.slice(1)),false,false));window.addEventListener('popstate',()=>go(decodeURIComponent(location.hash.slice(1)),false,false));
refresh();panel('book');const hash=decodeURIComponent(location.hash.slice(1));if(hash)go(hash,false,false);else{const first=$('.example-card');if(first){first.open=true;math(first.querySelector('.item-body'));}}
})();
