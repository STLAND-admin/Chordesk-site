const $ = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const choose = (attribute, value) => all(`[${attribute}]`).forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute(attribute) === value)));
let scene;
try { const { createGripScene } = await import('./grip-scene.js'); scene = createGripScene($('#grip-canvas')); }
catch { $('#grip-canvas').hidden = true; const fallback = document.createElement('p'); fallback.textContent = '当前浏览器无法显示 3D 模型。正面下方由拇指操作键盘；背面外屏由食指与中指操作触控板。下方的交互原型仍可使用。'; fallback.style.cssText = 'padding:130px 35px;line-height:2;font-size:15px'; $('.model-panel').append(fallback); }
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
function view(name) { scene?.setView(name); choose('data-view', name); $('#model-label').textContent = {front:'展开 · 正面',back:'展开 · 背面',orbit:'展开 · 环绕'}[name]; }
all('[data-view]').forEach(b => b.onclick = () => view(b.dataset.view));
$('#reveal-back').onclick = () => { view('back'); $('#grip-canvas').scrollIntoView({behavior:'smooth',block:'center'}); };
function motion() { scene?.setPlaying(playing); $('#pause-motion').textContent = playing ? 'Ⅱ' : '▷'; $('#pause-motion').setAttribute('aria-label',playing ? '暂停动画':'播放动画'); $('#pause-motion').setAttribute('aria-pressed',String(!playing)); }
$('#pause-motion').onclick = () => { playing = !playing; motion(); }; motion();
all('[data-grip]').forEach(b => b.onclick = () => { scene?.setGrip(b.dataset.grip); choose('data-grip', b.dataset.grip); $('#grip-description').textContent = b.dataset.grip === 'right' ? '右手食指与中指轻搭背面外屏，左手辅助支撑。双手拇指停留在正面键盘区。' : '背面外屏转到下半部，双手食指与中指在下方参与操作。双手拇指仍停留在正面键盘区。'; setEdge(b.dataset.grip); });
all('[data-action]').forEach(b => b.onclick = () => { scene?.setAction(b.dataset.action); all('[data-action]').forEach(row => row.classList.toggle('active',row === b)); view(b.dataset.action === 'trackpad' ? 'back' : 'front'); $('#grip-canvas').scrollIntoView({behavior:'smooth',block:'center'}); });
all('[data-comparison]').forEach(b => b.onclick = () => { choose('data-comparison', b.dataset.comparison); $('#compare-diagram').dataset.mode = b.dataset.comparison; $('#comparison-caption').textContent = b.dataset.comparison === 'combined' ? '键盘和触控板共同占用内屏，需要在显示区域与输入区域之间分配空间。' : '显示留在前上方；拇指与背面指尖各司其职，触控板独立于内屏。'; });

// All document, clipboard, pointer and window state is confined to this page.
const welcome = '把屏幕留给内容。\n\n点下面的屏幕键盘开始输入。\n用独立触控板移动光标，按住后拖动窗口标题栏。\n\n拇指负责键盘，食指与中指负责触控板。\n\n试试 ⌘ → A，再输入 HELLO。';
const state = {text:welcome,caret:welcome.length,selected:false,shift:false,cmd:false,opt:false,ctrl:false,clipboard:'',undo:[],cursor:{x:.5,y:.3},window:{x:.16,y:.12}};
const rows = [ [['esc','esc',1.2],...'1234567890'.split('').map(x=>[x,x]),['delete','⌫',1.5]], [['tab','tab',1.4],...'qwertyuiop'.split('').map(x=>[x,x]),['-','−']], [...'asdfghjkl'.split('').map(x=>[x,x]),["'","'"],['return','↵',2]], [['shift','⇧',1.6],...'zxcvbnm'.split('').map(x=>[x,x]),[',',','],['.','.'],['up','↑']], [['ctrl','ctrl'],['opt','⌥'],['cmd','⌘'],['space','space',5.2],['left','←'],['down','↓'],['right','→']] ];
const labels = {esc:'退出',delete:'退格',tab:'Tab',return:'换行',shift:'Shift',ctrl:'Control',opt:'Option',cmd:'Command',space:'空格',left:'向左',right:'向右',up:'文稿开头',down:'文稿末尾'};
for(const row of rows) { const el = document.createElement('div'); el.className='key-row'; for(const [key,label,weight=1] of row) { const button=document.createElement('button');button.className='touch-key';button.dataset.key=key;button.textContent=label;button.style.setProperty('--weight',weight);button.setAttribute('aria-label',labels[key]||key.toUpperCase());button.onclick=()=>keyInput(key);el.append(button); } $('#keyboard').append(el); }
function status(message) { $('#input-status').textContent = message; }
function renderDocument() { const text = $('#document-text'); text.replaceChildren(document.createTextNode(state.text.slice(0,state.caret))); const caret = document.createElement('span');caret.className='caret';caret.setAttribute('aria-hidden','true');text.append(caret, document.createTextNode(state.text.slice(state.caret)));text.classList.toggle('selected',state.selected); for(const b of all('.touch-key')) { b.classList.toggle('active',!!state[b.dataset.key]); if(b.dataset.key.length === 1) b.textContent=state.shift?b.dataset.key.toUpperCase():b.dataset.key; if(['shift','cmd','ctrl','opt'].includes(b.dataset.key))b.setAttribute('aria-pressed',String(state[b.dataset.key])); } }
function remember() { state.undo.push(state.text);if(state.undo.length>50)state.undo.shift(); }
function insert(value) { remember();if(state.selected){state.text='';state.caret=0;state.selected=false;}state.text=state.text.slice(0,state.caret)+value+state.text.slice(state.caret);state.caret+=value.length; }
function keyInput(key) {
 if(['shift','cmd','ctrl','opt'].includes(key)) { state[key]=!state[key];renderDocument();status(`${labels[key]} ${state[key]?'已按下':'已松开'}`);return; }
 if(key==='esc'){ $('#context-menu').hidden=true;state.selected=false; }
 else if(['left','right','up','down'].includes(key)){ state.caret=key==='up'?0:key==='down'?state.text.length:Math.min(state.text.length,Math.max(0,state.caret+(key==='left'?-1:1)));state.selected=false; }
 else if(state.cmd){ if(key==='a')state.selected=true;else if(key==='c' && state.selected)state.clipboard=state.text;else if(key==='v')insert(state.clipboard);else if(key==='z'&&state.undo.length){state.text=state.undo.pop();state.caret=state.text.length;state.selected=false;}state.cmd=false;status(`⌘ ${key.toUpperCase()}`);renderDocument();return; }
 else if(state.opt||state.ctrl){status(`${state.ctrl?'Ctrl ':''}${state.opt?'Option ':''}${key.toUpperCase()} · 记录快捷键`);state.opt=false;state.ctrl=false;renderDocument();return;}
 else if(key==='delete'){ remember();if(state.selected){state.text='';state.caret=0;state.selected=false;}else if(state.caret>0){state.text=state.text.slice(0,state.caret-1)+state.text.slice(state.caret);state.caret--;}}
 else {insert(key==='space'?' ':key==='return'?'\n':key==='tab'?'    ':state.shift?key.toUpperCase():key);state.shift=false;}
 renderDocument();status(`键盘 · ${labels[key]||key.toUpperCase()}`);$('#document-body').scrollTop=key==='up'?0:$('#document-body').scrollHeight;
}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function renderPointer(){ $('#desktop-cursor').style.left=`${state.cursor.x*100}%`;$('#desktop-cursor').style.top=`${state.cursor.y*100}%`;$('#note-window').style.left=`${state.window.x*100}%`;$('#note-window').style.top=`${state.window.y*100}%`; }
function move(dx,dy,dragging=false){const previous={...state.cursor};state.cursor.x=clamp(state.cursor.x+dx*1.5,.01,.99);state.cursor.y=clamp(state.cursor.y+dy*1.5,.01,.99);if(dragging){state.window.x=clamp(state.window.x+state.cursor.x-previous.x,.01,.23);state.window.y=clamp(state.window.y+state.cursor.y-previous.y,.03,.2);}renderPointer();}
function leftClick(){ $('#context-menu').hidden=true;state.selected=false;renderDocument();status('左键点击 · 文稿已聚焦'); }
function rightClick(){ const menu=$('#context-menu');menu.hidden=false;menu.style.left=`${clamp(state.cursor.x,.05,.65)*100}%`;menu.style.top=`${clamp(state.cursor.y,.05,.65)*100}%`;status('右键 · 打开文稿菜单'); }
function reset(){Object.assign(state,{text:welcome,caret:welcome.length,selected:false,shift:false,cmd:false,opt:false,ctrl:false,undo:[],cursor:{x:.5,y:.3},window:{x:.16,y:.12}});renderDocument();renderPointer();$('#context-menu').hidden=true;$('#document-body').scrollTop=0;status('已重置 · 先点 ⌘ → A 全选，再点字母开始输入');}
$('#reset-demo').onclick=reset;
function setEdge(edge){$('#bench').dataset.edge=edge;choose('data-edge',edge);}
all('[data-edge]').filter(b=>b.tagName==='BUTTON').forEach(b=>b.onclick=()=>setEdge(b.dataset.edge));
$('#open-note').onclick=()=>{state.window={x:.16,y:.12};renderPointer();status('打开 Demo 文稿');};
all('[data-command]').forEach(b=>b.onclick=()=>{if(b.dataset.command==='select')state.selected=true;if(b.dataset.command==='copy')state.clipboard=state.text;if(b.dataset.command==='clear'){state.selected=true;keyInput('delete');}$('#context-menu').hidden=true;renderDocument();status({select:'已全选文稿',copy:'已复制到演示剪贴板',clear:'已清空文稿'}[b.dataset.command]);});
$('#monitor').addEventListener('pointerdown',e=>{if(e.target===$('#monitor')){const r=e.currentTarget.getBoundingClientRect();state.cursor={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};renderPointer();leftClick();}});
// Direct title dragging also makes the monitor independently demonstrable.
let titleDrag;
$('#window-title').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);titleDrag={x:e.clientX,y:e.clientY};});
$('#window-title').addEventListener('pointermove',e=>{if(!titleDrag)return;const r=$('#monitor').getBoundingClientRect();state.window.x=clamp(state.window.x+(e.clientX-titleDrag.x)/r.width,.01,.23);state.window.y=clamp(state.window.y+(e.clientY-titleDrag.y)/r.height,.03,.2);titleDrag={x:e.clientX,y:e.clientY};renderPointer();status('拖动文稿窗口');});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#window-title').addEventListener(event,()=>titleDrag=null);

const pad=$('#trackpad'), touches=new Map();let startTime=0,maxTouches=0,totalTravel=0,centroid=null,holdTimer=null,dragging=false,dragWindow=false;
function center(){const values=[...touches.values()];return values.length?{x:values.reduce((n,p)=>n+p.x,0)/values.length,y:values.reduce((n,p)=>n+p.y,0)/values.length}:null;}
function cancelHold(){clearTimeout(holdTimer);holdTimer=null;}
function clearTouch(){cancelHold();touches.clear();centroid=null;dragging=false;dragWindow=false;$('#pad-trace').style.display='none';}
pad.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();pad.focus({preventScroll:true});pad.setPointerCapture(e.pointerId);if(!touches.size){startTime=performance.now();maxTouches=0;totalTravel=0;dragging=false;dragWindow=false;holdTimer=setTimeout(()=>{if(touches.size===1&&totalTravel<6){dragging=true;dragWindow=state.cursor.x>=state.window.x&&state.cursor.x<=state.window.x+.76&&state.cursor.y>=state.window.y&&state.cursor.y<=state.window.y+.10;status('拖拽开始 · 移动窗口标题栏');}},350);}touches.set(e.pointerId,{x:e.clientX,y:e.clientY});maxTouches=Math.max(maxTouches,touches.size);if(touches.size>1)cancelHold();centroid=center();});
pad.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=center(),r=pad.getBoundingClientRect();if(centroid){const dx=next.x-centroid.x,dy=next.y-centroid.y;totalTravel+=Math.hypot(dx,dy);if(totalTravel>6)cancelHold();if(touches.size>=2){$('#document-body').scrollTop-=dy;status('双指滚动文稿');}else{move(dx/r.width,dy/r.height,dragging&&dragWindow);status(dragging?'拖拽中':'移动光标');}}centroid=next;$('#pad-trace').style.cssText=`display:block;left:${next.x-r.left}px;top:${next.y-r.top}px`;});
pad.addEventListener('pointerup',e=>{if(!touches.has(e.pointerId))return;touches.delete(e.pointerId);cancelHold();centroid=center();if(!touches.size){if(dragging)status('拖拽结束');else if(totalTravel<8&&performance.now()-startTime<400){maxTouches>=2?rightClick():leftClick();}clearTouch();}});
pad.addEventListener('pointercancel',clearTouch);pad.addEventListener('lostpointercapture',e=>{if(touches.has(e.pointerId))clearTouch();});window.addEventListener('blur',clearTouch);
pad.addEventListener('contextmenu',e=>{e.preventDefault();rightClick();});pad.addEventListener('wheel',e=>{e.preventDefault();$('#document-body').scrollTop+=e.deltaY;status('滚轮 · 滚动文稿');},{passive:false});
pad.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();move(e.key==='ArrowLeft'?-.02:e.key==='ArrowRight'?.02:0,e.key==='ArrowUp'?-.02:e.key==='ArrowDown'?.02:0);status('方向键 · 移动光标');}else if(e.key==='Enter'){e.preventDefault();leftClick();}else if(e.key==='Escape')$('#context-menu').hidden=true;});
renderDocument();renderPointer();
window.addEventListener('pagehide',()=>scene?.dispose(),{once:true});
