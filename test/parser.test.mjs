import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTemplate, parseRunVariables, extractMustacheVars } from '../js/parser.js';

const SAMPLE = `# Ringkasan Dokumen

## RUN VARIABLES

\`\`\`
DOCUMENT_TOPIC : <tempel topik atau isi dokumen>
OUTPUT_LANG    : Bahasa Indonesia | English
TONE           : Formal | Santai | Teknis  # gaya bahasa ringkasan
\`\`\`

=== COPY MULAI DARI SINI ===

Topik: {{DOCUMENT_TOPIC}}
Bahasa: {{OUTPUT_LANG}}

{{#if TONE}}Gaya: {{TONE}}{{/if}}

=== COPY SAMPAI SINI ===
`;

test('parseTemplate mengambil judul dari heading pertama', () => {
  const parsed = parseTemplate(SAMPLE);
  assert.equal(parsed.title, 'Ringkasan Dokumen');
});

test('parseTemplate hanya mengambil isi di antara penanda COPY', () => {
  const parsed = parseTemplate(SAMPLE);
  assert.ok(parsed.body.startsWith('Topik: {{DOCUMENT_TOPIC}}'));
  assert.ok(!parsed.body.includes('COPY MULAI'));
  assert.ok(!parsed.body.includes('COPY SAMPAI'));
});

test('RUN VARIABLES: value placeholder <...> dikenali sebagai teks bebas, bukan select', () => {
  const parsed = parseTemplate(SAMPLE);
  const topic = parsed.runVariables.find((v) => v.key === 'DOCUMENT_TOPIC');
  assert.equal(topic.type, 'text');
  assert.equal(topic.isPlaceholder, true);
});

test('RUN VARIABLES: select dipisah oleh |', () => {
  const parsed = parseTemplate(SAMPLE);
  const lang = parsed.runVariables.find((v) => v.key === 'OUTPUT_LANG');
  assert.equal(lang.type, 'select');
  assert.deepEqual(lang.options, ['Bahasa Indonesia', 'English']);
});

test('RUN VARIABLES: komentar # masuk ke help, bukan ke value', () => {
  const parsed = parseTemplate(SAMPLE);
  const tone = parsed.runVariables.find((v) => v.key === 'TONE');
  assert.deepEqual(tone.options, ['Formal', 'Santai', 'Teknis']);
  assert.equal(tone.help, 'gaya bahasa ringkasan');
});

test('RUN VARIABLES: | di dalam <...> tidak dipecah jadi select', () => {
  const [v] = parseRunVariables('KEY : <opsi cepat | lambat sebagai teks bebas>');
  assert.equal(v.type, 'text');
  assert.equal(v.value, '<opsi cepat | lambat sebagai teks bebas>');
});

test('RUN VARIABLES: | di dalam (...) tidak memecah opsi lain', () => {
  const [v] = parseRunVariables('KEY : Opsi A (cepat | lambat) | Opsi B');
  assert.equal(v.type, 'select');
  assert.deepEqual(v.options, ['Opsi A (cepat | lambat)', 'Opsi B']);
});

test('RUN VARIABLES: baris lanjutan digabung ke value sebelumnya', () => {
  const [v] = parseRunVariables('KEY : baris pertama\n  baris kedua lanjutan');
  assert.equal(v.value, 'baris pertama baris kedua lanjutan');
});

test('extractMustacheVars mengabaikan penanda kontrol dan token tanggal', () => {
  const vars = extractMustacheVars('{{A}} {{#if B}}{{C}}{{/if}} {{date}} {{datetime}}');
  assert.deepEqual(vars.sort(), ['A', 'C']);
});

test('parseTemplate template tanpa penanda COPY tetap mengambil isi setelah blok RUN VARIABLES', () => {
  const noCopy = `# Judul\n\n## RUN VARIABLES\n\n\`\`\`\nX : y\n\`\`\`\n\nIsi: {{X}}\n`;
  const parsed = parseTemplate(noCopy);
  assert.equal(parsed.body, 'Isi: {{X}}');
});
