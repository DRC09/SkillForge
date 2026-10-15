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

[![npm version](https://img.shields.io/badge/npm-v0.2.0-cb3837?logo=npm)](https://www.npmjs.com/package/skillforge)
[![Tests](https://img.shields.io/badge/tests-85%20passed-2ea44f?logo=vitest)](https://github.com/DRC09/SkillForge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7%20Strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**SkillForge** es una herramienta CLI open source que transforma descripciones en lenguaje natural en paquetes **Agent Skills** (`SKILL.md`, referencias, configuración tipada y pruebas de cobertura estática) 100% compatibles con el ecosistema `npx skills add`. Sin claves de API ni servicios de pago requeridos: el enriquecimiento con un LLM es opcional y está desactivado por defecto.

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

| Comando                             | Descripción                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `skillforge create "<descripción>"` | Analiza la descripción con heurísticas locales, genera la estructura del skill y lo valida automáticamente.            |
| `skillforge validate <ruta>`        | Valida `SKILL.md`, frontmatter YAML, reglas de nombre, referencias a archivos y `skillforge.config.json`.              |
| `skillforge test <ruta>`            | Ejecuta evaluación estática de cobertura contra `tests/cases.json` y genera `skillforge-report.json`.                  |
| `skillforge pack <ruta>`            | Valida y empaqueta el skill en `dist/<skill-name>.skillforge.zip` excluyendo archivos temporales y secretos.           |
| `skillforge init [directorio]`      | Crea un repositorio base `skillforge-skills` con un skill de ejemplo y un workflow de GitHub Actions.                  |
| `skillforge list [dir]`             | Lista los skills de un directorio (por defecto `./skills`) con categoría, versión, idioma, agente y estado de validez. |
| `skillforge doctor [dir]`           | Diagnostica el entorno: versión de Node.js, carpeta `skills/` y validez de los skills instalados.                      |

### Opciones

| Comando            | Opción                  | Descripción                                                                                    |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| `create`           | `-n, --name <name>`     | Nombre corto del skill en kebab-case.                                                          |
| `create`           | `-a, --agent <agent>`   | Agente objetivo: `claude-code`, `cursor`, `codex` o `generic`.                                 |
| `create`           | `-l, --lang <lang>`     | Idioma del skill: `es` o `en`.                                                                 |
| `create`           | `-d, --level <level>`   | Nivel de detalle: `basico`, `estandar` o `avanzado`.                                           |
| `create`           | `-o, --out <dir>`       | Directorio de salida donde se creará la carpeta del skill.                                     |
| `create`           | `-y, --yes`             | Omite las preguntas interactivas y usa los valores detectados.                                 |
| `create`           | `--from-repo <path>`    | Inspecciona un repositorio local e inyecta su stack, versiones y scripts en el skill.          |
| `create`           | `--provider <provider>` | Proveedor opcional de enriquecimiento: `none` (por defecto), `ollama`, `openai` o `anthropic`. |
| `create`           | `--model <model>`       | Modelo opcional cuando se utiliza `--provider`.                                                |
| `validate`, `test` | `-w, --watch`           | Observa los cambios del skill y vuelve a ejecutar la acción automáticamente.                   |
| `list`             | `--templates`           | Muestra las 11 categorías de plantillas disponibles.                                           |
| `list`             | `--json`                | Imprime el resultado en formato JSON.                                                          |

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

### 5. Inyectar el contexto de un repositorio real

```bash
npx skillforge create "Revisar Pull Requests de este proyecto" --from-repo ./mi-proyecto
```

SkillForge lee el `package.json` y los archivos de configuración del repositorio, detecta el gestor de paquetes (`npm`, `pnpm`, `yarn` o `bun`), los frameworks y herramientas (`nextjs`, `react`, `vue`, `astro`, `zod`, `vitest`, `jest`, `playwright`, `tailwind`, `prisma`, `typescript`, etc.) y los scripts disponibles. Con eso añade la sección `## Contexto Técnico del Repositorio` a `SKILL.md`, un ítem extra en `references/checklist.md` y un bloque `repoContext` en `skillforge.config.json`.

### 6. Enriquecer el `SKILL.md` con un LLM (opcional)

```bash
npx skillforge create "Auditar seguridad de endpoints Node.js" --provider ollama --model llama3.2
```

| Proveedor   | Requisitos                                                                  | Modelo por defecto |
| ----------- | --------------------------------------------------------------------------- | ------------------ |
| `ollama`    | Servidor local en `http://127.0.0.1:11434` (configurable con `OLLAMA_HOST`) | `llama3.2`         |
| `openai`    | Variable de entorno `OPENAI_API_KEY`                                        | `gpt-4o-mini`      |
| `anthropic` | Variable de entorno `ANTHROPIC_API_KEY`                                     | `claude-haiku-5-5` |

El enriquecimiento usa únicamente `fetch` nativo de Node.js (sin SDKs) con un tiempo máximo de 8 segundos por petición. Es siempre seguro: si falta la clave, el proveedor no responde o la respuesta pierde el frontmatter, el `name` o alguna sección obligatoria, se conserva la plantilla heurística local y se muestra una advertencia. El resultado siempre se valida igual que cualquier otro skill.

### 7. Modo `--watch`

```bash
npx skillforge validate ./skills/nextjs-pr-reviewer --watch
npx skillforge test ./skills/nextjs-pr-reviewer --watch
```

Ejecuta la acción una vez y la repite cada vez que cambia un archivo del skill (con 250 ms de debounce). Ignora `skillforge-report.json`, `.git` y `node_modules`. Presiona `Ctrl+C` para salir.

### 8. Listar skills y diagnosticar el entorno

```bash
npx skillforge list                 # tabla con los skills de ./skills
npx skillforge list ./skills --json # mismo resultado en JSON
npx skillforge list --templates     # las 11 plantillas disponibles
npx skillforge doctor               # Node.js >= 20, carpeta skills/ y validez de los skills
```

`doctor` termina con código `0` si todo está en orden y `1` si detecta algún problema.

### Evaluación estática semántica

`skillforge test` reconoce cada criterio de `tests/cases.json` de tres formas, registradas en `matchDetails` dentro de `skillforge-report.json`:

- `exact`: el texto aparece tal cual (sin distinguir acentos ni mayúsculas).
- `stem`: coincide por raíz léxica (por ejemplo, `optimizaciones` con `optimización`).
- `synonym`: aparece un término equivalente bilingüe (por ejemplo, `performance` con `rendimiento`).

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
   git remote add origin https://github.com/<owner>/<repo>.git
   git push -u origin main
   ```
2. Cualquier desarrollador podrá instalar tu skill directamente en su agente (`Claude Code`, `Cursor`, `Codex`, etc.) ejecutando:
   ```bash
   npx skills add <owner>/<repo> --skill <skill-name>
   ```

---

## Roadmap

- [x] **v0.1.0 (MVP)**: Generación heurística offline en 11 categorías, validación estricta con Zod, evaluación estática de cobertura, empaquetado `.zip` y comando `init`.
- [x] **v0.2.0**: Inyección del contexto de un repositorio (`--from-repo`), enriquecimiento opcional con Ollama, OpenAI o Anthropic (`--provider`, `--model`), evaluación estática por raíz léxica y sinónimos, modo `--watch` y los comandos `list` y `doctor`.
- [ ] **v0.3.0**: Catálogo comunitario de plantillas, publicación directa de releases en GitHub y benchmarking comparativo entre versiones de un mismo skill.

---

## Licencia

Distribuido bajo la licencia [MIT](./LICENSE).
