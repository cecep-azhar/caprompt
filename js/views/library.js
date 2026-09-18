// SPDX-License-Identifier: AGPL-3.0-only
import { getAll } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';
import { iconSvg } from '../icons.js';

function renderCards(grid, templates) {
  grid.textContent = '';

  if (templates.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon">${iconSvg('library', { size: 20 })}</div>
      <p class="empty-title">Tidak ada template yang cocok</p>
      <p class="empty-subtitle">Coba kata kunci lain, atau hapus pencarian.</p>
    `;
    grid.appendChild(empty);
    return;
  }

  for (const t of templates) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `#/builder/${encodeURIComponent(t.id)}`;

    const icon = document.createElement('span');
    icon.className = 'card-icon';
    icon.innerHTML = iconSvg('library', { size: 18 });
    card.appendChild(icon);

    const textWrap = document.createElement('span');
    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = t.title || t.id;
    textWrap.appendChild(title);
    const subtitle = document.createElement('p');
    subtitle.className = 'card-subtitle';
    const varCount = (t.runVariables || []).length;
    subtitle.textContent = `${varCount} variabel`;
    textWrap.appendChild(subtitle);
    card.appendChild(textWrap);

    grid.appendChild(card);
  }
}

export async function renderLibrary(root) {
  root.textContent = '';

  const userTemplates = await getAll('templates');
  const all = [...SEED_TEMPLATES, ...userTemplates];

  const head = document.createElement('div');
  head.className = 'page-head';
  head.innerHTML = `
    <div>
      <h1 class="page-title">Pustaka</h1>
      <p class="page-subtitle">${all.length} template tersimpan</p>
    </div>
  `;
  root.appendChild(head);

  if (all.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon">${iconSvg('library', { size: 20 })}</div>
      <p class="empty-title">Belum ada template</p>
      <p class="empty-subtitle">Template bawaan akan muncul di sini setelah ditambahkan ke prompts/.</p>
    `;
    root.appendChild(empty);
    return;
  }

  const searchBar = document.createElement('div');
  searchBar.className = 'search-bar';
  searchBar.innerHTML = iconSvg('search', { size: 16 });
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Cari berdasarkan judul template...';
  searchBar.appendChild(searchInput);
  root.appendChild(searchBar);

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  root.appendChild(grid);

  renderCards(grid, all);

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = q ? all.filter((t) => (t.title || t.id).toLowerCase().includes(q)) : all;
    renderCards(grid, filtered);
  });
}
