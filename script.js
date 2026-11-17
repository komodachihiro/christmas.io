// Editing UI is hidden on the public LP. Open index.html?edit=1 to edit content.
if (new URLSearchParams(window.location.search).get('edit') === '1') { document.body.classList.add('editor-mode'); }
(function(){
'use strict';
const dataNode=document.getElementById('lp-data');
let data=JSON.parse(dataNode.textContent);
const original=JSON.parse(JSON.stringify(data));
const $=id=>document.getElementById(id);
let current=0, transitionTimer=null,locked=false,wheelTotal=0, wheelReset=null,touchStart=null;
function makeScenes(){return [data.intro,...data.products,data.outro];}
function textNode(id,value){$(id).textContent=value||'';}
function globalRender(){
 textNode('brandName',data.global.brand);textNode('smallTop',data.global.smalltop);
 $('heroTitle').textContent=data.global.heroTitle; $('heroTitle').style.whiteSpace='pre-line';
 textNode('fairDate',data.global.date); $('heroCopy').textContent=data.global.copy; $('heroCopy').style.whiteSpace='pre-line';
 textNode('topTag',data.global.deadline);textNode('order',data.global.orderLabel);
}
function makeDots(){
 const dots=$('dots');dots.replaceChildren();
 makeScenes().forEach((s,i)=>{const b=document.createElement('button');b.className='dot';b.setAttribute('aria-label',`${i+1}番目へ`);b.addEventListener('click',()=>show(i));dots.appendChild(b)});
}
function show(i){
 const scenes=makeScenes();current=Math.max(0,Math.min(scenes.length-1,i)); const s=scenes[current];
 $('details').dataset.category=s.category||'';
 $('name').textContent=(current>0&&current<=data.products.length?String(current).padStart(2,'0')+'  ':'')+(s.name||'');
 $('description').textContent=s.desc||'';
 $('details').classList.remove('enter');void $('details').offsetWidth;$('details').classList.add('enter');
 $('counter').textContent=String(current+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');
 $('prev').disabled=current===0; $('next').disabled=current===scenes.length-1;
 [...$('dots').children].forEach((d,j)=>d.classList.toggle('current',j===current));
 $('hint').textContent=current===0?'上下スワイプで商品を見る ↓':current===scenes.length-1?'フェアは12月18日（金）まで':'上下スワイプで次の商品へ ↓';
 $('order').hidden=current!==scenes.length-1; $('disclaimer').hidden=current!==scenes.length-1;
 $('tree').style.opacity=current===0||current===scenes.length-1?'1':'.33';
 const pv=$('price');pv.textContent=s.price||'';pv.hidden=!s.price;
 const img=$('product');img.classList.remove('active');clearTimeout(transitionTimer);
 transitionTimer=setTimeout(()=>{img.src=s.img||'';img.alt=s.img?s.name:'';if(s.img){requestAnimationFrame(()=>img.classList.add('active'))}},170);
}
function advance(dir){show(current+dir)}
function isEditing(){return $('editor').classList.contains('open')}
$('prev').addEventListener('click',()=>advance(-1)); $('next').addEventListener('click',()=>advance(1));
$('order').addEventListener('click',()=>{
 const link=data.global.orderUrl.trim();
 if(link&&/^https?:\/\//i.test(link)){window.open(link,'_blank','noopener,noreferrer')}
 else alert('注文先URLがまだ設定されていません。編集パネルの「注文URL」を設定してください。');
});
window.addEventListener('wheel',e=>{
 if(isEditing()||e.target.closest('#editor'))return;
 e.preventDefault();wheelTotal+=e.deltaY;clearTimeout(wheelReset);wheelReset=setTimeout(()=>wheelTotal=0,160);
 if(locked||Math.abs(wheelTotal)<38)return;
 const dir=Math.sign(wheelTotal);wheelTotal=0;advance(dir);locked=true;setTimeout(()=>locked=false,600);
},{passive:false});
document.addEventListener('touchstart',e=>{if(isEditing()||e.target.closest('#editor'))return;touchStart=e.touches[0].clientY},{passive:true});
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
// Editing controls
function closeEditor(){$('editor').classList.remove('open')}
$('editToggle').onclick=()=>{$('editor').classList.toggle('open');fillSceneDropdown();fillSceneFields();fillGlobalFields()};
$('editClose').onclick=closeEditor;
function field(parent,label,value,handler,multiline=false){
 const wrap=document.createElement('label');wrap.textContent=label;
 const input=document.createElement(multiline?'textarea':'input');
 if(!multiline)input.type='text';input.value=value||'';
 input.addEventListener('input',()=>handler(input.value));
 wrap.appendChild(input);parent.appendChild(wrap);return input;
}
function fillSceneDropdown(){
 const s=$('sceneSelect');let chosen=s.value||String(current);s.replaceChildren();
 makeScenes().forEach((v,i)=>{const option=document.createElement('option');option.value=i;
 option.textContent=i===0?'00 はじめの画面':i===data.products.length+1?'最後の注文案内':String(i).padStart(2,'0')+' '+v.name;s.appendChild(option)});
 s.value=Number(chosen)<makeScenes().length?chosen:'0';
}
function fillSceneFields(){
 const idx=Number($('sceneSelect').value)||0; const outer=$('sceneFields');outer.replaceChildren();
 const obj=idx===0?data.intro:idx===data.products.length+1?data.outro:data.products[idx-1];
 field(outer,'カテゴリ（赤いリボン）',obj.category,v=>{obj.category=v;show(idx)});
 field(outer,'商品名・見出し',obj.name,v=>{obj.name=v;show(idx)});
 field(outer,'説明文',obj.desc,v=>{obj.desc=v;show(idx)},true);
 if(idx>0&&idx<=data.products.length){
   field(outer,'表示価格（例：¥12,800（税込））',obj.price||'',v=>{obj.price=v;show(idx)});
   const label=document.createElement('label');label.textContent='商品画像を差し替える';
   const preview=document.createElement('img');preview.className='previewImg';preview.alt='商品画像';preview.src=obj.img||'';
   const upload=document.createElement('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp,image/gif';
   upload.addEventListener('change',()=>{const file=upload.files[0];if(!file)return;
     const reader=new FileReader();reader.onload=()=>{obj.img=reader.result;preview.src=obj.img;show(idx)};reader.readAsDataURL(file);
   });
   label.appendChild(preview);label.appendChild(upload);outer.appendChild(label);
   const remove=document.createElement('button');remove.className='lightButton';remove.textContent='この商品画像を消す';remove.onclick=()=>{obj.img='';preview.removeAttribute('src');show(idx)};outer.appendChild(remove);
 }
 show(idx);
}
$('sceneSelect').addEventListener('change',fillSceneFields);
function fillGlobalFields(){
 const outer=$('globalFields');outer.replaceChildren();
 const fields=[['brand','ブランド名'],['smalltop','小さな見出し'],['heroTitle','メインタイトル（改行可能）'],['date','開催期間'],['copy','キャッチコピー（改行可能）'],['deadline','右上の締切表示'],['orderLabel','注文ボタンの文言'],['orderUrl','注文URL（https://〜）']];
 fields.forEach(([key,label])=>field(outer,label,data.global[key],v=>{data.global[key]=v;globalRender()},key==='heroTitle'||key==='copy'));
}
function toConfigJson(){return JSON.stringify(data,null,2).replaceAll('<','\\u003c')}
function download(filename,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500)}
$('exportJson').onclick=()=>download('クリスマスフェア_LP編集データ.json',new Blob([toConfigJson()],{type:'application/json;charset=utf-8'}));
$('exportHtml').onclick=()=>{
 const dataNode=document.getElementById('lp-data');dataNode.textContent=JSON.stringify(data).replaceAll('<','\\u003c');
 const doc='<!doctype html>\n'+document.documentElement.outerHTML;
 download('クリスマスフェア_LP_編集済み.html',new Blob([doc],{type:'text/html;charset=utf-8'}));
};
$('importJson').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 try{const loaded=JSON.parse(await file.text());if(!loaded.global||!Array.isArray(loaded.products)||!loaded.intro||!loaded.outro)throw Error('ファイル形式が違います');data=loaded;makeDots();globalRender();fillSceneDropdown();fillGlobalFields();fillSceneFields();alert('設定を読み込みました');}
 catch(err){alert('読み込みに失敗しました：'+err.message)};
};
$('resetValues').onclick=()=>{if(!confirm('編集内容を初期状態に戻しますか？'))return;data=JSON.parse(JSON.stringify(original));makeDots();globalRender();fillSceneDropdown();fillGlobalFields();fillSceneFields()};
makeDots();globalRender();show(0);
})();
