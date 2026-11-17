(function(){
'use strict';
const dataNode=document.getElementById('lp-data');
let data=JSON.parse(dataNode.textContent);
const original=JSON.parse(JSON.stringify(data));
const $=id=>document.getElementById(id);
let current=0, touchStart=null;
// React to a fresh wheel gesture immediately, without a long global lock.
// Short idle detection + acceleration detection separates consecutive trackpad swipes.
let wheelAccum=0, wheelDirection=0, gestureConsumed=false;
let lastWheelEvent=0, lastAdvance=0, peakAfterAdvance=0, prevMagnitude=0;
const WHEEL_THRESHOLD=12;
const WHEEL_IDLE_MS=70;
const MIN_BETWEEN_CHANGES_MS=70;
let swapToken=0;

function makeScenes(){return [data.intro,...data.products,data.outro];}
function textNode(id,value){$(id).textContent=value||'';}
function globalRender(){textNode('smallTop',data.global.smalltop);
 $('heroTitle').textContent=data.global.heroTitle; $('heroTitle').style.whiteSpace='pre-line';
 textNode('fairDate',data.global.date); $('heroCopy').textContent=data.global.copy; $('heroCopy').style.whiteSpace='pre-line';textNode('order',data.global.orderLabel);
}

function show(i){
 const scenes=makeScenes();current=Math.max(0,Math.min(scenes.length-1,i)); const s=scenes[current];
 $('details').dataset.category=s.category||'';
 $('name').textContent=(current>0&&current<=data.products.length?String(current).padStart(2,'0')+'  ':'')+(s.name||'');
 $('description').textContent=s.desc||'';
 $('details').classList.remove('enter');void $('details').offsetWidth;$('details').classList.add('enter');
 $('hint').textContent=current===0?'上下スワイプで商品を見る ↓':current===scenes.length-1?'フェアは12月18日（金）まで':'上下スワイプで次の商品へ ↓';
 $('order').hidden=current!==scenes.length-1; $('disclaimer').hidden=current!==scenes.length-1;
 $('tree').style.opacity=current===0||current===scenes.length-1?'1':'.33';
 const pv=$('price');pv.textContent=s.price||'';pv.hidden=!s.price;
 const img=$('product');
 // Animate the departing image independently, and preload the next image.
 // This prevents the brief blank frame caused by replacing img.src mid-transition.
 const token=++swapToken;
 const oldSrc=img.getAttribute('src');
 if(oldSrc && img.classList.contains('active')){
   const leaving=img.cloneNode(false);
   leaving.removeAttribute('id');
   leaving.classList.remove('active');
   leaving.classList.add('product-leaving');
   img.parentNode.insertBefore(leaving,img);
   requestAnimationFrame(()=>leaving.classList.add('leave-now'));
   setTimeout(()=>leaving.remove(),190);
 }
 img.style.transition='none';
 img.classList.remove('active');
 img.style.opacity='0';
 const target=s.img||'';
 const reveal=()=>{
   if(token!==swapToken)return;
   img.src=target;img.alt=target?s.name:'';
   if(target){requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token===swapToken){img.style.transition='';img.style.opacity='';img.classList.add('active');}}));}
 };
 if(target){
   const preload=new Image();
   preload.onload=reveal;preload.onerror=reveal;
   preload.src=target;
   if(preload.complete)reveal();
 }else{img.removeAttribute('src');img.alt='';}

}
function advance(dir){show(current+dir)}
function isEditing(){return false}
$('order').addEventListener('click',()=>{
 const link=data.global.orderUrl.trim();
 if(link&&/^https?:\/\//i.test(link)){window.open(link,'_blank','noopener,noreferrer')}
 else alert('注文先URLがまだ設定されていません。');
});
window.addEventListener('wheel',e=>{
 if(isEditing())return;
 e.preventDefault();
 const now=performance.now();
 const unit=e.deltaMode===1?16:e.deltaMode===2?window.innerHeight:1;
 const dy=e.deltaY*unit;
 const magnitude=Math.abs(dy);
 if(magnitude<0.4)return;
 const direction=Math.sign(dy);
 const idle=now-lastWheelEvent;
 const changedDirection=direction!==wheelDirection;
 // Silence or reversal starts a new gesture right away.
 if(!lastWheelEvent || idle>WHEEL_IDLE_MS || changedDirection){
   wheelAccum=0;gestureConsumed=false;peakAfterAdvance=0;
 }
 // During a long stream, a new deliberate acceleration is also a new swipe.
 // Ignore small inertial events so a single swipe rarely skips two products.
 else if(gestureConsumed && now-lastAdvance>MIN_BETWEEN_CHANGES_MS &&
         magnitude>Math.max(15,peakAfterAdvance*1.35) &&
         magnitude>prevMagnitude*1.22){
   gestureConsumed=false;wheelAccum=0;peakAfterAdvance=0;
 }
 lastWheelEvent=now;
 wheelDirection=direction;
 prevMagnitude=magnitude;
 if(gestureConsumed){peakAfterAdvance=Math.max(peakAfterAdvance,magnitude);return;}
 wheelAccum+=Math.min(magnitude,125);
 if(wheelAccum>=WHEEL_THRESHOLD && now-lastAdvance>=MIN_BETWEEN_CHANGES_MS){
   advance(direction);
   lastAdvance=now;
   gestureConsumed=true;
   peakAfterAdvance=magnitude;
   wheelAccum=0;
 }
},{passive:false});
document.addEventListener('touchstart',e=>{if(isEditing())return;touchStart=e.touches[0].clientY},{passive:true});
document.addEventListener('touchmove',e=>{if(touchStart!==null&&!isEditing())e.preventDefault()},{passive:false});
document.addEventListener('touchend',e=>{if(touchStart===null)return;const delta=touchStart-e.changedTouches[0].clientY;if(Math.abs(delta)>24)advance(Math.sign(delta));touchStart=null},{passive:true});
document.addEventListener('keydown',e=>{
 if(isEditing()||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
 if(['ArrowDown','PageDown',' ','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();advance(['ArrowUp','PageUp'].includes(e.key)?-1:1)}
 else if(e.key==='Home')show(0);else if(e.key==='End')show(makeScenes().length-1);
});
for(let i=0;i<38;i++){
 const f=document.createElement('i');f.className='flake';const w=1.5+Math.random()*4;
 f.style.cssText=`width:${w}px;height:${w}px;left:${Math.random()*95}%;top:${Math.random()*70}%;animation-duration:${6+Math.random()*9}s;animation-delay:${-Math.random()*13}s`;$('snow').appendChild(f);
}
globalRender();show(0);
})();
