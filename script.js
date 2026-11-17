(function(){
'use strict';
const data=JSON.parse(document.getElementById('lp-data').textContent);
const $=id=>document.getElementById(id);
const scenes=[data.intro,...data.products,data.outro];
let current=-1,queued=false,token=0,modalOpen=false,previousFocus=null;
const STEP=230;
$('smallTop').textContent=data.global.smalltop;
$('heroTitle').textContent=data.global.heroTitle;
$('fairDate').textContent=data.global.date;
$('heroCopy').textContent=data.global.copy;
$('order').textContent=data.global.orderLabel||'注文はこちら ↗';
function show(index){
  index=Math.max(0,Math.min(scenes.length-1,index));
  if(current===index)return;
  current=index;
  const s=scenes[index];
  const isProduct=index>0&&index<=data.products.length;
  $('details').dataset.category=s.category||'';
  $('name').textContent=(isProduct?String(index).padStart(2,'0')+'  ':'')+(s.name||'');
  $('description').textContent=s.desc||'';
  $('moreLink').hidden=!isProduct;
  $('details').disabled=!isProduct;
  $('details').setAttribute('aria-label',isProduct?s.name+'の詳細を見る':'商品のご案内');
  $('details').classList.remove('enter'); void $('details').offsetWidth; $('details').classList.add('enter');
  $('tree').style.opacity=(index===0||index===scenes.length-1)?'1':'.33';
  $('price').textContent=s.price||'';
  $('price').hidden=!s.price;
  const img=$('product');
  const ticket=++token;
  if(img.getAttribute('src')&&img.classList.contains('active')){
    const old=img.cloneNode(false);
    old.removeAttribute('id');old.classList.remove('active');old.classList.add('product-leaving');
    img.parentNode.insertBefore(old,img);
    requestAnimationFrame(()=>old.classList.add('leave-now'));
    setTimeout(()=>old.remove(),170);
  }
  img.classList.remove('active');
  const src=s.img||'';
  if(!src){img.removeAttribute('src');img.alt='';return;}
  const preload=new Image();
  const apply=()=>{
    if(ticket!==token)return;
    img.src=src;img.alt=s.name||'';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(ticket===token)img.classList.add('active')}));
  };
  preload.onload=apply;preload.onerror=apply;preload.src=src;
  if(preload.complete)apply();
}
function sync(){queued=false;if(modalOpen)return;show(Math.round(window.scrollY/STEP));}
const track=document.createElement('div');
track.id='scroll-track';track.setAttribute('aria-hidden','true');
track.style.height=`calc(100dvh + ${(scenes.length-1)*STEP}px)`;
document.body.appendChild(track);
document.documentElement.classList.add('native-scroll');
document.body.classList.add('lp-public');
window.addEventListener('scroll',()=>{if(!queued&&!modalOpen){queued=true;requestAnimationFrame(sync)}},{passive:true});
window.addEventListener('pageshow',()=>requestAnimationFrame(sync));
$('details').addEventListener('click',()=>{
 if(!(current>0&&current<=data.products.length))return;
 const s=scenes[current]; previousFocus=document.activeElement;
 $('detailModalTitle').textContent=s.name;
 const image=$('detailImage'),missing=$('detailNoImage');
 image.hidden=false;missing.hidden=true;
 image.onerror=()=>{image.hidden=true;missing.hidden=false};
 image.src=s.detailImg||s.img||'';
 image.alt=s.name+'の詳細画像';
 modalOpen=true;
 $('detailModal').hidden=false;
 $('detailModal').setAttribute('aria-hidden','false');
 document.body.classList.add('modal-open');
 $('closeDetail').focus();
});
function closeDetail(){
 if(!modalOpen)return;
 modalOpen=false;
 $('detailModal').hidden=true;
 $('detailModal').setAttribute('aria-hidden','true');
 document.body.classList.remove('modal-open');
 if(previousFocus?.focus)previousFocus.focus();
 requestAnimationFrame(sync);
}
$('closeDetail').addEventListener('click',closeDetail);
$('detailModal').addEventListener('click',e=>{if(e.target===$('detailModal'))closeDetail()});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&modalOpen){closeDetail();return}
 if(modalOpen&&e.key==='Tab'){
   e.preventDefault();$('closeDetail').focus();
 }
});
$('order').addEventListener('click',()=>{
 const link=(data.global.orderUrl||'').trim();
 if(/^https?:\/\//i.test(link))window.open(link,'_blank','noopener,noreferrer');
 else alert('注文先URLがまだ設定されていません。公開前に注文先URLを設定してください。');
});
for(let i=0;i<38;i++){
 const f=document.createElement('i'),w=1.5+Math.random()*4;
 f.className='flake';
 f.style.cssText=`width:${w}px;height:${w}px;left:${Math.random()*95}%;top:${Math.random()*70}%;animation-duration:${6+Math.random()*9}s;animation-delay:${-Math.random()*13}s`;
 $('snow').appendChild(f);
}
requestAnimationFrame(sync);
})();
