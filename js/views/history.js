// SPDX-License-Identifier: AGPL-3.0-only
import { getAll, deleteRecord } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { toast, copyToClipboard } from '../ui.js';
import { iconSvg } from '../icons.js';

function templateTitle(templateId) {
  const seedMatch = SEED_TEMPLATES.find((t) => t.id === templateId);
  return seedMatch ? seedMatch.title : templateId;
}

function formatCreatedAt(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

export async function renderHistory(root) {
  root.textContent = '';

  const runs = (await getAll('runs')).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const head = document.createElement('div');
  head.className = 'page-head';
  head.innerHTML = `
    <div>
      <h1 class="page-title">Riwayat</h1>
      <p class="page-subtitle">${runs.length} run tersimpan</p>
    </div>
  `;
  root.appendChild(head);

  if (runs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon">${iconSvg('history', { size: 20 })}</div>
      <p class="empty-title">Belum ada run tersimpan</p>
      <p class="empty-subtitle">Render prompt di Rakit lalu simpan untuk melihatnya di sini.</p>
    `;
    root.appendChild(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'list';

  const detailWrap = document.createElement('div');

  function showDetail(run) {
    detailWrap.textContent = '';

    const card = document.createElement('div');
    card.className = 'detail-card';

    const meta = document.createElement('p');
    meta.className = 'detail-meta';
    meta.textContent = `${templateTitle(run.templateId)} — ${formatCreatedAt(run.createdAt)}`;
    card.appendChild(meta);

    const outputBox = document.createElement('div');
    outputBox.className = 'output-box';
    outputBox.innerHTML = '<div class="output-box-header"><span>HASIL RENDER</span></div>';
    const pre = document.createElement('pre');
    pre.textContent = run.renderedText;
    outputBox.appendChild(pre);
    card.appendChild(outputBox);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn';
    copyBtn.innerHTML = `${iconSvg('copy', { size: 15 })}<span>Salin</span>`;
    copyBtn.addEventListener('click', async () => {
      const ok = await copyToClipboard(run.renderedText);
      toast(ok ? 'Tersalin ke clipboard' : 'Gagal menyalin');
    });
    actions.appendChild(copyBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.innerHTML = `${iconSvg('trash', { size: 15 })}<span>Hapus</span>`;
    deleteBtn.addEventListener('click', async () => {
      await deleteRecord('runs', run.id);
      toast('Run dihapus');
      await renderHistory(root);
    });
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    detailWrap.appendChild(card);
  }

  for (const run of runs) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'list-item-btn';
    const itemTitle = document.createElement('span');
    itemTitle.className = 'item-title';
    itemTitle.textContent = templateTitle(run.templateId);
    button.appendChild(itemTitle);
    const itemMeta = document.createElement('span');
    itemMeta.className = 'item-meta';
    itemMeta.textContent = formatCreatedAt(run.createdAt);
    button.appendChild(itemMeta);
    button.addEventListener('click', () => showDetail(run));
    item.appendChild(button);
    list.appendChild(item);
  }

  root.appendChild(list);
  root.appendChild(detailWrap);
}
