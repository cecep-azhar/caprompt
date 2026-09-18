const RUN_VARS_HEADING = /^##\s*RUN VARIABLES\s*$/im;
const COPY_START = /^===\s*COPY MULAI DARI SINI\s*===\s*$/m;
const COPY_END = /^===\s*COPY SAMPAI SINI\s*===\s*$/m;
const MUSTACHE_VAR = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;
const RESERVED_TOKENS = new Set(['date', 'datetime', 'time']);
const KEY_LINE = /^([A-Za-z0-9_]+)\s*:\s*(.*)$/;

// Splits `str` on `delimiter`, ignoring any delimiter found inside <...> or (...).
function splitOutsideBrackets(str, delimiter) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if (ch === '<' || ch === '(') depth++;
    else if (ch === '>' || ch === ')') depth = Math.max(0, depth - 1);
    if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

function parseValueLine(raw) {
  const [beforeHash, ...afterHashParts] = splitOutsideBrackets(raw, '#');
  const help = afterHashParts.join('#').trim();
  const valueRaw = beforeHash.trim();
  const isPlaceholder = /^<.*>$/.test(valueRaw);

  if (!isPlaceholder && valueRaw.includes('|')) {
    const segments = splitOutsideBrackets(valueRaw, '|')
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length > 1) {
      return { type: 'select', options: segments, value: segments[0], help };
    }
  }
  return { type: 'text', value: valueRaw, isPlaceholder, help };
}

export function parseRunVariables(block) {
  const lines = block.split(/\r?\n/);
  const vars = [];
  let current = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const m = line.match(KEY_LINE);
    if (m) {
      const [, key, rest] = m;
      current = { key, ...parseValueLine(rest) };
      vars.push(current);
    } else if (current) {
      const continuation = line.trim();
      if (continuation) {
        current.value = current.value ? `${current.value} ${continuation}` : continuation;
      }
    }
  }
  return vars;
}

export function extractMustacheVars(text) {
  const found = new Set();
  MUSTACHE_VAR.lastIndex = 0;
  let m;
  while ((m = MUSTACHE_VAR.exec(text))) {
    const name = m[1];
    if (!RESERVED_TOKENS.has(name)) found.add(name);
  }
  return [...found];
}

export function parseTemplate(markdown) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';

  let runVariables = [];
  let afterRunVarsFence = null;
  const headingMatch = RUN_VARS_HEADING.exec(markdown);
  if (headingMatch) {
    const afterHeading = markdown.slice(headingMatch.index + headingMatch[0].length);
    const fenceMatch = afterHeading.match(/```[^\n]*\n([\s\S]*?)```/);
    if (fenceMatch) {
      runVariables = parseRunVariables(fenceMatch[1]);
      afterRunVarsFence = afterHeading.slice(fenceMatch.index + fenceMatch[0].length);
    }
  }

  let body;
  const startMatch = COPY_START.exec(markdown);
  const endMatch = COPY_END.exec(markdown);
  if (startMatch && endMatch && endMatch.index > startMatch.index) {
    body = markdown.slice(startMatch.index + startMatch[0].length, endMatch.index).trim();
  } else if (afterRunVarsFence !== null) {
    body = afterRunVarsFence.trim();
  } else if (headingMatch) {
    body = markdown.slice(headingMatch.index + headingMatch[0].length).trim();
  } else {
    body = markdown.trim();
  }

  return { title, runVariables, body, mustacheVars: extractMustacheVars(body) };
}
