import path from 'node:path';
import pc from 'picocolors';
import { generateSkill } from '../generators/skill-generator.js';
import { ensureDir, writeFileSafe } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

export interface InitRepoResult {
  repoDir: string;
  createdFiles: string[];
}

export function initSkillsRepository(targetParentDir?: string): InitRepoResult {
  const baseDir = targetParentDir ? path.resolve(targetParentDir) : process.cwd();
  const repoDir = path.join(baseDir, 'skillforge-skills');
  const skillsDir = path.join(repoDir, 'skills');
  const workflowsDir = path.join(repoDir, '.github', 'workflows');

  ensureDir(skillsDir);
  ensureDir(workflowsDir);

  generateSkill({
    name: 'example-skill',
    description:
      'Revisa Pull Requests y código fuente buscando problemas de rendimiento, accesibilidad y seguridad con parches accionables.',
    targetAgent: 'generic',
    language: 'es',
    detailLevel: 'estandar',
    outputDir: skillsDir
  });

  const repoReadme = `# skillforge-skills

Repositorio oficial de **Agent Skills** gestionado y validado con **SkillForge**.

## Instalar un skill de este repositorio

\`\`\`bash
npx skills add <owner>/skillforge-skills --skill example-skill
\`\`\`

## Validar todos los skills localmente

\`\`\`bash
npx skillforge validate ./skills/example-skill
npx skillforge test ./skills/example-skill
\`\`\`
`;

  const workflowYaml = `name: Validate Agent Skills

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Validate every skill in skills/
        run: |
          for skill_dir in ./skills/*/; do
            if [ -d "$skill_dir" ]; then
              echo "Validando $skill_dir..."
              npx skillforge validate "$skill_dir"
              npx skillforge test "$skill_dir"
            fi
          done
`;

  const repoPackageJson = {
    name: 'skillforge-skills',
    version: '0.1.0',
    private: true,
    description: 'Catálogo de Agent Skills validados con SkillForge',
    scripts: {
      'validate:example': 'skillforge validate ./skills/example-skill',
      'test:example': 'skillforge test ./skills/example-skill'
    },
    license: 'MIT'
  };

  writeFileSafe(path.join(repoDir, 'README.md'), repoReadme);
  writeFileSafe(path.join(workflowsDir, 'validate-skills.yml'), workflowYaml);
  writeFileSafe(
    path.join(repoDir, 'package.json'),
    `${JSON.stringify(repoPackageJson, null, 2)}\n`
  );

  return {
    repoDir,
    createdFiles: [
      'README.md',
      'package.json',
      '.github/workflows/validate-skills.yml',
      'skills/example-skill/SKILL.md',
      'skills/example-skill/README.md',
      'skills/example-skill/skillforge.config.json',
      'skills/example-skill/references/checklist.md',
      'skills/example-skill/tests/cases.json'
    ]
  };
}

export function executeInitCommand(targetParentDir?: string): number {
  const result = initSkillsRepository(targetParentDir);
  logger.success(
    `Repositorio base ${pc.bold('skillforge-skills')} inicializado en ${pc.underline(result.repoDir)}`
  );
  logger.step('Estructura generada:');
  for (const file of result.createdFiles) {
    logger.raw(`  - ${file}`);
  }
  return 0;
}
