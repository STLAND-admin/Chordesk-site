const buttons = [...document.querySelectorAll('[data-language]')];
let stored; try { stored = localStorage.getItem('chordesk-language'); } catch {}
function language(value, persist = false) {
 const lang = value === 'en' ? 'en' : 'zh';
 document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
 document.querySelectorAll('[data-copy]').forEach(node => node.hidden = node.dataset.copy !== lang);
 buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === lang)));
 if (persist) { try { localStorage.setItem('chordesk-language', lang); } catch {} const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url); }
}
buttons.forEach(button => button.onclick = () => language(button.dataset.language, true));
language(new URL(location.href).searchParams.get('lang') || stored);
