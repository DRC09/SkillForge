# SkillForge

```text
   _____ __   _ ________ ______                    
  / ___// /__(_) / / ____/___  ________ ____ 
  \__ \/ //_/ / / / /_  / __ \/ ___/ _ `/ _ \
 ___/ / ,< / / / / __/ / /_/ / /  / /_/ /  __/
/____/_/|_/_/_/_/_/    \____/_/   \__, /\___/ 
                                 /____/       
```

> **Describe una habilidad en una frase. Obtén un skill versionado, validado e instalable para tu agente de código.**

[![npm version](https://img.shields.io/badge/npm-v0.1.0-cb3837?logo=npm)](https://www.npmjs.com/package/skillforge)
[![Tests](https://img.shields.io/badge/tests-30%20passed-2ea44f?logo=vitest)](https://github.com/DRC09/SkillForge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%20Strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**SkillForge** es una herramienta CLI open source que transforma descripciones en lenguaje natural en paquetes **Agent Skills** (`SKILL.md`, referencias, configuración tipada y pruebas de cobertura estática) 100% compatibles con el ecosistema `npx skills add`. Sin claves de API ni servicios de pago requeridos.

---

## Demo en terminal

```text
$ npx skillforge create "Crear un skill que revise Pull Requests de Next.js buscando problemas de rendimiento, accesibilidad y seguridad, y proponga parches concretos" --yes

✔ Skill nextjs-pr-reviewer creado y validado correctamente.
ℹ Categoría detectada: code-review
ℹ Directorio generado: ./nextjs-pr-reviewer
→ Archivos creados:
  - SKILL.md
  - README.md
  - skillforge.config.json
  - references/checklist.md
  - tests/cases.json

ℹ Para instalar este skill desde tu repositorio en GitHub ejecuta:
  npx skills add DRC09/SkillForge --skill nextjs-pr-reviewer
```

---

## Instalación

### Uso directo con `npx`

```bash
npx skillforge create "Tu descripción del skill"
```

### Instalación global

```bash
npm install -g skillforge
```

---

## Comandos

| Comando | Descripción |
|---|---|
| `skillforge create "<descripción>"` | Analiza la descripción con heurísticas locales, genera la estructura del skill y lo valida automáticamente. |
| `skillforge validate <ruta>` | Valida `SKILL.md`, frontmatter YAML, reglas de nombre, referencias a archivos y `skillforge.config.json`. |
| `skillforge test <ruta>` | Ejecuta evaluación estática de cobertura contra `tests/cases.json` y genera `skillforge-report.json`. |
| `skillforge pack <ruta>` | Valida y empaqueta el skill en `dist/<skill-name>.skillforge.zip` excluyendo archivos temporales y secretos. |
| `skillforge init [directorio]` | Crea un repositorio base `skillforge-skills` con un skill de ejemplo y un workflow de GitHub Actions. |

---

## Ejemplos de uso

### 1. Crear un skill para revisar Pull Requests de Next.js

```bash
npx skillforge create "Crear un skill que revise Pull Requests de Next.js buscando problemas de rendimiento, accesibilidad y seguridad, y proponga parches concretos"
```

### 2. Validar y probar un skill existente

```bash
npx skillforge validate ./skills/nextjs-pr-reviewer
npx skillforge test ./skills/nextjs-pr-reviewer
```

### 3. Empaquetar para distribución

```bash
npx skillforge pack ./skills/nextjs-pr-reviewer
# Genera: dist/nextjs-pr-reviewer.skillforge.zip
```

### 4. Inicializar un catálogo de skills para tu equipo

```bash
npx skillforge init
```

---

## Formato del Skill Generado

Cada skill generado sigue la estructura estándar compatible con `npx skills`:

```text
nextjs-pr-reviewer/
├── SKILL.md
├── README.md
├── skillforge.config.json
├── references/
│   └── checklist.md
└── tests/
    └── cases.json
```

El archivo `SKILL.md` incluye frontmatter YAML validado (`name` en kebab-case hasta 64 caracteres y `description` hasta 1.024 caracteres) seguido de secciones estructuradas: **Propósito**, **Cuándo activarse**, **Entradas esperadas**, **Proceso paso a paso**, **Reglas y restricciones**, **Formato de salida**, **Criterios de calidad**, **Qué no debe hacer el agente** y **Ejemplos de uso**.

---

## Cómo publicar un skill en GitHub e instalarlo con `npx skills add`

1. Inicializa tu repositorio de skills o añade la carpeta generada dentro de `skills/<skill-name>`:
   ```bash
   npx skillforge init
   cd skillforge-skills
   git init && git add . && git commit -m "feat: add initial agent skills"
   git remote add origin [https://github.com/](https://github.com/)<owner>/<repo>.git
   git push -u origin main
   ```
2. Cualquier desarrollador podrá instalar tu skill directamente en su agente (`Claude Code`, `Cursor`, `Codex`, etc.) ejecutando:
   ```bash
   npx skills add <owner>/<repo> --skill <skill-name>
   ```

---

## Roadmap

- [x] **v0.1.0 (MVP)**: Generación heurística offline en 11 categorías, validación estricta con Zod, evaluación estática de cobertura, empaquetado `.zip` y comando `init`.
- [ ] **v0.2.0**: Evaluación semántica opcional con LLMs locales (Ollama) y proveedores BYOK, modo `--watch` y catálogo comunitario de plantillas.
- [ ] **v0.3.0**: Publicación directa de releases en GitHub y benchmarking comparativo entre versiones de un mismo skill.

---

## Licencia

Distribuido bajo la licencia [MIT](./LICENSE).