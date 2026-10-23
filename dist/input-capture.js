// Pointer Lock is opt-in and scoped to this page. Escape always belongs to the host.
export function createInputCapture({ target, button, onChange, onMove, onClick, onRightClick, onScroll, onKey, canDrag, onDragEnd, onStatus }) {
  let active = false;
  let pending = false;
  let cancelled = false;
  let pressed = false;
  let dragging = false;
  let windowDrag = false;
  let travel = 0;
  const listeners = [];
  const listen = (node, type, handler, options) => {
    node.addEventListener(type, handler, options);
    listeners.push(() => node.removeEventListener(type, handler, options));
  };
  const consume = (event) => { event.preventDefault(); event.stopImmediatePropagation(); };
  function resetPress() {
    if (dragging) onDragEnd();
    pressed = false;
    dragging = false;
    windowDrag = false;
    travel = 0;
  }
  function update(value) {
    active = value;
    pending = false;
    resetPress();
    button.disabled = false;
    button.textContent = value ? '退出接管 · Esc' : '接管触控板 · P';
    button.setAttribute('aria-pressed', String(value));
    onChange(value);
  }
  function fail() {
    if (document.pointerLockElement === target) return;
    update(false);
    onStatus('当前浏览器未允许指针接管。请在独立的 Edge / Chrome 窗口打开此页，再点击“接管触控板”；也可继续使用面板。');
  }
  function exit() {
    cancelled = true;
    if (document.pointerLockElement === target) document.exitPointerLock();
    if (active || pending) update(false);
  }
  function enter() {
    if (active || pending) return;
    if (!target.requestPointerLock) { fail(); return; }
    cancelled = false;
    pending = true;
    button.disabled = true;
    button.textContent = '正在接管…';
    // Keep this synchronous with the click/key gesture. Preserve the OS acceleration.
    try {
      const request = target.requestPointerLock();
      request?.catch(() => { if (!cancelled) fail(); });
    } catch { fail(); }
  }
  listen(button, 'click', () => active ? exit() : enter());
  listen(document, 'pointerlockchange', () => {
    const ownsLock = document.pointerLockElement === target;
    if (ownsLock && (cancelled || !document.hasFocus() || document.hidden)) {
      document.exitPointerLock();
      return;
    }
    update(ownsLock);
    if (ownsLock) target.focus({ preventScroll: true });
    onStatus(ownsLock ? '已接管 · 直接滑动触控板控制 Demo，按 Esc 返回 Mac' : '已退出接管 · 触控板恢复控制 Mac');
  });
  listen(document, 'pointerlockerror', () => { if (!cancelled) fail(); });
  // Do not cancel pointerdown defaults here: that would suppress compatibility mouse events.
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
    listen(document, type, event => { if (active) event.stopImmediatePropagation(); }, true);
  }
  listen(document, 'mousemove', event => {
    if (!active) return;
    consume(event);
    if (pressed) {
      travel += Math.hypot(event.movementX, event.movementY);
      if (travel > 3) dragging = true;
    }
    onMove(event.movementX, event.movementY, dragging && windowDrag);
  }, true);
  listen(document, 'mousedown', event => {
    if (!active) return;
    consume(event);
    if (event.button === 0) {
      pressed = true;
      travel = 0;
      dragging = false;
      windowDrag = canDrag();
    } else if (event.button === 2) onRightClick();
  }, true);
  listen(document, 'mouseup', event => {
    if (!active) return;
    consume(event);
    if (event.button === 0 && pressed) {
      if (!dragging) onClick();
      resetPress();
    }
  }, true);
  for (const type of ['click', 'dblclick', 'contextmenu', 'auxclick']) {
    listen(document, type, event => { if (active) consume(event); }, true);
  }
  listen(document, 'wheel', event => {
    if (!active) return;
    consume(event);
    // Ctrl+wheel is usually trackpad pinch-to-zoom, not two-finger scrolling.
    if (!event.ctrlKey) onScroll(event.deltaY, event.deltaMode);
  }, { capture: true, passive: false });
  listen(document, 'keydown', event => {
    if (event.key === 'Escape' && (active || pending)) { exit(); return; }
    if (active) {
      // Preserve app switching. Browsers / macOS also retain reserved shortcuts.
      if ((event.metaKey || event.altKey) && event.key === 'Tab') { exit(); return; }
      consume(event);
      if (!event.isComposing) onKey(event);
      return;
    }
    const editable = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (!pending && !editable && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'p') {
      consume(event);
      enter();
    }
  }, true);
  listen(document, 'keyup', event => { if (active) consume(event); }, true);
  listen(window, 'blur', exit);
  listen(document, 'visibilitychange', () => { if (document.hidden) exit(); });
  listen(window, 'pagehide', exit);
  return { get active() { return active; }, exit, dispose() { exit(); listeners.forEach(remove => remove()); } };
}
