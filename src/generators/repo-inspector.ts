import fs from 'node:fs';
import path from 'node:path';
import { PackageManagerName, RepoContext, SkillLanguage } from '../types/index.js';
import { fileExists, readFileSafe } from '../utils/fs.js';

interface FrameworkRule {
  label: string;
  dependencyKeys: string[];
}

const FRAMEWORK_RULES: FrameworkRule[] = [
  { label: 'nextjs', dependencyKeys: ['next'] },
  { label: 'react', dependencyKeys: ['react'] },
  { label: 'vue', dependencyKeys: ['vue'] },
  { label: 'astro', dependencyKeys: ['astro'] },
  { label: 'nodejs-backend', dependencyKeys: ['express', 'fastify', '@nestjs/core'] },
  { label: 'zod', dependencyKeys: ['zod'] },
  { label: 'vitest', dependencyKeys: ['vitest'] },
  { label: 'jest', dependencyKeys: ['jest'] },
  { label: 'playwright', dependencyKeys: ['@playwright/test', 'playwright'] },
  { label: 'tailwind', dependencyKeys: ['tailwindcss'] },
  { label: 'prisma', dependencyKeys: ['prisma', '@prisma/client'] },
  { label: 'typescript', dependencyKeys: ['typescript'] }
];

const KNOWN_CONFIG_FILES = [
  'tsconfig.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'vite.config.ts',
  'vitest.config.ts',
  'playwright.config.ts',
  'eslint.config.js',
  'prisma/schema.prisma',
  'Dockerfile'
];

const PRIORITY_SCRIPTS = ['build', 'test', 'lint', 'typecheck'];

function detectPackageManager(resolvedPath: string): PackageManagerName {
  if (fileExists(path.join(resolvedPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fileExists(path.join(resolvedPath, 'yarn.lock'))) return 'yarn';
  if (
    fileExists(path.join(resolvedPath, 'bun.lockb')) ||
    fileExists(path.join(resolvedPath, 'bun.lock'))
  ) {
    return 'bun';
  }
  return 'npm';
}

function toStringRecord(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return result;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }
  return result;
}

export function inspectRepository(repoPath: string): RepoContext {
  const resolvedPath = path.resolve(repoPath);

  if (!fileExists(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    throw new Error(`El directorio de repositorio especificado no existe: ${resolvedPath}`);
  }

  const packageManager = detectPackageManager(resolvedPath);

  let projectName = path.basename(resolvedPath);
  let dependencies: Record<string, string> = {};
  let scripts: Record<string, string> = {};

  const packageJsonPath = path.join(resolvedPath, 'package.json');
  if (fileExists(packageJsonPath)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSafe(packageJsonPath));
    } catch {
      throw new Error(`El archivo package.json no contiene JSON válido: ${packageJsonPath}`);
    }

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const pkg = parsed as Record<string, unknown>;
      if (typeof pkg['name'] === 'string' && pkg['name'].trim().length > 0) {
        projectName = pkg['name'];
      }
      dependencies = {
        ...toStringRecord(pkg['devDependencies']),
        ...toStringRecord(pkg['dependencies'])
      };
      scripts = toStringRecord(pkg['scripts']);
    }
  }

  const detectedFrameworks = FRAMEWORK_RULES.filter((rule) =>
    rule.dependencyKeys.some((key) => key in dependencies)
  ).map((rule) => rule.label);

  const configFiles = KNOWN_CONFIG_FILES.filter((file) =>
    fileExists(path.join(resolvedPath, file))
  );

  const hasTypeScript =
    Boolean(dependencies['typescript']) || configFiles.includes('tsconfig.json');

  return {
    projectName,
    packageManager,
    dependencies,
    scripts,
    detectedFrameworks,
    configFiles,
    hasTypeScript
  };
}

function resolveFrameworkVersion(label: string, dependencies: Record<string, string>): string {
  const rule = FRAMEWORK_RULES.find((candidate) => candidate.label === label);
  const key = rule?.dependencyKeys.find((candidate) => candidate in dependencies);
  const version = key ? dependencies[key] : undefined;
  return key && version ? `${key}@${version}` : '';
}

// A bare "scripts/x.sh" in backticks would be mistaken by the skill validator for a skill file
// reference; the "./" prefix is equivalent in a shell and avoids that false positive.
function sanitizeScriptCommand(command: string): string {
  const prefixed = /^(references|tests|scripts|assets)\//.test(command) ? `./${command}` : command;
  return sanitizeInlineCode(prefixed);
}

function sanitizeInlineCode(value: string): string {
  return value.replace(/`/g, "'").replace(/\r?\n/g, ' ');
}

export function formatRepoContextMarkdown(ctx: RepoContext, language: SkillLanguage): string {
  const isEs = language === 'es';

  const frameworkLines = ctx.detectedFrameworks.map((label) => {
    const resolved = resolveFrameworkVersion(label, ctx.dependencies);
    return resolved ? `- \`${label}\` (\`${sanitizeInlineCode(resolved)}\`)` : `- \`${label}\``;
  });

  const scriptNames = Object.keys(ctx.scripts);
  const orderedScriptNames = [
    ...PRIORITY_SCRIPTS.filter((name) => name in ctx.scripts),
    ...scriptNames.filter((name) => !PRIORITY_SCRIPTS.includes(name)).sort()
  ];
  const scriptLines = orderedScriptNames.map(
    (name) =>
      `- \`${ctx.packageManager} run ${sanitizeInlineCode(name)}\`: \`${sanitizeScriptCommand(ctx.scripts[name] ?? '')}\``
  );

  const configLines = ctx.configFiles.map((file) => `- \`${file}\``);

  const yes = isEs ? 'Sí' : 'Yes';
  const no = isEs ? 'No' : 'No';
  const none = isEs ? '- Ninguno detectado.' : '- None detected.';

  const lines = [
    isEs ? '## Contexto Técnico del Repositorio' : '## Repository Technical Context',
    '',
    `- **${isEs ? 'Proyecto' : 'Project'}:** \`${sanitizeInlineCode(ctx.projectName)}\``,
    `- **${isEs ? 'Gestor de paquetes' : 'Package manager'}:** \`${ctx.packageManager}\``,
    `- **${isEs ? 'Soporte de TypeScript' : 'TypeScript support'}:** ${ctx.hasTypeScript ? yes : no}`,
    '',
    `### ${isEs ? 'Frameworks y herramientas detectadas' : 'Detected frameworks and tools'}`,
    '',
    ...(frameworkLines.length > 0 ? frameworkLines : [none]),
    '',
    `### ${isEs ? 'Archivos de configuración presentes' : 'Configuration files present'}`,
    '',
    ...(configLines.length > 0 ? configLines : [none]),
    '',
    `### ${isEs ? 'Scripts disponibles en package.json' : 'Scripts available in package.json'}`,
    '',
    ...(scriptLines.length > 0 ? scriptLines : [none]),
    ''
  ];

  return lines.join('\n');
}
