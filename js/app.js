import { renderLibrary } from './views/library.js';
import { renderBuilder } from './views/builder.js';
import { renderHistory } from './views/history.js';

function parseHash() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

function renderNav() {
  const nav = document.getElementById('nav');
  nav.textContent = '';
  const links = [
    ['#/', 'Pustaka'],
    ['#/history', 'Riwayat'],
  ];
  for (const [href, label] of links) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    nav.appendChild(a);
  }
}

async function route() {
  const root = document.getElementById('app');
  const parts = parseHash();
  if (parts[0] === 'builder' && parts[1]) {
    await renderBuilder(root, decodeURIComponent(parts[1]));
    return;
  }
  if (parts[0] === 'history') {
    await renderHistory(root);
    return;
  }
  await renderLibrary(root);
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  renderNav();
  route();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
