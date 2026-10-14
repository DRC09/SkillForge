export type SkillCategory =
  | 'code-review'
  | 'debugging'
  | 'documentation'
  | 'framework-migration'
  | 'accessibility'
  | 'performance'
  | 'security'
  | 'seo'
  | 'testing'
  | 'repo-onboarding'
  | 'refactoring';

export type TargetAgent = 'claude-code' | 'cursor' | 'codex' | 'generic';

export type SkillLanguage = 'es' | 'en';

export type DetailLevel = 'basico' | 'estandar' | 'avanzado';

export interface SkillForgeConfig {
  schemaVersion: 1;
  name: string;
  category: SkillCategory;
  targetAgent: TargetAgent;
  language: SkillLanguage;
  version: string;
  author: string;
  license: string;
  tags: string[];
  entrypoint: string;
}

export interface CreateSkillOptions {
  description: string;
  name?: string;
  targetAgent?: TargetAgent;
  language?: SkillLanguage;
  detailLevel?: DetailLevel;
  outputDir?: string;
  author?: string;
}

export interface AnalyzedPrompt {
  suggestedName: string;
  primaryCategory: SkillCategory;
  secondaryCategories: SkillCategory[];
  tags: string[];
  detectedKeywords: string[];
}

export interface SkillFrontmatter {
  name: string;
  description: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  skillPath: string;
  frontmatter?: SkillFrontmatter;
  issues: ValidationIssue[];
}

export interface SkillTestCase {
  id?: string;
  name?: string;
  input: string;
  expectedBehavior: string;
  criteria: string[];
}

export interface SkillTestCaseResult {
  index: number;
  name: string;
  input: string;
  matchedCriteria: string[];
  missingCriteria: string[];
  score: number;
  passed: boolean;
}

export interface SkillTestReport {
  skillName: string;
  skillPath: string;
  timestamp: string;
  valid: boolean;
  totalCases: number;
  passedCases: number;
  coverageScore: number;
  passed: boolean;
  caseResults: SkillTestCaseResult[];
  validationIssues: ValidationIssue[];
}
