// SPDX-License-Identifier: AGPL-3.0-only
import { allTemplates } from '../templates.js';
import { renderChain, DEFAULT_CHAIN_SEPARATOR } from '../engine.js';
import { buildFieldGroup } from '../field-form.js';
import { putRecord } from '../store.js';
import { toast, copyToClipboard } from '../ui.js';
import { iconSvg } from '../icons.js';

export async function renderRangkai(root) {
  root.textContent = '';

  const templates = await allTemplates();

  const head = document.createElement('div');
  head.className = 'page-head';
  const headInner = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.className = 'page-title';
  h1.textContent = 'Rangkai';
  headInner.appendChild(h1);
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = 'Gabungkan beberapa prompt jadi satu urutan, terpisah dengan pemisah yang sama.';
  headInner.appendChild(subtitle);
  head.appendChild(headInner);
  root.appendChild(head);

  if (templates.length < 2) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="empty-icon">${iconSvg('chain', { size: 20 })}</div>`;
    const title = document.createElement('p');
    title.className = 'empty-title';
    title.textContent = 'Butuh minimal 2 template';
    empty.appendChild(title);
    const sub = document.createElement('p');
    sub.className = 'empty-subtitle';
    sub.textContent = `Pustaka baru punya ${templates.length} template. Tambah lewat Buat Baru dulu.`;
    empty.appendChild(sub);
    root.appendChild(empty);
    return;
  }

  // --- Picker: tambah template ke rantai ---
  const pickerField = document.createElement('div');
  pickerField.className = 'field';
  const pickerLabel = document.createElement('label');
  pickerLabel.textContent = 'Tambah template ke rantai';
  pickerField.appendChild(pickerLabel);
  const pickerRow = document.createElement('div');
  pickerRow.style.display = 'flex';
  pickerRow.style.gap = '8px';
  const select = document.createElement('select');
  for (const t of templates) {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title || t.id;
    select.appendChild(opt);
  }
  select.style.flex = '1';
  pickerRow.appendChild(select);
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn';
  addBtn.textContent = 'Tambah';
  pickerRow.appendChild(addBtn);
  pickerField.appendChild(pickerRow);
  root.appendChild(pickerField);

  // --- Daftar rantai ---
  const chainListEl = document.createElement('div');
  chainListEl.style.display = 'flex';
  chainListEl.style.flexDirection = 'column';
  chainListEl.style.gap = '10px';
  chainListEl.style.margin = '16px 0';
  root.appendChild(chainListEl);

  const chainEmptyMsg = document.createElement('p');
  chainEmptyMsg.className = 'page-subtitle';
  chainEmptyMsg.textContent = 'Rantai masih kosong — tambah minimal 2 template di atas.';
  root.appendChild(chainEmptyMsg);

  // --- Pemisah ---
  const sepField = document.createElement('div');
  sepField.className = 'field';
  const sepLabel = document.createElement('label');
  sepLabel.textContent = 'Pemisah antar prompt';
  sepField.appendChild(sepLabel);
  // textarea, bukan <input type="text"> — input tunggal-baris diam-diam
  // membuang newline, jadi pemisah default berbaris ganda akan terpotong.
  const sepInput = document.createElement('textarea');
  sepInput.rows = 2;
  sepInput.value = DEFAULT_CHAIN_SEPARATOR;
  sepField.appendChild(sepInput);
  root.appendChild(sepField);

  const gabungBtn = document.createElement('button');
  gabungBtn.type = 'button';
  gabungBtn.className = 'btn btn-primary';
  gabungBtn.textContent = 'Gabungkan';
  gabungBtn.disabled = true;
  root.appendChild(gabungBtn);

  const missingBox = document.createElement('p');
  missingBox.className = 'missing-box';
  root.appendChild(missingBox);

  const outputBox = document.createElement('div');
  outputBox.className = 'output-box';
  outputBox.style.marginTop = '16px';
  outputBox.innerHTML = '<div class="output-box-header"><span>HASIL RANGKAIAN</span></div>';
  const output = document.createElement('pre');
  outputBox.appendChild(output);
  root.appendChild(outputBox);

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.style.marginTop = '12px';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'btn';
  copyBtn.innerHTML = `${iconSvg('copy', { size: 15 })}<span>Salin</span>`;
  copyBtn.disabled = true;
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn';
  saveBtn.innerHTML = `${iconSvg('save', { size: 15 })}<span>Simpan sebagai Run</span>`;
  saveBtn.disabled = true;
  actions.appendChild(copyBtn);
  actions.appendChild(saveBtn);
  root.appendChild(actions);

  const chain = [];
  let lastResult = null;

  function renderChainList() {
    chainListEl.textContent = '';
    chainEmptyMsg.style.display = chain.length === 0 ? '' : 'none';
    chain.forEach((entry, idx) => {
      entry.titleEl.textContent = `${idx + 1}. ${entry.template.title || entry.template.id}`;
      entry.upBtn.disabled = idx === 0;
      entry.downBtn.disabled = idx === chain.length - 1;
      chainListEl.appendChild(entry.wrapper);
    });
    gabungBtn.disabled = chain.length < 2;
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    output.textContent = '';
    missingBox.textContent = '';
  }

  function addToChain(template) {
    const fieldApi = buildFieldGroup(template.runVariables);
    const wrapper = document.createElement('div');
    wrapper.className = 'detail-card';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    const titleEl = document.createElement('strong');
    header.appendChild(titleEl);

    const controls = document.createElement('div');
    controls.className = 'actions';
    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'btn';
    upBtn.title = 'Pindah ke atas';
    upBtn.textContent = '↑';
    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'btn';
    downBtn.title = 'Pindah ke bawah';
    downBtn.textContent = '↓';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger';
    removeBtn.title = 'Hapus dari rantai';
    removeBtn.innerHTML = iconSvg('trash', { size: 14 });
    controls.appendChild(upBtn);
    controls.appendChild(downBtn);
    controls.appendChild(removeBtn);
    header.appendChild(controls);

    wrapper.appendChild(header);
    wrapper.appendChild(fieldApi.element);

    const entry = { template, fieldApi, wrapper, titleEl, upBtn, downBtn };

    upBtn.addEventListener('click', () => {
      const i = chain.indexOf(entry);
      if (i > 0) {
        [chain[i - 1], chain[i]] = [chain[i], chain[i - 1]];
        renderChainList();
      }
    });
    downBtn.addEventListener('click', () => {
      const i = chain.indexOf(entry);
      if (i < chain.length - 1) {
        [chain[i + 1], chain[i]] = [chain[i], chain[i + 1]];
        renderChainList();
      }
    });
    removeBtn.addEventListener('click', () => {
      const i = chain.indexOf(entry);
      if (i >= 0) chain.splice(i, 1);
      renderChainList();
    });

    chain.push(entry);
    renderChainList();
  }

  addBtn.addEventListener('click', () => {
    const template = templates.find((t) => t.id === select.value);
    if (template) addToChain(template);
  });

  gabungBtn.addEventListener('click', () => {
    const items = chain.map((entry) => ({ body: entry.template.body, vars: entry.fieldApi.collectVars() }));
    const separator = sepInput.value || DEFAULT_CHAIN_SEPARATOR;
    lastResult = renderChain(items, { separator });
    output.textContent = lastResult.text;

    const missingParts = [];
    lastResult.missing.forEach((missingKeys, idx) => {
      if (missingKeys.length) {
        const title = chain[idx].template.title || chain[idx].template.id;
        missingParts.push(`${title}: ${missingKeys.join(', ')}`);
      }
    });
    missingBox.textContent = missingParts.length ? `Variabel wajib belum diisi — ${missingParts.join(' · ')}` : '';

    copyBtn.disabled = false;
    saveBtn.disabled = false;
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastResult) return;
    const ok = await copyToClipboard(lastResult.text);
    toast(ok ? 'Tersalin ke clipboard' : 'Gagal menyalin');
  });

  saveBtn.addEventListener('click', async () => {
    if (!lastResult) return;
    const run = {
      id: crypto.randomUUID(),
      templateId: 'rangkai',
      chain: chain.map((entry) => ({ templateId: entry.template.id, title: entry.template.title || entry.template.id })),
      variables: chain.map((entry) => entry.fieldApi.collectVars()),
      renderedText: lastResult.text,
      createdAt: new Date().toISOString(),
    };
    await putRecord('runs', run);
    toast('Run tersimpan');
  });

  renderChainList();
}
