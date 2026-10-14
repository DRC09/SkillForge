import path from 'node:path';
import { SkillTestCaseResult, SkillTestReport } from '../types/index.js';
import { fileExists, readFileSafe, writeFileSafe } from '../utils/fs.js';
import { stripAccents } from '../utils/string.js';
import { SkillTestSuiteSchema } from './schema.js';
import { validateSkill } from './skill-validator.js';

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

    for (const criterion of testCase.criteria) {
      const normalizedCriterion = stripAccents(criterion).toLowerCase();
      if (normalizedCorpus.includes(normalizedCriterion)) {
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
      passed: score >= 70
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
