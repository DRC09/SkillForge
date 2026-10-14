import fs from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { validateSkill } from '../validators/skill-validator.js';
import { listFilesRecursive } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { createZipArchive } from '../utils/zip.js';

const EXCLUDED_SEGMENTS = new Set(['node_modules', '.git', 'dist', 'coverage']);

const ALLOWED_TOP_FILES = new Set(['SKILL.md', 'README.md', 'skillforge.config.json', 'LICENSE']);
const ALLOWED_TOP_DIRS = new Set(['references', 'tests', 'scripts', 'assets']);

export function shouldIncludeInPack(relativePath: string, isDirectory: boolean): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const baseName = parts[parts.length - 1] ?? '';

  for (const part of parts) {
    if (EXCLUDED_SEGMENTS.has(part)) {
      return false;
    }
  }

  if (
    baseName.startsWith('.env') ||
    baseName === '.DS_Store' ||
    baseName === 'skillforge-report.json' ||
    baseName.endsWith('.tmp') ||
    baseName.endsWith('.log') ||
    baseName.endsWith('.pem') ||
    baseName.endsWith('.key') ||
    baseName.startsWith('secret') ||
    baseName.startsWith('credentials')
  ) {
    return false;
  }

  const topSegment = parts[0] ?? '';
  if (parts.length === 1 && !isDirectory) {
    return ALLOWED_TOP_FILES.has(topSegment);
  }

  return ALLOWED_TOP_DIRS.has(topSegment);
}

export interface PackResult {
  success: boolean;
  zipPath?: string;
  includedFiles: string[];
}

export function packSkill(skillPath: string, outputBaseDir?: string): PackResult {
  const validation = validateSkill(skillPath);
  if (!validation.valid || !validation.frontmatter) {
    return { success: false, includedFiles: [] };
  }

  const skillName = validation.frontmatter.name;
  const resolvedSkillDir = validation.skillPath;
  const relativeFiles = listFilesRecursive(resolvedSkillDir, shouldIncludeInPack);

  const entries = relativeFiles.map((relPath) => ({
    relativePath: `${skillName}/${relPath}`,
    data: fs.readFileSync(path.join(resolvedSkillDir, relPath))
  }));

  const targetRoot = outputBaseDir ? path.resolve(outputBaseDir) : process.cwd();
  const zipPath = path.join(targetRoot, 'dist', `${skillName}.skillforge.zip`);

  createZipArchive(entries, zipPath);

  return {
    success: true,
    zipPath,
    includedFiles: relativeFiles
  };
}

export function executePackCommand(skillPath: string, outputBaseDir?: string): number {
  const validation = validateSkill(skillPath);
  if (!validation.valid) {
    logger.error('No se puede empaquetar un skill inválido:');
    for (const issue of validation.issues) {
      logger.error(`  [${issue.code}] ${issue.message}`);
    }
    return 1;
  }

  const result = packSkill(skillPath, outputBaseDir);
  if (!result.success || !result.zipPath) {
    logger.error('Error al generar el paquete ZIP del skill.');
    return 1;
  }

  logger.success(`Paquete generado con éxito (${result.includedFiles.length} archivos incluidos):`);
  logger.info(pc.underline(result.zipPath));
  return 0;
}
