# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-10-14

### Añadido

- `skillforge create --from-repo <path>`: inspección de un repositorio local (`src/generators/repo-inspector.ts`) que detecta gestor de paquetes, dependencias con versiones, scripts, archivos de configuración y soporte de TypeScript, e inyecta la sección `## Contexto Técnico del Repositorio` en `SKILL.md`, un ítem adicional en `references/checklist.md` y el bloque `repoContext` en `skillforge.config.json` (fusionando los frameworks detectados en `tags`, máximo 10).
- `skillforge create --provider <none|ollama|openai|anthropic>` y `--model <model>`: enriquecimiento opcional del `SKILL.md` (`src/generators/llm-enricher.ts`) con `fetch` nativo y un tiempo máximo de 8 segundos. Usa `OLLAMA_HOST`, `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`, y conserva siempre la plantilla heurística local si falta la clave, falla la red o la respuesta pierde el frontmatter, el `name` o alguna sección obligatoria, mostrando una advertencia.
- Evaluación estática semántica en `skillforge test`: coincidencia por texto exacto, raíz léxica (`stem`) y sinónimos bilingües (`synonym`), con el detalle por criterio en `matchDetails` dentro de `skillforge-report.json`.
- Modo `-w, --watch` en `skillforge validate` y `skillforge test` (`src/utils/watcher.ts`) con debounce de 250 ms; ignora `skillforge-report.json`, `.git` y `node_modules`.
- Comando `skillforge list [dir]` con las opciones `--templates` y `--json`.
- Comando `skillforge doctor [dir]`: comprueba Node.js >= 20, la carpeta `skills/` y la validez de los skills instalados.
- Campo opcional `repoContext` en `SkillForgeConfigSchema`; los `skillforge.config.json` de la v0.1.0 siguen siendo válidos.
- Nuevos tipos exportados: `LlmProvider`, `PackageManagerName`, `RepoContext`, `SkillSummaryItem` y `DoctorCheckResult`.
- La suite pasa de 36 a 85 pruebas automatizadas con Vitest.

### Cambiado

- `skillforge validate` exige ahora las 9 secciones obligatorias de `SKILL.md` (en español o inglés) y reporta el código `MISSING_REQUIRED_SECTIONS` si falta alguna.
- La versión de la herramienta pasa a `0.2.0`. No se añadieron dependencias nuevas.

### Corregido

- Los archivos con BOM UTF-8 o saltos de línea CRLF ya no rompen la detección del frontmatter.
- Las descripciones con comillas dobles o barras invertidas se escriben y se leen correctamente en el frontmatter YAML.
- El analizador heurístico ya no interpreta "de React" o "de Express" como migración si no hay un verbo de migración delante (`Optimizar rendimiento de React` se clasifica ahora como `performance`).
- Las referencias a archivos dentro de bloques de código de `SKILL.md` ya no se tratan como archivos que deban existir.

## [0.1.0] - 2026-10-13

### Añadido

- CLI completa con los comandos `create`, `validate`, `test`, `pack` e `init`.
- Motor heurístico local de detección de 11 categorías y generación de nombres en `kebab-case`.
- Plantillas especializadas en español e inglés para `code-review`, `debugging`, `documentation`, `framework-migration`, `accessibility`, `performance`, `security`, `seo`, `testing`, `repo-onboarding` y `refactoring`.
- Validador estricto de frontmatter YAML, nombres reservados, longitud de campos, archivos referenciados y `skillforge.config.json` con Zod.
- Evaluador estático de cobertura con generación de reporte `skillforge-report.json`.
- Empaquetador ZIP nativo sin dependencias externas que genera `dist/<skill-name>.skillforge.zip`.
- Skill de ejemplo funcional `skills/nextjs-pr-reviewer` y suite de 36 pruebas automatizadas con Vitest.
