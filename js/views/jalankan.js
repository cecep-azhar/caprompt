// SPDX-License-Identifier: AGPL-3.0-only
import { allTemplates } from '../templates.js';
import { render } from '../engine.js';
import { buildFieldGroup } from '../field-form.js';
import { getAIConfig, chatCompletion } from '../ai.js';
import { putRecord } from '../store.js';
import { toast, copyToClipboard } from '../ui.js';
import { iconSvg } from '../icons.js';

export async function renderJalankan(root) {
  root.textContent = '';

  const head = document.createElement('div');
  head.className = 'page-head';
  const headInner = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.className = 'page-title';
  h1.textContent = 'Jalankan';
  headInner.appendChild(h1);
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = 'Render prompt lalu kirim langsung ke provider AI yang dikonfigurasi.';
  headInner.appendChild(subtitle);
  head.appendChild(headInner);
  root.appendChild(head);

  const config = await getAIConfig();
  if (!config.baseUrl || !config.model) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="empty-icon">${iconSvg('play', { size: 20 })}</div>`;
    const title = document.createElement('p');
    title.className = 'empty-title';
    title.textContent = 'Konfigurasi AI belum diisi';
    empty.appendChild(title);
    const sub = document.createElement('p');
    sub.className = 'empty-subtitle';
    sub.textContent = 'Isi Base URL dan Model di Pengaturan → tab AI dulu.';
    empty.appendChild(sub);
    const link = document.createElement('a');
    link.href = '#/settings';
    link.className = 'btn btn-primary';
    link.style.marginTop = '14px';
    link.style.display = 'inline-flex';
    link.textContent = 'Buka Pengaturan';
    empty.appendChild(link);
    root.appendChild(empty);
    return;
  }

  const templates = await allTemplates();
  if (templates.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<div class="empty-icon">${iconSvg('play', { size: 20 })}</div>`;
    const title = document.createElement('p');
    title.className = 'empty-title';
    title.textContent = 'Belum ada template';
    empty.appendChild(title);
    root.appendChild(empty);
    return;
  }

  const pickerField = document.createElement('div');
  pickerField.className = 'field';
  const pickerLabel = document.createElement('label');
  pickerLabel.textContent = 'Template';
  pickerField.appendChild(pickerLabel);
  const select = document.createElement('select');
  for (const t of templates) {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title || t.id;
    select.appendChild(opt);
  }
  pickerField.appendChild(select);
  root.appendChild(pickerField);

  const formWrap = document.createElement('div');
  root.appendChild(formWrap);

  const runBtn = document.createElement('button');
  runBtn.type = 'button';
  runBtn.className = 'btn btn-primary';
  runBtn.innerHTML = `${iconSvg('play', { size: 15 })}<span>Render &amp; Kirim ke AI</span>`;
  root.appendChild(runBtn);

  const statusMsg = document.createElement('p');
  statusMsg.className = 'missing-box';
  root.appendChild(statusMsg);

  const outputBox = document.createElement('div');
  outputBox.className = 'output-box';
  outputBox.style.marginTop = '16px';
  outputBox.innerHTML = `<div class="output-box-header"><span>JAWABAN AI (<span id="ai-model-label"></span>)</span></div>`;
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

  let fieldApi = null;
  let currentTemplate = null;
  let lastAnswer = null;

  function mountForm() {
    currentTemplate = templates.find((t) => t.id === select.value);
    formWrap.textContent = '';
    fieldApi = buildFieldGroup(currentTemplate.runVariables);
    formWrap.appendChild(fieldApi.element);
    output.textContent = '';
    statusMsg.textContent = '';
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    lastAnswer = null;
  }

  select.addEventListener('change', mountForm);
  mountForm();

  runBtn.addEventListener('click', async () => {
    const rendered = render(currentTemplate.body, fieldApi.collectVars());
    if (rendered.missing.length) {
      statusMsg.style.color = '#d97706';
      statusMsg.textContent = `Variabel wajib belum diisi: ${rendered.missing.join(', ')}`;
      return;
    }

    statusMsg.style.color = '';
    statusMsg.textContent = 'Menunggu respons AI (bisa 10-30 detik)...';
    runBtn.disabled = true;
    copyBtn.disabled = true;
    saveBtn.disabled = true;
    output.textContent = '';

    const result = await chatCompletion({
      ...config,
      messages: [{ role: 'user', content: rendered.text }],
      maxTokens: 2048,
    });

    runBtn.disabled = false;

    if (!result.ok) {
      statusMsg.style.color = '#ef4444';
      statusMsg.textContent = `Gagal: ${result.error}`;
      return;
    }

    statusMsg.textContent = result.usage
      ? `Selesai — ${result.usage.total_tokens ?? '?'} token.`
      : 'Selesai.';
    const modelUsed = result.model || config.model;
    document.getElementById('ai-model-label').textContent = modelUsed;
    const textWithEmblem = result.text + `\n\n---\n*Generated by ${modelUsed}*`;
    output.textContent = textWithEmblem;
    lastAnswer = { prompt: rendered.text, answer: textWithEmblem, model: modelUsed };
    copyBtn.disabled = false;
    saveBtn.disabled = false;
  });

  copyBtn.addEventListener('click', async () => {
    if (!lastAnswer) return;
    const ok = await copyToClipboard(lastAnswer.answer);
    toast(ok ? 'Tersalin ke clipboard' : 'Gagal menyalin');
  });

  saveBtn.addEventListener('click', async () => {
    if (!lastAnswer) return;
    const run = {
      id: crypto.randomUUID(),
      templateId: currentTemplate.id,
      variables: fieldApi.collectVars(),
      renderedText: lastAnswer.answer,
      viaAI: true,
      aiModel: lastAnswer.model,
      createdAt: new Date().toISOString(),
    };
    await putRecord('runs', run);
    toast('Run tersimpan');
  });
}
