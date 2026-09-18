// SPDX-License-Identifier: AGPL-3.0-only
import { getThemePref, setThemePref } from '../theme.js';
import { getAll } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { iconSvg } from '../icons.js';
import { APP_VERSION } from '../version.js';
import { getAIConfig, setAIConfig, listModels, chatCompletion } from '../ai.js';
import { toast } from '../ui.js';

const TABS = [
  { id: 'tampilan', label: 'Tampilan', icon: 'settings' },
  { id: 'ai', label: 'AI', icon: 'sparkle' },
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

async function renderAI(panel) {
  panel.textContent = '';

  const h2 = document.createElement('h2');
  h2.innerHTML = `${iconSvg('sparkle', { size: 16 })}<span>Provider AI</span>`;
  panel.appendChild(h2);

  const desc = document.createElement('p');
  desc.className = 'settings-desc';
  desc.textContent =
    'Endpoint OpenAI-compatible (mis. 9router atau server lokal). API key hanya tersimpan di perangkat ini (IndexedDB) — tidak pernah ikut ekspor, kode, atau log.';
  panel.appendChild(desc);

  const config = await getAIConfig();

  const urlField = document.createElement('div');
  urlField.className = 'field';
  const urlLabel = document.createElement('label');
  urlLabel.textContent = 'Base URL';
  urlField.appendChild(urlLabel);
  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.placeholder = 'http://localhost:8080/v1';
  urlInput.value = config.baseUrl || '';
  urlField.appendChild(urlInput);
  panel.appendChild(urlField);

  const keyField = document.createElement('div');
  keyField.className = 'field';
  const keyLabel = document.createElement('label');
  keyLabel.textContent = 'API Key';
  keyField.appendChild(keyLabel);
  const keyRow = document.createElement('div');
  keyRow.style.display = 'flex';
  keyRow.style.gap = '8px';
  const keyInput = document.createElement('input');
  keyInput.type = 'password';
  keyInput.placeholder = 'sk-...';
  keyInput.value = config.apiKey || '';
  keyInput.autocomplete = 'off';
  keyRow.appendChild(keyInput);
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'btn';
  toggleBtn.textContent = 'Lihat';
  toggleBtn.addEventListener('click', () => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    toggleBtn.textContent = keyInput.type === 'password' ? 'Lihat' : 'Sembunyikan';
  });
  keyRow.appendChild(toggleBtn);
  keyField.appendChild(keyRow);
  panel.appendChild(keyField);

  const modelField = document.createElement('div');
  modelField.className = 'field';
  const modelLabel = document.createElement('label');
  modelLabel.textContent = 'Model';
  modelField.appendChild(modelLabel);
  const modelRow = document.createElement('div');
  modelRow.style.display = 'flex';
  modelRow.style.gap = '8px';
  const modelInput = document.createElement('input');
  modelInput.type = 'text';
  modelInput.placeholder = 'nama model';
  modelInput.value = config.model || '';
  modelInput.setAttribute('list', 'ai-model-list');
  modelRow.appendChild(modelInput);
  const modelDatalist = document.createElement('datalist');
  modelDatalist.id = 'ai-model-list';
  const presets = [
    'claude-3-opus-5-ultra', 
    'claude-3-5-sonnet-4-6-max', 
    'gemini-3.0-pro-high',
    'hermes-agent',
    'open-claw-agent'
  ];
  presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    modelDatalist.appendChild(opt);
  });
  modelRow.appendChild(modelDatalist);
  const loadModelsBtn = document.createElement('button');
  loadModelsBtn.type = 'button';
  loadModelsBtn.className = 'btn';
  loadModelsBtn.textContent = 'Muat daftar model';
  modelRow.appendChild(loadModelsBtn);
  modelField.appendChild(modelRow);
  panel.appendChild(modelField);

  const statusMsg = document.createElement('p');
  statusMsg.className = 'missing-box';
  panel.appendChild(statusMsg);

  const actions = document.createElement('div');
  actions.className = 'actions';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.innerHTML = `${iconSvg('save', { size: 15 })}<span>Simpan</span>`;
  const testBtn = document.createElement('button');
  testBtn.type = 'button';
  testBtn.className = 'btn';
  testBtn.textContent = 'Tes koneksi';
  actions.appendChild(saveBtn);
  actions.appendChild(testBtn);
  panel.appendChild(actions);

  function currentConfig() {
    return { baseUrl: urlInput.value.trim(), apiKey: keyInput.value, model: modelInput.value.trim() };
  }

  saveBtn.addEventListener('click', async () => {
    await setAIConfig(currentConfig());
    toast('Konfigurasi AI tersimpan');
  });

  loadModelsBtn.addEventListener('click', async () => {
    statusMsg.textContent = 'Memuat daftar model...';
    statusMsg.style.color = '';
    const result = await listModels(currentConfig());
    if (!result.ok) {
      statusMsg.textContent = `Gagal memuat model: ${result.error}`;
      statusMsg.style.color = '#ef4444';
      return;
    }
    modelDatalist.textContent = '';
    for (const id of result.models) {
      const opt = document.createElement('option');
      opt.value = id;
      modelDatalist.appendChild(opt);
    }
    statusMsg.textContent = `${result.models.length} model ditemukan — ketik di kolom Model untuk memilih.`;
    statusMsg.style.color = '';
  });

  testBtn.addEventListener('click', async () => {
    statusMsg.textContent = 'Menghubungi AI (bisa 10-30 detik)...';
    statusMsg.style.color = '';
    testBtn.disabled = true;
    const result = await chatCompletion({
      ...currentConfig(),
      messages: [{ role: 'user', content: 'Balas hanya dengan kata: OK' }],
      maxTokens: 200,
    });
    testBtn.disabled = false;
    if (!result.ok) {
      statusMsg.textContent = `Gagal: ${result.error}`;
      statusMsg.style.color = '#ef4444';
      return;
    }
    statusMsg.textContent = `Berhasil — model (${result.model}) menjawab: "${result.text.trim()}"`;
    statusMsg.style.color = '#22c55e';
  });
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

const RENDERERS = { tampilan: renderTampilan, ai: renderAI, tentang: renderTentang };

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
