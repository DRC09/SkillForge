import pc from 'picocolors';
import { validateSkill } from '../validators/skill-validator.js';
import { logger } from '../utils/logger.js';

export function executeValidateCommand(skillPath: string): number {
  const result = validateSkill(skillPath);

  if (result.valid) {
    logger.success(
      `El skill en ${pc.underline(result.skillPath)} es válido (${pc.bold(result.frontmatter?.name ?? '')}).`
    );
    return 0;
  }

  logger.error(`Validación fallida para ${pc.underline(result.skillPath)}:`);
  for (const issue of result.issues) {
    logger.error(`  [${issue.code}] ${issue.message}`);
  }
  return 1;
}
