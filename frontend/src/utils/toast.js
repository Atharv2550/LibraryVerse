export const toast = {
  success: (msg) => {
    showToastNotification(msg, 'success');
  },
  error: (msg) => {
    showToastNotification(msg, 'error');
  },
  info: (msg) => {
    showToastNotification(msg, 'info');
  }
};

function showToastNotification(message, type = 'info') {
  if (typeof document === 'undefined') return;
  let container = document.getElementById('library-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'library-toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.style.cssText = `
    padding: 12px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.25);
    pointer-events: auto;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(20px);
    opacity: 0;
    max-width: 380px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  if (type === 'success') {
    el.style.background = '#059669';
    el.style.color = '#ffffff';
  } else if (type === 'error') {
    el.style.background = '#e11d48';
    el.style.color = '#ffffff';
  } else {
    el.style.background = '#4f46e5';
    el.style.color = '#ffffff';
  }

  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }, 3500);
}

export default toast;
