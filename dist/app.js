const $ = s => document.querySelector(s);
const all = s => [...document.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene;
try { const {createGripScene} = await import('./grip-scene.js'); scene = createGripScene($('#grip-canvas')); scene.setAction('direct'); scene.setView('orbit'); }
catch { $('#grip-canvas').hidden = true; $('.model-fallback').hidden = false; }
let playing = !reducedMotion;
function updateMotion() { scene?.setPlaying(playing); $('#pause-motion').textContent = playing ? '暂停动画' : '播放动画'; $('#pause-motion').setAttribute('aria-pressed',String(!playing)); }
updateMotion();
$('#pause-motion').onclick = () => { playing = !playing; updateMotion(); };
all('[data-view]').forEach(button => button.onclick = () => { scene?.setView(button.dataset.view); all('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); $('#model-label').textContent = `展开 · ${{front:'正面',back:'背面',orbit:'环绕'}[button.dataset.view]}`; });
all('[data-grip]').forEach(button => button.onclick = () => { scene?.setGrip(button.dataset.grip); all('[data-grip]').forEach(b=>b.setAttribute('aria-pressed',String(b===button))); });
all('[data-scene]').forEach(button => button.onclick = () => { scene?.setAction(button.dataset.scene); all('[data-scene]').forEach(b=>b.classList.toggle('active',b===button)); $('#model-label').textContent = {direct:'正面 · 拇指触控',overview:'组合 · 一指与正面双指',trackpad:'组合 · 双指按住，正面精细移动'}[button.dataset.scene]; });
const monitor = $('#monitor');
const state = {rear:0, trackpad:false, manualTrackpad:false, overview:false, keyboard:false, cursor:{x:.5,y:.45}};
let rearTimer, tapTimer, frontTimer, demoTimers=[], front=new Map(), gestureStart=null, travel=0, selecting=false, gestureDone=false, demoPlaying=false;
const status = text => $('#input-status').textContent = text;
function pointer() { $('#desktop-cursor').style.left=`${state.cursor.x*100}%`; $('#desktop-cursor').style.top=`${state.cursor.y*100}%`; }
function clearFront() { clearTimeout(frontTimer); front.clear(); gestureStart=null; selecting=false; gestureDone=false; }
function renderMode() {
 const trackpad = state.trackpad || state.manualTrackpad;
 monitor.dataset.mode = trackpad ? 'trackpad' : 'direct';
 $('#demo-mode').textContent = trackpad ? '触控板' : '直接触控';
 $('#pad-material').hidden = !trackpad;
 $('#rear-dot-one').classList.toggle('on',state.rear>0); $('#rear-dot-two').classList.toggle('on',state.rear>1);
 $('#hold-one').setAttribute('aria-pressed',String(state.rear===1)); $('#hold-two').setAttribute('aria-pressed',String(state.rear===2));
 $('#overview-up').disabled = $('#overview-down').disabled = state.rear!==1 || trackpad;
 $('#rear-title').textContent = state.rear===0 ? '握持，放松。' : state.rear===1 ? '一指提供条件。' : state.trackpad ? '双指，切换精度。' : '保持约半秒…';
 $('#rear-description').innerHTML = state.rear===0 ? (state.manualTrackpad ? '菜单已切为触控板<br>背面没有按住手指' : '默认直接触控<br>背面没有按住手指') : state.rear===1 ? '正面双指 ↑ 打开窗口总览<br>正面双指 ↓ 退出窗口总览' : '正面变成相对触控板<br>松开背面，恢复原模式';
}
function setRear(count) {
 clearTimeout(rearTimer); clearFront(); state.rear=count; state.trackpad=false;
 if(count===2) { rearTimer=setTimeout(()=>{ if(state.rear!==2)return;clearFront();state.trackpad=true;renderMode();status('背面双指长按 → 正面触控板 · 在内屏拖动以相对移动光标');scene?.setAction('trackpad'); },450); }
 if(count===1){status('背面一指按住 · 现在正面双指上推或下滑');scene?.setAction('overview');}
 if(count===0){status('背面已松开 · 恢复'+(state.manualTrackpad?'触控板':'直接触控'));scene?.setAction('direct');}
 renderMode();
}
function setOverview(open) { state.overview=open; $('#overview').hidden=!open;status(open?'窗口总览已打开 · 选择窗口，或在一指条件下正面双指下滑退出':'已退出窗口总览'); }
function invokeOverview(open) { if(state.rear!==1 || state.trackpad || state.manualTrackpad)return;setOverview(open); }
function stopDemo() { demoTimers.forEach(clearTimeout);demoTimers=[];demoPlaying=false;$('#play-demo').textContent='播放操作示范';$('#play-demo').setAttribute('aria-pressed','false');$('#front-gesture').className='front-gesture'; }
function releaseAll() {stopDemo();setRear(0);clearFront();}
function holdButton(id,count) {
 const button=$(id);
 button.addEventListener('pointerdown',e=>{if(e.button!==0)return; e.preventDefault();stopDemo();button.setPointerCapture(e.pointerId);setRear(count);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{if(state.rear===count)setRear(0);});
 button.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat){stopDemo();setRear(count);}}});
 button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();setRear(0);}});
 button.addEventListener('contextmenu',e=>e.preventDefault());
}
holdButton('#hold-one',1);holdButton('#hold-two',2);
$('#overview-up').onclick=()=>invokeOverview(true);$('#overview-down').onclick=()=>invokeOverview(false);
all('[data-window]').forEach(button=>button.onclick=()=>{setOverview(false);status(`已选择${button.dataset.window} · 返回示意桌面`);});
$('#mode-toggle').onclick=()=>{stopDemo();clearFront();state.manualTrackpad=!state.manualTrackpad;renderMode();status('通过菜单切换为'+(state.manualTrackpad?'触控板':'直接触控'));};
function keyboard(show){state.keyboard=show;monitor.classList.toggle('keyboard-visible',show);$('#keyboard').hidden=!show;$('#keyboard-toggle').setAttribute('aria-pressed',String(show));scene?.setAction(show?'keyboard':'direct');}
$('#keyboard-toggle').onclick=()=>{stopDemo();keyboard(!state.keyboard);status(state.keyboard?'模拟键盘已显示 · 真实 App 支持 iPhone 原生输入法':'键盘已收起，桌面铺满内屏');};
let keyboardPage='abc';
function buildKeyboard(){
 const rows = keyboardPage==='abc' ? ['q w e r t y u i o p','a s d f g h j k l','⇧ z x c v b n m ⌫','123 ctrl option cmd 空格 ↵'] : ['1 2 3 4 5 6 7 8 9 0','- / : ; ( ) ¥ & @ ”','#+= . , ? ! \u0027 ⌫','ABC ctrl option cmd 空格 ↵'];
 $('#keyboard').replaceChildren();
 for(const row of rows){const div=document.createElement('div');div.className='key-row';for(const key of row.split(' ')){const button=document.createElement('button');button.textContent=key;button.classList.toggle('space',key==='空格');button.onclick=()=>{if(key==='123'||key==='ABC'){keyboardPage=key==='123'?'123':'abc';buildKeyboard();return;}if(['ctrl','option','cmd','⇧','#+='].includes(key)){status(`${key} · 网页仅展示快捷键位置`);return;}const text=$('#typed-text');text.textContent=key==='⌫'?text.textContent.slice(0,-1):text.textContent+(key==='空格'?' ':key==='↵'?'\n':key);status('已输入到模拟文稿');};div.append(button);}$('#keyboard').append(div);}
}
buildKeyboard();
function centroid(){const points=[...front.values()];return points.length?{x:points.reduce((n,p)=>n+p.x,0)/points.length,y:points.reduce((n,p)=>n+p.y,0)/points.length}:null;}
const clamp=v=>Math.max(.02,Math.min(.98,v));
monitor.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.target.closest('button')||e.target.closest('.keyboard'))return;
 e.preventDefault();stopDemo();monitor.setPointerCapture(e.pointerId);
 front.set(e.pointerId,{x:e.clientX,y:e.clientY});gestureStart=centroid();travel=0;gestureDone=false;clearTimeout(frontTimer);
 if(front.size===1){selecting=false;frontTimer=setTimeout(()=>{if(front.size!==1||travel>8)return;selecting=true;status('长按已触发 · 拖动以演示选字');},450);}
});
monitor.addEventListener('pointermove',e=>{
 if(!front.has(e.pointerId))return;
 const old=centroid();front.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=centroid(),r=monitor.getBoundingClientRect();const dx=next.x-old.x,dy=next.y-old.y;travel+=Math.hypot(dx,dy);
 if(front.size===2){clearTimeout(frontTimer);if(state.rear===1&&!state.trackpad&&!state.manualTrackpad&&!gestureDone&&Math.abs(next.y-gestureStart.y)>r.height*.08){gestureDone=true;invokeOverview(next.y<gestureStart.y);}return;}
 if(front.size!==1)return;
 if(state.trackpad||state.manualTrackpad){state.cursor={x:clamp(state.cursor.x+dx/r.width),y:clamp(state.cursor.y+dy/r.height)};pointer();status('正面触控板 · 相对移动光标');}
 else if(selecting){$('#document').classList.add('selected');status('长按拖选 · 模拟选择反馈，抬手释放');}
 else{if(travel>8)clearTimeout(frontTimer);$('#document').scrollTop-=dy;}
});
monitor.addEventListener('pointerup',e=>{
 if(!front.has(e.pointerId))return;
 if(front.size===1 && travel<8 && !selecting && !gestureDone){const r=monitor.getBoundingClientRect();if(!state.trackpad&&!state.manualTrackpad)state.cursor={x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height)};pointer();const ring=$('#tap-ring');ring.style.left=`${state.cursor.x*100}%`;ring.style.top=`${state.cursor.y*100}%`;ring.hidden=false;clearTimeout(tapTimer);tapTimer=setTimeout(()=>ring.hidden=true,350);$('#document').classList.remove('selected');status('左键点按 · 模拟文稿获得焦点');}
 front.delete(e.pointerId);clearTimeout(frontTimer);if(!front.size){selecting=false;gestureStart=null;}else{gestureDone=true;travel=100;gestureStart=centroid();}
});
for(const event of ['pointercancel','lostpointercapture'])monitor.addEventListener(event,e=>{if(front.has(e.pointerId))clearFront();});
monitor.addEventListener('wheel',e=>{e.preventDefault();$('#document').scrollTop+=e.deltaY;status('正面双指滚动 · 模拟文稿');},{passive:false});
window.addEventListener('keydown',e=>{
 if(e.target.closest('.keyboard')||e.metaKey||e.ctrlKey||e.altKey)return;
 if(['1','2','ArrowUp','ArrowDown','Escape'].includes(e.key))e.preventDefault();else return;
 if(e.repeat)return;
 if(e.key==='1'||e.key==='2'){stopDemo();setRear(Number(e.key));}
 else if(e.key==='ArrowUp')invokeOverview(true);else if(e.key==='ArrowDown')invokeOverview(false);else releaseAll();
});
window.addEventListener('keyup',e=>{if((e.key==='1'&&state.rear===1)||(e.key==='2'&&state.rear===2))setRear(0);});
window.addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
$('#reset-demo').onclick=()=>{releaseAll();state.manualTrackpad=false;setOverview(false);keyboard(false);state.cursor={x:.5,y:.45};pointer();$('#document').classList.remove('selected');$('#document').scrollTop=0;$('#typed-text').textContent='Chordesk — 握在手里的工作空间。';renderMode();status('默认直接触控 · 在正面点一下试试');};
$('#play-demo').onclick=()=>{
 if(demoPlaying){releaseAll();return;}
 releaseAll();state.manualTrackpad=false;keyboard(false);setOverview(false);renderMode();demoPlaying=true;$('#play-demo').textContent='停止示范';$('#play-demo').setAttribute('aria-pressed','true');
 function step(delay,fn){demoTimers.push(setTimeout(fn,delay));}
 function gesture(direction){$('#front-gesture').className='front-gesture show '+(reducedMotion?'':direction);$('#front-gesture span').textContent=direction==='up'?'↑':'↓';}
 status('① 默认直接触控 · 拇指在正面点按');
 step(1500,()=>{setRear(1);gesture('up');status('② 背面一指按住 + 正面双指上推');});
 step(3200,()=>{setOverview(true);$('#front-gesture').className='front-gesture';});
 step(4600,()=>{gesture('down');status('③ 背面一指仍按住 + 正面双指下滑');});
 step(6200,()=>{setOverview(false);$('#front-gesture').className='front-gesture';setRear(0);});
 step(7300,()=>{setRear(2);status('④ 背面双指长按约半秒');});
 step(8500,()=>{state.cursor={x:.65,y:.42};pointer();status('正面成为触控板 · 拇指相对移动光标');});
 step(9600,()=>{state.cursor={x:.4,y:.6};pointer();});
 step(10800,()=>{setRear(0);stopDemo();status('⑤ 松开背面 → 恢复直接触控。现在可以自己试试。');});
};
renderMode();pointer();
window.addEventListener('pagehide',()=>{releaseAll();scene?.dispose();},{once:true});
