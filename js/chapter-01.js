
let selected=1,currentPage=10,opened=new Set(['A','B','F','G']);
const tree=document.getElementById('tree'),detail=document.getElementById('detailbody'),family=document.getElementById('family'),search=document.getElementById('search'),photoarea=document.getElementById('photoarea');
function esc(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function rich(t){return esc(t).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');}
let mathJob=Promise.resolve(),mathVersion=0;
function math(){
 if(!(window.MathJax&&MathJax.startup&&MathJax.typesetPromise))return;
 const myVersion=++mathVersion;
 mathJob=mathJob.catch(()=>{}).then(()=>MathJax.startup.promise).then(()=>{
   if(myVersion!==mathVersion)return;
   MathJax.typesetClear([family,detail]);
   return MathJax.typesetPromise([family,detail]);
 }).catch(e=>console.warn('公式渲染:',e));
}
function showFamily(key){
 const b=DATA.branches[key];if(!b)return;const g=b.guide;
 const ns=DATA.entries.filter(e=>e.b===key).map(e=>'1.'+e.n).join(' · ');
 let boxes=g.cases.map((c,i)=>'<div class="routecase"><b>'+esc(c[0])+'</b><div class="routeformula">'+c[1]+'</div><p>'+rich(c[2])+'</p><button class="route-jump" data-route="'+c[4]+'">查看'+esc(c[3])+'的题面判断 →</button></div>').join('');
 family.innerHTML='<div class="eyebrow">母结构 '+esc(key)+' · 先判条件，再用方法</div><h2>'+esc(b.title)+'</h2>'+
 '<div class="route-head"><b>这类题的真正核心</b>'+rich(g.essence)+'</div>'+
 '<div class="gate-grid"><div class="gate"><h4>① 什么时候进入本分支？</h4><p>'+rich(g.entry)+'</p></div><div class="gate"><h4>② 可以使用前必须检查什么？</h4><p>'+rich(g.permission)+'</p></div><div class="gate reject"><h4>③ 外观相似却不该套用</h4><p>'+rich(g.reject)+'</p></div><div class="gate"><h4>④ 应变形成什么？</h4><p>'+rich(g.goal)+'</p></div></div>'+
 '<h3>同一母结构内部，还必须继续分情况</h3><div class="routecases">'+boxes+'</div>'+
 '<div class="countercase"><b>反例／边界案例：</b> '+rich(g.negative)+'</div>'+
 '<div class="crossrule"><b>走到这里之后转向哪？</b> '+rich(g.next)+'</div>'+
 '<p class="footnote">本分支涉及原书例题：'+ns+'。这些例题具有相似障碍，但各自的数学前提、所需精度未必相同。</p>';
 family.querySelectorAll('.route-jump').forEach(el=>el.onclick=()=>select(+el.dataset.route,true));
}
function select(n,scroll){
 const e=DATA.entries.find(e=>e.n===n);if(!e)return;selected=n;
 const d=e.details,b=DATA.branches[e.b],f=e.fit;showFamily(e.b);
 const makefield=(tag,title,txt,extra='')=>'<section class="field"><h3><span class="tag">'+tag+'</span>'+title+'</h3><div class="'+extra+'"><p>'+rich(txt)+'</p></div></section>';
 const rel=e.related.map(i=>'<button data-link="'+i+'">例1.'+i+'</button>').join('');
 detail.innerHTML='<div class="detailhead"><div class="eyebrow">教材例1.'+n+' · 先读条件，再读题解</div><h2>'+esc(e.shape)+'</h2><div class="subtitle">主分支 '+esc(e.b+' · '+b.title)+'　｜　教材印刷页约 P'+e.printed_page+'</div></div><div class="dfields">'+
 '<div class="field"><h3><span class="tag">0</span>与原题对应的关键公式</h3><div class="formula">\\['+d.latex+'\\]</div><p class="footnote">此处是为突出结构而摘录/重写的关系；原题的全部条件、常数及积分上下限以本卡片底部原书页为准。</p></div>'+
 '<div class="field"><h3>在这道题里，为什么能够走入这个分支？</h3><div class="case-triad"><div class="case-check"><strong>① 题面中的准入证据</strong><p>'+rich(f.signal)+'</p></div><div class="case-check"><strong>② 第一件可执行的事</strong><p>'+rich(f.first)+'</p></div><div class="case-check bad"><strong>③ 何时不能照搬</strong><p>'+rich(f.stop)+'</p></div></div><div class="preroute"><strong>具体操作：</strong>先核对上面三点，再阅读下方原题拆解。这里的前提若不成立，不能仅因为外形相似就直接套用该分支。</div></div>'+
 makefield('1','原题的信息：每个条件起什么作用？',d.inputs)+
 makefield('2','直接计算遇到了什么障碍？',d.obstacle)+
 makefield('3','从原式出发的分步转化',d.steps)+
 makefield('4','为什么想到这一步？',d.insight,'why')+
 makefield('5','证明中必须补全的合法性检查',d.caution,'warn')+
 '<div class="field"><h3>同类题横向比较</h3><p class="squash-note">相同的结构不等于相同的解法：点开比较“准入证据”和“禁用边界”。</p><div class="related">'+rel+'</div></div></div>';
 detail.querySelectorAll('[data-link]').forEach(el=>el.onclick=()=>select(+el.dataset.link,true));
 setPage(e.page);list();math();if(scroll)document.getElementById('family').scrollIntoView({behavior:'smooth',block:'start'});
}
function setPage(p){if(!PAGES[p])return;currentPage=p;document.getElementById('sourceimg').src=PAGES[p];document.getElementById('sourcefoot').textContent='当前显示：PDF第 '+p+' 页（教材印刷页约 '+(p-8)+'）。同一道例题的证明有时延续到下一页，可点“后一页”继续。';photoarea.classList.remove('zoom');}
function list(){const q=search.value.trim().toLowerCase();tree.innerHTML='';let hits=0;for(const [key,b] of Object.entries(DATA.branches)){
const es=DATA.entries.filter(e=>e.b===key&&(!q||('例1.'+e.n+' '+e.shape+' '+e.core+' '+e.details.inputs+' '+e.details.insight+' '+e.fit.signal+' '+e.fit.stop+' '+e.fit.first+' '+b.title+' '+b.guide.entry+' '+b.guide.permission+' '+b.guide.reject+' '+e.tags.join(' ')).toLowerCase().includes(q)));
if(!es.length)continue;hits+=es.length;const div=document.createElement('div');div.className='cluster'+(opened.has(key)||q?' open':'');div.innerHTML='<button class="branch"><span>'+key+'｜'+esc(b.title)+'</span><span class="count">'+es.length+'题</span></button><div class="exlist">'+es.map(e=>'<button class="pick '+(e.n===selected?'active':'')+'" data-n="'+e.n+'"><strong>1.'+e.n+'</strong> '+esc(e.shape)+'</button>').join('')+'</div>';div.querySelector('.branch').onclick=()=>{opened.has(key)?opened.delete(key):opened.add(key);list()};div.querySelectorAll('[data-n]').forEach(el=>el.onclick=()=>select(+el.dataset.n,true));tree.appendChild(div);
}if(!hits)tree.innerHTML='<p class="intro">未找到匹配内容，请尝试“积分”“泰勒”“例1.27”等关键词。</p>';
}
document.getElementById('unfold').onclick=()=>{opened=new Set(Object.keys(DATA.branches));list()};document.getElementById('fold').onclick=()=>{opened=new Set();list()};document.getElementById('reset').onclick=()=>{search.value='';list()};search.oninput=list;
document.getElementById('sourceprev').onclick=()=>setPage(Math.max(10,currentPage-1));document.getElementById('sourcenext').onclick=()=>setPage(Math.min(61,currentPage+1));document.getElementById('zoom').onclick=()=>photoarea.classList.toggle('zoom');document.getElementById('sourceimg').onclick=()=>photoarea.classList.toggle('zoom');document.getElementById('jump').onclick=()=>document.getElementById('nav').scrollIntoView({behavior:'smooth'});
select(1,false);
// Typeset the static example comparison after startup too.
if(window.MathJax&&MathJax.startup&&MathJax.startup.promise){MathJax.startup.promise.then(()=>MathJax.typesetPromise([document.getElementById('decisionIntro')])).then(()=>math()).catch(console.warn);}
