import { renderLibrary } from './views/library.js';
import { renderBuilder } from './views/builder.js';
import { renderHistory } from './views/history.js';
import { renderSettings } from './views/settings.js';
import { getAll } from './store.js';
import { SEED_TEMPLATES } from './seed.js';
import { iconSvg } from './icons.js';
import { initTheme, getThemePref, setThemePref } from './theme.js';
import { APP_VERSION } from './version.js';

const NAV_ITEMS = [
  { id: 'library', hash: '#/', label: 'Pustaka', icon: 'library', match: (p) => p.length === 0 },
  { id: 'history', hash: '#/history', label: 'Riwayat', icon: 'history', match: (p) => p[0] === 'history' },
];

function parseHash() {
  return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

async function runCount() {
  return (await getAll('runs')).length;
}

async function templateCount() {
  return SEED_TEMPLATES.length + (await getAll('templates')).length;
}

async function renderNav(activeParts) {
  const nav = document.getElementById('nav');
  nav.textContent = '';
  const counts = { library: await templateCount(), history: await runCount() };

  for (const item of NAV_ITEMS) {
    const a = document.createElement('a');
    a.href = item.hash;
    a.className = 'nav-item' + (item.match(activeParts) ? ' active' : '');
    a.innerHTML = iconSvg(item.icon, { size: 17 });
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;
    a.appendChild(label);
    const count = document.createElement('span');
    count.className = 'count';
    count.textContent = counts[item.id];
    a.appendChild(count);
    nav.appendChild(a);
  }
}

function renderSettingsEntry(activeParts) {
  const entry = document.getElementById('settings-entry');
  entry.className = 'settings-entry' + (activeParts[0] === 'settings' ? ' active' : '');
  entry.innerHTML = iconSvg('settings', { size: 17 });
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = 'Pengaturan';
  entry.appendChild(label);
  entry.insertAdjacentHTML('beforeend', iconSvg('chevron', { size: 14 }));
}

function renderBreadcrumb(label, icon) {
  const el = document.getElementById('breadcrumb');
  el.innerHTML = iconSvg(icon, { size: 16 });
  const span = document.createElement('span');
  span.textContent = label;
  el.appendChild(span);
}

async function renderThemeToggle() {
  const el = document.getElementById('theme-toggle');
  const current = await getThemePref();
  el.textContent = '';
  const options = [
    ['light', 'sun'],
    ['dark', 'moon'],
  ];
  for (const [value, icon] of options) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = current === value ? 'active' : '';
    btn.title = value === 'light' ? 'Tema terang' : 'Tema gelap';
    btn.innerHTML = iconSvg(icon, { size: 14 });
    btn.addEventListener('click', () => setThemePref(value));
    el.appendChild(btn);
  }
}

async function route() {
  const root = document.getElementById('app');
  const parts = parseHash();

  await renderNav(parts);
  renderSettingsEntry(parts);

  if (parts[0] === 'builder' && parts[1]) {
    renderBreadcrumb('Rakit', 'library');
    await renderBuilder(root, decodeURIComponent(parts[1]));
    return;
  }
  if (parts[0] === 'history') {
    renderBreadcrumb('Riwayat', 'history');
    await renderHistory(root);
    return;
  }
  if (parts[0] === 'settings') {
    renderBreadcrumb('Pengaturan', 'settings');
    await renderSettings(root);
    return;
  }
  renderBreadcrumb('Pustaka', 'library');
  await renderLibrary(root);
}

window.addEventListener('hashchange', route);
window.addEventListener('caprompt:theme-changed', renderThemeToggle);
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('app-version').textContent = `v${APP_VERSION}`;
  await initTheme();
  await renderThemeToggle();
  await route();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
