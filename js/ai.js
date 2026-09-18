// SPDX-License-Identifier: AGPL-3.0-only
// Klien OpenAI-compatible generik (9router atau endpoint lokal/lain yang mengikuti
// bentuk /v1/chat/completions & /v1/models). Tidak ada dependensi npm (R4) — pakai fetch bawaan.
// R10: API key hanya pernah singgah di memori + IndexedDB kv lewat getAIConfig/setAIConfig,
// tidak pernah ditulis ke berkas project, ekspor, atau log.
import { getRecord, putRecord } from './store.js';

const KV_KEY = 'ai-config';

export async function getAIConfig() {
  const record = await getRecord('kv', KV_KEY);
  return record ? record.value : { baseUrl: '', apiKey: '', model: '' };
}

export async function setAIConfig(config) {
  await putRecord('kv', { key: KV_KEY, value: config });
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

export async function listModels({ baseUrl, apiKey }, { signal } = {}) {
  if (!baseUrl) return { ok: false, error: 'Base URL belum diisi.' };
  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    const ids = Array.isArray(data?.data) ? data.data.map((m) => m.id).filter(Boolean) : [];
    return { ok: true, models: ids };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Waktu tunggu habis.' : String(err.message || err) };
  }
}

export async function chatCompletion({ baseUrl, apiKey, model, messages, maxTokens = 1024 }, { signal } = {}) {
  if (!baseUrl) return { ok: false, error: 'Base URL belum diisi.' };
  if (!model) return { ok: false, error: 'Nama model belum diisi.' };
  try {
    const res = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: false }),
      signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      return { ok: false, error: 'Respons tidak sesuai format OpenAI-compatible (tidak ada choices[0].message.content).' };
    }
    return { ok: true, text, usage: data.usage || null, model: data.model || model };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Waktu tunggu habis.' : String(err.message || err) };
  }
}
