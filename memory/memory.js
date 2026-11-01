'use strict';
(()=>{
 const $=s=>document.querySelector(s), cards=[...document.querySelectorAll('.card')];
 let chapter='all';
 function filter(){
  const term=$('#search').value.normalize('NFKC').trim().toLowerCase(),kind=$('#kind').value;
  let total=0;
  for(const c of cards){
   const ch=c.closest('.chapter').dataset.chapter;
   c.hidden=!(chapter==='all'||ch===chapter)||!(kind==='all'||c.dataset.kind===kind)||!c.dataset.search.normalize('NFKC').toLowerCase().includes(term);
   if(!c.hidden)total++;
  }
  for(const s of document.querySelectorAll('[data-book-section]'))s.hidden=![...s.querySelectorAll('.card')].some(c=>!c.hidden);
  for(const s of document.querySelectorAll('.chapter'))s.hidden=![...s.querySelectorAll('.card')].some(c=>!c.hidden);
  $('#count').textContent=`显示${total}项`;
  $('#empty').hidden=total!==0;
 }
 for(const b of document.querySelectorAll('[data-ch]'))b.addEventListener('click',()=>{
  chapter=b.dataset.ch;for(const n of document.querySelectorAll('[data-ch]'))n.setAttribute('aria-pressed',String(n===b));filter();
 });
 $('#search').addEventListener('input',filter);$('#kind').addEventListener('change',filter);
 function showAnswers(open){for(const c of cards)if(!c.hidden)c.querySelector('details.answer').open=open;}
 $('#test').addEventListener('click',()=>showAnswers(false));$('#read').addEventListener('click',()=>showAnswers(true));
 let printState=null;
 window.addEventListener('beforeprint',()=>{
  if(printState)return;
  printState=cards.map(c=>c.querySelector('details.answer').open);showAnswers(true);
 });
 window.addEventListener('afterprint',()=>{
  if(!printState)return;
  cards.forEach((c,i)=>{c.querySelector('details.answer').open=printState[i];});printState=null;
 });
 $('#print').addEventListener('click',()=>window.print());
 function hashJump(){
  const id=decodeURIComponent(location.hash.slice(1)),target=document.getElementById(id);
  if(!target||!target.matches('.card,.chapter'))return;
  chapter=target.closest('.chapter').dataset.chapter;$('#search').value='';$('#kind').value='all';
  for(const b of document.querySelectorAll('[data-ch]'))b.setAttribute('aria-pressed',String(b.dataset.ch===chapter));
  filter();if(target.matches('.card'))target.querySelector('.answer').open=true;
  requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
 }
 window.addEventListener('hashchange',hashJump);filter();hashJump();
})();
