import { z } from 'zod';

export const SKILL_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_NAME_WORDS = ['anthropic', 'claude'];

export const SkillCategorySchema = z.enum([
  'code-review',
  'debugging',
  'documentation',
  'framework-migration',
  'accessibility',
  'performance',
  'security',
  'seo',
  'testing',
  'repo-onboarding',
  'refactoring'
]);

export const TargetAgentSchema = z.enum(['claude-code', 'cursor', 'codex', 'generic']);

export const SkillLanguageSchema = z.enum(['es', 'en']);

export const PackageManagerSchema = z.enum(['npm', 'pnpm', 'yarn', 'bun']);

export const SkillNameSchema = z
  .string()
  .min(1, 'El campo "name" no puede estar vacío.')
  .max(64, 'El campo "name" debe tener como máximo 64 caracteres.')
  .regex(
    SKILL_NAME_REGEX,
    'El campo "name" solo puede usar minúsculas, números y guiones simples (kebab-case).'
  )
  .refine(
    (val) => !RESERVED_NAME_WORDS.some((word) => val.toLowerCase().includes(word)),
    'El campo "name" no puede incluir las palabras reservadas "anthropic" ni "claude".'
  );

export const SkillDescriptionSchema = z
  .string()
  .trim()
  .min(1, 'El campo "description" no puede estar vacío.')
  .max(1024, 'El campo "description" debe tener como máximo 1.024 caracteres.');

export const SkillFrontmatterSchema = z.object({
  name: SkillNameSchema,
  description: SkillDescriptionSchema
});

export const SkillForgeConfigSchema = z.object({
  schemaVersion: z.literal(1),
  name: SkillNameSchema,
  category: SkillCategorySchema,
  targetAgent: TargetAgentSchema,
  language: SkillLanguageSchema,
  version: z.string().min(1),
  author: z.string(),
  license: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  entrypoint: z.string().min(1),
  repoContext: z
    .object({
      frameworks: z.array(z.string()),
      packageManager: PackageManagerSchema,
      hasTypeScript: z.boolean()
    })
    .optional()
});

export const SkillTestCaseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  input: z.string().trim().min(1, 'Cada caso debe tener un "input" no vacío.'),
  expectedBehavior: z
    .string()
    .trim()
    .min(1, 'Cada caso debe tener un "expectedBehavior" no vacío.'),
  criteria: z
    .array(z.string().trim().min(1))
    .min(1, 'Cada caso debe incluir al menos un criterio medible en "criteria".')
});

export const SkillTestSuiteSchema = z
  .array(SkillTestCaseSchema)
  .min(1, 'El archivo tests/cases.json debe contener al menos un caso de prueba.');
