// SPDX-License-Identifier: AGPL-3.0-only
import { getAll } from './store.js';
import { SEED_TEMPLATES } from './seed.js';

export async function allTemplates() {
  return [...SEED_TEMPLATES, ...(await getAll('templates'))];
}

export async function findTemplateById(id) {
  const seedMatch = SEED_TEMPLATES.find((t) => t.id === id);
  if (seedMatch) return seedMatch;
  const userTemplates = await getAll('templates');
  return userTemplates.find((t) => t.id === id) || null;
}
