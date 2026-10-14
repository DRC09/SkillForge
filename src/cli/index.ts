#!/usr/bin/env node
import { Command } from 'commander';
import { executeCreateCommand } from '../commands/create.js';
import { executeValidateCommand } from '../commands/validate.js';
import { executeTestCommand } from '../commands/test.js';
import { executePackCommand } from '../commands/pack.js';
import { executeInitCommand } from '../commands/init.js';
import { DetailLevel, SkillLanguage, TargetAgent } from '../types/index.js';
import { logger } from '../utils/logger.js';

export function buildCli(): Command {
  const program = new Command();

  program
    .name('skillforge')
    .description(
      'Convierte una descripción en lenguaje natural en un Agent Skill validado, versionado e instalable.'
    )
    .version('0.1.0');

  program
    .command('create')
    .description('Crea un nuevo Agent Skill a partir de una descripción en lenguaje natural')
    .argument('<description>', 'Descripción en lenguaje natural de la habilidad')
    .option('-n, --name <name>', 'Nombre corto del skill en kebab-case')
    .option(
      '-a, --agent <agent>',
      'Agente objetivo: claude-code, cursor, codex, generic',
      'generic'
    )
    .option('-l, --lang <lang>', 'Idioma del skill: es o en', 'es')
    .option('-d, --level <level>', 'Nivel de detalle: basico, estandar o avanzado', 'estandar')
    .option('-o, --out <dir>', 'Directorio de salida donde se creará la carpeta del skill')
    .option('-y, --yes', 'Omitir preguntas interactivas y usar valores detectados')
    .action(
      async (
        description: string,
        opts: {
          name?: string;
          agent?: TargetAgent;
          lang?: SkillLanguage;
          level?: DetailLevel;
          out?: string;
          yes?: boolean;
        }
      ) => {
        const code = await executeCreateCommand(description, opts);
        process.exitCode = code;
      }
    );

  program
    .command('validate')
    .description('Valida la estructura, frontmatter YAML, referencias y configuración de un skill')
    .argument('<skillPath>', 'Ruta a la carpeta del skill')
    .action((skillPath: string) => {
      const code = executeValidateCommand(skillPath);
      process.exitCode = code;
    });

  program
    .command('test')
    .description('Ejecuta la evaluación estática de cobertura sobre tests/cases.json')
    .argument('<skillPath>', 'Ruta a la carpeta del skill')
    .action((skillPath: string) => {
      const code = executeTestCommand(skillPath);
      process.exitCode = code;
    });

  program
    .command('pack')
    .description('Empaqueta un skill validado en un archivo dist/<skill-name>.skillforge.zip')
    .argument('<skillPath>', 'Ruta a la carpeta del skill')
    .option('-o, --out <dir>', 'Directorio base para la carpeta dist/')
    .action((skillPath: string, opts: { out?: string }) => {
      const code = executePackCommand(skillPath, opts.out);
      process.exitCode = code;
    });

  program
    .command('init')
    .description('Crea un repositorio base skillforge-skills con ejemplo y GitHub Actions CI')
    .argument('[dir]', 'Directorio padre opcional donde crear skillforge-skills')
    .action((dir?: string) => {
      const code = executeInitCommand(dir);
      process.exitCode = code;
    });

  return program;
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('/cli/index.ts') ||
    process.argv[1].endsWith('/cli/index.js') ||
    process.argv[1].endsWith('\\cli\\index.ts') ||
    process.argv[1].endsWith('\\cli\\index.js') ||
    process.argv[1].endsWith('skillforge'));

if (isDirectExecution) {
  const cli = buildCli();
  cli.parseAsync(process.argv).catch((error: unknown) => {
    logger.error(error instanceof Error ? error.message : 'Error inesperado en la ejecución.');
    process.exitCode = 1;
  });
}
