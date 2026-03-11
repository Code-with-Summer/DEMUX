export function showToast(message, type = 'info', duration = 3500) {
  const containerId = 'toast-container-top';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = 9999;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.alignItems = 'flex-end';
    document.body.appendChild(container);
  }

  const id = `toast-${Date.now()}`;
  const el = document.createElement('div');
  el.id = id;
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
  el.style.color = '#111';
  el.style.fontSize = '14px';
  el.style.maxWidth = '360px';
  el.style.wordBreak = 'break-word';
  el.style.opacity = '0';
  el.style.transition = 'opacity 180ms ease, transform 180ms ease';
  el.style.transform = 'translateY(-8px)';

  if (type === 'error') {
    el.style.background = '#ffe6e6';
    el.style.color = '#8b0000';
  } else if (type === 'success') {
    el.style.background = '#e6ffef';
    el.style.color = '#006b2c';
  } else {
    el.style.background = '#f3f4f6';
  }

  el.textContent = message;
  container.appendChild(el);

  // trigger enter (slide down into place)
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 220);
  }, duration);
}
