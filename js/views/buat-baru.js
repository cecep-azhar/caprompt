// SPDX-License-Identifier: AGPL-3.0-only
import { parseTemplate } from '../parser.js';
import { getAll, putRecord } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { toast } from '../ui.js';
import { iconSvg } from '../icons.js';

const EXAMPLE = `# Judul Prompt Anda

## RUN VARIABLES

\`\`\`
TOPIK : <tempel topik di sini>
GAYA  : Formal | Santai  # gaya bahasa
\`\`\`

Tulis isi prompt di sini, pakai {{TOPIK}} dan {{GAYA}} untuk variabel.
`;

export function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || 'template';
}

async function uniqueId(title) {
  const existing = new Set([...SEED_TEMPLATES, ...(await getAll('templates'))].map((t) => t.id));
  const base = slugify(title);
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function renderBuatBaru(root) {
  root.textContent = '';

  const head = document.createElement('div');
  head.className = 'page-head';
  const headInner = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.className = 'page-title';
  h1.textContent = 'Buat Baru';
  headInner.appendChild(h1);
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = 'Tulis template dalam format yang sama seperti prompts/*.md';
  headInner.appendChild(subtitle);
  head.appendChild(headInner);
  root.appendChild(head);

  const field = document.createElement('div');
  field.className = 'field';
  const label = document.createElement('label');
  label.textContent = 'Markdown template';
  field.appendChild(label);
  const textarea = document.createElement('textarea');
  textarea.rows = 14;
  textarea.value = EXAMPLE;
  field.appendChild(textarea);
  root.appendChild(field);

  const previewBox = document.createElement('div');
  previewBox.className = 'detail-card';
  previewBox.style.marginTop = '16px';
  root.appendChild(previewBox);

  const errorBox = document.createElement('p');
  errorBox.className = 'missing-box';
  root.appendChild(errorBox);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-primary';
  saveBtn.innerHTML = `${iconSvg('save', { size: 15 })}<span>Simpan template</span>`;
  saveBtn.style.marginTop = '4px';
  root.appendChild(saveBtn);

  let lastParsed = null;

  function updatePreview() {
    const parsed = parseTemplate(textarea.value);
    lastParsed = parsed;
    previewBox.textContent = '';

    const declaredKeys = new Set(parsed.runVariables.map((v) => v.key));
    const undeclared = parsed.mustacheVars.filter((k) => !declaredKeys.has(k));

    const titleRow = document.createElement('p');
    titleRow.className = 'detail-meta';
    titleRow.textContent = parsed.title ? `Judul: ${parsed.title}` : 'Judul: (belum ada — tulis "# Judul" di baris pertama)';
    previewBox.appendChild(titleRow);

    const varRow = document.createElement('p');
    varRow.className = 'detail-meta';
    varRow.textContent = `${parsed.runVariables.length} variabel terdeteksi${
      parsed.runVariables.length ? ': ' + parsed.runVariables.map((v) => v.key).join(', ') : ''
    }`;
    previewBox.appendChild(varRow);

    if (undeclared.length) {
      const warn = document.createElement('p');
      warn.className = 'detail-meta';
      warn.style.color = '#d97706';
      warn.textContent = `Peringatan: {{${undeclared.join('}}, {{')}}} dipakai di isi tapi tidak dideklarasikan di RUN VARIABLES.`;
      previewBox.appendChild(warn);
    }

    const outputBox = document.createElement('div');
    outputBox.className = 'output-box';
    outputBox.innerHTML = '<div class="output-box-header"><span>ISI PROMPT</span></div>';
    const pre = document.createElement('pre');
    pre.textContent = parsed.body || '(kosong)';
    outputBox.appendChild(pre);
    previewBox.appendChild(outputBox);

    const titleOk = parsed.title.trim().length > 0;
    const bodyOk = parsed.body.trim().length > 0;
    saveBtn.disabled = !(titleOk && bodyOk);
    errorBox.textContent = !titleOk
      ? 'Judul wajib diisi (baris pertama diawali "# ").'
      : !bodyOk
        ? 'Isi prompt wajib diisi.'
        : '';
  }

  textarea.addEventListener('input', updatePreview);
  updatePreview();

  saveBtn.addEventListener('click', async () => {
    if (!lastParsed || !lastParsed.title.trim() || !lastParsed.body.trim()) return;
    const id = await uniqueId(lastParsed.title);
    const template = {
      id,
      title: lastParsed.title,
      runVariables: lastParsed.runVariables,
      body: lastParsed.body,
      mustacheVars: lastParsed.mustacheVars,
      origin: 'user',
      createdAt: new Date().toISOString(),
    };
    await putRecord('templates', template);
    toast('Template tersimpan');
    location.hash = `#/builder/${encodeURIComponent(id)}`;
  });
}
