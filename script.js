(function(){
'use strict';
const data=JSON.parse(document.getElementById('lp-data').textContent);
const $=id=>document.getElementById(id);
const scenes=[data.intro,...data.products,data.outro];
let current=-1,token=0,modalOpen=false,previousFocus=null;
let introAnimationFrame = null;

// 初回画像だけ、90% → 110% → 100% (3秒) で一度だけ拡大・収縮する。
// CSSに transform: ... !important があるため、毎フレーム inline !important で更新する。
function animateIntroImage(img, ticket) {
  if (introAnimationFrame !== null) cancelAnimationFrame(introAnimationFrame);
  const duration = 3000;
  const ease = t => t * t * (3 - 2 * t);
  const start = performance.now();
  const frame = now => {
    if (ticket !== token || current !== 0) return;
    const progress = Math.min(1, (now - start) / duration);
    const scale = progress <= 2 / 3
      ? 0.9 + 0.2 * ease(progress / (2 / 3))
      : 1.1 - 0.2 * ease((progress - 2 / 3) / (1 / 3));
    img.style.setProperty(
      'transform',
      `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
      'important'
    );
    if (progress < 1) introAnimationFrame = requestAnimationFrame(frame);
    else introAnimationFrame = null;
  };
  introAnimationFrame = requestAnimationFrame(frame);
}

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
  $('tree').style.opacity=index===0?'0':(index===scenes.length-1?'1':'.33');
  $('product').classList.toggle('intro-collage',index===0);
  $('price').textContent=s.price||'';
  $('price').hidden=!s.price;
  const img=$('product');
  // 直前の初回アニメーションは、シーン切り替え時に停止する。
  if (introAnimationFrame !== null) {
    cancelAnimationFrame(introAnimationFrame);
    introAnimationFrame = null;
  }
  if (index === 0) {
    // ここで集合画像の基本サイズ・位置を調整できます。
    for (const [key, value] of Object.entries({
      width: '110%', height: 'auto', 'max-width': 'none',
      left: '50%', top: '55%', 'object-fit': 'contain',
      transform: 'translate(-50%, -50%) scale(0.9)',
      transition: 'none'
    })) img.style.setProperty(key, value, 'important');
  } else {
    ['width','height','max-width','left','top','object-fit','transform','transition']
      .forEach(key => img.style.removeProperty(key));
  }
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
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if (ticket !== token) return;
      img.classList.add('active');
      if (index === 0) animateIntroImage(img, ticket);
    }));
  };
  preload.onload=apply;preload.onerror=apply;preload.src=src;
  if(preload.complete)apply();
}
// 商品はホイールの1ジェスチャー/タッチの1スワイプにつき1点ずつ切り替えます。
// 切り替えアニメーションの完了を待つロックは設けません。
// トラックパッドの慣性イベントは、一連の操作として扱います。
const WHEEL_GESTURE_END_MS = 110;
const WHEEL_MIN_DELTA = 3;
let wheelGestureOpen = false;
let wheelQuietTimer = null;
function nextProduct(direction) {
  if (modalOpen || !direction) return;
  show(current + (direction > 0 ? 1 : -1));
}
window.addEventListener('wheel', (e) => {
  if (modalOpen) return; // 詳細画像のスクロールは妨げない
  e.preventDefault();
  // 新しいホイール入力が来るたびに「操作終了」の時刻を更新する。
  clearTimeout(wheelQuietTimer);
  wheelQuietTimer = setTimeout(() => { wheelGestureOpen = false; }, WHEEL_GESTURE_END_MS);
  if (wheelGestureOpen || Math.abs(e.deltaY) < WHEEL_MIN_DELTA) return;
  wheelGestureOpen = true;
  nextProduct(e.deltaY);
}, {passive:false});

// スマートフォンでは、距離が一定以上のスワイプ1回で1商品進める。
let touchStartY = null;
let touchStartX = null;
window.addEventListener('touchstart', e => {
  if (modalOpen || e.touches.length !== 1) return;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}, {passive:true});
window.addEventListener('touchend', e => {
  if (modalOpen || touchStartY === null || !e.changedTouches.length) return;
  const dy = touchStartY - e.changedTouches[0].clientY;
  const dx = touchStartX - e.changedTouches[0].clientX;
  touchStartY = null;
  touchStartX = null;
  if (Math.abs(dy) >= 35 && Math.abs(dy) > Math.abs(dx) * 1.2) nextProduct(dy);
}, {passive:true});
window.addEventListener('touchcancel',()=>{touchStartY=null;touchStartX=null},{passive:true});
window.addEventListener('keydown', e => {
  if (modalOpen || e.altKey || e.ctrlKey || e.metaKey) return;
  if (['ArrowDown','PageDown',' '].includes(e.key)) {e.preventDefault();nextProduct(1)}
  if (['ArrowUp','PageUp'].includes(e.key)) {e.preventDefault();nextProduct(-1)}
});
document.body.classList.add('lp-public');
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
show(0);
})();
