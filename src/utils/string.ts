const STOP_WORDS = new Set([
  'a',
  'al',
  'an',
  'and',
  'ante',
  'as',
  'at',
  'bajo',
  'build',
  'buscando',
  'by',
  'como',
  'con',
  'concrete',
  'concretos',
  'contra',
  'create',
  'crear',
  'de',
  'del',
  'desde',
  'Durante',
  'el',
  'en',
  'entre',
  'es',
  'esa',
  'ese',
  'esta',
  'este',
  'for',
  'from',
  'genera',
  'generar',
  'hacia',
  'hasta',
  'in',
  'into',
  'is',
  'la',
  'las',
  'le',
  'les',
  'lo',
  'los',
  'make',
  'mas',
  'mediante',
  'mi',
  'muy',
  'o',
  'of',
  'on',
  'or',
  'para',
  'pero',
  'por',
  'problemas',
  'proponga',
  'proponer',
  'que',
  'se',
  'segun',
  'sin',
  'skill',
  'sobre',
  'su',
  'sus',
  'that',
  'the',
  'to',
  'tu',
  'un',
  'una',
  'unas',
  'uno',
  'unos',
  'use',
  'using',
  'with',
  'y'
]);

const RESERVED_WORDS = ['anthropic', 'claude'];

const NORMALIZATION_MAP: Array<[RegExp, string]> = [
  [/next\.js/gi, 'nextjs'],
  [/node\.js/gi, 'nodejs'],
  [/vue\.js/gi, 'vuejs'],
  [/nuxt\.js/gi, 'nuxtjs'],
  [/nest\.js/gi, 'nestjs'],
  [/pull\s+requests?/gi, 'pr'],
  [/revis(e|ar|ion|a)\s+pr/gi, 'pr-reviewer'],
  [/code\s+review/gi, 'code-reviewer']
];

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function toKebabCase(input: string): string {
  const cleaned = stripAccents(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return cleaned.slice(0, 64).replace(/-+$/g, '');
}

export function generateSkillNameFromDescription(description: string): string {
  let normalized = stripAccents(description).toLowerCase();

  for (const [pattern, replacement] of NORMALIZATION_MAP) {
    normalized = normalized.replace(pattern, replacement);
  }

  for (const reserved of RESERVED_WORDS) {
    normalized = normalized.replace(new RegExp(reserved, 'gi'), 'agent');
  }

  const hasPr = /\bpr\b/.test(normalized);
  const hasReview = /\b(revis\w*|review\w*|audit\w*)\b/.test(normalized);
  const hasNextjs = /\bnextjs\b/.test(normalized);

  if (hasNextjs && hasPr && hasReview) {
    return 'nextjs-pr-reviewer';
  }

  const rawTokens = normalized
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^-+|-+$/g, ''))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  const actionTransformed = rawTokens.map((token) => {
    if (/^revis(e|ar|ion|a)$/.test(token)) return 'reviewer';
    if (/^debug(gear|ging)?$/.test(token)) return 'debugger';
    if (/^document(ar|acion)?$/.test(token)) return 'docs';
    if (/^optimiz(ar|acion|e)$/.test(token)) return 'optimizer';
    if (/^migr(ar|acion|ate)$/.test(token)) return 'migrator';
    return token;
  });

  const uniqueTokens: string[] = [];
  for (const token of actionTransformed) {
    if (!uniqueTokens.includes(token)) {
      uniqueTokens.push(token);
    }
    if (uniqueTokens.length >= 4) {
      break;
    }
  }

  if (uniqueTokens.length === 0) {
    return 'custom-agent-skill';
  }

  const candidate = toKebabCase(uniqueTokens.join('-'));
  return candidate.length > 0 ? candidate : 'custom-agent-skill';
}

export function extractFrontmatter(markdown: string): {
  frontmatterRaw: string | null;
  body: string;
} {
  // Strip a leading UTF-8 BOM so editors that add one do not break frontmatter detection.
  const withoutBom = markdown.charCodeAt(0) === 0xfeff ? markdown.slice(1) : markdown;
  const normalized = withoutBom.replace(/\r\n/g, '\n');
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) {
    return { frontmatterRaw: null, body: normalized };
  }
  return {
    frontmatterRaw: match[1] ?? null,
    body: (match[2] ?? '').trim()
  };
}

export function parseSimpleYamlFrontmatter(yamlText: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = yamlText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const colonIndex = line.indexOf(':');
    if (colonIndex <= 0) {
      throw new Error(`Línea YAML inválida en frontmatter: "${rawLine}"`);
    }
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\(["\\])/g, '$1');
    } else if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replace(/''/g, "'");
    }

    result[key] = value;
  }

  return result;
}
