(()=>{'use strict';
const $=s=>document.querySelector(s),data=JSON.parse($('#plan456-data').textContent);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const states={};for(const ch of [4,5,6]){try{const x=JSON.parse(localStorage.getItem(`math-notes-ch456-book-v1-${ch}`)||'null');states[ch]=x?.schema===1&&x.chapter===ch?x:{examples:{},exercises:{}};}catch{states[ch]={examples:{},exercises:{}};}}
const done=x=>!!(x&&(x.status==='independent'||x.redo));let ex=0,hw=0;
data.days.forEach(day=>{const state=states[day.chapter],a=day.examples.filter(id=>state.examples[id]?.done).length,b=day.core.concat(day.supplements).filter(id=>done(state.exercises[id])).length;ex+=a;hw+=b;const node=document.getElementById('progress-'+day.date);if(node)node.textContent=`本浏览器记录：例题 ${a}/${day.examples.length} · 当前核心过关 ${b}/${day.core.length+day.supplements.length}`;});
$('#plan-progress').textContent=`第4—6章当前记录：必学例题 ${ex}/147 · 核心单元 ${hw}/79（含共享小问及自编组）。`;
const match=data.days.find(d=>d.date===today())||data.days.find(d=>d.examples.some(id=>!states[d.chapter].examples[id]?.done)||d.core.concat(d.supplements).some(id=>!done(states[d.chapter].exercises[id])))||data.days.at(-1);
$('#plan-today').href='#day-'+match.date;document.getElementById('day-'+match.date)?.classList.add('selected');
function pace(){const six=$('#pace-select').value==='six';$('#pace-note').textContent=six?'6小时节奏：题号清单保持不变，按当天360分钟容量接着做，4—6章约10天到11月3日；第7章11月4—6日、第8章11月7—9日、整卷11月10—12日。下表保留主方案日期供对照，11月13日仍减量。':'主方案：10月25—27日第4章，28—29日第5章，30日—11月1日第6章。前8天总计3550分钟（59.2小时），含订正360分钟及旧章/到期复习305分钟。';try{localStorage.setItem('math-notes-plan456-pace',$('#pace-select').value);}catch{}}
try{if(localStorage.getItem('math-notes-plan456-pace')==='six')$('#pace-select').value='six';}catch{}
$('#pace-select').onchange=pace;pace();
})();
