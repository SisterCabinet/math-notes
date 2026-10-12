(()=>{'use strict';
const $=s=>document.querySelector(s),meta=JSON.parse($('#foundation-meta').textContent),units=[...document.querySelectorAll('.basic-unit')],groups=[...document.querySelectorAll('.foundation-group')],key='math-notes-foundations-v1';let recalled=new Set();
try{recalled=new Set(JSON.parse(localStorage.getItem(key)||'[]'));}catch{}
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const norm=s=>String(s).toLowerCase().replace(/\s+/g,'').replace(/复合函数求导法则/g,'复合函数求导').replace(/复合求导/g,'链式').replace(/牛顿莱布尼茨/g,'牛顿—莱布尼茨');
const scope=new URLSearchParams(location.search).get('chapter');if(scope==='2'||scope==='3')$('#basic-scope').value=scope;
function apply(){const q=norm($('#basic-search').value),s=$('#basic-scope').value,st=$('#basic-status').value;const allowed=s==='all'?null:new Set(meta.chapters[s]);let visible=[];
units.forEach(u=>{const hit=(!allowed||allowed.has(u.id))&&(!q||norm(u.dataset.search).includes(q))&&(st==='all'||(st==='done')===recalled.has(u.id));u.hidden=!hit;u.classList.toggle('recalled',recalled.has(u.id));u.querySelector('[data-recalled]').checked=recalled.has(u.id);if(hit)visible.push(u);});
groups.forEach(g=>g.hidden=![...g.querySelectorAll('.basic-unit')].some(u=>!u.hidden));$('#foundation-empty').hidden=visible.length>0;$('#foundation-count').textContent='当前显示 '+visible.length+' / '+units.length+' 项 · 点击条目展开，答案先独立尝试再看';$('#recall-progress').textContent=meta.units.filter(u=>recalled.has(u.id)).length+' / '+units.length;
const names=[...new Set(visible.map(u=>u.dataset.group))];$('#foundation-tree').innerHTML=names.map(g=>`<details class="foundation-nav-group" open><summary>${esc(g)}</summary>${visible.filter(u=>u.dataset.group===g).map(u=>{const m=meta.units.find(x=>x.id===u.id);return `<a href="#${u.id}" data-basic-link="${u.id}">${recalled.has(u.id)?'✓ ':''}${esc(m.title)}</a>`;}).join('')}</details>`).join('');}
function reveal(id,scroll=true){const el=document.getElementById(id);if(!el)return;if(el.classList.contains('basic-unit')){if(el.hidden){$('#basic-search').value='';$('#basic-status').value='all';$('#basic-scope').value='all';apply();}el.open=true;$('#foundation-tree').querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.dataset.basicLink===id));}else if(el.id==='foundation-sources')el.open=true;
if(scroll)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),30);}
$('#basic-search').oninput=apply;$('#basic-scope').onchange=()=>{apply();const url=new URL(location.href);const s=$('#basic-scope').value;s==='all'?url.searchParams.delete('chapter'):url.searchParams.set('chapter',s);history.replaceState(null,'',url);};$('#basic-status').onchange=apply;
$('#basic-expand').onclick=()=>units.filter(u=>!u.hidden).forEach(u=>u.open=true);$('#basic-collapse').onclick=()=>units.forEach(u=>u.open=false);
document.querySelectorAll('[data-recalled]').forEach(x=>x.onchange=()=>{x.checked?recalled.add(x.dataset.recalled):recalled.delete(x.dataset.recalled);try{localStorage.setItem(key,JSON.stringify([...recalled]));}catch{}apply();});
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);if(document.getElementById(id)){e.preventDefault();history.pushState(null,'','#'+id);reveal(id);}});window.addEventListener('hashchange',()=>reveal(location.hash.slice(1)));window.addEventListener('popstate',()=>reveal(location.hash.slice(1)));
apply();if(location.hash)reveal(location.hash.slice(1),false);
if(window.MathJax?.startup?.promise)MathJax.startup.promise.then(()=>{if(location.hash)reveal(location.hash.slice(1),true);});
})();
