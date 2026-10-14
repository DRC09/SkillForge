# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-13

### Añadido

- CLI completa con los comandos `create`, `validate`, `test`, `pack` e `init`.
- Motor heurístico local de detección de 11 categorías y generación de nombres en `kebab-case`.
- Plantillas especializadas en español e inglés para `code-review`, `debugging`, `documentation`, `framework-migration`, `accessibility`, `performance`, `security`, `seo`, `testing`, `repo-onboarding` y `refactoring`.
- Validador estricto de frontmatter YAML, nombres reservados, longitud de campos, archivos referenciados y `skillforge.config.json` con Zod.
- Evaluador estático de cobertura con generación de reporte `skillforge-report.json`.
- Empaquetador ZIP nativo sin dependencias externas que genera `dist/<skill-name>.skillforge.zip`.
- Skill de ejemplo funcional `skills/nextjs-pr-reviewer` y suite de 36 pruebas automatizadas con Vitest.
