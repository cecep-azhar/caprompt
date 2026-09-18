import { renderLibrary } from './views/library.js';
import { renderBuilder } from './views/builder.js';

function parseHash() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

async function route() {
  const root = document.getElementById('app');
  const parts = parseHash();
  if (parts[0] === 'builder' && parts[1]) {
    await renderBuilder(root, decodeURIComponent(parts[1]));
    return;
  }
  await renderLibrary(root);
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  route();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
