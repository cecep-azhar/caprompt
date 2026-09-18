import { getAll } from '../store.js';
import { SEED_TEMPLATES } from '../seed.js';

export async function renderLibrary(root) {
  root.textContent = '';

  const heading = document.createElement('h1');
  heading.textContent = 'Pustaka';
  root.appendChild(heading);

  const userTemplates = await getAll('templates');
  const all = [...SEED_TEMPLATES, ...userTemplates];

  const list = document.createElement('ul');
  list.className = 'template-list';

  if (all.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Belum ada template.';
    list.appendChild(empty);
  }

  for (const t of all) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#/builder/${encodeURIComponent(t.id)}`;
    link.textContent = t.title || t.id;
    item.appendChild(link);
    list.appendChild(item);
  }

  root.appendChild(list);
}
