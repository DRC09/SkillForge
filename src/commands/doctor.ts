import fs from 'node:fs';
import path from 'node:path';
import { DoctorCheckResult } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { listSkillsInDirectory } from './list.js';

const MIN_NODE_MAJOR = 20;

export interface DoctorReport {
  healthy: boolean;
  checks: DoctorCheckResult[];
}

function checkNodeVersion(): DoctorCheckResult {
  const version = process.versions.node;
  const major = Number.parseInt(version.split('.')[0] ?? '0', 10);
  const passed = major >= MIN_NODE_MAJOR;
  return {
    check: `Node.js >= ${MIN_NODE_MAJOR}`,
    passed,
    detail: passed
      ? `Versión detectada: v${version}.`
      : `Versión detectada: v${version}. SkillForge requiere Node.js ${MIN_NODE_MAJOR} o superior.`
  };
}

function checkSkillsDirectory(skillsDir: string): DoctorCheckResult {
  let passed = false;
  try {
    passed = fs.statSync(skillsDir).isDirectory();
  } catch {
    passed = false;
  }
  return {
    check: 'Estructura de directorio skills/',
    passed,
    detail: passed
      ? `Directorio encontrado: ${skillsDir}`
      : `No se encontró el directorio ${skillsDir}. Créalo o ejecuta "skillforge init".`
  };
}

function checkInstalledSkills(skillsDir: string): DoctorCheckResult {
  const skills = listSkillsInDirectory(skillsDir);
  const invalid = skills.filter((skill) => !skill.valid);
  const passed = invalid.length === 0;
  return {
    check: 'Validez de skills instalados',
    passed,
    detail: passed
      ? skills.length === 0
        ? 'No hay skills instalados para validar.'
        : `${skills.length} skill(s) revisados, todos válidos.`
      : `Skills inválidos (${invalid.length}/${skills.length}): ${invalid.map((skill) => skill.name).join(', ')}. Ejecuta "skillforge validate <ruta>" para ver los detalles.`
  };
}

export function runDoctorChecks(workspaceDir = process.cwd()): DoctorReport {
  const skillsDir = path.join(path.resolve(workspaceDir), 'skills');
  const checks = [
    checkNodeVersion(),
    checkSkillsDirectory(skillsDir),
    checkInstalledSkills(skillsDir)
  ];
  return { healthy: checks.every((check) => check.passed), checks };
}

export function executeDoctorCommand(workspaceDir = process.cwd()): number {
  const report = runDoctorChecks(workspaceDir);

  for (const check of report.checks) {
    if (check.passed) {
      logger.success(`${check.check}: ${check.detail}`);
    } else {
      logger.error(`${check.check}: ${check.detail}`);
    }
  }

  if (report.healthy) {
    logger.success('Todo en orden: el entorno de SkillForge está saludable.');
    return 0;
  }

  logger.error('Se detectaron problemas en el entorno de SkillForge.');
  return 1;
}
