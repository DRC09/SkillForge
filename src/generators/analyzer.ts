import { AnalyzedPrompt, SkillCategory } from '../types/index.js';
import { generateSkillNameFromDescription, stripAccents } from '../utils/string.js';

interface CategoryRule {
  category: SkillCategory;
  patterns: RegExp[];
  weight: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'code-review',
    patterns: [
      /\b(pull\s*requests?|prs?)\b/i,
      /\b(code\s*reviews?|revis(ar|ion|e)\s+(de\s+)?(codigo|pr|pull\s*request|cambios))\b/i,
      /\b(revis(ar|e)|review)\b/i
    ],
    weight: 12
  },
  {
    category: 'debugging',
    patterns: [
      /\b(debug|debugging|depurar|depuracion)\b/i,
      /\b(errores|bugs?|stack\s*trace|excepciones|crashes|fallos)\b/i,
      /\b(root\s*cause|causa\s*raiz)\b/i
    ],
    weight: 10
  },
  {
    category: 'documentation',
    patterns: [
      /\b(documenta(r|cion)|documentation|docs|readme|jsdoc|tsdoc|openapi|swagger)\b/i,
      /\b(guias?|manuales|changelog|adr)\b/i
    ],
    weight: 10
  },
  {
    category: 'framework-migration',
    patterns: [
      /\b(migra(r|cion|te|tion)|upgrade|actualizar\s+version|portar)\b/i,
      /\b(pages\s+router\s+a\s+app\s+router|de\s+vue\s+2|de\s+react|de\s+express|legacy)\b/i
    ],
    weight: 11
  },
  {
    category: 'accessibility',
    patterns: [
      /\b(accesibilidad|accessibility|a11y|wcag|aria|screen\s*reader|lectores\s+de\s+pantalla)\b/i,
      /\b(contraste|teclado|semantica\s+html)\b/i
    ],
    weight: 10
  },
  {
    category: 'performance',
    patterns: [
      /\b(rendimiento|performance|optimiz(ar|acion)|latencia|core\s+web\s+vitals|lcp|cls|inp)\b/i,
      /\b(bundle\s+size|memoria|memory\s+leak|cuellos?\s+de\s+botella|caching)\b/i
    ],
    weight: 10
  },
  {
    category: 'security',
    patterns: [
      /\b(seguridad|security|owasp|vulnerabilidad(es)?|xss|csrf|sqli|inyeccion)\b/i,
      /\b(autenticacion|autorizacion|secretos|auditoria\s+de\s+seguridad|cves?)\b/i
    ],
    weight: 10
  },
  {
    category: 'seo',
    patterns: [
      /\b(seo|search\s+engine|motores\s+de\s+busqueda|metadatos|metadata|opengraph|sitemap)\b/i,
      /\b(json-ld|schema\.org|indexacion|canonical|robots\.txt)\b/i
    ],
    weight: 10
  },
  {
    category: 'testing',
    patterns: [
      /\b(testing|tests?|pruebas?\s+unitarias?|vitest|jest|playwright|cypress|e2e|tdd)\b/i,
      /\b(cobertura|coverage|mocks?|fixtures?)\b/i
    ],
    weight: 10
  },
  {
    category: 'repo-onboarding',
    patterns: [
      /\b(onboarding|incorporacion|explorar\s+repositorio|entender\s+arquitectura)\b/i,
      /\b(mapa\s+del\s+proyecto|estructura\s+del\s+repositorio|guia\s+para\s+nuevos)\b/i
    ],
    weight: 10
  },
  {
    category: 'refactoring',
    patterns: [
      /\b(refactor(izar|izacion|ing)?|deuda\s+tecnica|clean\s+code|code\s+smells?)\b/i,
      /\b(modularizar|desacoplar|simplificar\s+codigo)\b/i
    ],
    weight: 10
  }
];

const TECH_TAGS: Array<[RegExp, string]> = [
  [/\bnext\.?js\b/i, 'nextjs'],
  [/\breact\b/i, 'react'],
  [/\btypescript\b|\bts\b/i, 'typescript'],
  [/\bnode\.?js\b/i, 'nodejs'],
  [/\bpython\b/i, 'python'],
  [/\bdocker\b/i, 'docker'],
  [/\bgraphql\b/i, 'graphql'],
  [/\bsql\b|\bpostgres\b/i, 'sql'],
  [/\btailwind\b/i, 'tailwind'],
  [/\bastro\b/i, 'astro'],
  [/\bvue\b/i, 'vue']
];

export function analyzeDescription(description: string): AnalyzedPrompt {
  const normalized = stripAccents(description);
  const scores = new Map<SkillCategory, number>();

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        score += rule.weight;
      }
    }
    if (score > 0) {
      scores.set(rule.category, score);
    }
  }

  const sortedCategories = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  const primaryCategory: SkillCategory = sortedCategories[0] ?? 'code-review';
  const secondaryCategories = sortedCategories.slice(1);

  const tags = new Set<string>([primaryCategory]);
  for (const sec of secondaryCategories) {
    tags.add(sec);
  }
  for (const [regex, tag] of TECH_TAGS) {
    if (regex.test(normalized)) {
      tags.add(tag);
    }
  }

  const detectedKeywords = Array.from(tags);
  const suggestedName = generateSkillNameFromDescription(description);

  return {
    suggestedName,
    primaryCategory,
    secondaryCategories,
    tags: Array.from(tags).slice(0, 8),
    detectedKeywords
  };
}
