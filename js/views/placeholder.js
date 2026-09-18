// SPDX-License-Identifier: AGPL-3.0-only
// View generik untuk menu yang sudah masuk peta navigasi tapi belum diimplementasikan.
// Jujur menampilkan status "segera hadir" — bukan fitur palsu yang terlihat jalan (R5).
import { iconSvg } from '../icons.js';

export function renderPlaceholder(root, { title, icon, description, sourceNote }) {
  root.textContent = '';

  const head = document.createElement('div');
  head.className = 'page-head';
  const headInner = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.className = 'page-title';
  h1.textContent = title;
  headInner.appendChild(h1);
  const subtitle = document.createElement('p');
  subtitle.className = 'page-subtitle';
  subtitle.textContent = 'Segera hadir';
  headInner.appendChild(subtitle);
  head.appendChild(headInner);
  root.appendChild(head);

  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = `<div class="empty-icon">${iconSvg(icon, { size: 20 })}</div>`;

  const title2 = document.createElement('p');
  title2.className = 'empty-title';
  title2.textContent = 'Belum diimplementasikan';
  empty.appendChild(title2);

  const desc = document.createElement('p');
  desc.className = 'empty-subtitle';
  desc.textContent = description;
  empty.appendChild(desc);

  if (sourceNote) {
    const note = document.createElement('p');
    note.className = 'empty-subtitle';
    note.style.marginTop = '8px';
    note.style.opacity = '0.7';
    note.textContent = sourceNote;
    empty.appendChild(note);
  }

  root.appendChild(empty);
}
