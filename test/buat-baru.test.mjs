import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../js/views/buat-baru.js';

test('slugify: judul biasa jadi kebab-case huruf kecil', () => {
  assert.equal(slugify('Ringkasan Dokumen'), 'ringkasan-dokumen');
});

test('slugify: karakter non-alfanumerik diganti tanda hubung tunggal', () => {
  assert.equal(slugify('Prompt: Coding & Review!!'), 'prompt-coding-review');
});

test('slugify: tanda hubung di awal/akhir dirapikan', () => {
  assert.equal(slugify('  --Judul--  '), 'judul');
});

test('slugify: judul kosong jatuh ke default "template"', () => {
  assert.equal(slugify('   '), 'template');
});
