import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTemplate } from '../js/parser.js';

const here = dirname(fileURLToPath(import.meta.url));
const promptsDir = join(here, '..', 'prompts');
const outFile = join(here, '..', 'js', 'seed.js');

function slugify(fileName) {
  return fileName.replace(/\.md$/, '');
}

function build() {
  const files = readdirSync(promptsDir).filter((f) => f.endsWith('.md')).sort();
  const templates = files.map((file) => {
    const raw = readFileSync(join(promptsDir, file), 'utf8');
    const parsed = parseTemplate(raw);
    return {
      id: slugify(file),
      title: parsed.title || slugify(file),
      runVariables: parsed.runVariables,
      body: parsed.body,
      mustacheVars: parsed.mustacheVars,
      sourceFile: file,
    };
  });

  const header =
    '// DIBUAT OTOMATIS oleh tools/build-seed.mjs dari prompts/*.md — jangan diedit tangan (R6).\n';
  const content = `${header}export const SEED_TEMPLATES = ${JSON.stringify(templates, null, 2)};\n`;
  writeFileSync(outFile, content, 'utf8');
  console.log(`Generated ${outFile} dengan ${templates.length} template.`);
}

build();
