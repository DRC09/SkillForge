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

export type LlmProvider = 'none' | 'ollama' | 'openai' | 'anthropic';

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface RepoContext {
  projectName: string;
  packageManager: PackageManagerName;
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  detectedFrameworks: string[];
  configFiles: string[];
  hasTypeScript: boolean;
}

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
  repoContext?: {
    frameworks: string[];
    packageManager: PackageManagerName;
    hasTypeScript: boolean;
  };
}

export interface CreateSkillOptions {
  description: string;
  name?: string;
  targetAgent?: TargetAgent;
  language?: SkillLanguage;
  detailLevel?: DetailLevel;
  outputDir?: string;
  author?: string;
  fromRepo?: string;
  provider?: LlmProvider;
  model?: string;
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
  matchDetails?: Array<{
    criterion: string;
    matched: boolean;
    matchType: 'exact' | 'stem' | 'synonym' | 'none';
  }>;
}

export interface SkillSummaryItem {
  name: string;
  path: string;
  category: string;
  version: string;
  language: string;
  targetAgent: string;
  valid: boolean;
}

export interface DoctorCheckResult {
  check: string;
  passed: boolean;
  detail: string;
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
