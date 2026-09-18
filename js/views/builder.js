// SPDX-License-Identifier: AGPL-3.0-only
import { putRecord } from '../store.js';
import { findTemplateById } from '../templates.js';
import { render } from '../engine.js';
import { toast, copyToClipboard } from '../ui.js';
import { iconSvg } from '../icons.js';
import { buildFieldGroup } from '../field-form.js';

export async function renderBuilder(root, id) {
  root.textContent = '';
  const template = await findTemplateById(id);

  if (!template) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="empty-icon">${iconSvg('library', { size: 20 })}</div>`;
    const title = document.createElement('p');
    title.className = 'empty-title';
    title.textContent = 'Template tidak ditemukan';
    empty.appendChild(title);
    const subtitle = document.createElement('p');
    subtitle.className = 'empty-subtitle';
    subtitle.textContent = `"${id}" tidak ada di Pustaka.`;
    empty.appendChild(subtitle);
    root.appendChild(empty);
    return;
  }

  const head = document.createElement('div');
  head.className = 'page-head';
  const headInner = document.createElement('div');
  const title = document.createElement('h1');
  title.className = 'page-title';
  title.textContent = template.title || template.id;
  headInner.appendChild(title);
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = `${(template.runVariables || []).length} variabel · Rakit`;
  headInner.appendChild(subtitle);
  head.appendChild(headInner);
  root.appendChild(head);

  const form = document.createElement('form');
  const { element: fieldGroup, collectVars } = buildFieldGroup(template.runVariables);
  form.appendChild(fieldGroup);

  const renderBtn = document.createElement('button');
  renderBtn.type = 'submit';
  renderBtn.className = 'btn btn-primary';
  renderBtn.textContent = 'Render';
  form.appendChild(renderBtn);
  root.appendChild(form);

  const missingBox = document.createElement('p');
  missingBox.className = 'missing-box';
  root.appendChild(missingBox);

  const outputBox = document.createElement('div');
  outputBox.className = 'output-box';
  outputBox.style.marginTop = '16px';
  outputBox.innerHTML = '<div class="output-box-header"><span>HASIL RENDER</span></div>';
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

  let lastResult = null;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    lastResult = render(template.body, collectVars());
    output.textContent = lastResult.text;
    missingBox.textContent = lastResult.missing.length
      ? `Variabel wajib belum diisi: ${lastResult.missing.join(', ')}`
      : '';
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
      templateId: template.id,
      variables: collectVars(),
      renderedText: lastResult.text,
      createdAt: new Date().toISOString(),
    };
    await putRecord('runs', run);
    toast('Run tersimpan');
  });
}
