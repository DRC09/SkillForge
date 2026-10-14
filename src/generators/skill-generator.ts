import path from 'node:path';
import {
  CreateSkillOptions,
  DetailLevel,
  SkillForgeConfig,
  SkillLanguage,
  TargetAgent
} from '../types/index.js';
import { analyzeDescription } from './analyzer.js';
import {
  buildTestCases,
  renderChecklistMarkdown,
  renderSkillMarkdown
} from '../templates/index.js';
import { ensureDir, writeFileSafe } from '../utils/fs.js';
import { toKebabCase } from '../utils/string.js';

export interface GeneratedSkillArtifact {
  skillName: string;
  skillDir: string;
  config: SkillForgeConfig;
  filesCreated: string[];
}

export function generateSkill(options: CreateSkillOptions): GeneratedSkillArtifact {
  const analysis = analyzeDescription(options.description);
  const skillName = options.name ? toKebabCase(options.name) : analysis.suggestedName;
  const targetAgent: TargetAgent = options.targetAgent ?? 'generic';
  const language: SkillLanguage = options.language ?? 'es';
  const detailLevel: DetailLevel = options.detailLevel ?? 'estandar';
  const baseDir = options.outputDir ? path.resolve(options.outputDir) : process.cwd();
  const skillDir = path.join(baseDir, skillName);

  ensureDir(skillDir);
  ensureDir(path.join(skillDir, 'references'));
  ensureDir(path.join(skillDir, 'tests'));

  const config: SkillForgeConfig = {
    schemaVersion: 1,
    name: skillName,
    category: analysis.primaryCategory,
    targetAgent,
    language,
    version: '0.1.0',
    author: options.author ?? '',
    license: 'MIT',
    tags: analysis.tags,
    entrypoint: 'SKILL.md'
  };

  const skillMdContent = renderSkillMarkdown({
    name: skillName,
    description: options.description,
    primaryCategory: analysis.primaryCategory,
    secondaryCategories: analysis.secondaryCategories,
    targetAgent,
    language,
    detailLevel,
    tags: analysis.tags
  });

  const checklistContent = renderChecklistMarkdown(
    skillName,
    analysis.primaryCategory,
    analysis.secondaryCategories,
    language
  );

  const testCases = buildTestCases(analysis.primaryCategory, language);

  const readmeContent = `# ${skillName}

${options.description}

## Instalación con Agent Skills CLI

\`\`\`bash
npx skills add <owner>/<repo> --skill ${skillName}
\`\`\`

## Estructura del Skill

- \`SKILL.md\`: Instrucciones principales del agente y frontmatter YAML.
- \`skillforge.config.json\`: Metadatos y configuración de SkillForge.
- \`references/checklist.md\`: Lista de control técnica de apoyo.
- \`tests/cases.json\`: Casos de prueba para evaluación estática.

## Validación y Pruebas Locales

\`\`\`bash
npx skillforge validate ./${skillName}
npx skillforge test ./${skillName}
npx skillforge pack ./${skillName}
\`\`\`
`;

  const filesToWrite: Array<[string, string]> = [
    ['SKILL.md', skillMdContent],
    ['README.md', readmeContent],
    ['skillforge.config.json', `${JSON.stringify(config, null, 2)}\n`],
    ['references/checklist.md', checklistContent],
    ['tests/cases.json', `${JSON.stringify(testCases, null, 2)}\n`]
  ];

  const filesCreated: string[] = [];
  for (const [relPath, content] of filesToWrite) {
    const fullPath = path.join(skillDir, relPath);
    writeFileSafe(fullPath, content);
    filesCreated.push(relPath);
  }

  return {
    skillName,
    skillDir,
    config,
    filesCreated
  };
}
