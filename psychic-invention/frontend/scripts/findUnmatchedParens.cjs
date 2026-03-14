const fs = require('fs');

const path = process.argv[2];
if (!path) {
  console.error('Usage: node findUnmatchedParens.cjs <file>');
  process.exit(2);
}

const src = fs.readFileSync(path, 'utf8');

// Very small lexer: ignore strings and comments to find structural parens/braces.
let i = 0;
const stack = [];
const push = (ch, idx) => stack.push({ ch, idx });
const pop = (ch) => {
  for (let j = stack.length - 1; j >= 0; j--) {
    if (stack[j].ch === ch) return stack.splice(j, 1)[0];
  }
  return null;
};

const isWs = (c) => c === ' ' || c === '\n' || c === '\r' || c === '\t';

while (i < src.length) {
  const ch = src[i];
  const next = src[i + 1];

  // line comment
  if (ch === '/' && next === '/') {
    i += 2;
    while (i < src.length && src[i] !== '\n') i++;
    continue;
  }
  // block comment
  if (ch === '/' && next === '*') {
    i += 2;
    while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
    i += 2;
    continue;
  }
  // strings
  if (ch === '\'' || ch === '"' || ch === '`') {
    const quote = ch;
    i++;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\\\') {
        i += 2;
        continue;
      }
      if (quote === '`' && c === '$' && src[i + 1] === '{') {
        // skip ${ ... } expression naively
        i += 2;
        let depth = 1;
        while (i < src.length && depth > 0) {
          const cc = src[i];
          if (cc === '\'' || cc === '"' || cc === '`') break; // bail early; good enough
          if (cc === '{') depth++;
          if (cc === '}') depth--;
          i++;
        }
        continue;
      }
      if (c === quote) {
        i++;
        break;
      }
      i++;
    }
    continue;
  }

  if (ch === '(') push('(', i);
  else if (ch === ')') {
    const p = pop('(');
    if (!p) console.log('extra ) at', i);
  } else if (ch === '{') push('{', i);
  else if (ch === '}') {
    const p = pop('{');
    if (!p) console.log('extra } at', i);
  }

  i++;
}

if (stack.length) {
  console.log('Unmatched openings:', stack.map((s) => s.ch + '@' + s.idx).slice(-10));
  const last = stack[stack.length - 1];
  const start = Math.max(0, last.idx - 80);
  const end = Math.min(src.length, last.idx + 120);
  console.log('Context:', src.slice(start, end));
} else {
  console.log('No unmatched parens/braces found');
}

