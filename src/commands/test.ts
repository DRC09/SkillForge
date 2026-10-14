import path from 'node:path';
import pc from 'picocolors';
import { runSkillStaticTests } from '../validators/skill-tester.js';
import { logger } from '../utils/logger.js';

export function executeTestCommand(skillPath: string): number {
  const report = runSkillStaticTests(skillPath, true);
  const reportFilePath = path.join(report.skillPath, 'skillforge-report.json');

  logger.info(`Evaluación estática del skill: ${pc.bold(report.skillName)}`);
  logger.step(`Casos evaluados: ${report.passedCases}/${report.totalCases}`);

  for (const caseResult of report.caseResults) {
    const badge = caseResult.passed ? pc.green('PASS') : pc.red('FAIL');
    logger.raw(`  [${badge}] ${caseResult.name} (${caseResult.score}/100)`);
    if (caseResult.missingCriteria.length > 0) {
      logger.warn(
        `    Criterios no encontrados en SKILL.md: ${caseResult.missingCriteria.join(', ')}`
      );
    }
  }

  if (report.validationIssues.length > 0) {
    logger.error('Problemas de validación detectados:');
    for (const issue of report.validationIssues) {
      logger.error(`  [${issue.code}] ${issue.message}`);
    }
  }

  logger.info(
    `Puntaje de cobertura: ${pc.bold(`${report.coverageScore}/100`)} (mínimo requerido: 70)`
  );
  logger.info(`Reporte guardado en: ${pc.underline(reportFilePath)}`);

  if (report.passed) {
    logger.success('El skill superó todas las pruebas estáticas.');
    return 0;
  }

  logger.error('El skill no alcanzó el puntaje mínimo o tiene errores de validación.');
  return 1;
}
