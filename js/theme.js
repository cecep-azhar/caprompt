// SPDX-License-Identifier: AGPL-3.0-only
import { getRecord, putRecord } from './store.js';

const KV_KEY = 'theme';

export function applyTheme(pref) {
  if (pref === 'light' || pref === 'dark') {
    document.documentElement.dataset.theme = pref;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export async function getThemePref() {
  const record = await getRecord('kv', KV_KEY);
  return record ? record.value : 'system';
}

export async function setThemePref(pref) {
  await putRecord('kv', { key: KV_KEY, value: pref });
  applyTheme(pref);
  window.dispatchEvent(new CustomEvent('caprompt:theme-changed', { detail: { pref } }));
}

export async function initTheme() {
  const pref = await getThemePref();
  applyTheme(pref);
  return pref;
}
