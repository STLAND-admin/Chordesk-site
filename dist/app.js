import {english, dynamic, accessibility} from './i18n.js';
const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const content = all('[data-i18n]');
const chinese = Object.fromEntries(content.map(node => [node.dataset.i18n, node.textContent]));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let language = 'zh', scene, playing = !reducedMotion, contactCount = 0, view = 'orbit';
let storedLanguage;
try { storedLanguage = localStorage.getItem('chordesk-language'); } catch { /* Storage is optional. */ }
const requestedLanguage = new URL(location.href).searchParams.get('lang') || storedLanguage;
function renderState() {
 const copy = dynamic[language];
 $('#model-label').textContent = copy.view[view];
 $('#model-contacts').textContent = copy.contacts[contactCount];
 $('#pause-motion').textContent = playing ? copy.pause : copy.play;
 $('#pause-motion').setAttribute('aria-pressed', String(!playing));
 all('[data-contact]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.contact) === contactCount)));
 all('[data-scene]').forEach(button => {
  const selected = button.dataset.scene === ['direct','overview','trackpad'][contactCount];
  button.classList.toggle('active', selected);button.setAttribute('aria-pressed', String(selected));
 });
}
function setLanguage(next, persist = false) {
 language = next === 'en' ? 'en' : 'zh';
 const strings = language === 'en' ? english : chinese;
 content.forEach(node => { node.textContent = strings[node.dataset.i18n] ?? chinese[node.dataset.i18n]; });
 all("[data-i18n-aria]").forEach(node => node.setAttribute("aria-label", accessibility[language][node.dataset.i18nAria]));
 document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
 document.title = dynamic[language].title;
 $('meta[name=description]').content = dynamic[language].description;
 all('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
 if (persist) {
  try { localStorage.setItem('chordesk-language', language); } catch { /* Language still works. */ }
  const url = new URL(location.href);url.searchParams.set('lang', language);history.replaceState(null, '', url);
 }
 renderState();
}
all('[data-language]').forEach(button => button.onclick = () => setLanguage(button.dataset.language, true));
setLanguage(requestedLanguage);
try {
 const {createGripScene} = await import('./grip-scene.js');
 scene = createGripScene($('#grip-canvas'), {onContactChange: count => { contactCount = Math.max(0,Math.min(2,count));renderState(); }});
 scene.setView('orbit');scene.setPlaying(playing);
} catch {
 $('#grip-canvas').hidden = true;$('.model-fallback').hidden = false;
 $('#pause-motion').disabled = true;$('#cycle-chords').disabled = true;
 all('[data-view],[data-grip]').forEach(button => button.disabled = true);
}
$('#pause-motion').onclick = () => { playing = !playing;scene?.setPlaying(playing);renderState(); };
$('#cycle-chords').onclick = () => { scene?.cycleChords();playing = true;scene?.setPlaying(true);renderState(); };
function chooseContact(count) { contactCount = count;scene?.setRearContacts(count);renderState(); }
all('[data-contact]').forEach(button => button.onclick = () => chooseContact(Number(button.dataset.contact)));
all('[data-view]').forEach(button => button.onclick = () => { view = button.dataset.view;scene?.setView(view);all('[data-view]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));renderState(); });
all('[data-grip]').forEach(button => button.onclick = () => { scene?.setGrip(button.dataset.grip);all('[data-grip]').forEach(b => b.setAttribute('aria-pressed',String(b === button))); });
all('[data-scene]').forEach(button => button.onclick = () => { const action = button.dataset.scene;chooseContact({direct:0,overview:1,trackpad:2}[action]);scene?.setAction(action); });
document.addEventListener('visibilitychange', () => scene?.setPlaying(!document.hidden && playing));
window.addEventListener('pagehide', () => scene?.dispose(), {once:true});
