import * as clack from '@clack/prompts';
import ora from 'ora';
import pc from 'picocolors';
import { DetailLevel, SkillLanguage, TargetAgent } from '../types/index.js';
import { analyzeDescription } from '../generators/analyzer.js';
import { generateSkill } from '../generators/skill-generator.js';
import { validateSkill } from '../validators/skill-validator.js';
import { logger } from '../utils/logger.js';

export interface CreateCommandCliOptions {
  name?: string;
  agent?: TargetAgent;
  lang?: SkillLanguage;
  level?: DetailLevel;
  out?: string;
  yes?: boolean;
}

export async function executeCreateCommand(
  description: string,
  options: CreateCommandCliOptions
): Promise<number> {
  if (!description || description.trim().length < 5) {
    logger.error('Debes proporcionar una descripción clara del skill (mínimo 5 caracteres).');
    return 1;
  }

  const analysis = analyzeDescription(description);
  let skillName = options.name ?? analysis.suggestedName;
  let targetAgent: TargetAgent = options.agent ?? 'generic';
  let language: SkillLanguage = options.lang ?? 'es';
  let detailLevel: DetailLevel = options.level ?? 'estandar';

  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY && !options.yes);

  if (isInteractive) {
    clack.intro(pc.bgCyan(pc.black(' SkillForge - Generador de Agent Skills ')));

    const nameAnswer = await clack.text({
      message: 'Nombre corto del skill (kebab-case):',
      placeholder: analysis.suggestedName,
      defaultValue: skillName
    });
    if (clack.isCancel(nameAnswer)) {
      clack.cancel('Operación cancelada por el usuario.');
      return 1;
    }
    if (nameAnswer && nameAnswer.trim().length > 0) {
      skillName = nameAnswer.trim();
    }

    const agentAnswer = await clack.select({
      message: 'Selecciona el agente objetivo:',
      options: [
        { value: 'generic', label: 'Generic (Compatible con todo el ecosistema Agent Skills)' },
        { value: 'claude-code', label: 'Claude Code' },
        { value: 'cursor', label: 'Cursor' },
        { value: 'codex', label: 'Codex' }
      ],
      initialValue: targetAgent
    });
    if (clack.isCancel(agentAnswer)) {
      clack.cancel('Operación cancelada por el usuario.');
      return 1;
    }
    targetAgent = agentAnswer as TargetAgent;

    const langAnswer = await clack.select({
      message: 'Idioma del skill:',
      options: [
        { value: 'es', label: 'Español (es)' },
        { value: 'en', label: 'Inglés (en)' }
      ],
      initialValue: language
    });
    if (clack.isCancel(langAnswer)) {
      clack.cancel('Operación cancelada por el usuario.');
      return 1;
    }
    language = langAnswer as SkillLanguage;

    const levelAnswer = await clack.select({
      message: 'Nivel de detalle de las instrucciones:',
      options: [
        { value: 'basico', label: 'Básico (Directo y conciso)' },
        { value: 'estandar', label: 'Estándar (Recomendado)' },
        { value: 'avanzado', label: 'Avanzado (Exhaustivo)' }
      ],
      initialValue: detailLevel
    });
    if (clack.isCancel(levelAnswer)) {
      clack.cancel('Operación cancelada por el usuario.');
      return 1;
    }
    detailLevel = levelAnswer as DetailLevel;
  }

  const spinner = ora({
    text: 'Analizando descripción y generando archivos del skill...',
    isEnabled: isInteractive
  }).start();

  const generated = generateSkill({
    description,
    name: skillName,
    targetAgent,
    language,
    detailLevel,
    outputDir: options.out
  });

  const validation = validateSkill(generated.skillDir);

  if (!validation.valid) {
    spinner.fail('El skill se generó pero encontró errores de validación.');
    for (const issue of validation.issues) {
      logger.error(`[${issue.code}] ${issue.message}`);
    }
    return 1;
  }

  spinner.succeed(`Skill ${pc.bold(generated.skillName)} creado y validado correctamente.`);

  logger.info(`Categoría detectada: ${pc.cyan(generated.config.category)}`);
  logger.info(`Directorio generado: ${pc.underline(generated.skillDir)}`);
  logger.step('Archivos creados:');
  for (const file of generated.filesCreated) {
    logger.raw(`  - ${file}`);
  }

  logger.raw('');
  logger.info(pc.bold('Para instalar este skill desde tu repositorio en GitHub ejecuta:'));
  logger.raw(`  ${pc.green(`npx skills add <owner>/<repo> --skill ${generated.skillName}`)}`);

  return 0;
}
