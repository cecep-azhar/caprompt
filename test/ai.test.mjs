import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatCompletion, listModels } from '../js/ai.js';

test('chatCompletion menolak base URL kosong tanpa memanggil fetch', async () => {
  const result = await chatCompletion({ baseUrl: '', model: 'x', messages: [] });
  assert.equal(result.ok, false);
  assert.match(result.error, /Base URL/);
});

test('chatCompletion menolak model kosong tanpa memanggil fetch', async () => {
  const result = await chatCompletion({ baseUrl: 'http://localhost:1', model: '', messages: [] });
  assert.equal(result.ok, false);
  assert.match(result.error, /model/i);
});

test('listModels menolak base URL kosong tanpa memanggil fetch', async () => {
  const result = await listModels({ baseUrl: '', apiKey: '' });
  assert.equal(result.ok, false);
  assert.match(result.error, /Base URL/);
});
