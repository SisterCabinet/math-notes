(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], el=id=>document.getElementById(id);
const data=JSON.parse($('#study-data').textContent),ch=data.number,key=`math-notes-ch456-book-v1-${ch}`;
const all=[...data.exercises,...data.supplements],byId=new Map(all.map(x=>[x.id,x])),byDom=new Map([...data.examples,...all].map(x=>[x.dom_id,x]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function plus(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
let state={schema:1,chapter:ch,examples:{},exercises:{}};
try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x?.schema===1&&x.chapter===ch&&x.examples&&x.exercises)state=x;}catch{}
let timer;function notice(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('#toast').hidden=true,5500);}
function save(){try{localStorage.setItem(key,JSON.stringify(state));}catch{notice('当前浏览器无法保存记录，请导出进度保留。');}}
const done=x=>!!(x&&(x.status==='independent'||x.redo));
function schedule(x){if(!x.nextReviewDate)x.nextReviewDate=plus(date(),1);x.updatedAt=new Date().toISOString();}
// A representative per method, plus unsuccessful/assisted attempts. All examples are not queued.
const anchors=new Set();
data.mothers.forEach(m=>{const e=data.examples.find(x=>x.is_required&&x.mother_ids.includes(m.id));const q=all.find(x=>x.is_core&&x.mother_ids.includes(m.id));if(e)anchors.add(e.id);if(q)anchors.add(q.id);});
function due(){const tasks=[];
 for(const r of data.examples){const x=state.examples[r.id];if(anchors.has(r.id)&&x?.done&&x.nextReviewDate<=date())tasks.push({r,x,kind:'example'});}
 for(const r of all){const x=state.exercises[r.id];if(x?.nextReviewDate&&x.nextReviewDate<=date()&&(anchors.has(r.id)||!done(x)))tasks.push({r,x,kind:'exercise'});}
 return tasks.sort((a,b)=>Number(done(a.x))-Number(done(b.x))||a.x.nextReviewDate.localeCompare(b.x.nextReviewDate));
}
let panelName='book',section=data.sections[0].id,pool='K',mother='',selectedDay='';
let mathQueue=Promise.resolve();
function math(node){if(!node||node.dataset.mathDone)return;node.dataset.mathDone='yes';mathQueue=mathQueue.then(async()=>{try{await window.MathJax?.startup?.promise;if(window.MathJax?.typesetPromise)await MathJax.typesetPromise([node]);}catch{node.dataset.mathDone='';}});}
function refresh(){
 const ex=data.examples.filter(x=>x.is_required),core=all.filter(x=>x.is_core);
 $('#example-progress').textContent=`${ex.filter(r=>state.examples[r.id]?.done).length} / ${ex.length}`;
 $('#exercise-progress').textContent=`${core.filter(r=>done(state.exercises[r.id])).length} / ${core.length}`;
 $('#first-progress').textContent=core.filter(r=>state.exercises[r.id]?.firstIndependent).length;
 $('#review-progress').textContent=due().length;
 $$('[data-example-done]').forEach(input=>{const yes=!!state.examples[input.dataset.exampleDone]?.done;input.checked=yes;input.closest('.example-card').querySelector('.item-status').textContent=yes?'已达要求':'';});
 $$('[data-exercise-record]').forEach(select=>{
  const id=select.dataset.exerciseRecord,r=byId.get(id),x=state.exercises[id]||{},card=select.closest('.exercise-card');
  select.value=x.status||'new';select.querySelector('option[value=independent]').disabled=(!r.is_default_fresh_candidate||x.exposed||x.status==='seen')&&!x.firstIndependent;
  const labels={new:'未记录',stuck:'独立尝试未完成',independent:'首次无提示完成',hinted:'提示后待复做',solution:'解答后待复做',seen:'已见复现'};
  card.querySelector('.item-status').textContent=(done(x)?'当前过关 · ':'')+labels[x.status||'new'];
  card.classList.toggle('is-done',done(x));card.classList.toggle('is-assisted',!done(x)&&!!x.exposed);
  const note=card.querySelector('[data-note]');if(document.activeElement!==note)note.value=x.note||'';
  const info=card.querySelector('[data-review-state]');
  info.textContent=(x.redo?'已记录闭卷复做；':'')+(x.nextReviewDate?`下次回访 ${x.nextReviewDate}。`:'记录尝试后，代表题/未通过题进入间隔回访。')+(r.deferred_part&&!x.laterDone?' 本题二重积分部分尚未完成。':'');
  const later=card.querySelector('[data-later-done]');if(later)later.checked=!!x.laterDone;
 });
 data.days.forEach(day=>{const node=el('progress-'+day.date),ids=day.core.concat(day.supplements);if(node)node.textContent=`当前记录：例题 ${day.examples.filter(id=>state.examples[id]?.done).length}/${day.examples.length} · 当前核心过关 ${ids.filter(id=>done(state.exercises[id])).length}/${ids.length}（正式小问/自编组）`;});
 renderDue();filterExercises();
}
function expose(ids,kind,silent=false){let count=0;
 const expanded=new Set(ids);
 if(ch===6)for(const group of [['6-练14','6-练30'],['6-练6','6-练32']])if(group.some(id=>expanded.has(id)))group.forEach(id=>expanded.add(id));
 ids=[...expanded];
 ids.forEach(id=>{const r=byId.get(id);if(!r)return;const x=state.exercises[id]||(state.exercises[id]={});if(!x.exposed)count++;x.exposed=true;if(!x.firstIndependent)x.status=kind;x.viewedAt=new Date().toISOString();schedule(x);});
 save();refresh();if(count&&!silent)notice(`已标记${count}个本题、重复题或同页可能见到的单元；按实际阅读情况记录，可在题卡更正。`);
}
function passReview(id,kind='exercise'){
 const collection=kind==='example'?state.examples:state.exercises,x=collection[id]||(collection[id]={});
 if(x.reviewedDate===date()){notice('今天这次回访已记录，下次按日期再检验。');return;}
 x.redo=true;x.status=x.status||'seen';x.reviewedDate=date();
 if(x.nextReviewDate&&x.nextReviewDate<=date()){
  x.reviewStage=Math.min(3,(x.reviewStage||0)+1);x.nextReviewDate=plus(date(),[1,2,4,7][x.reviewStage]);
 }else if(!x.nextReviewDate)x.nextReviewDate=plus(date(),1);
 x.reviewLog=[...(x.reviewLog||[]),date()].slice(-20);x.updatedAt=new Date().toISOString();
 if(kind==='exercise'&&ch===6){const group=[['6-练14','6-练30'],['6-练6','6-练32']].find(g=>g.includes(id));if(group)expose(group.filter(other=>other!==id),'seen',true);}
 save();refresh();notice('已记录闭卷复做；首次独立记录保持原样。');
}
function renderDue(){const tasks=due();$('#review-items').innerHTML=tasks.length?tasks.slice(0,12).map(({r,x,kind})=>`<div class="review-row"><button data-goto="${esc(r.dom_id)}"><b>${kind==='example'?'例'+esc(r.id):'习题'+esc(r.local_id)}</b> · ${esc(r.method||r.label)}</button><small>到期 ${esc(x.nextReviewDate)}</small><button data-review-pass="${esc(r.id)}" data-review-kind="${kind}">今天闭卷通过</button></div>`).join(''):'<p class="muted">本章暂无到期条目。先按每日安排复习第1—3章，记录新章尝试后再回访。</p>';}
function show(name){panelName=name;$$('[data-panel]').forEach(n=>n.hidden=n.dataset.panel!==name);$$('[data-tab]').forEach(b=>{const yes=b.dataset.tab===name;b.classList.toggle('active',yes);b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});if(name==='book')showSection(section);if(name==='practice')filterExercises();if(name==='methods')search();if(name==='daily')selectDay(selectedDay||date());}
function showSection(id){if(!data.sections.some(s=>s.id===id))return;section=id;$$('[data-book-section]').forEach(n=>n.hidden=n.id!==id);$$('[data-section]').forEach(b=>{const yes=b.dataset.section===id;b.classList.toggle('active',yes);b.setAttribute('aria-current',yes?'step':'false');});filterExamples();}
function filterExamples(){const required=$('#example-filter').value==='required';$$('.example-card').forEach(n=>n.hidden=required&&!byDom.get(n.id).is_required);}
function filterExercises(){const status=$('#exercise-status').value,topic=$('#exercise-topic').value;let n=0;
 $$('.exercise-card').forEach(card=>{const r=byDom.get(card.id),x=state.exercises[r.id];let hit=pool==='all'||(pool==='K'?r.is_core:pool==='supp'?r.kind==='supplement':r.kind!=='supplement'&&r.level===pool);
  if(topic!=='all')hit=hit&&r.topic===topic;
  if(status==='new')hit=hit&&(!x?.status||x.status==='new');if(status==='independent')hit=hit&&!!x?.firstIndependent;
  if(status==='review')hit=hit&&!!x&&['stuck','hinted','solution','seen'].includes(x.status)&&!done(x);if(status==='done')hit=hit&&done(x);
  card.hidden=!hit;if(hit)n++;
 });
 $('#exercise-count').textContent=`显示 ${n} 个单元 · 原书${data.exercises.length}个`+(data.supplements.length?`，自编${data.supplements.length}组`:'');$('#exercise-empty').hidden=n>0;
 $$('[data-pool]').forEach(b=>{b.classList.toggle('active',b.dataset.pool===pool);b.setAttribute('aria-pressed',String(b.dataset.pool===pool));});
}
const norm=s=>String(s).toLowerCase().replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248)).replace(/（/g,'(').replace(/）/g,')').replace(/[．。]/g,'.').replace(/\s+/g,'');
function search(){const q=norm($('#global-search').value),kind=$('#result-kind').value,exq=q.replace(/^例题?/,''),hwq=q.replace(/^(课后)?习题/,'');const result=[];
 if(kind!=='exercise')data.examples.forEach(r=>{let hit=!mother||r.mother_ids.includes(mother);if(q)hit=hit&&(/^\d+\.\d+$/.test(exq)?r.id===exq:norm([r.id,r.method,r.target,r.group].join(' ')).includes(exq));if(hit)result.push({r,label:'例'+r.id+' · '+r.method,meta:r.level+' · '+r.group});});
 if(kind!=='example')all.forEach(r=>{let hit=!mother||r.mother_ids.includes(mother);if(q)hit=hit&&(/^\d+(\(\d+\))?$/.test(hwq)?r.local_id===hwq:norm([r.local_id,r.label,r.reason,r.hint].join(' ')).includes(hwq));if(hit)result.push({r,label:(r.kind==='supplement'?'自编':'习题')+r.local_id+' · '+r.label,meta:r.level+' · '+(r.kind==='supplement'?'自编独立检验':'原书章末习题')});});
 const out=q||mother?result:[];$('#method-results').innerHTML=out.map(({r,label,meta})=>`<button class="result-link" data-goto="${esc(r.dom_id)}"><b>${esc(label)}</b><br><span>${esc(meta)}</span></button>`).join('');
 $('#method-result-count').textContent=q||mother?`找到 ${out.length} 个条目`:'选一个母结构，或输入例题号、习题号、知识点。';$('#method-empty').hidden=!(q||mother)||out.length>0;
 $('#selected-method').textContent=data.mothers.find(m=>m.id===mother)?.title||'全部方法';$$('[data-method]').forEach(b=>{b.classList.toggle('active',b.dataset.method===mother);b.setAttribute('aria-pressed',String(b.dataset.method===mother));});
}
function selectDay(wanted){const match=data.days.find(x=>x.date===wanted)||data.days.find(d=>d.examples.some(id=>!state.examples[id]?.done)||d.core.concat(d.supplements).some(id=>!done(state.exercises[id])))||data.days.at(-1);selectedDay=match.date;$('#day-select').value=match.date;$$('[data-day-date]').forEach(n=>n.classList.toggle('selected',n.dataset.dayDate===match.date));}
function go(id,scroll=true,push=true){if(push)history.pushState(null,'','#'+id);
 if(['book','practice','methods','basics','daily'].includes(id)){show(id);if(scroll)$('#tab-bar').scrollIntoView({behavior:'smooth'});return;}
 if(data.mothers.some(m=>m.id===id)){mother=id;$('#global-search').value='';show('methods');if(scroll)$('#method-results').scrollIntoView({behavior:'smooth'});return;}
 if(data.sections.some(s=>s.id===id)){section=id;show('book');}
 const node=el(id);if(!node)return;const r=byDom.get(id);
 if(r?.kind==='example'){section=r.section_id;show('book');$('#example-filter').value='all';filterExamples();node.open=true;math(node.querySelector('.item-body'));}
 else if(r){pool='all';$('#exercise-status').value='all';$('#exercise-topic').value='all';show('practice');node.open=true;math(node.querySelector('.item-body'));}
 else if(id.startsWith('bridge-')){show('basics');node.open=true;math(node.querySelector('.bridge-body'));}
 else if(id.startsWith('day-')){selectedDay=id.slice(4);show('daily');}
 else if(id==='review-queue')show('daily');
 if(scroll)setTimeout(()=>node.scrollIntoView({behavior:'smooth',block:'start'}),25);
}
// Reader never switches from question-only images to an answer page by scrolling.
let readerMode='book',readerPage=data.source.examples[0],readerLabel='';const reader=$('#source-reader');
function range(){return data.source[readerMode==='book'?'examples':readerMode==='question'?'question':'solution'];}
function readPage(){const [lo,hi]=range();readerPage=Math.max(lo,Math.min(hi,readerPage));const img=$('#reader-image');img.hidden=false;img.classList.remove('zoomed');$('#reader-image-error').hidden=true;
 img.src=`../../images/chapter-04-06/${readerMode==='question'?'question-':''}${data.source.book}-${readerPage}.webp`;
 img.alt=(readerMode==='question'?'只含题干的原页':'教材原页')+` PDF ${readerPage}`;$('#reader-title').textContent=readerLabel;$('#reader-page').textContent=`印刷P${readerPage-data.source.offset} / PDF ${readerPage}`;
 $('#reader-prev').disabled=readerPage<=lo;$('#reader-next').disabled=readerPage>=hi;$('#reader-jump').min=lo;$('#reader-jump').max=hi;$('#reader-jump').value=readerPage;
 $('#reader-note').textContent=readerMode==='question'?'仅题干，可在本章习题范围翻页；不会进入答案。':readerMode==='solution'?'教材答案可能同页含其他题；已标记可能见到的单元，按实际阅读情况更正。':'本区是例题学习，原页含解答；独立检测请去习题区。';
 if(readerMode==='solution')expose(data.exercises.filter(r=>r.answer_pdf_pages[0]<=readerPage&&readerPage<=r.answer_pdf_pages[1]).map(r=>r.id),'solution');
}
function openReader(mode,page,label){readerMode=mode;readerPage=page;readerLabel=label;readPage();reader.showModal();document.body.classList.add('reader-open');}
$$('[data-tab]').forEach(b=>b.onclick=()=>go(b.dataset.tab));$$('[data-section]').forEach(b=>b.onclick=()=>go(b.dataset.section));
$('#tab-bar').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$('[data-tab]'),i=tabs.indexOf(document.activeElement),j=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[j].focus();go(tabs[j].dataset.tab,false);});
$('#example-filter').onchange=filterExamples;$$('[data-pool]').forEach(b=>b.onclick=()=>{pool=b.dataset.pool;filterExercises();});$('#exercise-status').onchange=filterExercises;$('#exercise-topic').onchange=filterExercises;
$('#global-search').oninput=()=>{mother='';show('methods');};$('#result-kind').onchange=search;$('#clear-method').onclick=()=>{mother='';$('#global-search').value='';search();};
$('#day-select').onchange=e=>go('day-'+e.target.value);$('#today-button').onclick=()=>{selectDay(date());go('day-'+selectedDay);};
document.addEventListener('click',e=>{
 const jump=e.target.closest('[data-goto]');if(jump){e.preventDefault();go(jump.dataset.goto);return;}
 const method=e.target.closest('[data-method]');if(method){go(method.dataset.method);return;}
 const src=e.target.closest('[data-source-page]');if(src){openReader(src.dataset.readerMode,+src.dataset.sourcePage,src.dataset.readerLabel);return;}
 const pass=e.target.closest('[data-review-pass]');if(pass){passReview(pass.dataset.reviewPass,pass.dataset.reviewKind||'exercise');return;}
 const clear=e.target.closest('[data-clear-record]');if(clear){delete state.exercises[clear.dataset.clearRecord];save();refresh();notice('已更正本题记录；请按实际是否见过提示重新记录。');return;}
 const a=e.target.closest('a[href^="#"]');if(a&&a.hash){e.preventDefault();go(decodeURIComponent(a.hash.slice(1)));}
});
document.addEventListener('change',e=>{const t=e.target;
 if(t.matches('[data-example-done]')){const id=t.dataset.exampleDone,x=state.examples[id]||(state.examples[id]={});x.done=t.checked;if(x.done)schedule(x);save();refresh();}
 if(t.matches('[data-exercise-record]')){const id=t.dataset.exerciseRecord,r=byId.get(id),x=state.exercises[id]||(state.exercises[id]={}),status=t.value;
  if(status==='independent'&&(!r.is_default_fresh_candidate||x.exposed||x.status==='seen')&&!x.firstIndependent){notice('已见或看过提示的题请按复现记录，闭卷通过可另记。');refresh();return;}
  x.status=status;if(['new','stuck','hinted','solution','seen'].includes(status))x.redo=false;if(status==='independent')x.firstIndependent=true;if(['hinted','solution','seen'].includes(status))x.exposed=true;
  if(status!=='new')schedule(x);save();refresh();
 }
 if(t.matches('[data-later-done]')){const x=state.exercises[t.dataset.laterDone]||(state.exercises[t.dataset.laterDone]={});x.laterDone=t.checked;save();refresh();}
});
document.addEventListener('input',e=>{if(e.target.matches('[data-note]')){const id=e.target.dataset.note,x=state.exercises[id]||(state.exercises[id]={});x.note=e.target.value.slice(0,1000);save();}});
document.addEventListener('toggle',e=>{const n=e.target;if(!n.open)return;if(n.matches('.example-card,.exercise-card'))math(n.querySelector('.item-body'));if(n.matches('.bridge-card'))math(n.querySelector('.bridge-body'));if(n.matches('.source-notes'))math(n.querySelector('.needs-math'));if(n.dataset.hintFor)expose([n.dataset.hintFor],'hinted',true);n.querySelectorAll('img[data-image-src]').forEach(img=>{img.src=img.dataset.imageSrc;delete img.dataset.imageSrc;});},true);
$('#reader-prev').onclick=()=>{readerPage--;readPage();};$('#reader-next').onclick=()=>{readerPage++;readPage();};$('#reader-jump').onchange=e=>{readerPage=Number(e.target.value)||range()[0];readPage();};$('#reader-close').onclick=()=>reader.close();$('#reader-image').onclick=()=>$('#reader-image').classList.toggle('zoomed');$('#reader-image').onerror=()=>{$('#reader-image').hidden=true;$('#reader-image-error').hidden=false;};reader.addEventListener('close',()=>document.body.classList.remove('reader-open'));reader.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'&&readerPage>range()[0]){e.preventDefault();readerPage--;readPage();}if(e.key==='ArrowRight'&&readerPage<range()[1]){e.preventDefault();readerPage++;readPage();}});
$('#export-progress').onclick=()=>{const payload={...state,exportedAt:new Date().toISOString()},url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`第${ch}章-按书复习进度.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import-progress').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{
 if(file.size>2e6)throw Error();const x=JSON.parse(await file.text());if(x.schema!==1||x.chapter!==ch||!x.examples||!x.exercises||Array.isArray(x.examples)||Array.isArray(x.exercises))throw Error();
 const next={schema:1,chapter:ch,examples:{},exercises:{}};
 for(const r of data.examples){const v=x.examples[r.id];if(v&&typeof v==='object')next.examples[r.id]=clean(v,true);}
 for(const r of all){const v=x.exercises[r.id];if(v&&typeof v==='object'){next.exercises[r.id]=clean(v,false);if(!r.is_default_fresh_candidate){next.exercises[r.id].firstIndependent=false;if(next.exercises[r.id].status==='independent')next.exercises[r.id].status='seen';}}}
 state=next;save();refresh();notice('本章进度已导入。');
 }catch{notice('请选择本版、本章导出的进度文件；文件格式不匹配。');}e.target.value='';};
function clean(v,isExample){const status=['new','stuck','independent','hinted','solution','seen'].includes(v.status)?v.status:'new';
 const x={done:!!v.done,status,firstIndependent:!!v.firstIndependent,exposed:!!v.exposed,redo:!!v.redo,laterDone:!!v.laterDone,note:String(v.note||'').slice(0,1000),reviewStage:Math.max(0,Math.min(3,Number(v.reviewStage)||0))};
 for(const k of ['nextReviewDate','reviewedDate'])if(/^\d{4}-\d{2}-\d{2}$/.test(v[k]||''))x[k]=v[k];
 if(!isExample&&status==='independent'){x.firstIndependent=true;}return x;}
$('#print-page').onclick=()=>window.print();window.addEventListener('hashchange',()=>go(decodeURIComponent(location.hash.slice(1)),false,false));window.addEventListener('popstate',()=>go(decodeURIComponent(location.hash.slice(1)),false,false));
refresh();show('book');if(location.hash)go(decodeURIComponent(location.hash.slice(1)),false,false);else{const first=$('.example-card');if(first){first.open=true;math(first.querySelector('.item-body'));}}
})();
