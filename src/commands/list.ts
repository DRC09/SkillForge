import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { SkillCategory, SkillSummaryItem } from '../types/index.js';
import { CATEGORY_TEMPLATES } from '../templates/index.js';
import { fileExists, readFileSafe } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { validateSkill } from '../validators/skill-validator.js';

const MISSING_VALUE = '-';

export interface TemplateSummary {
  category: SkillCategory;
  titleEs: string;
  titleEn: string;
}

export interface ListCommandOptions {
  templates?: boolean;
  json?: boolean;
}

function isDirectory(targetPath: string): boolean {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}

function readConfigFields(skillDir: string): Record<string, string> {
  const configPath = path.join(skillDir, 'skillforge.config.json');
  const fields: Record<string, string> = {};
  if (!fileExists(configPath)) {
    return fields;
  }

  try {
    const parsed = JSON.parse(readFileSafe(configPath)) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          fields[key] = value;
        }
      }
    }
  } catch {
    // An unreadable config is reported by validateSkill; the summary falls back to defaults.
  }
  return fields;
}

function summarizeSkill(skillDir: string): SkillSummaryItem {
  const validation = validateSkill(skillDir);
  const config = readConfigFields(skillDir);

  return {
    name: validation.frontmatter?.name ?? config['name'] ?? path.basename(skillDir),
    path: skillDir,
    category: config['category'] ?? MISSING_VALUE,
    version: config['version'] ?? MISSING_VALUE,
    language: config['language'] ?? MISSING_VALUE,
    targetAgent: config['targetAgent'] ?? MISSING_VALUE,
    valid: validation.valid
  };
}

export function listSkillsInDirectory(dirPath: string): SkillSummaryItem[] {
  const resolvedDir = path.resolve(dirPath);
  if (!isDirectory(resolvedDir)) {
    return [];
  }

  if (fileExists(path.join(resolvedDir, 'SKILL.md'))) {
    return [summarizeSkill(resolvedDir)];
  }

  return fs
    .readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(resolvedDir, entry.name))
    .filter((candidate) => fileExists(path.join(candidate, 'SKILL.md')))
    .sort()
    .map(summarizeSkill);
}

export function listAvailableTemplates(): TemplateSummary[] {
  return Object.values(CATEGORY_TEMPLATES).map((template) => ({
    category: template.category,
    titleEs: template.titleEs,
    titleEn: template.titleEn
  }));
}

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? '').length))
  );
  const formatRow = (cells: string[]): string =>
    cells
      .map((cell, column) =>
        column === cells.length - 1 ? cell : cell.padEnd(widths[column] ?? 0)
      )
      .join('  ');

  logger.raw(pc.bold(formatRow(headers)));
  logger.raw(widths.map((width) => '-'.repeat(width)).join('  '));
  for (const row of rows) {
    logger.raw(formatRow(row));
  }
}

function displayPath(absolutePath: string): string {
  const relative = path.relative(process.cwd(), absolutePath);
  return relative.length === 0 ? '.' : relative;
}

export function executeListCommand(dirPath = './skills', options: ListCommandOptions = {}): number {
  if (options.templates) {
    const templates = listAvailableTemplates();
    if (options.json) {
      logger.raw(JSON.stringify(templates, null, 2));
      return 0;
    }

    logger.info(`Plantillas disponibles (${templates.length}):`);
    printTable(
      ['CATEGORÍA', 'TÍTULO (ES)', 'TÍTULO (EN)'],
      templates.map((template) => [template.category, template.titleEs, template.titleEn])
    );
    return 0;
  }

  const skills = listSkillsInDirectory(dirPath);
  if (options.json) {
    logger.raw(JSON.stringify(skills, null, 2));
    return 0;
  }

  if (skills.length === 0) {
    logger.warn(`No se encontraron skills en ${path.resolve(dirPath)}.`);
    return 0;
  }

  logger.info(`Skills encontrados (${skills.length}) en ${pc.underline(path.resolve(dirPath))}:`);
  printTable(
    ['NOMBRE', 'CATEGORÍA', 'VERSIÓN', 'IDIOMA', 'AGENTE', 'ESTADO', 'RUTA'],
    skills.map((skill) => [
      skill.name,
      skill.category,
      skill.version,
      skill.language,
      skill.targetAgent,
      skill.valid ? 'válido' : 'inválido',
      displayPath(skill.path)
    ])
  );
  return 0;
}
