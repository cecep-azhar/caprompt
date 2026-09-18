// SPDX-License-Identifier: AGPL-3.0-only
import { getAll, putRecord } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { render } from '../engine.js';
import { toast, copyToClipboard } from '../ui.js';
import { iconSvg } from '../icons.js';

async function findTemplate(id) {
  const seedMatch = SEED_TEMPLATES.find((t) => t.id === id);
  if (seedMatch) return seedMatch;
  const userTemplates = await getAll('templates');
  return userTemplates.find((t) => t.id === id) || null;
}

export async function renderBuilder(root, id) {
  root.textContent = '';
  const template = await findTemplate(id);

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
  const fieldGroup = document.createElement('div');
  fieldGroup.className = 'field-group';
  const inputs = {};

  for (const v of template.runVariables) {
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.textContent = v.key;
    field.appendChild(label);

    let control;
    if (v.type === 'select') {
      control = document.createElement('select');
      for (const opt of v.options) {
        const optionEl = document.createElement('option');
        optionEl.value = opt;
        optionEl.textContent = opt;
        control.appendChild(optionEl);
      }
    } else {
      control = document.createElement('input');
      control.type = 'text';
      control.value = v.isPlaceholder ? '' : v.value;
      control.placeholder = v.isPlaceholder ? v.value : '';
    }
    control.name = v.key;
    field.appendChild(control);
    fieldGroup.appendChild(field);
    inputs[v.key] = control;
  }

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

  function collectVars() {
    const vars = {};
    for (const [key, field] of Object.entries(inputs)) vars[key] = field.value;
    return vars;
  }

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
