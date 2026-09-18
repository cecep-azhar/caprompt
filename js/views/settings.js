// SPDX-License-Identifier: AGPL-3.0-only
import { getThemePref, setThemePref } from '../theme.js';
import { getAll } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { iconSvg } from '../icons.js';
import { APP_VERSION } from '../version.js';

const TABS = [
  { id: 'tampilan', label: 'Tampilan', icon: 'settings' },
  { id: 'tentang', label: 'Tentang', icon: 'info' },
];

async function renderTampilan(panel) {
  panel.textContent = '';

  const h2 = document.createElement('h2');
  h2.innerHTML = `${iconSvg('settings', { size: 16 })}<span>Tema</span>`;
  panel.appendChild(h2);

  const desc = document.createElement('p');
  desc.className = 'settings-desc';
  desc.textContent = 'Pilih tampilan terang, gelap, atau ikuti pengaturan sistem.';
  panel.appendChild(desc);

  const picker = document.createElement('div');
  picker.className = 'theme-picker';
  const current = await getThemePref();

  const options = [
    ['light', 'Terang', 'swatch-light'],
    ['dark', 'Gelap', 'swatch-dark'],
    ['system', 'Sistem', 'swatch-system'],
  ];

  for (const [value, label, swatchClass] of options) {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'theme-option' + (current === value ? ' active' : '');
    const swatch = document.createElement('span');
    swatch.className = `swatch ${swatchClass}`;
    opt.appendChild(swatch);
    const span = document.createElement('span');
    span.textContent = label;
    opt.appendChild(span);
    opt.addEventListener('click', async () => {
      await setThemePref(value);
      await renderTampilan(panel);
    });
    picker.appendChild(opt);
  }

  panel.appendChild(picker);
}

async function renderTentang(panel) {
  panel.textContent = '';

  const h2 = document.createElement('h2');
  h2.innerHTML = `${iconSvg('info', { size: 16 })}<span>CAPrompt</span>`;
  panel.appendChild(h2);

  const desc = document.createElement('p');
  desc.className = 'settings-desc';
  desc.textContent = 'Prompt studio lokal-first: PWA JavaScript murni, tanpa build step, tanpa dependensi npm.';
  panel.appendChild(desc);

  const templateCount = SEED_TEMPLATES.length + (await getAll('templates')).length;
  const runCount = (await getAll('runs')).length;

  const rows = [
    ['Versi', `v${APP_VERSION}`],
    ['Lisensi', 'AGPL-3.0'],
    ['Template tersimpan', String(templateCount)],
    ['Run tersimpan', String(runCount)],
  ];

  for (const [k, v] of rows) {
    const row = document.createElement('div');
    row.className = 'kv-row';
    const kEl = document.createElement('span');
    kEl.className = 'k';
    kEl.textContent = k;
    const vEl = document.createElement('span');
    vEl.textContent = v;
    row.appendChild(kEl);
    row.appendChild(vEl);
    panel.appendChild(row);
  }
}

const RENDERERS = { tampilan: renderTampilan, tentang: renderTentang };

export async function renderSettings(root) {
  root.textContent = '';

  const heading = document.createElement('h1');
  heading.className = 'page-title';
  heading.textContent = 'Pengaturan';
  root.appendChild(heading);

  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = 'Kelola tampilan dan lihat informasi aplikasi.';
  subtitle.style.marginBottom = '20px';
  root.appendChild(subtitle);

  const tabBar = document.createElement('div');
  tabBar.className = 'settings-tabs';
  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  let active = 'tampilan';

  async function renderActive() {
    tabBar.textContent = '';
    for (const tab of TABS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab-btn' + (tab.id === active ? ' active' : '');
      btn.innerHTML = iconSvg(tab.icon, { size: 15 });
      const label = document.createElement('span');
      label.textContent = tab.label;
      btn.appendChild(label);
      btn.addEventListener('click', async () => {
        active = tab.id;
        await renderActive();
      });
      tabBar.appendChild(btn);
    }
    await RENDERERS[active](panel);
  }

  root.appendChild(tabBar);
  root.appendChild(panel);
  await renderActive();
}
