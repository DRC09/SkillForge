import path from 'node:path';
import { SkillTestCaseResult, SkillTestReport } from '../types/index.js';
import { fileExists, readFileSafe, writeFileSafe } from '../utils/fs.js';
import { stripAccents } from '../utils/string.js';
import { SkillTestSuiteSchema } from './schema.js';
import { validateSkill } from './skill-validator.js';

export type CriterionMatchType = 'exact' | 'stem' | 'synonym' | 'none';

export interface CriterionMatch {
  matched: boolean;
  matchType: CriterionMatchType;
}

// Bilingual groups of equivalent technical terms. Entries are stored accent-free and lowercase.
export const SYNONYM_GROUPS: string[][] = [
  ['rendimiento', 'performance', 'optimizacion', 'latencia', 'velocidad'],
  ['accesibilidad', 'accessibility', 'a11y', 'wcag', 'aria'],
  ['seguridad', 'security', 'owasp', 'vulnerabilidad', 'vulnerabilidades'],
  ['parche', 'parches', 'patch', 'patches', 'diff', 'reemplazo'],
  ['archivo', 'archivos', 'file', 'files', 'ruta'],
  ['teclado', 'keyboard', 'tab', 'focus-visible'],
  ['regresion', 'regression', 'test', 'pruebas', 'tests'],
  ['causa raiz', 'root cause', 'origen del fallo'],
  ['hidratacion', 'hydration', 'client component', 'use client'],
  ['secretos', 'secrets', 'variables de entorno', 'next_public_']
];

const NORMALIZED_SYNONYM_GROUPS: string[][] = SYNONYM_GROUPS.map((group) =>
  group.map((term) => stripAccents(term).toLowerCase())
);

const STEM_MIN_WORD_LENGTH = 6;
const STEM_MIN_TOKEN_LENGTH = 3;
const STEM_SUFFIXES = ['ciones', 'cion', 'ing', 'ed', 'es', 's'];

function stemWord(word: string): string {
  if (word.length < STEM_MIN_WORD_LENGTH) {
    return word;
  }
  for (const suffix of STEM_SUFFIXES) {
    if (word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// True when the term appears in the corpus delimited by non-alphanumeric characters.
function containsWholeTerm(corpus: string, term: string): boolean {
  return new RegExp(`(?<![a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`).test(corpus);
}

function stemMatches(normalizedCriterion: string, normalizedCorpus: string): boolean {
  const tokens = normalizedCriterion
    .split(/[^a-z0-9_]+/)
    .filter((token) => token.length >= STEM_MIN_TOKEN_LENGTH);
  if (tokens.length === 0) {
    return false;
  }
  // Each stem must start a word in the corpus, so "optimiz" matches "optimizacion".
  return tokens.every((token) =>
    new RegExp(`(?<![a-z0-9])${escapeRegExp(stemWord(token))}`).test(normalizedCorpus)
  );
}

function synonymMatches(normalizedCriterion: string, normalizedCorpus: string): boolean {
  const trimmedCriterion = normalizedCriterion.replace(/^[^a-z0-9_]+|[^a-z0-9_]+$/g, '');
  return NORMALIZED_SYNONYM_GROUPS.some(
    (group) =>
      (group.includes(normalizedCriterion) || group.includes(trimmedCriterion)) &&
      group.some(
        (term) =>
          term !== normalizedCriterion &&
          term !== trimmedCriterion &&
          containsWholeTerm(normalizedCorpus, term)
      )
  );
}

export function evaluateCriterionMatch(
  criterion: string,
  normalizedCorpus: string
): CriterionMatch {
  const normalizedCriterion = stripAccents(criterion).toLowerCase().trim();

  if (normalizedCriterion.length > 0 && normalizedCorpus.includes(normalizedCriterion)) {
    return { matched: true, matchType: 'exact' };
  }
  if (stemMatches(normalizedCriterion, normalizedCorpus)) {
    return { matched: true, matchType: 'stem' };
  }
  if (synonymMatches(normalizedCriterion, normalizedCorpus)) {
    return { matched: true, matchType: 'synonym' };
  }
  return { matched: false, matchType: 'none' };
}

export function runSkillStaticTests(skillPath: string, writeReportFile = true): SkillTestReport {
  const resolvedDir = path.resolve(skillPath);
  const validation = validateSkill(resolvedDir);
  const skillName = validation.frontmatter?.name ?? path.basename(resolvedDir);

  const casesPath = path.join(resolvedDir, 'tests', 'cases.json');
  if (!fileExists(casesPath)) {
    const failedReport: SkillTestReport = {
      skillName,
      skillPath: resolvedDir,
      timestamp: new Date().toISOString(),
      valid: false,
      totalCases: 0,
      passedCases: 0,
      coverageScore: 0,
      passed: false,
      caseResults: [],
      validationIssues: [
        ...validation.issues,
        {
          code: 'MISSING_CASES_JSON',
          message: 'No se encontró el archivo tests/cases.json.',
          severity: 'error'
        }
      ]
    };

    if (writeReportFile) {
      writeFileSafe(
        path.join(resolvedDir, 'skillforge-report.json'),
        `${JSON.stringify(failedReport, null, 2)}\n`
      );
    }
    return failedReport;
  }

  let parsedCasesJson: unknown;
  try {
    parsedCasesJson = JSON.parse(readFileSafe(casesPath));
  } catch {
    const invalidJsonReport: SkillTestReport = {
      skillName,
      skillPath: resolvedDir,
      timestamp: new Date().toISOString(),
      valid: false,
      totalCases: 0,
      passedCases: 0,
      coverageScore: 0,
      passed: false,
      caseResults: [],
      validationIssues: [
        ...validation.issues,
        {
          code: 'INVALID_CASES_JSON',
          message: 'El archivo tests/cases.json no es un JSON válido.',
          severity: 'error'
        }
      ]
    };
    if (writeReportFile) {
      writeFileSafe(
        path.join(resolvedDir, 'skillforge-report.json'),
        `${JSON.stringify(invalidJsonReport, null, 2)}\n`
      );
    }
    return invalidJsonReport;
  }

  const suiteParse = SkillTestSuiteSchema.safeParse(parsedCasesJson);
  if (!suiteParse.success) {
    const schemaIssues = suiteParse.error.issues.map((issue) => ({
      code: 'INVALID_TEST_CASE_SCHEMA',
      message: `tests/cases.json (${issue.path.join('.')}): ${issue.message}`,
      severity: 'error' as const
    }));

    const schemaFailReport: SkillTestReport = {
      skillName,
      skillPath: resolvedDir,
      timestamp: new Date().toISOString(),
      valid: false,
      totalCases: 0,
      passedCases: 0,
      coverageScore: 0,
      passed: false,
      caseResults: [],
      validationIssues: [...validation.issues, ...schemaIssues]
    };

    if (writeReportFile) {
      writeFileSafe(
        path.join(resolvedDir, 'skillforge-report.json'),
        `${JSON.stringify(schemaFailReport, null, 2)}\n`
      );
    }
    return schemaFailReport;
  }

  const skillMdPath = path.join(resolvedDir, 'SKILL.md');
  const checklistPath = path.join(resolvedDir, 'references', 'checklist.md');
  const combinedCorpusRaw = [
    fileExists(skillMdPath) ? readFileSafe(skillMdPath) : '',
    fileExists(checklistPath) ? readFileSafe(checklistPath) : ''
  ].join('\n');

  const normalizedCorpus = stripAccents(combinedCorpusRaw).toLowerCase();

  const cases = suiteParse.data;
  const caseResults: SkillTestCaseResult[] = cases.map((testCase, idx) => {
    const matchedCriteria: string[] = [];
    const missingCriteria: string[] = [];
    const matchDetails: NonNullable<SkillTestCaseResult['matchDetails']> = [];

    for (const criterion of testCase.criteria) {
      const { matched, matchType } = evaluateCriterionMatch(criterion, normalizedCorpus);
      matchDetails.push({ criterion, matched, matchType });
      if (matched) {
        matchedCriteria.push(criterion);
      } else {
        missingCriteria.push(criterion);
      }
    }

    const score = Math.round((matchedCriteria.length / testCase.criteria.length) * 100);
    return {
      index: idx + 1,
      name: testCase.name ?? testCase.id ?? `Caso #${idx + 1}`,
      input: testCase.input,
      matchedCriteria,
      missingCriteria,
      score,
      passed: score >= 70,
      matchDetails
    };
  });

  const totalScoreSum = caseResults.reduce((acc, item) => acc + item.score, 0);
  const coverageScore = caseResults.length > 0 ? Math.round(totalScoreSum / caseResults.length) : 0;
  const passedCases = caseResults.filter((c) => c.passed).length;
  const overallPassed = validation.valid && coverageScore >= 70;

  const report: SkillTestReport = {
    skillName,
    skillPath: resolvedDir,
    timestamp: new Date().toISOString(),
    valid: validation.valid,
    totalCases: caseResults.length,
    passedCases,
    coverageScore,
    passed: overallPassed,
    caseResults,
    validationIssues: validation.issues
  };

  if (writeReportFile) {
    writeFileSafe(
      path.join(resolvedDir, 'skillforge-report.json'),
      `${JSON.stringify(report, null, 2)}\n`
    );
  }

  return report;
}
