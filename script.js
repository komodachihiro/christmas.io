(function(){
'use strict';
const dataNode=document.getElementById('lp-data');
let data=JSON.parse(dataNode.textContent);
const original=JSON.parse(JSON.stringify(data));
const $=id=>document.getElementById(id);
let current=0, transitionTimer=null,locked=false,wheelTotal=0, wheelReset=null,touchStart=null;
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
 const img=$('product');img.classList.remove('active');clearTimeout(transitionTimer);
 transitionTimer=setTimeout(()=>{img.src=s.img||'';img.alt=s.img?s.name:'';if(s.img){requestAnimationFrame(()=>img.classList.add('active'))}},170);
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
 e.preventDefault();wheelTotal+=e.deltaY;clearTimeout(wheelReset);wheelReset=setTimeout(()=>wheelTotal=0,160);
 if(locked||Math.abs(wheelTotal)<38)return;
 const dir=Math.sign(wheelTotal);wheelTotal=0;advance(dir);locked=true;setTimeout(()=>locked=false,600);
},{passive:false});
document.addEventListener('touchstart',e=>{if(isEditing())return;touchStart=e.touches[0].clientY},{passive:true});
document.addEventListener('touchmove',e=>{if(touchStart!==null&&!isEditing())e.preventDefault()},{passive:false});
document.addEventListener('touchend',e=>{if(touchStart===null)return;const delta=touchStart-e.changedTouches[0].clientY;if(Math.abs(delta)>42)advance(Math.sign(delta));touchStart=null},{passive:true});
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
