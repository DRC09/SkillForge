import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeDescription } from '../src/generators/analyzer.js';
import { executeCreateCommand } from '../src/commands/create.js';
import { executeDoctorCommand, runDoctorChecks } from '../src/commands/doctor.js';
import {
  executeListCommand,
  listAvailableTemplates,
  listSkillsInDirectory
} from '../src/commands/list.js';
import { enrichSkillMarkdownIfRequested } from '../src/generators/llm-enricher.js';
import { generateSkill } from '../src/generators/skill-generator.js';
import { formatRepoContextMarkdown, inspectRepository } from '../src/generators/repo-inspector.js';
import { initSkillsRepository } from '../src/commands/init.js';
import { packSkill, shouldIncludeInPack } from '../src/commands/pack.js';
import {
  SYNONYM_GROUPS,
  evaluateCriterionMatch,
  runSkillStaticTests
} from '../src/validators/skill-tester.js';
import { validateSkill } from '../src/validators/skill-validator.js';
import { SkillForgeConfigSchema } from '../src/validators/schema.js';
import {
  extractFrontmatter,
  generateSkillNameFromDescription,
  stripAccents,
  toKebabCase
} from '../src/utils/string.js';
import { listZipEntries } from '../src/utils/zip.js';
import { startWatchMode, watchSkillDirectory } from '../src/utils/watcher.js';
import { logger } from '../src/utils/logger.js';

describe('SkillForge MVP Suite', () => {
  let tempDir: string;

  beforeEach(() => {
    logger.setSilent(true);
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skillforge-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('1. Kebab-case Name Generation', () => {
    it('1. converts accented Spanish strings and special symbols into clean kebab-case', () => {
      expect(toKebabCase('Revisión Rápida de Código & Seguridad!')).toBe(
        'revision-rapida-de-codigo-seguridad'
      );
    });

    it('2. generates nextjs-pr-reviewer for the canonical Next.js PR prompt', () => {
      const prompt =
        'Crear un skill que revise Pull Requests de Next.js buscando problemas de rendimiento, accesibilidad y seguridad, y proponga parches concretos';
      expect(generateSkillNameFromDescription(prompt)).toBe('nextjs-pr-reviewer');
    });

    it('3. strips reserved words anthropic and claude when generating skill names', () => {
      const name = generateSkillNameFromDescription(
        'Crear skill para Claude y Anthropic que audite seguridad SQL'
      );
      expect(name).not.toContain('claude');
      expect(name).not.toContain('anthropic');
      expect(name.length).toBeLessThanOrEqual(64);
    });

    it('4. truncates generated kebab-case names to a maximum of 64 characters', () => {
      const veryLong =
        'supercali-fragilistic-expialidocious-architecture-performance-security-accessibility-auditor-plus-extra';
      const result = toKebabCase(veryLong);
      expect(result.length).toBeLessThanOrEqual(64);
      expect(result.endsWith('-')).toBe(false);
    });
  });

  describe('2. Heuristic Category Detection', () => {
    it('5. detects code-review category from Pull Request review descriptions', () => {
      const res = analyzeDescription('Revisa Pull Requests buscando bugs y mejoras');
      expect(res.primaryCategory).toBe('code-review');
    });

    it('6. detects debugging category from stack trace and bug descriptions', () => {
      const res = analyzeDescription(
        'Depurar errores críticos analizando el stack trace y causa raíz'
      );
      expect(res.primaryCategory).toBe('debugging');
    });

    it('7. detects documentation category from README and API docs descriptions', () => {
      const res = analyzeDescription('Generar documentación técnica OpenAPI, TSDoc y README');
      expect(res.primaryCategory).toBe('documentation');
    });

    it('8. detects framework-migration category from upgrade and migration prompts', () => {
      const res = analyzeDescription(
        'Migrar aplicación de Pages Router a App Router sin regresiones'
      );
      expect(res.primaryCategory).toBe('framework-migration');
    });

    it('8b. does not read "de React" or "de Express" as a migration unless a migration verb precedes it', () => {
      const performance = [
        'Optimizar rendimiento de React',
        'Mejorar el rendimiento de Express reduciendo la latencia'
      ];
      for (const description of performance) {
        expect(analyzeDescription(description).primaryCategory).toBe('performance');
      }

      const migrations = [
        'Migrar una aplicación de React a Vue',
        'Convertir el servidor de Express a Fastify',
        'Portar el proyecto desde Express a Hono'
      ];
      for (const description of migrations) {
        expect(analyzeDescription(description).primaryCategory).toBe('framework-migration');
      }
    });

    it('9. detects accessibility category from WCAG and ARIA prompts', () => {
      const res = analyzeDescription(
        'Auditar accesibilidad WCAG, roles ARIA y lectores de pantalla'
      );
      expect(res.primaryCategory).toBe('accessibility');
    });

    it('10. detects performance category from Core Web Vitals and latency prompts', () => {
      const res = analyzeDescription(
        'Optimizar rendimiento, Core Web Vitals, LCP y tamaño de bundle'
      );
      expect(res.primaryCategory).toBe('performance');
    });

    it('11. detects security category from OWASP and vulnerability prompts', () => {
      const res = analyzeDescription(
        'Auditar vulnerabilidades OWASP, inyecciones SQL, XSS y secretos'
      );
      expect(res.primaryCategory).toBe('security');
    });

    it('12. detects seo category from metadata, JSON-LD, and sitemap prompts', () => {
      const res = analyzeDescription(
        'Optimizar SEO técnico, metadatos OpenGraph, JSON-LD y sitemap.xml'
      );
      expect(res.primaryCategory).toBe('seo');
    });

    it('13. detects testing category from unit tests and Vitest prompts', () => {
      const res = analyzeDescription('Crear pruebas unitarias con Vitest, mocks y alta cobertura');
      expect(res.primaryCategory).toBe('testing');
    });

    it('14. detects repo-onboarding category from repository onboarding prompts', () => {
      const res = analyzeDescription(
        'Onboarding de repositorio y mapa para entender arquitectura del proyecto'
      );
      expect(res.primaryCategory).toBe('repo-onboarding');
    });

    it('15. detects refactoring category from technical debt and clean code prompts', () => {
      const res = analyzeDescription(
        'Refactorizar deuda técnica y code smells desacoplando módulos'
      );
      expect(res.primaryCategory).toBe('refactoring');
    });
  });

  describe('3. Skill Creation & File Structure', () => {
    it('16. creates the full directory tree and files for a new skill', () => {
      const artifact = generateSkill({
        description:
          'Auditar seguridad de endpoints Node.js buscando vulnerabilidades OWASP y proponiendo parches',
        outputDir: tempDir
      });

      expect(fs.existsSync(path.join(artifact.skillDir, 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(artifact.skillDir, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(artifact.skillDir, 'skillforge.config.json'))).toBe(true);
      expect(fs.existsSync(path.join(artifact.skillDir, 'references', 'checklist.md'))).toBe(true);
      expect(fs.existsSync(path.join(artifact.skillDir, 'tests', 'cases.json'))).toBe(true);
    });

    it('17. validates skillforge.config.json against Zod schema upon creation', () => {
      const artifact = generateSkill({
        description: 'Optimizar consultas lentas y rendimiento en React',
        name: 'react-perf-auditor',
        targetAgent: 'cursor',
        language: 'en',
        outputDir: tempDir
      });

      const parsed = SkillForgeConfigSchema.safeParse(artifact.config);
      expect(parsed.success).toBe(true);
      expect(artifact.config.targetAgent).toBe('cursor');
      expect(artifact.config.language).toBe('en');
    });
  });

  describe('4. Skill Validation Rules', () => {
    it('18. validates the bundled skills/nextjs-pr-reviewer example without errors', () => {
      const examplePath = path.resolve(process.cwd(), 'skills', 'nextjs-pr-reviewer');
      const result = validateSkill(examplePath);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('19. fails validation when SKILL.md is missing', () => {
      const emptySkillDir = path.join(tempDir, 'missing-skill');
      fs.mkdirSync(emptySkillDir, { recursive: true });
      const result = validateSkill(emptySkillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'MISSING_SKILL_MD')).toBe(true);
    });

    it('20. fails validation when YAML frontmatter delimiters are missing', () => {
      const skillDir = path.join(tempDir, 'no-frontmatter');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Skill sin frontmatter\n\nContenido');
      const result = validateSkill(skillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'INVALID_FRONTMATTER')).toBe(true);
    });

    it('21. rejects skill names containing uppercase letters, spaces, or >64 characters', () => {
      const skillDir = path.join(tempDir, 'Invalid_Name');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---\nname: Invalid_Name\ndescription: "Descripción válida"\n---\n\n## Propósito\n${'Texto de prueba accionable. '.repeat(10)}`
      );
      const result = validateSkill(skillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'INVALID_NAME_FORMAT')).toBe(true);
    });

    it('22. rejects skill names containing reserved words "claude" or "anthropic"', () => {
      const skillDir = path.join(tempDir, 'claude-helper');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---\nname: claude-helper\ndescription: "Descripción válida"\n---\n\n## Propósito\n${'Instrucciones detalladas. '.repeat(10)}`
      );
      const result = validateSkill(skillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'RESERVED_NAME_WORD')).toBe(true);
    });

    it('23. rejects when frontmatter name does not match the directory name', () => {
      const skillDir = path.join(tempDir, 'folder-one');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---\nname: folder-two\ndescription: "Descripción válida"\n---\n\n## Propósito\n${'Instrucciones detalladas. '.repeat(10)}`
      );
      const result = validateSkill(skillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'NAME_FOLDER_MISMATCH')).toBe(true);
    });

    it('24. rejects empty descriptions or descriptions exceeding 1,024 characters', () => {
      const skillDir = path.join(tempDir, 'long-desc-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      const longDesc = 'a'.repeat(1030);
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---\nname: long-desc-skill\ndescription: "${longDesc}"\n---\n\n## Propósito\n${'Instrucciones detalladas. '.repeat(10)}`
      );
      const result = validateSkill(skillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'INVALID_DESCRIPTION_LENGTH')).toBe(true);
    });

    it('25. detects non-existent referenced files in SKILL.md', () => {
      const artifact = generateSkill({
        description: 'Revisar accesibilidad en formularios web',
        name: 'a11y-form-checker',
        outputDir: tempDir
      });
      fs.rmSync(path.join(artifact.skillDir, 'references', 'checklist.md'));

      const result = validateSkill(artifact.skillDir);
      expect(result.valid).toBe(false);
      expect(result.issues.some((i) => i.code === 'MISSING_REFERENCED_FILE')).toBe(true);
    });
  });

  describe('5. Static Testing & Score Calculation', () => {
    it('26. passes static tests on skills/nextjs-pr-reviewer with score >= 70 and generates report', () => {
      const examplePath = path.resolve(process.cwd(), 'skills', 'nextjs-pr-reviewer');
      const report = runSkillStaticTests(examplePath, false);
      expect(report.passed).toBe(true);
      expect(report.coverageScore).toBeGreaterThanOrEqual(70);
      expect(report.totalCases).toBeGreaterThanOrEqual(5);
    });

    it('27. fails static test when coverage score is below 70 and writes skillforge-report.json', () => {
      const artifact = generateSkill({
        description: 'Revisar código TypeScript',
        name: 'low-score-skill',
        outputDir: tempDir
      });

      const impossibleCases = [
        {
          id: 'imp-1',
          name: 'Criterios inexistentes',
          input: 'Entrada de prueba',
          expectedBehavior: 'Comportamiento con palabras que no están en el documento',
          criteria: ['blockchain-cuantico-xyz', 'teletransporte-neuronal-999']
        }
      ];
      fs.writeFileSync(
        path.join(artifact.skillDir, 'tests', 'cases.json'),
        JSON.stringify(impossibleCases, null, 2)
      );

      const report = runSkillStaticTests(artifact.skillDir, true);
      expect(report.coverageScore).toBe(0);
      expect(report.passed).toBe(false);
      expect(fs.existsSync(path.join(artifact.skillDir, 'skillforge-report.json'))).toBe(true);
    });
  });

  describe('6. ZIP Packaging & File Filtering', () => {
    it('28. packages a valid skill into dist/<name>.skillforge.zip and excludes forbidden files', () => {
      const artifact = generateSkill({
        description: 'Optimizar SEO y metadatos estructurados',
        name: 'seo-meta-auditor',
        outputDir: tempDir
      });

      // Add forbidden files that must be excluded from the ZIP archive
      fs.mkdirSync(path.join(artifact.skillDir, 'node_modules', 'fake-pkg'), { recursive: true });
      fs.writeFileSync(
        path.join(artifact.skillDir, 'node_modules', 'fake-pkg', 'index.js'),
        'module.exports = {};'
      );
      fs.writeFileSync(path.join(artifact.skillDir, '.env'), 'SECRET_KEY=12345');
      fs.writeFileSync(path.join(artifact.skillDir, 'debug.log'), 'log line');

      const packRes = packSkill(artifact.skillDir, tempDir);
      expect(packRes.success).toBe(true);
      expect(packRes.zipPath).toBeDefined();
      expect(fs.existsSync(packRes.zipPath!)).toBe(true);

      const zipEntries = listZipEntries(packRes.zipPath!);
      expect(zipEntries).toContain('seo-meta-auditor/SKILL.md');
      expect(zipEntries).toContain('seo-meta-auditor/references/checklist.md');
      expect(zipEntries.some((e) => e.includes('node_modules'))).toBe(false);
      expect(zipEntries.some((e) => e.includes('.env'))).toBe(false);
      expect(zipEntries.some((e) => e.includes('debug.log'))).toBe(false);
    });

    it('29. unit-tests shouldIncludeInPack filter rules directly', () => {
      expect(shouldIncludeInPack('SKILL.md', false)).toBe(true);
      expect(shouldIncludeInPack('references/checklist.md', false)).toBe(true);
      expect(shouldIncludeInPack('node_modules/pkg/index.js', false)).toBe(false);
      expect(shouldIncludeInPack('.git/config', false)).toBe(false);
      expect(shouldIncludeInPack('.env.local', false)).toBe(false);
      expect(shouldIncludeInPack('skillforge-report.json', false)).toBe(false);
    });
  });

  describe('7. Repository Initialization (skillforge init)', () => {
    it('30. initializes skillforge-skills repository with example-skill and GitHub Actions workflow', () => {
      const result = initSkillsRepository(tempDir);
      expect(fs.existsSync(path.join(result.repoDir, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(result.repoDir, 'package.json'))).toBe(true);
      expect(
        fs.existsSync(path.join(result.repoDir, '.github', 'workflows', 'validate-skills.yml'))
      ).toBe(true);

      const exampleSkillDir = path.join(result.repoDir, 'skills', 'example-skill');
      const validation = validateSkill(exampleSkillDir);
      expect(validation.valid).toBe(true);

      const extracted = extractFrontmatter(
        fs.readFileSync(path.join(exampleSkillDir, 'SKILL.md'), 'utf-8')
      );
      expect(extracted.frontmatterRaw).toContain('name: example-skill');
    });
  });

  describe('8. Hardening & Edge Cases', () => {
    it('31. reports MISSING_REQUIRED_SECTIONS when mandatory headings are absent', () => {
      const skillDir = path.join(tempDir, 'partial-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---\nname: partial-skill\ndescription: "Descripción válida"\n---\n\n## Propósito\n${'Instrucciones detalladas. '.repeat(10)}`
      );
      const result = validateSkill(skillDir);
      expect(result.valid).toBe(false);
      const issue = result.issues.find((i) => i.code === 'MISSING_REQUIRED_SECTIONS');
      expect(issue).toBeDefined();
      expect(issue?.message).toContain('Ejemplos de uso');
      expect(issue?.message).not.toContain('Propósito');
    });

    it('32. accepts SKILL.md files prefixed with a UTF-8 BOM and CRLF line endings', () => {
      const artifact = generateSkill({
        description: 'Generar documentación técnica de la API',
        name: 'bom-docs-skill',
        outputDir: tempDir
      });
      const skillMdPath = path.join(artifact.skillDir, 'SKILL.md');
      const original = fs.readFileSync(skillMdPath, 'utf-8');
      fs.writeFileSync(skillMdPath, `\uFEFF${original.replace(/\n/g, '\r\n')}`);
      expect(validateSkill(artifact.skillDir).valid).toBe(true);
    });

    it('33. round-trips descriptions containing quotes and backslashes through the frontmatter', () => {
      const description = 'Auditar rutas "C:\\app" y seguridad de "endpoints" con OWASP';
      const artifact = generateSkill({
        description,
        name: 'quoted-desc-skill',
        outputDir: tempDir
      });
      const result = validateSkill(artifact.skillDir);
      expect(result.valid).toBe(true);
      expect(result.frontmatter?.description).toBe(description);
    });

    it('34. generates valid English skills that pass their own static tests for every category', () => {
      const prompts = [
        'Debug errors from the stack trace and find the root cause',
        'Write documentation and README for the API',
        'Improve accessibility with WCAG and ARIA',
        'Refactor technical debt and code smells'
      ];
      for (const [idx, description] of prompts.entries()) {
        const artifact = generateSkill({
          description,
          name: `english-skill-${idx}`,
          language: 'en',
          outputDir: tempDir
        });
        expect(validateSkill(artifact.skillDir).valid).toBe(true);
        expect(runSkillStaticTests(artifact.skillDir, false).passed).toBe(true);
      }
    });

    it('35. produces a ZIP archive whose entries inflate back to the original bytes', async () => {
      const zlib = await import('node:zlib');
      const examplePath = path.resolve(process.cwd(), 'skills', 'nextjs-pr-reviewer');
      const packRes = packSkill(examplePath, tempDir);
      expect(packRes.success).toBe(true);

      const buffer = fs.readFileSync(packRes.zipPath!);
      const nameLength = buffer.readUInt16LE(26);
      const compressedSize = buffer.readUInt32LE(18);
      const entryName = buffer.subarray(30, 30 + nameLength).toString('utf-8');
      const dataStart = 30 + nameLength + buffer.readUInt16LE(28);
      const inflated = zlib.inflateRawSync(buffer.subarray(dataStart, dataStart + compressedSize));

      const relPath = entryName.replace(/^nextjs-pr-reviewer\//, '');
      expect(inflated.equals(fs.readFileSync(path.join(examplePath, relPath)))).toBe(true);
      expect(buffer.readUInt32LE(buffer.length - 22)).toBe(0x06054b50);
    });

    it('36. pack refuses to package an invalid skill', () => {
      const skillDir = path.join(tempDir, 'broken-skill');
      fs.mkdirSync(skillDir, { recursive: true });
      const packRes = packSkill(skillDir, tempDir);
      expect(packRes.success).toBe(false);
      expect(fs.existsSync(path.join(tempDir, 'dist'))).toBe(false);
    });
  });

  describe('9. Config Schema repoContext (v0.2.0)', () => {
    const baseConfig = {
      schemaVersion: 1,
      name: 'legacy-skill',
      category: 'code-review',
      targetAgent: 'generic',
      language: 'es',
      version: '0.1.0',
      author: '',
      license: 'MIT',
      tags: ['code-review'],
      entrypoint: 'SKILL.md'
    };

    it('37. keeps v0.1.0 configs without repoContext fully valid', () => {
      expect(SkillForgeConfigSchema.safeParse(baseConfig).success).toBe(true);
      const examplePath = path.resolve(process.cwd(), 'skills', 'nextjs-pr-reviewer');
      const raw = JSON.parse(
        fs.readFileSync(path.join(examplePath, 'skillforge.config.json'), 'utf-8')
      ) as Record<string, unknown>;
      expect(raw).not.toHaveProperty('repoContext');
      expect(SkillForgeConfigSchema.safeParse(raw).success).toBe(true);
    });

    it('38. accepts a well-formed repoContext and rejects malformed ones', () => {
      const valid = {
        ...baseConfig,
        repoContext: { frameworks: ['nextjs'], packageManager: 'pnpm', hasTypeScript: true }
      };
      expect(SkillForgeConfigSchema.safeParse(valid).success).toBe(true);

      const badManager = {
        ...valid,
        repoContext: { ...valid.repoContext, packageManager: 'pip' }
      };
      expect(SkillForgeConfigSchema.safeParse(badManager).success).toBe(false);

      const missingField = {
        ...baseConfig,
        repoContext: { frameworks: [], packageManager: 'npm' }
      };
      expect(SkillForgeConfigSchema.safeParse(missingField).success).toBe(false);
    });
  });

  describe('10. Repository Inspector (v0.2.0)', () => {
    function writeRepoFile(relPath: string, content: string): void {
      const full = path.join(tempDir, relPath);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content);
    }

    it('39. throws a Spanish error when the repository directory does not exist', () => {
      const missing = path.join(tempDir, 'does-not-exist');
      expect(() => inspectRepository(missing)).toThrow(
        `El directorio de repositorio especificado no existe: ${path.resolve(missing)}`
      );
    });

    it('40. detects frameworks, merged dependencies, scripts and config files', () => {
      writeRepoFile(
        'package.json',
        JSON.stringify({
          name: 'demo-app',
          scripts: { build: 'next build', test: 'vitest run', dev: 'next dev' },
          dependencies: { next: '14.2.3', react: '18.3.1', zod: '3.24.1' },
          devDependencies: { vitest: '2.1.9', typescript: '5.7.2', '@playwright/test': '1.49.0' }
        })
      );
      writeRepoFile('pnpm-lock.yaml', '');
      writeRepoFile('tsconfig.json', '{}');
      writeRepoFile('next.config.mjs', 'export default {};');
      writeRepoFile('prisma/schema.prisma', '');

      const ctx = inspectRepository(tempDir);
      expect(ctx.projectName).toBe('demo-app');
      expect(ctx.packageManager).toBe('pnpm');
      expect(ctx.dependencies['vitest']).toBe('2.1.9');
      expect(ctx.scripts['build']).toBe('next build');
      expect(ctx.detectedFrameworks).toEqual([
        'nextjs',
        'react',
        'zod',
        'vitest',
        'playwright',
        'typescript'
      ]);
      expect(ctx.configFiles).toEqual(['tsconfig.json', 'next.config.mjs', 'prisma/schema.prisma']);
      expect(ctx.hasTypeScript).toBe(true);
    });

    it('41. applies package manager priority and falls back to npm and folder name', () => {
      expect(inspectRepository(tempDir).packageManager).toBe('npm');
      expect(inspectRepository(tempDir).projectName).toBe(path.basename(tempDir));
      expect(inspectRepository(tempDir).hasTypeScript).toBe(false);

      writeRepoFile('bun.lockb', '');
      expect(inspectRepository(tempDir).packageManager).toBe('bun');
      writeRepoFile('yarn.lock', '');
      expect(inspectRepository(tempDir).packageManager).toBe('yarn');
      writeRepoFile('pnpm-lock.yaml', '');
      expect(inspectRepository(tempDir).packageManager).toBe('pnpm');
    });

    it('42. reports a Spanish error for an invalid package.json and detects tsconfig-only TypeScript', () => {
      writeRepoFile('package.json', '{ not json');
      expect(() => inspectRepository(tempDir)).toThrow('package.json no contiene JSON válido');

      writeRepoFile('package.json', JSON.stringify({ dependencies: { fastify: '4.0.0' } }));
      writeRepoFile('tsconfig.json', '{}');
      const ctx = inspectRepository(tempDir);
      expect(ctx.detectedFrameworks).toEqual(['nodejs-backend']);
      expect(ctx.hasTypeScript).toBe(true);
    });

    it('43. renders the repository context markdown in Spanish and English', () => {
      writeRepoFile(
        'package.json',
        JSON.stringify({
          name: 'demo-app',
          scripts: { dev: 'next dev', lint: 'eslint .', build: 'next build' },
          dependencies: { next: '14.2.3' }
        })
      );
      const ctx = inspectRepository(tempDir);

      const es = formatRepoContextMarkdown(ctx, 'es');
      expect(es).toContain('## Contexto Técnico del Repositorio');
      expect(es).toContain('`next@14.2.3`');
      expect(es).toContain('`npm run build`: `next build`');
      expect(es.indexOf('npm run build')).toBeLessThan(es.indexOf('npm run dev'));

      const en = formatRepoContextMarkdown(ctx, 'en');
      expect(en).toContain('## Repository Technical Context');
      expect(en).toContain('None detected.');
    });
  });

  describe('11. Optional LLM Enricher (v0.2.0)', () => {
    const baseMarkdown = `---\nname: demo-skill\ndescription: "Descripción base"\n---\n\n## Propósito\n\nTexto base.\n\n## Reglas y restricciones\n\n- Regla base.\n`;
    const envKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OLLAMA_HOST'] as const;
    const savedEnv: Record<string, string | undefined> = {};

    function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
      const mock = vi.fn(impl);
      vi.stubGlobal('fetch', mock);
      return mock;
    }

    function jsonResponse(body: unknown, status = 200): Response {
      return new Response(JSON.stringify(body), { status });
    }

    beforeEach(() => {
      for (const key of envKeys) {
        savedEnv[key] = process.env[key];
        delete process.env[key];
      }
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      for (const key of envKeys) {
        if (savedEnv[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = savedEnv[key];
        }
      }
    });

    it('44. returns the base markdown untouched and never calls fetch for provider none', async () => {
      const fetchMock = stubFetch(() => Promise.reject(new Error('must not be called')));
      const result = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'none'
      });
      expect(result).toEqual({ markdown: baseMarkdown, enriched: false });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('45. warns and skips the network when OPENAI_API_KEY or ANTHROPIC_API_KEY is missing', async () => {
      const fetchMock = stubFetch(() => Promise.reject(new Error('must not be called')));
      const openai = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'openai'
      });
      expect(openai.enriched).toBe(false);
      expect(openai.warning).toBe(
        'OPENAI_API_KEY no definida; se usó la plantilla heurística local.'
      );
      const anthropic = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'anthropic'
      });
      expect(anthropic.warning).toBe(
        'ANTHROPIC_API_KEY no definida; se usó la plantilla heurística local.'
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('46. enriches through Ollama using OLLAMA_HOST, the requested model and stream false', async () => {
      process.env['OLLAMA_HOST'] = 'http://ollama.test:9999';
      const enriched = baseMarkdown.replace('Texto base.', 'Texto enriquecido.');
      const fetchMock = stubFetch(() => Promise.resolve(jsonResponse({ response: enriched })));

      const result = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'ollama',
        model: 'qwen2.5'
      });

      expect(result.enriched).toBe(true);
      expect(result.warning).toBeUndefined();
      expect(result.markdown).toContain('Texto enriquecido.');
      const [url, init] = fetchMock.mock.calls[0] ?? [];
      expect(url).toBe('http://ollama.test:9999/api/generate');
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body['model']).toBe('qwen2.5');
      expect(body['stream']).toBe(false);
      expect(String(body['prompt'])).toContain('Texto base.');
      expect(init?.signal).toBeDefined();
    });

    it('47. unwraps fenced answers and parses OpenAI and Anthropic response shapes', async () => {
      const enriched = baseMarkdown.replace('Texto base.', 'Texto remoto.');
      process.env['OPENAI_API_KEY'] = 'test-openai-key';
      const openaiFetch = stubFetch(() =>
        Promise.resolve(
          jsonResponse({
            choices: [{ message: { content: '```markdown\n' + enriched + '\n```' } }]
          })
        )
      );
      const openai = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'openai'
      });
      expect(openai.enriched).toBe(true);
      expect(openai.markdown.startsWith('---')).toBe(true);
      const openaiInit = openaiFetch.mock.calls[0]?.[1];
      expect((openaiInit?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer test-openai-key'
      );

      process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
      const anthropicFetch = stubFetch(() =>
        Promise.resolve(jsonResponse({ content: [{ type: 'text', text: enriched }] }))
      );
      const anthropic = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'anthropic'
      });
      expect(anthropic.enriched).toBe(true);
      expect(anthropicFetch.mock.calls[0]?.[0]).toBe('https://api.anthropic.com/v1/messages');
      const anthropicInit = anthropicFetch.mock.calls[0]?.[1];
      expect((anthropicInit?.headers as Record<string, string>)['x-api-key']).toBe(
        'test-anthropic-key'
      );
    });

    it('48. falls back with the connection warning on network errors and HTTP failures', async () => {
      stubFetch(() => Promise.reject(new TypeError('fetch failed')));
      const networkFail = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'ollama'
      });
      expect(networkFail).toEqual({
        markdown: baseMarkdown,
        enriched: false,
        warning: 'No se pudo conectar al proveedor LLM; se mantuvo la generación heurística local.'
      });

      stubFetch(() => Promise.resolve(jsonResponse({ error: 'boom' }, 500)));
      const httpFail = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'ollama'
      });
      expect(httpFail.enriched).toBe(false);
      expect(httpFail.markdown).toBe(baseMarkdown);
      expect(httpFail.warning).toContain('No se pudo conectar al proveedor LLM');
    });

    it('49. rejects answers that lose the frontmatter, rename the skill or drop sections', async () => {
      const noFrontmatter = '# Solo texto\n\n## Propósito\n\nSin frontmatter.';
      stubFetch(() => Promise.resolve(jsonResponse({ response: noFrontmatter })));
      const lost = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'ollama'
      });
      expect(lost.enriched).toBe(false);
      expect(lost.markdown).toBe(baseMarkdown);
      expect(lost.warning).toContain('No se pudo conectar al proveedor LLM');

      const renamed = baseMarkdown.replace('name: demo-skill', 'name: otro-skill');
      stubFetch(() => Promise.resolve(jsonResponse({ response: renamed })));
      const renamedResult = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'ollama'
      });
      expect(renamedResult.enriched).toBe(false);

      const missingSection = baseMarkdown.replace('## Reglas y restricciones', '## Otra cosa');
      stubFetch(() => Promise.resolve(jsonResponse({ response: missingSection })));
      const dropped = await enrichSkillMarkdownIfRequested({
        description: 'demo',
        baseMarkdown,
        provider: 'ollama'
      });
      expect(dropped.enriched).toBe(false);
      expect(dropped.markdown).toBe(baseMarkdown);
      expect(dropped.warning).toContain('no conservó la estructura');
    });
  });

  describe('12. --from-repo and --provider integration (v0.2.0)', () => {
    function makeRepo(): string {
      const repoDir = path.join(tempDir, 'sample-repo');
      fs.mkdirSync(repoDir, { recursive: true });
      fs.writeFileSync(
        path.join(repoDir, 'package.json'),
        JSON.stringify({
          name: 'sample-repo',
          scripts: { build: 'next build', test: 'vitest run' },
          dependencies: { next: '14.2.3', react: '18.3.1', zod: '3.24.1' },
          devDependencies: { vitest: '2.1.9', typescript: '5.7.2' }
        })
      );
      fs.writeFileSync(path.join(repoDir, 'pnpm-lock.yaml'), '');
      fs.writeFileSync(path.join(repoDir, 'tsconfig.json'), '{}');
      return repoDir;
    }

    afterEach(() => {
      vi.unstubAllGlobals();
      delete process.env['OPENAI_API_KEY'];
    });

    it('50. injects the repository context after Propósito and stores repoContext in the config', () => {
      const artifact = generateSkill({
        description: 'Revisar Pull Requests de Next.js buscando problemas de rendimiento',
        name: 'repo-aware-skill',
        outputDir: tempDir,
        fromRepo: makeRepo()
      });

      expect(artifact.config.repoContext).toEqual({
        frameworks: ['nextjs', 'react', 'zod', 'vitest', 'typescript'],
        packageManager: 'pnpm',
        hasTypeScript: true
      });
      expect(artifact.config.tags).toEqual(expect.arrayContaining(['nextjs', 'react', 'zod']));
      expect(new Set(artifact.config.tags).size).toBe(artifact.config.tags.length);
      expect(artifact.config.tags.length).toBeLessThanOrEqual(10);

      const writtenConfig = JSON.parse(
        fs.readFileSync(path.join(artifact.skillDir, 'skillforge.config.json'), 'utf-8')
      ) as unknown;
      expect(writtenConfig).toMatchObject({
        repoContext: {
          frameworks: ['nextjs', 'react', 'zod', 'vitest', 'typescript'],
          packageManager: 'pnpm',
          hasTypeScript: true
        }
      });
      expect(SkillForgeConfigSchema.safeParse(writtenConfig).success).toBe(true);

      const skillMd = fs.readFileSync(path.join(artifact.skillDir, 'SKILL.md'), 'utf-8');
      const purposeIdx = skillMd.indexOf('## Propósito');
      const contextIdx = skillMd.indexOf('## Contexto Técnico del Repositorio');
      const activateIdx = skillMd.indexOf('## Cuándo activarse');
      expect(purposeIdx).toBeGreaterThan(-1);
      expect(contextIdx).toBeGreaterThan(purposeIdx);
      expect(activateIdx).toBeGreaterThan(contextIdx);
      expect(skillMd).toContain('`next@14.2.3`');
      expect(skillMd).toContain('`pnpm run build`: `next build`');

      const checklist = fs.readFileSync(
        path.join(artifact.skillDir, 'references', 'checklist.md'),
        'utf-8'
      );
      expect(checklist).toContain(
        '- [ ] Verificar compatibilidad con el stack detectado (nextjs, react, zod, vitest, typescript) y ejecutar scripts del proyecto (build, test).'
      );

      expect(validateSkill(artifact.skillDir).valid).toBe(true);
      expect(runSkillStaticTests(artifact.skillDir, false).passed).toBe(true);
    });

    it('51. renders the English context section and checklist item for --lang en', () => {
      const artifact = generateSkill({
        description: 'Review pull requests for security problems',
        name: 'repo-aware-en',
        language: 'en',
        outputDir: tempDir,
        fromRepo: makeRepo()
      });
      const skillMd = fs.readFileSync(path.join(artifact.skillDir, 'SKILL.md'), 'utf-8');
      expect(skillMd.indexOf('## Repository Technical Context')).toBeGreaterThan(
        skillMd.indexOf('## Purpose')
      );
      expect(skillMd.indexOf('## Repository Technical Context')).toBeLessThan(
        skillMd.indexOf('## When to Activate')
      );
      const checklist = fs.readFileSync(
        path.join(artifact.skillDir, 'references', 'checklist.md'),
        'utf-8'
      );
      expect(checklist).toContain(
        '- [ ] Verify compatibility with detected stack (nextjs, react, zod, vitest, typescript) and run project scripts (build, test).'
      );
      expect(validateSkill(artifact.skillDir).valid).toBe(true);
    });

    it('52. leaves skills generated without --from-repo free of repo context', () => {
      const artifact = generateSkill({
        description: 'Revisar Pull Requests de Next.js',
        name: 'plain-skill',
        outputDir: tempDir
      });
      expect(artifact.config.repoContext).toBeUndefined();
      const skillMd = fs.readFileSync(path.join(artifact.skillDir, 'SKILL.md'), 'utf-8');
      expect(skillMd).not.toContain('Contexto Técnico del Repositorio');
    });

    it('53. does not create the skill folder when the --from-repo path does not exist', async () => {
      const code = await executeCreateCommand('Revisar Pull Requests de Next.js', {
        name: 'no-repo-skill',
        out: tempDir,
        yes: true,
        fromRepo: path.join(tempDir, 'missing-repo')
      });
      expect(code).toBe(1);
      expect(fs.existsSync(path.join(tempDir, 'no-repo-skill'))).toBe(false);
    });

    it('54. rejects unknown providers before generating anything', async () => {
      const code = await executeCreateCommand('Revisar Pull Requests de Next.js', {
        name: 'bad-provider-skill',
        out: tempDir,
        yes: true,
        provider: 'gemini' as unknown as 'none'
      });
      expect(code).toBe(1);
      expect(fs.existsSync(path.join(tempDir, 'bad-provider-skill'))).toBe(false);
    });

    it('55. keeps the heuristic skill when the provider key is missing and still validates', async () => {
      delete process.env['OPENAI_API_KEY'];
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const code = await executeCreateCommand('Revisar Pull Requests de Next.js', {
        name: 'no-key-skill',
        out: tempDir,
        yes: true,
        provider: 'openai'
      });
      expect(code).toBe(0);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(validateSkill(path.join(tempDir, 'no-key-skill')).valid).toBe(true);
    });

    it('56. writes the enriched SKILL.md before validation when the provider answers', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (_url: string, init: RequestInit) => {
          const body = JSON.parse(String(init.body)) as { prompt: string };
          const marker = 'SKILL.md actual:\n\n';
          const base = body.prompt.slice(body.prompt.indexOf(marker) + marker.length);
          return new Response(
            JSON.stringify({
              response: base.replace('## Propósito', '## Propósito\n\nENRIQUECIDO')
            })
          );
        })
      );
      const code = await executeCreateCommand('Revisar Pull Requests de Next.js', {
        name: 'enriched-skill',
        out: tempDir,
        yes: true,
        provider: 'ollama',
        model: 'llama3.2'
      });
      expect(code).toBe(0);
      const skillDir = path.join(tempDir, 'enriched-skill');
      expect(fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8')).toContain('ENRIQUECIDO');
      expect(validateSkill(skillDir).valid).toBe(true);
    });

    it('57. falls back to the heuristic skill when the provider is unreachable', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(new TypeError('fetch failed')))
      );
      const code = await executeCreateCommand('Revisar Pull Requests de Next.js', {
        name: 'offline-skill',
        out: tempDir,
        yes: true,
        provider: 'ollama'
      });
      expect(code).toBe(0);
      const skillMd = fs.readFileSync(path.join(tempDir, 'offline-skill', 'SKILL.md'), 'utf-8');
      expect(skillMd).not.toContain('ENRIQUECIDO');
    });
  });

  describe('13. Semantic Criterion Matching (v0.2.0)', () => {
    const corpus = stripAccents(
      'Optimización de rendimiento. Revisar la accesibilidad con ARIA. Proponer un parche en diff. Validación de rutas y archivos. Riesgo de hidratación y variables de entorno. Causa raíz del fallo.'
    ).toLowerCase();

    it('58. returns exact for normalized substring matches, ignoring accents and case', () => {
      expect(evaluateCriterionMatch('Hidratación', corpus)).toEqual({
        matched: true,
        matchType: 'exact'
      });
      expect(evaluateCriterionMatch('ARIA', corpus)).toEqual({ matched: true, matchType: 'exact' });
    });

    it('59. returns stem when every lexical root of the criterion appears in the corpus', () => {
      // "optimizaciones" -> "optimiz"; "validaciones" -> "valid"
      expect(evaluateCriterionMatch('optimizaciones', corpus)).toEqual({
        matched: true,
        matchType: 'stem'
      });
      expect(evaluateCriterionMatch('Validaciones de archivos', corpus)).toEqual({
        matched: true,
        matchType: 'stem'
      });
      expect(evaluateCriterionMatch('reviewing', 'revisar y review del codigo')).toEqual({
        matched: true,
        matchType: 'stem'
      });
    });

    it('60. does not stem short words and requires every root to be present', () => {
      expect(evaluateCriterionMatch('optimizaciones y blockchain', corpus).matched).toBe(false);
      expect(evaluateCriterionMatch('xyz', corpus)).toEqual({ matched: false, matchType: 'none' });
    });

    it('61. returns synonym when an equivalent term of the same group appears in the corpus', () => {
      expect(evaluateCriterionMatch('performance', corpus)).toEqual({
        matched: true,
        matchType: 'synonym'
      });
      expect(evaluateCriterionMatch('accessibility', corpus)).toEqual({
        matched: true,
        matchType: 'synonym'
      });
      expect(evaluateCriterionMatch('root cause', corpus)).toEqual({
        matched: true,
        matchType: 'synonym'
      });
      expect(evaluateCriterionMatch('hydration', corpus)).toEqual({
        matched: true,
        matchType: 'synonym'
      });
      expect(evaluateCriterionMatch('secrets', corpus)).toEqual({
        matched: true,
        matchType: 'synonym'
      });
    });

    it('62. uses whole-term boundaries for synonyms so "tab" does not match "tabla"', () => {
      expect(evaluateCriterionMatch('keyboard', 'una tabla de datos')).toEqual({
        matched: false,
        matchType: 'none'
      });
      expect(evaluateCriterionMatch('keyboard', 'pulsa tab para avanzar')).toEqual({
        matched: true,
        matchType: 'synonym'
      });
    });

    it('63. keeps every synonym group normalized, bilingual and with at least two terms', () => {
      expect(SYNONYM_GROUPS.length).toBeGreaterThanOrEqual(10);
      for (const group of SYNONYM_GROUPS) {
        expect(group.length).toBeGreaterThanOrEqual(2);
        for (const term of group) {
          expect(term).toBe(stripAccents(term).toLowerCase());
        }
      }
    });

    it('64. scores a skill through synonyms and writes matchDetails into skillforge-report.json', () => {
      const artifact = generateSkill({
        description: 'Revisar Pull Requests de Next.js',
        name: 'semantic-skill',
        outputDir: tempDir
      });
      fs.writeFileSync(
        path.join(artifact.skillDir, 'tests', 'cases.json'),
        JSON.stringify([
          {
            id: 'sem-1',
            input: 'Entrada',
            expectedBehavior: 'Comportamiento',
            criteria: ['Propósito', 'performance', 'accessibility', 'blockchain-cuantico-xyz']
          }
        ])
      );

      const report = runSkillStaticTests(artifact.skillDir, true);
      const details = report.caseResults[0]?.matchDetails ?? [];
      expect(details.map((d) => d.matchType)).toEqual(['exact', 'synonym', 'synonym', 'none']);
      expect(report.caseResults[0]?.score).toBe(75);
      expect(report.passed).toBe(true);

      const saved = JSON.parse(
        fs.readFileSync(path.join(artifact.skillDir, 'skillforge-report.json'), 'utf-8')
      ) as { caseResults: Array<{ matchDetails: Array<{ criterion: string; matched: boolean }> }> };
      expect(saved.caseResults[0]?.matchDetails).toHaveLength(4);
      expect(saved.caseResults[0]?.matchDetails[3]).toEqual({
        criterion: 'blockchain-cuantico-xyz',
        matched: false,
        matchType: 'none'
      });
    });

    it('65. stays backward compatible: the bundled example still scores 100 with exact matches', () => {
      const examplePath = path.resolve(process.cwd(), 'skills', 'nextjs-pr-reviewer');
      const report = runSkillStaticTests(examplePath, false);
      expect(report.coverageScore).toBe(100);
      for (const result of report.caseResults) {
        expect(result.missingCriteria).toHaveLength(0);
        expect(result.matchDetails?.every((d) => d.matched)).toBe(true);
      }
    });
  });

  describe('14. Watch Mode (v0.2.0)', () => {
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    async function waitUntil(condition: () => boolean, timeoutMs = 4000): Promise<void> {
      const start = Date.now();
      while (!condition() && Date.now() - start < timeoutMs) {
        await sleep(25);
      }
    }

    it('66. reports a single debounced change for a burst of writes', async () => {
      const changes: string[] = [];
      const stop = watchSkillDirectory(tempDir, (file) => changes.push(file));
      try {
        for (let i = 0; i < 4; i++) {
          fs.writeFileSync(path.join(tempDir, 'SKILL.md'), `contenido ${i}`);
          await sleep(20);
        }
        await waitUntil(() => changes.length > 0);
        await sleep(600);
        expect(changes).toEqual(['SKILL.md']);
      } finally {
        stop();
      }
    });

    it('67. detects changes inside nested folders using forward-slash paths', async () => {
      fs.mkdirSync(path.join(tempDir, 'references'));
      const changes: string[] = [];
      const stop = watchSkillDirectory(tempDir, (file) => changes.push(file));
      try {
        fs.writeFileSync(path.join(tempDir, 'references', 'checklist.md'), '- [ ] item');
        await waitUntil(() => changes.length > 0);
        expect(changes[0]).toBe('references/checklist.md');
      } finally {
        stop();
      }
    });

    it('68. ignores skillforge-report.json, .git and node_modules', async () => {
      fs.mkdirSync(path.join(tempDir, '.git'));
      fs.mkdirSync(path.join(tempDir, 'node_modules'));
      const changes: string[] = [];
      const stop = watchSkillDirectory(tempDir, (file) => changes.push(file));
      try {
        fs.writeFileSync(path.join(tempDir, 'skillforge-report.json'), '{}');
        fs.writeFileSync(path.join(tempDir, '.git', 'HEAD'), 'ref');
        fs.writeFileSync(path.join(tempDir, 'node_modules', 'pkg.js'), 'x');
        await sleep(700);
        expect(changes).toEqual([]);
      } finally {
        stop();
      }
    });

    it('69. stop() cancels pending notifications and is idempotent', async () => {
      const changes: string[] = [];
      const stop = watchSkillDirectory(tempDir, (file) => changes.push(file));
      fs.writeFileSync(path.join(tempDir, 'SKILL.md'), 'cambio');
      await sleep(60);
      stop();
      stop();
      await sleep(600);
      expect(changes).toEqual([]);
    });

    it('70. startWatchMode runs the action initially and again after each change', async () => {
      const artifact = generateSkill({
        description: 'Revisar Pull Requests de Next.js',
        name: 'watch-skill',
        outputDir: tempDir
      });
      let runs = 0;
      const codes: number[] = [];
      const stop = startWatchMode(
        artifact.skillDir,
        () => {
          runs += 1;
          return validateSkill(artifact.skillDir).valid ? 0 : 1;
        },
        (code) => codes.push(code)
      );
      expect(stop).not.toBeNull();
      try {
        expect(runs).toBe(1);

        const skillMdPath = path.join(artifact.skillDir, 'SKILL.md');
        const original = fs.readFileSync(skillMdPath, 'utf-8');
        fs.writeFileSync(skillMdPath, original.replace('## Ejemplos de uso', '## Otra cosa'));
        await waitUntil(() => runs >= 2);
        expect(codes.slice(0, 2)).toEqual([0, 1]);

        fs.writeFileSync(skillMdPath, original);
        await waitUntil(() => runs >= 3);
        expect(codes[codes.length - 1]).toBe(0);
      } finally {
        stop?.();
      }
    });

    it('71. startWatchMode reports exit code 1 and returns null when the directory is missing', () => {
      const codes: number[] = [];
      const stop = startWatchMode(
        path.join(tempDir, 'does-not-exist'),
        () => 1,
        (code) => codes.push(code)
      );
      expect(stop).toBeNull();
      expect(codes).toEqual([1, 1]);
    });
  });

  describe('15. list and doctor commands (v0.2.0)', () => {
    function capture<T>(fn: () => T): { result: T; output: string } {
      const chunks: string[] = [];
      logger.setSilent(false);
      const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        chunks.push(String(chunk));
        return true;
      });
      const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
        chunks.push(String(chunk));
        return true;
      });
      try {
        return { result: fn(), output: chunks.join('') };
      } finally {
        outSpy.mockRestore();
        errSpy.mockRestore();
        logger.setSilent(true);
      }
    }

    function makeSkillsWorkspace(): { skillsDir: string } {
      const skillsDir = path.join(tempDir, 'skills');
      generateSkill({
        description: 'Auditar seguridad de endpoints Node.js con OWASP',
        name: 'security-auditor',
        outputDir: skillsDir
      });
      generateSkill({
        description: 'Optimizar rendimiento y Core Web Vitals del frontend',
        name: 'react-perf',
        language: 'en',
        targetAgent: 'cursor',
        outputDir: skillsDir
      });
      fs.mkdirSync(path.join(skillsDir, 'not-a-skill'), { recursive: true });
      fs.writeFileSync(path.join(skillsDir, 'not-a-skill', 'notes.txt'), 'sin SKILL.md');
      fs.writeFileSync(path.join(skillsDir, 'loose-file.md'), 'archivo suelto');
      return { skillsDir };
    }

    it('72. lists only folders containing SKILL.md, sorted, with config metadata', () => {
      const { skillsDir } = makeSkillsWorkspace();
      const skills = listSkillsInDirectory(skillsDir);

      expect(skills.map((s) => s.name)).toEqual(['react-perf', 'security-auditor']);
      expect(skills[0]).toMatchObject({
        name: 'react-perf',
        path: path.join(skillsDir, 'react-perf'),
        category: 'performance',
        version: '0.1.0',
        language: 'en',
        targetAgent: 'cursor',
        valid: true
      });
      expect(skills[1]?.category).toBe('security');
    });

    it('73. returns [] for a missing directory and evaluates the directory itself when it has SKILL.md', () => {
      expect(listSkillsInDirectory(path.join(tempDir, 'missing'))).toEqual([]);

      const { skillsDir } = makeSkillsWorkspace();
      const single = listSkillsInDirectory(path.join(skillsDir, 'security-auditor'));
      expect(single).toHaveLength(1);
      expect(single[0]?.name).toBe('security-auditor');
    });

    it('74. flags invalid skills and falls back to "-" when the config is missing or corrupt', () => {
      const { skillsDir } = makeSkillsWorkspace();
      const brokenDir = path.join(skillsDir, 'broken-skill');
      fs.mkdirSync(brokenDir);
      fs.writeFileSync(path.join(brokenDir, 'SKILL.md'), '# Sin frontmatter');
      fs.writeFileSync(path.join(skillsDir, 'react-perf', 'skillforge.config.json'), '{ not json');

      const byName = new Map(listSkillsInDirectory(skillsDir).map((s) => [s.name, s]));
      expect(byName.get('broken-skill')).toMatchObject({
        valid: false,
        category: '-',
        version: '-',
        language: '-',
        targetAgent: '-'
      });
      expect(byName.get('react-perf')).toMatchObject({ valid: false, category: '-' });
    });

    it('75. exposes the 11 registered templates', () => {
      const templates = listAvailableTemplates();
      expect(templates).toHaveLength(11);
      expect(templates.map((t) => t.category).sort()).toEqual(
        [
          'accessibility',
          'code-review',
          'debugging',
          'documentation',
          'framework-migration',
          'performance',
          'refactoring',
          'repo-onboarding',
          'security',
          'seo',
          'testing'
        ].sort()
      );
      for (const template of templates) {
        expect(template.titleEs.length).toBeGreaterThan(0);
        expect(template.titleEn.length).toBeGreaterThan(0);
      }
    });

    it('76. prints an aligned table, JSON output and the templates listing', () => {
      const { skillsDir } = makeSkillsWorkspace();

      const table = capture(() => executeListCommand(skillsDir));
      expect(table.result).toBe(0);
      const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
      const lines = table.output.replace(ansiPattern, '').split('\n');
      const header = lines.find((l) => l.includes('NOMBRE')) ?? '';
      const row = lines.find((l) => l.startsWith('security-auditor')) ?? '';
      expect(header.indexOf('CATEGORÍA')).toBe(row.indexOf('security', 1));
      expect(table.output).toContain('react-perf');
      expect(table.output).toContain('válido');

      const json = capture(() => executeListCommand(skillsDir, { json: true }));
      expect(json.result).toBe(0);
      const parsed = JSON.parse(json.output) as Array<{ name: string; valid: boolean }>;
      expect(parsed.map((s) => s.name)).toEqual(['react-perf', 'security-auditor']);

      const templatesJson = capture(() =>
        executeListCommand(skillsDir, { templates: true, json: true })
      );
      expect(templatesJson.result).toBe(0);
      expect((JSON.parse(templatesJson.output) as unknown[]).length).toBe(11);

      const templatesTable = capture(() => executeListCommand(skillsDir, { templates: true }));
      expect(templatesTable.result).toBe(0);
      expect(templatesTable.output).toContain('framework-migration');
    });

    it('77. list returns 0 with a warning when there are no skills, and [] in JSON mode', () => {
      const empty = capture(() => executeListCommand(path.join(tempDir, 'missing')));
      expect(empty.result).toBe(0);
      expect(empty.output).toContain('No se encontraron skills');

      const json = capture(() => executeListCommand(path.join(tempDir, 'missing'), { json: true }));
      expect(JSON.parse(json.output)).toEqual([]);
    });

    it('78. doctor is healthy for a workspace with valid skills', () => {
      makeSkillsWorkspace();
      const report = runDoctorChecks(tempDir);
      expect(report.healthy).toBe(true);
      expect(report.checks.map((c) => c.check)).toEqual([
        'Node.js >= 20',
        'Estructura de directorio skills/',
        'Validez de skills instalados'
      ]);
      expect(report.checks.every((c) => c.passed)).toBe(true);

      const run = capture(() => executeDoctorCommand(tempDir));
      expect(run.result).toBe(0);
      expect(run.output).toContain('Todo en orden');
    });

    it('79. doctor fails when skills/ is missing and when an installed skill is invalid', () => {
      const missing = runDoctorChecks(tempDir);
      expect(missing.healthy).toBe(false);
      expect(missing.checks[1]?.passed).toBe(false);
      expect(capture(() => executeDoctorCommand(tempDir)).result).toBe(1);

      const { skillsDir } = makeSkillsWorkspace();
      fs.rmSync(path.join(skillsDir, 'react-perf', 'references', 'checklist.md'));
      const broken = runDoctorChecks(tempDir);
      expect(broken.healthy).toBe(false);
      expect(broken.checks[1]?.passed).toBe(true);
      expect(broken.checks[2]?.passed).toBe(false);
      expect(broken.checks[2]?.detail).toContain('react-perf');

      const run = capture(() => executeDoctorCommand(tempDir));
      expect(run.result).toBe(1);
      expect(run.output).toContain('Se detectaron problemas');
    });

    it('80. lists the real ./skills directory and reports nextjs-pr-reviewer as valid', () => {
      const skillsDir = path.resolve(process.cwd(), 'skills');
      const example = listSkillsInDirectory(skillsDir).find((s) => s.name === 'nextjs-pr-reviewer');
      expect(example).toMatchObject({
        path: path.join(skillsDir, 'nextjs-pr-reviewer'),
        category: 'code-review',
        version: '0.1.0',
        language: 'es',
        targetAgent: 'generic',
        valid: true
      });

      // The default directory of "skillforge list" is ./skills relative to the cwd.
      const run = capture(() => executeListCommand());
      expect(run.result).toBe(0);
      expect(run.output).toContain('nextjs-pr-reviewer');
    });

    it('81. doctor reports the current workspace as healthy', () => {
      const report = runDoctorChecks(process.cwd());
      expect(report.checks.map((c) => `${c.check}:${c.passed}`)).toEqual([
        'Node.js >= 20:true',
        'Estructura de directorio skills/:true',
        'Validez de skills instalados:true'
      ]);
      expect(report.healthy).toBe(true);
      expect(capture(() => executeDoctorCommand(process.cwd())).result).toBe(0);
    });
  });

  describe('16. Watcher resource cleanup (v0.2.0)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    function spyOnWatchers(): {
      created: fs.FSWatcher[];
      closeSpies: Array<ReturnType<typeof vi.spyOn>>;
    } {
      const realWatch = fs.watch.bind(fs) as (...args: unknown[]) => fs.FSWatcher;
      const created: fs.FSWatcher[] = [];
      const closeSpies: Array<ReturnType<typeof vi.spyOn>> = [];
      vi.spyOn(fs, 'watch').mockImplementation(((...args: unknown[]) => {
        const watcher = realWatch(...args);
        created.push(watcher);
        closeSpies.push(vi.spyOn(watcher, 'close'));
        return watcher;
      }) as unknown as typeof fs.watch);
      return { created, closeSpies };
    }

    it('82. opens one recursive watcher on the resolved path and closes it exactly once', () => {
      const { created, closeSpies } = spyOnWatchers();

      const stop = watchSkillDirectory(tempDir, () => undefined);
      expect(created).toHaveLength(1);
      expect(fs.watch).toHaveBeenCalledWith(
        path.resolve(tempDir),
        expect.objectContaining({ recursive: true }),
        expect.any(Function)
      );
      expect(closeSpies[0]).not.toHaveBeenCalled();

      stop();
      stop();
      expect(closeSpies[0]).toHaveBeenCalledTimes(1);
    });

    it('83. closes every watcher of repeated start/stop cycles and frees the directory', () => {
      const { created, closeSpies } = spyOnWatchers();
      const watchedDir = path.join(tempDir, 'watched');
      fs.mkdirSync(watchedDir);

      const stops = Array.from({ length: 25 }, () =>
        watchSkillDirectory(watchedDir, () => undefined)
      );
      expect(created).toHaveLength(25);
      for (const stop of stops) {
        stop();
      }
      expect(closeSpies.every((spy) => spy.mock.calls.length === 1)).toBe(true);

      // A leaked directory handle would make this fail on Windows (EBUSY/EPERM).
      expect(() => fs.rmSync(watchedDir, { recursive: true })).not.toThrow();
      expect(fs.existsSync(watchedDir)).toBe(false);
    });

    it('84. closes the watcher and cancels the pending timer when stopped mid-debounce', async () => {
      const { closeSpies } = spyOnWatchers();
      const onChange = vi.fn();
      const stop = watchSkillDirectory(tempDir, onChange);

      fs.writeFileSync(path.join(tempDir, 'SKILL.md'), 'cambio');
      await new Promise<void>((resolve) => setTimeout(resolve, 60));
      stop();

      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      expect(onChange).not.toHaveBeenCalled();
      expect(closeSpies[0]).toHaveBeenCalledTimes(1);
    });
  });
});
