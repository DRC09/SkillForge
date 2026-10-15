import { LlmProvider } from '../types/index.js';
import { extractFrontmatter, parseSimpleYamlFrontmatter } from '../utils/string.js';

export interface EnrichmentInput {
  description: string;
  baseMarkdown: string;
  provider: LlmProvider;
  model?: string;
}

export interface EnrichmentResult {
  markdown: string;
  enriched: boolean;
  warning?: string;
}

const REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-5-5';
const ANTHROPIC_API_VERSION = '2023-06-01';
const ANTHROPIC_MAX_TOKENS = 4096;

const CONNECTION_WARNING =
  'No se pudo conectar al proveedor LLM; se mantuvo la generación heurística local.';
const STRUCTURE_WARNING =
  'La respuesta del proveedor LLM no conservó la estructura del skill; se mantuvo la generación heurística local.';

function buildPrompt(input: EnrichmentInput): string {
  return [
    'Eres un experto en redacción de Agent Skills para agentes de código.',
    'Mejora el siguiente archivo SKILL.md haciendo sus instrucciones más concretas y accionables.',
    '',
    'Reglas estrictas:',
    '- Conserva exactamente el bloque frontmatter YAML inicial delimitado por ---, sin cambiar "name".',
    '- Conserva todos los encabezados de segundo nivel (##) con el mismo texto y en el mismo orden.',
    '- Conserva las referencias a references/checklist.md y tests/cases.json.',
    '- No inventes archivos nuevos ni agregues secciones ajenas al original.',
    '- Responde únicamente con el contenido completo del SKILL.md, sin explicaciones ni bloques de código envolventes.',
    '',
    `Descripción original del skill: ${input.description}`,
    '',
    'SKILL.md actual:',
    '',
    input.baseMarkdown
  ].join('\n');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as unknown;
}

async function requestOllama(prompt: string, model: string | undefined): Promise<string> {
  const host = process.env['OLLAMA_HOST'] ?? DEFAULT_OLLAMA_HOST;
  const data = await postJson(
    `${host}/api/generate`,
    {},
    { model: model ?? DEFAULT_OLLAMA_MODEL, prompt, stream: false }
  );
  if (!isRecord(data) || typeof data['response'] !== 'string') {
    throw new Error('Unexpected Ollama response shape');
  }
  return data['response'];
}

async function requestOpenAi(
  prompt: string,
  model: string | undefined,
  apiKey: string
): Promise<string> {
  const data = await postJson(
    'https://api.openai.com/v1/chat/completions',
    { Authorization: `Bearer ${apiKey}` },
    {
      model: model ?? DEFAULT_OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }]
    }
  );
  const choices = isRecord(data) ? data['choices'] : undefined;
  const first: unknown = Array.isArray(choices) ? choices[0] : undefined;
  const message = isRecord(first) ? first['message'] : undefined;
  const content = isRecord(message) ? message['content'] : undefined;
  if (typeof content !== 'string') {
    throw new Error('Unexpected OpenAI response shape');
  }
  return content;
}

async function requestAnthropic(
  prompt: string,
  model: string | undefined,
  apiKey: string
): Promise<string> {
  const data = await postJson(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_API_VERSION },
    {
      model: model ?? DEFAULT_ANTHROPIC_MODEL,
      max_tokens: ANTHROPIC_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }]
    }
  );
  const blocks = isRecord(data) ? data['content'] : undefined;
  const first: unknown = Array.isArray(blocks) ? blocks[0] : undefined;
  const text = isRecord(first) ? first['text'] : undefined;
  if (typeof text !== 'string') {
    throw new Error('Unexpected Anthropic response shape');
  }
  return text;
}

// Models sometimes wrap the whole answer in a Markdown code fence; unwrap it.
function unwrapCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const match = /^```[a-zA-Z]*\n([\s\S]*?)\n```$/.exec(trimmed);
  return match?.[1] ?? trimmed;
}

function parseFrontmatterName(markdown: string): string | null {
  const { frontmatterRaw } = extractFrontmatter(markdown);
  if (frontmatterRaw === null) {
    return null;
  }
  try {
    const parsed = parseSimpleYamlFrontmatter(frontmatterRaw);
    const name = parsed['name'];
    const description = parsed['description'];
    return name && description && description.trim().length > 0 ? name : null;
  } catch {
    return null;
  }
}

function listSecondLevelHeadings(markdown: string): string[] {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3).trim());
}

export async function enrichSkillMarkdownIfRequested(
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  if (input.provider === 'none') {
    return { markdown: input.baseMarkdown, enriched: false };
  }

  let apiKey = '';
  if (input.provider === 'openai') {
    apiKey = process.env['OPENAI_API_KEY'] ?? '';
    if (!apiKey) {
      return {
        markdown: input.baseMarkdown,
        enriched: false,
        warning: 'OPENAI_API_KEY no definida; se usó la plantilla heurística local.'
      };
    }
  } else if (input.provider === 'anthropic') {
    apiKey = process.env['ANTHROPIC_API_KEY'] ?? '';
    if (!apiKey) {
      return {
        markdown: input.baseMarkdown,
        enriched: false,
        warning: 'ANTHROPIC_API_KEY no definida; se usó la plantilla heurística local.'
      };
    }
  }

  const fallback = (warning: string): EnrichmentResult => ({
    markdown: input.baseMarkdown,
    enriched: false,
    warning
  });

  let candidate: string;
  try {
    const prompt = buildPrompt(input);
    if (input.provider === 'ollama') {
      candidate = await requestOllama(prompt, input.model);
    } else if (input.provider === 'openai') {
      candidate = await requestOpenAi(prompt, input.model, apiKey);
    } else {
      candidate = await requestAnthropic(prompt, input.model, apiKey);
    }
  } catch {
    return fallback(CONNECTION_WARNING);
  }

  const enrichedMarkdown = unwrapCodeFence(candidate);
  const baseName = parseFrontmatterName(input.baseMarkdown);
  const enrichedName = parseFrontmatterName(enrichedMarkdown);
  if (enrichedName === null || (baseName !== null && enrichedName !== baseName)) {
    return fallback(CONNECTION_WARNING);
  }

  const enrichedHeadings = new Set(listSecondLevelHeadings(enrichedMarkdown));
  const missingHeading = listSecondLevelHeadings(input.baseMarkdown).some(
    (heading) => !enrichedHeadings.has(heading)
  );
  if (missingHeading) {
    return fallback(STRUCTURE_WARNING);
  }

  return { markdown: `${enrichedMarkdown}\n`, enriched: true };
}
