import path from 'node:path';
import { ValidationIssue, ValidationResult } from '../types/index.js';
import { fileExists, readFileSafe } from '../utils/fs.js';
import { extractFrontmatter, parseSimpleYamlFrontmatter, stripAccents } from '../utils/string.js';
import {
  RESERVED_NAME_WORDS,
  SKILL_NAME_REGEX,
  SkillForgeConfigSchema,
  SkillFrontmatterSchema
} from './schema.js';

// Each mandatory section may be written in Spanish or English.
const REQUIRED_SECTIONS: Array<{ es: string; en: string }> = [
  { es: 'Propósito', en: 'Purpose' },
  { es: 'Cuándo activarse', en: 'When to Activate' },
  { es: 'Entradas esperadas', en: 'Expected Inputs' },
  { es: 'Proceso paso a paso', en: 'Step-by-Step Process' },
  { es: 'Reglas y restricciones', en: 'Rules and Constraints' },
  { es: 'Formato de salida', en: 'Output Format' },
  { es: 'Criterios de calidad', en: 'Quality Criteria' },
  { es: 'Qué no debe hacer el agente', en: 'What the Agent Must NOT Do' },
  { es: 'Ejemplos de uso', en: 'Usage Examples' }
];

function normalizeHeading(value: string): string {
  return stripAccents(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function findMissingSections(markdownBody: string): string[] {
  const headings = new Set(
    markdownBody
      .split('\n')
      .filter((line) => line.startsWith('## '))
      .map((line) => normalizeHeading(line.slice(3)))
  );

  return REQUIRED_SECTIONS.filter(
    (section) =>
      !headings.has(normalizeHeading(section.es)) && !headings.has(normalizeHeading(section.en))
  ).map((section) => section.es);
}

function stripFencedCodeBlocks(markdownBody: string): string {
  return markdownBody.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');
}

function extractReferencedPaths(markdownBody: string): string[] {
  const references = new Set<string>();

  const linkRegex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(markdownBody)) !== null) {
    const target = match[1]?.trim();
    if (
      target &&
      !target.startsWith('http://') &&
      !target.startsWith('https://') &&
      !target.startsWith('#') &&
      !target.startsWith('mailto:')
    ) {
      references.add(target.split('#')[0] ?? target);
    }
  }

  const inlineCodePathRegex = /`((?:references|tests|scripts|assets)\/[a-zA-Z0-9._/-]+)`/g;
  while ((match = inlineCodePathRegex.exec(markdownBody)) !== null) {
    if (match[1]) {
      references.add(match[1]);
    }
  }

  return Array.from(references);
}

export function validateSkill(skillPath: string): ValidationResult {
  const resolvedDir = path.resolve(skillPath);
  const folderName = path.basename(resolvedDir);
  const issues: ValidationIssue[] = [];

  const skillMdPath = path.join(resolvedDir, 'SKILL.md');
  if (!fileExists(skillMdPath)) {
    issues.push({
      code: 'MISSING_SKILL_MD',
      message: 'No se encontró el archivo obligatorio SKILL.md en el directorio del skill.',
      severity: 'error'
    });
    return { valid: false, skillPath: resolvedDir, issues };
  }

  const rawMarkdown = readFileSafe(skillMdPath);
  const { frontmatterRaw, body } = extractFrontmatter(rawMarkdown);

  if (frontmatterRaw === null) {
    issues.push({
      code: 'INVALID_FRONTMATTER',
      message: 'SKILL.md debe comenzar con un bloque YAML frontmatter válido delimitado por ---.',
      severity: 'error'
    });
    return { valid: false, skillPath: resolvedDir, issues };
  }

  let parsedYaml: Record<string, string>;
  try {
    parsedYaml = parseSimpleYamlFrontmatter(frontmatterRaw);
  } catch (err) {
    issues.push({
      code: 'YAML_PARSE_ERROR',
      message: err instanceof Error ? err.message : 'Error al parsear el YAML frontmatter.',
      severity: 'error'
    });
    return { valid: false, skillPath: resolvedDir, issues };
  }

  const rawName = parsedYaml['name'];
  const rawDescription = parsedYaml['description'];

  if (rawName === undefined) {
    issues.push({
      code: 'MISSING_NAME',
      message: 'El frontmatter de SKILL.md debe incluir la propiedad "name".',
      severity: 'error'
    });
  } else {
    if (rawName.length === 0 || rawName.length > 64) {
      issues.push({
        code: 'INVALID_NAME_LENGTH',
        message: 'El campo "name" debe tener entre 1 y 64 caracteres.',
        severity: 'error'
      });
    }
    if (!SKILL_NAME_REGEX.test(rawName)) {
      issues.push({
        code: 'INVALID_NAME_FORMAT',
        message: 'El campo "name" solo puede contener letras minúsculas, números y guiones.',
        severity: 'error'
      });
    }
    if (RESERVED_NAME_WORDS.some((reserved) => rawName.toLowerCase().includes(reserved))) {
      issues.push({
        code: 'RESERVED_NAME_WORD',
        message:
          'El campo "name" no puede incluir las palabras reservadas "anthropic" ni "claude".',
        severity: 'error'
      });
    }
    if (rawName !== folderName) {
      issues.push({
        code: 'NAME_FOLDER_MISMATCH',
        message: `El campo "name" ("${rawName}") debe coincidir exactamente con el nombre de la carpeta ("${folderName}").`,
        severity: 'error'
      });
    }
  }

  if (rawDescription === undefined || rawDescription.trim().length === 0) {
    issues.push({
      code: 'INVALID_DESCRIPTION_EMPTY',
      message: 'El campo "description" en el frontmatter no puede estar vacío.',
      severity: 'error'
    });
  } else if (rawDescription.length > 1024) {
    issues.push({
      code: 'INVALID_DESCRIPTION_LENGTH',
      message: 'El campo "description" no puede superar los 1.024 caracteres.',
      severity: 'error'
    });
  }

  const frontmatterCheck = SkillFrontmatterSchema.safeParse({
    name: rawName,
    description: rawDescription
  });

  if (body.length < 120 || !body.includes('## ')) {
    issues.push({
      code: 'INSUFFICIENT_BODY_INSTRUCTIONS',
      message:
        'El cuerpo de SKILL.md debe contener instrucciones estructuradas con encabezados Markdown (##) y pasos accionables.',
      severity: 'error'
    });
  }

  const bodyWithoutCode = stripFencedCodeBlocks(body);
  const missingSections = findMissingSections(bodyWithoutCode);
  if (missingSections.length > 0) {
    issues.push({
      code: 'MISSING_REQUIRED_SECTIONS',
      message: `SKILL.md no contiene las secciones obligatorias (## ...): ${missingSections.join(', ')}.`,
      severity: 'error'
    });
  }

  const referencedPaths = extractReferencedPaths(bodyWithoutCode);
  for (const refRelPath of referencedPaths) {
    const resolvedRef = path.join(resolvedDir, refRelPath);
    if (!fileExists(resolvedRef)) {
      issues.push({
        code: 'MISSING_REFERENCED_FILE',
        message: `El archivo referenciado "${refRelPath}" en SKILL.md no existe.`,
        severity: 'error'
      });
    }
  }

  const configPath = path.join(resolvedDir, 'skillforge.config.json');
  if (fileExists(configPath)) {
    try {
      const rawConfig = JSON.parse(readFileSafe(configPath)) as unknown;
      const configParse = SkillForgeConfigSchema.safeParse(rawConfig);
      if (!configParse.success) {
        for (const issue of configParse.error.issues) {
          issues.push({
            code: 'INVALID_CONFIG_SCHEMA',
            message: `skillforge.config.json inválido (${issue.path.join('.')}): ${issue.message}`,
            severity: 'error'
          });
        }
      } else if (rawName && configParse.data.name !== rawName) {
        issues.push({
          code: 'CONFIG_NAME_MISMATCH',
          message: `El nombre en skillforge.config.json ("${configParse.data.name}") no coincide con SKILL.md ("${rawName}").`,
          severity: 'error'
        });
      }
    } catch {
      issues.push({
        code: 'INVALID_CONFIG_JSON',
        message: 'El archivo skillforge.config.json no contiene JSON válido.',
        severity: 'error'
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    valid: !hasErrors && frontmatterCheck.success,
    skillPath: resolvedDir,
    frontmatter: frontmatterCheck.success ? frontmatterCheck.data : undefined,
    issues
  };
}
