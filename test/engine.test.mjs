import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render, expandTokens } from '../js/engine.js';

test('substitusi variabel sederhana', () => {
  const { text, missing } = render('Halo {{NAME}}!', { NAME: 'Budi' });
  assert.equal(text, 'Halo Budi!');
  assert.deepEqual(missing, []);
});

test('variabel wajib kosong ditandai missing, placeholder tetap terlihat (tidak diam-diam dirender)', () => {
  const { text, missing } = render('Halo {{NAME}}!', {});
  assert.equal(text, 'Halo {{NAME}}!');
  assert.deepEqual(missing, ['NAME']);
});

test('{{#if}} menampilkan blok saat variabel terisi', () => {
  const { text } = render('A{{#if X}}B{{/if}}C', { X: 'ya' });
  assert.equal(text, 'ABC');
});

test('{{#if}} menghilangkan blok saat variabel kosong', () => {
  const { text } = render('A{{#if X}}B{{/if}}C', {});
  assert.equal(text, 'AC');
});

test('{{#unless}} adalah kebalikan dari {{#if}}', () => {
  assert.equal(render('A{{#unless X}}B{{/unless}}C', { X: 'ya' }).text, 'AC');
  assert.equal(render('A{{#unless X}}B{{/unless}}C', {}).text, 'ABC');
});

test('{{#if}} bersarang dievaluasi sesuai kombinasi variabel', () => {
  const tpl = '{{#if A}}outer-start{{#if B}}inner{{/if}}outer-end{{/if}}';
  assert.equal(render(tpl, { A: '1', B: '1' }).text, 'outer-startinnerouter-end');
  assert.equal(render(tpl, { A: '1' }).text, 'outer-startouter-end');
  assert.equal(render(tpl, {}).text, '');
});

test('{{#if}} yang tidak tertutup tidak meninggalkan sisa penanda di keluaran', () => {
  const { text } = render('A{{#if X}}B', { X: '1' });
  assert.ok(!text.includes('{{'));
  assert.ok(!text.includes('}}'));
});

test('expandTokens memakai jam yang dikunci, tidak bergantung jam sistem', () => {
  const now = new Date('2026-03-05T10:00:00Z'); // 17:00 WIB
  const out = expandTokens('{{date}} {{time}} {{datetime}}', { now });
  assert.equal(out, '2026-03-05 17:00 WIB 2026-03-05 17:00 WIB');
});
