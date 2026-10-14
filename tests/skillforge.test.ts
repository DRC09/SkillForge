import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { analyzeDescription } from '../src/generators/analyzer.js';
import { generateSkill } from '../src/generators/skill-generator.js';
import { initSkillsRepository } from '../src/commands/init.js';
import { packSkill, shouldIncludeInPack } from '../src/commands/pack.js';
import { runSkillStaticTests } from '../src/validators/skill-tester.js';
import { validateSkill } from '../src/validators/skill-validator.js';
import { SkillForgeConfigSchema } from '../src/validators/schema.js';
import {
  extractFrontmatter,
  generateSkillNameFromDescription,
  toKebabCase
} from '../src/utils/string.js';
import { listZipEntries } from '../src/utils/zip.js';
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
});
