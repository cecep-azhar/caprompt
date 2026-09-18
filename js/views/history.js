// SPDX-License-Identifier: AGPL-3.0-only
import { getAll, deleteRecord } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { toast, copyToClipboard } from '../ui.js';

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

  const heading = document.createElement('h1');
  heading.textContent = 'Riwayat';
  root.appendChild(heading);

  const runs = (await getAll('runs')).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const list = document.createElement('ul');
  list.className = 'history-list';

  if (runs.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Belum ada run tersimpan.';
    list.appendChild(empty);
  }

  const detail = document.createElement('div');
  detail.className = 'history-detail';

  function showDetail(run) {
    detail.textContent = '';

    const meta = document.createElement('p');
    meta.textContent = `${templateTitle(run.templateId)} — ${formatCreatedAt(run.createdAt)}`;
    detail.appendChild(meta);

    const output = document.createElement('pre');
    output.className = 'output';
    output.textContent = run.renderedText;
    detail.appendChild(output);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = 'Salin';
    copyBtn.addEventListener('click', async () => {
      const ok = await copyToClipboard(run.renderedText);
      toast(ok ? 'Tersalin ke clipboard' : 'Gagal menyalin');
    });
    actions.appendChild(copyBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Hapus';
    deleteBtn.addEventListener('click', async () => {
      await deleteRecord('runs', run.id);
      toast('Run dihapus');
      await renderHistory(root);
    });
    actions.appendChild(deleteBtn);
    detail.appendChild(actions);

    root.appendChild(detail);
  }

  for (const run of runs) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    button.textContent = `${templateTitle(run.templateId)} — ${formatCreatedAt(run.createdAt)}`;
    button.addEventListener('click', () => showDetail(run));
    item.appendChild(button);
    list.appendChild(item);
  }

  root.appendChild(list);
}
