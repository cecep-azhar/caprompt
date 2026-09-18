// SPDX-License-Identifier: AGPL-3.0-only
// SUMBER KEBENARAN RENDER — satu-satunya mesin render CAPrompt.
// Go/Rust dilarang mereimplementasi ini (R5); mereka wajib memanggil jalur ini
// atau membuktikan hasilnya byte-identik.

const TAG_RE = /\{\{#(if|unless)\s+([A-Za-z0-9_]+)\}\}|\{\{\/(if|unless)\}\}/g;
const VAR_TOKEN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;
const DATE_TOKENS = new Set(['date', 'datetime', 'time']);

function isTruthy(vars, key) {
  const v = vars[key];
  return v !== undefined && v !== null && String(v).trim() !== '';
}

function tokenizeConditionals(text) {
  const tokens = [];
  let lastIndex = 0;
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(text))) {
    if (m.index > lastIndex) tokens.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    if (m[1]) tokens.push({ type: 'open', kind: m[1], key: m[2] });
    else tokens.push({ type: 'close', kind: m[3] });
    lastIndex = TAG_RE.lastIndex;
  }
  if (lastIndex < text.length) tokens.push({ type: 'text', value: text.slice(lastIndex) });
  return tokens;
}

// Stack-based evaluation so {{#if}}/{{#unless}} nest correctly and an
// unclosed tag never leaks its raw marker into the output.
function evalTokens(list, vars) {
  let out = '';
  let i = 0;
  while (i < list.length) {
    const t = list[i];
    if (t.type === 'text') {
      out += t.value;
      i++;
      continue;
    }
    if (t.type === 'open') {
      let depth = 1;
      let j = i + 1;
      const inner = [];
      while (j < list.length && depth > 0) {
        const tj = list[j];
        if (tj.type === 'open' && tj.kind === t.kind) depth++;
        if (tj.type === 'close' && tj.kind === t.kind) {
          depth--;
          if (depth === 0) break;
        }
        inner.push(tj);
        j++;
      }
      const truthy = isTruthy(vars, t.key);
      const keep = t.kind === 'if' ? truthy : !truthy;
      if (keep) out += evalTokens(inner, vars);
      i = j + 1;
      continue;
    }
    // stray close with no matching open: drop silently, never leak a marker
    i++;
  }
  return out;
}

function resolveConditionals(text, vars) {
  return evalTokens(tokenizeConditionals(text), vars);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toWIBParts(date) {
  const wib = new Date(date.getTime() + 7 * 3600000);
  return {
    y: wib.getUTCFullYear(),
    mo: pad2(wib.getUTCMonth() + 1),
    d: pad2(wib.getUTCDate()),
    h: pad2(wib.getUTCHours()),
    mi: pad2(wib.getUTCMinutes()),
  };
}

export function expandTokens(text, { now = new Date() } = {}) {
  const p = toWIBParts(now);
  return text
    .replace(/\{\{\s*datetime\s*\}\}/g, `${p.y}-${p.mo}-${p.d} ${p.h}:${p.mi} WIB`)
    .replace(/\{\{\s*date\s*\}\}/g, `${p.y}-${p.mo}-${p.d}`)
    .replace(/\{\{\s*time\s*\}\}/g, `${p.h}:${p.mi} WIB`);
}

export function render(body, vars = {}, { now = new Date() } = {}) {
  let out = resolveConditionals(body, vars);
  out = expandTokens(out, { now });

  const missing = [];
  VAR_TOKEN.lastIndex = 0;
  out = out.replace(VAR_TOKEN, (match, key) => {
    if (DATE_TOKENS.has(key)) return match;
    const has = Object.prototype.hasOwnProperty.call(vars, key) && String(vars[key]).trim() !== '';
    if (!has) {
      if (!missing.includes(key)) missing.push(key);
      return match; // keep placeholder visible — never silently render blank
    }
    return String(vars[key]);
  });

  return { text: out, missing };
}

export const DEFAULT_CHAIN_SEPARATOR = '\n\n---\n\n';

// Rangkai: render beberapa {body, vars} lalu gabungkan urut sesuai `items`,
// dipisah `separator`. Tidak mereimplementasi render — memanggil ulang render().
export function renderChain(items, { separator = DEFAULT_CHAIN_SEPARATOR, now = new Date() } = {}) {
  const results = items.map((item) => render(item.body, item.vars || {}, { now }));
  return {
    text: results.map((r) => r.text).join(separator),
    parts: results.map((r) => r.text),
    missing: results.map((r) => r.missing),
  };
}
