import { getAll, putRecord } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { render } from '../engine.js';
import { toast, copyToClipboard } from '../ui.js';

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
    const notFound = document.createElement('p');
    notFound.textContent = `Template "${id}" tidak ditemukan.`;
    root.appendChild(notFound);
    return;
  }

  const heading = document.createElement('h1');
  heading.textContent = template.title || template.id;
  root.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'builder-form';
  const inputs = {};

  for (const v of template.runVariables) {
    const label = document.createElement('label');
    label.textContent = v.key;

    let field;
    if (v.type === 'select') {
      field = document.createElement('select');
      for (const opt of v.options) {
        const optionEl = document.createElement('option');
        optionEl.value = opt;
        optionEl.textContent = opt;
        field.appendChild(optionEl);
      }
    } else {
      field = document.createElement('input');
      field.type = 'text';
      field.value = v.isPlaceholder ? '' : v.value;
      field.placeholder = v.isPlaceholder ? v.value : '';
    }
    field.name = v.key;
    label.appendChild(field);
    form.appendChild(label);
    inputs[v.key] = field;
  }

  const renderBtn = document.createElement('button');
  renderBtn.type = 'submit';
  renderBtn.textContent = 'Render';
  form.appendChild(renderBtn);
  root.appendChild(form);

  const missingBox = document.createElement('p');
  missingBox.className = 'missing-box';
  root.appendChild(missingBox);

  const output = document.createElement('pre');
  output.className = 'output';
  root.appendChild(output);

  const actions = document.createElement('div');
  actions.className = 'actions';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Salin';
  copyBtn.disabled = true;
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.textContent = 'Simpan sebagai Run';
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
