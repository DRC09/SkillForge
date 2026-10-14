import {
  DetailLevel,
  SkillCategory,
  SkillLanguage,
  SkillTestCase,
  TargetAgent
} from '../types/index.js';

export interface CategoryTemplateData {
  category: SkillCategory;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  triggersEs: string[];
  triggersEn: string[];
  inputsEs: string[];
  inputsEn: string[];
  stepsEs: string[];
  stepsEn: string[];
  rulesEs: string[];
  rulesEn: string[];
  qualityCriteriaEs: string[];
  qualityCriteriaEn: string[];
  antiPatternsEs: string[];
  antiPatternsEn: string[];
  checklistItemsEs: string[];
  checklistItemsEn: string[];
  defaultCasesEs: SkillTestCase[];
  defaultCasesEn: SkillTestCase[];
}

export const CATEGORY_TEMPLATES: Record<SkillCategory, CategoryTemplateData> = {
  'code-review': {
    category: 'code-review',
    titleEs: 'Auditoría y Revisión Estructurada de Código / Pull Requests',
    titleEn: 'Structured Code and Pull Request Review',
    summaryEs:
      'Analiza diffs y archivos modificados para detectar regresiones funcionales, problemas de rendimiento, accesibilidad y vulnerabilidades de seguridad con parches accionables.',
    summaryEn:
      'Analyzes diffs and modified files to detect functional regressions, performance bottlenecks, accessibility gaps, and security risks with actionable patches.',
    triggersEs: [
      'Cuando el usuario solicita revisar un Pull Request, commit o diff de código.',
      'Antes de fusionar ramas hacia main/production en proyectos críticos.',
      'Cuando se requiere validación cruzada de rendimiento, accesibilidad (WCAG) y seguridad (OWASP).'
    ],
    triggersEn: [
      'When the user asks to review a Pull Request, commit, or code diff.',
      'Before merging feature branches into main/production.',
      'When cross-checking performance, accessibility (WCAG), and security (OWASP) is required.'
    ],
    inputsEs: [
      'Diff del Pull Request (`git diff`) o lista de archivos modificados.',
      'Contexto del framework o arquitectura del proyecto (por ejemplo, Next.js App Router, React, Node.js).',
      'Restricciones del repositorio o convenciones del equipo.'
    ],
    inputsEn: [
      'Pull Request diff (`git diff`) or list of modified files.',
      'Framework or project architecture context (e.g., Next.js App Router, React, Node.js).',
      'Repository constraints or team conventions.'
    ],
    stepsEs: [
      'Inspeccionar la lista de archivos afectados y clasificar cambios por capa (UI, servidor, datos, configuración).',
      'Evaluar el impacto en rendimiento: hidratación innecesaria, uso excesivo de `"use client"`, consultas N+1 y tamaño de bundle.',
      'Auditar accesibilidad en componentes interactivos: roles ARIA, navegación por teclado, etiquetas semánticas y contraste.',
      'Verificar superficie de seguridad: validación de entradas con esquemas, exposición de secretos, Server Actions, cabeceras y XSS/CSRF.',
      'Consultar `references/checklist.md` para confirmar que ningún punto crítico quede sin revisar.',
      'Redactar hallazgos citando archivo, línea aproximada, nivel de severidad, riesgo real y bloque de código con el parche concreto.'
    ],
    stepsEn: [
      'Inspect affected files and classify changes by layer (UI, server, data, configuration).',
      'Evaluate performance impact: unnecessary hydration, overusing `"use client"`, N+1 queries, and bundle size.',
      'Audit accessibility in interactive components: ARIA roles, keyboard navigation, semantic tags, and contrast.',
      'Verify security surface: input schema validation, secret exposure, Server Actions, headers, and XSS/CSRF.',
      'Check `references/checklist.md` to confirm all critical review items are covered.',
      'Write findings citing file path, severity level, concrete risk, and a ready-to-apply code patch.'
    ],
    rulesEs: [
      'Citar siempre el archivo afectado y la evidencia exacta del código antes de emitir una recomendación.',
      'Priorizar hallazgos en cuatro niveles: `CRÍTICO`, `ALTO`, `MEDIO` y `BAJO`.',
      'Proporcionar un parche de código concreto (`diff` o bloque reemplazo) para cada hallazgo `CRÍTICO` o `ALTO`.',
      'Verificar explícitamente directivas de servidor/cliente, fugas de variables de entorno y atributos de accesibilidad.'
    ],
    rulesEn: [
      'Always cite the affected file and exact code evidence before issuing a recommendation.',
      'Prioritize findings into four severity levels: `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW`.',
      'Provide a concrete code patch (`diff` or replacement block) for every `CRITICAL` or `HIGH` finding.',
      'Explicitly verify server/client boundaries, environment variable leaks, and accessibility attributes.'
    ],
    qualityCriteriaEs: [
      'Cada hallazgo incluye ruta del archivo, explicación técnica del riesgo y parche verificable.',
      'Cero falsos positivos genéricos sin referencia al código analizado.',
      'Cobertura explícita de rendimiento, accesibilidad y seguridad en el resumen ejecutivo.'
    ],
    qualityCriteriaEn: [
      'Every finding includes file path, technical risk explanation, and verifiable code patch.',
      'Zero generic false positives without reference to the analyzed code.',
      'Explicit coverage of performance, accessibility, and security in the executive summary.'
    ],
    antiPatternsEs: [
      'No emitir comentarios vagos como "mejora este componente" sin mostrar el parche exacto.',
      'No aprobar un Pull Request sin verificar antes la exposición de datos sensibles o errores de tipado.',
      'No reescribir archivos completos si el cambio requiere únicamente un parche focalizado.'
    ],
    antiPatternsEn: [
      'Do not output vague comments without showing the exact code patch.',
      'Do not approve a Pull Request without checking sensitive data exposure or type safety.',
      'Do not rewrite entire files when a focused patch solves the issue.'
    ],
    checklistItemsEs: [
      '[Rendimiento] Verificar que los componentes sean Server Components por defecto y limitar `"use client"` a hojas interactivas.',
      '[Rendimiento] Comprobar optimización de imágenes (`next/image`), fuentes y estrategias de caché/revalidación.',
      '[Accesibilidad] Validar que botones, modales y formularios tengan etiquetas semánticas, `aria-label` y soporte de teclado.',
      '[Seguridad] Confirmar validación con Zod en Server Actions y Route Handlers antes de procesar datos.',
      '[Seguridad] Asegurar que ninguna clave privada se filtre con prefijo `NEXT_PUBLIC_` ni en respuestas al cliente.'
    ],
    checklistItemsEn: [
      '[Performance] Verify Server Components by default and restrict `"use client"` to interactive leaf nodes.',
      '[Performance] Check image optimization (`next/image`), fonts, and caching/revalidation strategies.',
      '[Accessibility] Validate semantic labels, `aria-label`, and keyboard support on interactive controls.',
      '[Security] Confirm Zod validation on Server Actions and Route Handlers before processing inputs.',
      '[Security] Ensure no private secret is leaked via `NEXT_PUBLIC_` or serialized props.'
    ],
    defaultCasesEs: [
      {
        id: 'case-1',
        name: 'Detección de uso excesivo de use client y problemas de rendimiento',
        input:
          'PR que añade "use client" en el layout raíz e importa una librería pesada sin carga diferida.',
        expectedBehavior:
          'Identificar el impacto en rendimiento e hidratación, citar el archivo afectado y proponer parche moviendo "use client" a un subcomponente.',
        criteria: ['rendimiento', 'use client', 'hidratación', 'parche', 'archivo']
      },
      {
        id: 'case-2',
        name: 'Auditoría de accesibilidad en controles interactivos',
        input:
          'Componente de modal e icono interactivo construido con div onClick sin roles ARIA ni soporte de teclado.',
        expectedBehavior:
          'Reportar hallazgo de accesibilidad WCAG, exigir etiquetas semánticas o roles ARIA y navegación por teclado con parche concreto.',
        criteria: ['accesibilidad', 'ARIA', 'teclado', 'semánticas', 'parche']
      },
      {
        id: 'case-3',
        name: 'Prevención de vulnerabilidades de seguridad y exposición de secretos',
        input:
          'Server Action que inserta datos sin validar esquema y expone clave privada en cliente.',
        expectedBehavior:
          'Marcar severidad CRÍTICO en seguridad, requerir validación de entradas con Zod y eliminar exposición de secretos.',
        criteria: ['seguridad', 'CRÍTICO', 'Zod', 'secretos', 'Server Actions']
      },
      {
        id: 'case-4',
        name: 'Priorización por severidad y evidencia por archivo',
        input: 'Diff con múltiples cambios en rutas, estilos y utilidades de servidor.',
        expectedBehavior:
          'Clasificar hallazgos en niveles CRÍTICO, ALTO, MEDIO y BAJO citando el archivo afectado y el riesgo técnico.',
        criteria: ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO', 'evidencia']
      },
      {
        id: 'case-5',
        name: 'Verificación con lista de control de referencia',
        input: 'Solicitud de revisión integral de Pull Request antes de producción.',
        expectedBehavior:
          'Ejecutar revisión paso a paso apoyándose en references/checklist.md y entregar veredicto estructurado.',
        criteria: ['references/checklist.md', 'rendimiento', 'accesibilidad', 'seguridad']
      }
    ],
    defaultCasesEn: [
      {
        id: 'case-1',
        name: 'Detecting unnecessary client boundary and performance regressions',
        input: 'PR adding "use client" to a root page and importing heavy libraries.',
        expectedBehavior:
          'Flag performance and hydration impact, cite affected file, and provide a concrete patch.',
        criteria: ['performance', 'use client', 'hydration', 'patch', 'file']
      },
      {
        id: 'case-2',
        name: 'Accessibility audit on interactive elements',
        input: 'Clickable div without ARIA attributes or keyboard handlers.',
        expectedBehavior:
          'Report accessibility issue and provide semantic HTML, ARIA roles, and keyboard support patch.',
        criteria: ['accessibility', 'ARIA', 'keyboard', 'semantic', 'patch']
      },
      {
        id: 'case-3',
        name: 'Security validation on Server Actions and secrets',
        input: 'Server Action accepting raw unvalidated input and exposing secrets.',
        expectedBehavior:
          'Flag CRITICAL security risk, require Zod validation, and prevent secret exposure.',
        criteria: ['security', 'CRITICAL', 'Zod', 'secret', 'Server Actions']
      }
    ]
  },
  debugging: {
    category: 'debugging',
    titleEs: 'Diagnóstico Sistemático y Resolución de Bugs (Causa Raíz)',
    titleEn: 'Systematic Debugging and Root Cause Analysis',
    summaryEs:
      'Aísla fallos reproducibles, analiza trazas de error, formula hipótesis verificables y aplica correcciones mínimas con pruebas de regresión.',
    summaryEn:
      'Isolates reproducible failures, analyzes stack traces, formulates testable hypotheses, and applies minimal fixes with regression tests.',
    triggersEs: [
      'Cuando ocurre una excepción en tiempo de ejecución, fallo de compilación o test roto.',
      'Cuando existe un comportamiento inesperado o condición de carrera en producción.'
    ],
    triggersEn: [
      'When a runtime exception, build failure, or broken test occurs.',
      'When unexpected behavior or race conditions appear in production.'
    ],
    inputsEs: [
      'Stack trace completo, logs de error o salida del test fallido.',
      'Pasos de reproducción y archivos involucrados en el flujo.'
    ],
    inputsEn: [
      'Full stack trace, error logs, or failing test output.',
      'Reproduction steps and files involved in the execution flow.'
    ],
    stepsEs: [
      'Analizar el stack trace e identificar el punto exacto de fallo (archivo, función y línea).',
      'Reconstruir el flujo de datos de entrada y estado previo a la excepción.',
      'Formular hasta 3 hipótesis ordenadas por probabilidad y descartar con evidencia en el código.',
      'Validar los puntos de control de `references/checklist.md` para aislar efectos secundarios.',
      'Aplicar el parche mínimo que corrige la causa raíz y añadir un test de regresión.'
    ],
    stepsEn: [
      'Analyze the stack trace and pinpoint the exact failure location (file, function, line).',
      'Reconstruct input data flow and state prior to the exception.',
      'Formulate up to 3 ranked hypotheses and falsify them using code evidence.',
      'Check `references/checklist.md` to rule out side effects.',
      'Apply a minimal root-cause fix and add a regression test.'
    ],
    rulesEs: [
      'No aplicar parches superficiales (`try/catch` silenciosos) que oculten la causa raíz.',
      'Explicar por qué ocurrió el bug antes de proponer el cambio de código.',
      'Incluir siempre un caso de prueba que falle antes del parche y pase después.'
    ],
    rulesEn: [
      'Never apply silent `try/catch` bandages that hide the root cause.',
      'Explain why the bug occurred before proposing the code change.',
      'Always include a test case that fails before the fix and passes after.'
    ],
    qualityCriteriaEs: [
      'Causa raíz demostrada con referencia exacta al archivo y línea.',
      'Parche mínimo sin efectos colaterales en módulos no relacionados.',
      'Test de regresión incluido en la respuesta.'
    ],
    qualityCriteriaEn: [
      'Root cause demonstrated with exact file and line reference.',
      'Minimal patch with zero side effects on unrelated modules.',
      'Regression test included in the output.'
    ],
    antiPatternsEs: [
      'No adivinar cambios al azar sin analizar antes el stack trace y el flujo de estado.',
      'No desactivar reglas de tipos (`any`, `@ts-ignore`) para silenciar un fallo.'
    ],
    antiPatternsEn: [
      'Do not guess random changes without tracing state and stack trace first.',
      'Do not disable type safety (`any`, `@ts-ignore`) to silence errors.'
    ],
    checklistItemsEs: [
      'Reproducir el error de forma determinista con los datos de entrada proporcionados.',
      'Verificar valores nulos/indefinidos, promesas no manejadas y mutaciones de estado.',
      'Confirmar que el test de regresión cubre el caso borde detectado.'
    ],
    checklistItemsEn: [
      'Reproduce the error deterministically with provided inputs.',
      'Check null/undefined values, unhandled promises, and state mutations.',
      'Confirm the regression test covers the detected edge case.'
    ],
    defaultCasesEs: [
      {
        id: 'debug-1',
        name: 'Análisis de stack trace y causa raíz',
        input: 'TypeError: Cannot read properties of undefined en controlador asíncrono.',
        expectedBehavior:
          'Identificar archivo y línea en el stack trace, explicar la causa raíz y proponer parche mínimo con test de regresión.',
        criteria: ['stack trace', 'causa raíz', 'archivo', 'parche', 'regresión']
      },
      {
        id: 'debug-2',
        name: 'Prevención de parches silenciosos',
        input: 'Fallo intermitente por condición de carrera en petición de red.',
        expectedBehavior:
          'Formular hipótesis, evitar try/catch silenciosos y consultar references/checklist.md.',
        criteria: ['hipótesis', 'try/catch', 'references/checklist.md']
      },
      {
        id: 'debug-3',
        name: 'Verificación con pruebas de regresión',
        input: 'Función de cálculo falla con entradas negativas o bordes vacíos.',
        expectedBehavior:
          'Entregar evidencia del flujo de datos, corrección exacta y caso de prueba de regresión.',
        criteria: ['evidencia', 'flujo de datos', 'regresión']
      }
    ],
    defaultCasesEn: [
      {
        id: 'debug-1',
        name: 'Stack trace and root cause isolation',
        input: 'Unhandled rejection in async handler.',
        expectedBehavior:
          'Pinpoint file and root cause in stack trace and provide a regression test.',
        criteria: ['stack trace', 'root cause', 'regression', 'references/checklist.md']
      }
    ]
  },
  documentation: {
    category: 'documentation',
    titleEs: 'Generación y Auditoría de Documentación Técnica Ejecutable',
    titleEn: 'Executable Technical Documentation Generation and Audit',
    summaryEs:
      'Produce documentación técnica precisa (README, APIs, arquitectura, TSDoc) sincronizada con las firmas reales del código y ejemplos verificables.',
    summaryEn:
      'Produces accurate technical documentation (README, APIs, architecture, TSDoc) synchronized with real code signatures and verifiable examples.',
    triggersEs: [
      'Cuando se crean nuevos módulos, endpoints, paquetes CLI o SDKs sin documentar.',
      'Cuando la documentación existente ha quedado desfasada respecto al código fuente.'
    ],
    triggersEn: [
      'When new modules, endpoints, CLI packages, or SDKs need documentation.',
      'When existing documentation is out of sync with the source code.'
    ],
    inputsEs: [
      'Archivos de código fuente, esquemas de tipos, `package.json` o rutas de API.',
      'Audiencia objetivo (desarrolladores internos, usuarios del paquete, integradores).'
    ],
    inputsEn: [
      'Source code files, type schemas, `package.json`, or API routes.',
      'Target audience (internal engineers, package users, integrators).'
    ],
    stepsEs: [
      'Extraer firmas públicas, tipos de entrada/salida, variables de entorno y comandos reales del código.',
      'Estructurar el documento con instalación rápida, arquitectura, ejemplos copiables y tabla de parámetros.',
      'Verificar contra `references/checklist.md` que todos los comandos y ejemplos coincidan con el código.',
      'Documentar casos de error comunes y guía de resolución de problemas.'
    ],
    stepsEn: [
      'Extract public signatures, input/output types, environment variables, and real CLI commands.',
      'Structure the document with quickstart, architecture, copy-pasteable examples, and parameter tables.',
      'Verify against `references/checklist.md` that all commands and examples match the code.',
      'Document common error cases and troubleshooting steps.'
    ],
    rulesEs: [
      'Nunca inventar flags, endpoints o parámetros que no existan en el código fuente.',
      'Incluir bloques de código completos con tipos reales y salidas esperadas.',
      'Mantener tablas claras para opciones, argumentos y variables de entorno.'
    ],
    rulesEn: [
      'Never invent flags, endpoints, or parameters that do not exist in the source code.',
      'Include complete code blocks with real types and expected outputs.',
      'Maintain clear tables for options, arguments, and environment variables.'
    ],
    qualityCriteriaEs: [
      '100% de las funciones o comandos públicos documentados con tipos exactos.',
      'Ejemplos de código sintácticamente válidos y ejecutables.',
      'Cero discrepancias entre `package.json`/código y los comandos del documento.'
    ],
    qualityCriteriaEn: [
      '100% of public functions or commands documented with exact types.',
      'Syntactically valid and executable code examples.',
      'Zero discrepancies between source code and documented commands.'
    ],
    antiPatternsEs: [
      'No redactar descripciones tautológicas como "la función getUser obtiene el usuario" sin detallar parámetros y errores.',
      'No dejar placeholders sin completar en bloques de comando.'
    ],
    antiPatternsEn: [
      'Do not write tautological descriptions without detailing parameters and error states.',
      'Do not leave incomplete placeholders in command blocks.'
    ],
    checklistItemsEs: [
      'Comprobar que cada comando documentado exista en `package.json` o en el parser CLI.',
      'Incluir requisitos previos de versión de runtime y variables de entorno.',
      'Añadir ejemplos de entrada/salida y códigos de estado o retorno.'
    ],
    checklistItemsEn: [
      'Verify every documented command exists in `package.json` or the CLI parser.',
      'Include runtime version prerequisites and environment variables.',
      'Add input/output examples and return/status codes.'
    ],
    defaultCasesEs: [
      {
        id: 'doc-1',
        name: 'Sincronización estricta con firmas del código fuente',
        input:
          'Módulo TypeScript con funciones exportadas, opciones tipadas y posibles excepciones.',
        expectedBehavior:
          'Documentar firmas públicas, tabla de parámetros y ejemplos verificables usando references/checklist.md.',
        criteria: ['firmas', 'parámetros', 'ejemplos', 'references/checklist.md']
      },
      {
        id: 'doc-2',
        name: 'Prohibición de parámetros inventados',
        input: 'CLI con tres comandos definidos en package.json.',
        expectedBehavior:
          'Generar guía de instalación y comandos exactos sin inventar flags inexistentes.',
        criteria: ['package.json', 'comandos', 'flags', 'instalación']
      },
      {
        id: 'doc-3',
        name: 'Inclusión de errores y resolución de problemas',
        input: 'API REST que devuelve códigos de error de validación.',
        expectedBehavior:
          'Incluir ejemplos de respuesta, variables de entorno y sección de errores comunes.',
        criteria: ['variables de entorno', 'errores', 'ejemplos']
      }
    ],
    defaultCasesEn: [
      {
        id: 'doc-1',
        name: 'Strict synchronization with code signatures',
        input: 'TypeScript SDK module with exported functions.',
        expectedBehavior:
          'Document public signatures, parameter tables, and check references/checklist.md.',
        criteria: ['signatures', 'parameter', 'examples', 'references/checklist.md']
      }
    ]
  },
  'framework-migration': {
    category: 'framework-migration',
    titleEs: 'Migración Incremental y Segura de Frameworks y Versiones',
    titleEn: 'Safe Incremental Framework and Version Migration',
    summaryEs:
      'Planifica y ejecuta migraciones incrementales entre frameworks o versiones mayores (por ejemplo, Next.js Pages a App Router) preservando compatibilidad y tests.',
    summaryEn:
      'Plans and executes incremental migrations between frameworks or major versions while preserving compatibility and tests.',
    triggersEs: [
      'Cuando se actualiza una versión mayor de un framework o librería principal.',
      'Cuando se migra arquitectura (por ejemplo, Pages Router a App Router, CommonJS a ESM).'
    ],
    triggersEn: [
      'When upgrading a major version of a core framework or library.',
      'When migrating architecture (e.g., Pages Router to App Router, CommonJS to ESM).'
    ],
    inputsEs: [
      '`package.json`, configuración de compilación y archivos representativos del patrón actual.',
      'Versión o arquitectura destino y restricciones de despliegue.'
    ],
    inputsEn: [
      '`package.json`, build configuration, and representative files of the current pattern.',
      'Target version or architecture and deployment constraints.'
    ],
    stepsEs: [
      'Inventariar dependencias, APIs obsoletas (breaking changes) y archivos afectados.',
      'Diseñar una estrategia de coexistencia incremental por rutas o módulos.',
      'Transformar el código aplicando los equivalentes modernos y verificando `references/checklist.md`.',
      'Ejecutar verificación de tipos, tests existentes y pruebas de humo tras cada lote migrado.'
    ],
    stepsEn: [
      'Inventory dependencies, deprecated APIs (breaking changes), and affected files.',
      'Design an incremental coexistence strategy by route or module.',
      'Transform code to modern equivalents while checking `references/checklist.md`.',
      'Run typechecking, existing tests, and smoke checks after each migrated batch.'
    ],
    rulesEs: [
      'Priorizar migración incremental módulo por módulo sobre reescrituras masivas ("big bang").',
      'Documentar cada breaking change detectado y su reemplazo exacto antes de modificar archivos.',
      'Preservar contratos de API, URLs públicas y comportamiento funcional existente.'
    ],
    rulesEn: [
      'Prioritize module-by-module incremental migration over big-bang rewrites.',
      'Document every breaking change and its exact replacement before editing files.',
      'Preserve public API contracts, URLs, and existing functional behavior.'
    ],
    qualityCriteriaEs: [
      'Plan de migración por fases con riesgos y plan de rollback por lote.',
      'Transformaciones de código completas con antes/después verificable.',
      'Verificación de tipos y tests en verde al finalizar cada fase.'
    ],
    qualityCriteriaEn: [
      'Phased migration plan with risks and rollback strategy per batch.',
      'Complete before/after code transformations.',
      'Green typechecks and tests at the end of each phase.'
    ],
    antiPatternsEs: [
      'No migrar decenas de archivos simultáneamente sin validar el compilador entre pasos.',
      'No eliminar tests antiguos sin haber validado su equivalente en la nueva arquitectura.'
    ],
    antiPatternsEn: [
      'Do not migrate dozens of files simultaneously without validating the build between steps.',
      'Do not delete legacy tests before validating their equivalent in the new architecture.'
    ],
    checklistItemsEs: [
      'Identificar todos los breaking changes entre versión origen y destino.',
      'Verificar compatibilidad de dependencias de terceros con la versión objetivo.',
      'Garantizar plan de rollback limpio y paridad funcional.'
    ],
    checklistItemsEn: [
      'Identify all breaking changes between source and target versions.',
      'Verify third-party dependency compatibility with target version.',
      'Ensure clean rollback path and functional parity.'
    ],
    defaultCasesEs: [
      {
        id: 'mig-1',
        name: 'Plan incremental y detección de breaking changes',
        input: 'Proyecto que migra de versión mayor con APIs obsoletas.',
        expectedBehavior:
          'Inventariar breaking changes, proponer migración incremental por fases y consultar references/checklist.md.',
        criteria: ['breaking changes', 'incremental', 'references/checklist.md', 'archivos']
      },
      {
        id: 'mig-2',
        name: 'Preservación de contratos y plan de rollback',
        input: 'Cambio de enrutador en aplicación en producción.',
        expectedBehavior:
          'Preservar contratos de API y URLs públicas e incluir estrategia de rollback.',
        criteria: ['contratos', 'URLs', 'rollback', 'tests']
      },
      {
        id: 'mig-3',
        name: 'Rechazo de reescrituras big bang',
        input: 'Solicitud para reescribir todo el repositorio en un solo paso sin pruebas.',
        expectedBehavior:
          'Evitar big bang, dividir por módulos y exigir verificación de tipos tras cada lote.',
        criteria: ['big bang', 'módulo', 'tipos']
      }
    ],
    defaultCasesEn: [
      {
        id: 'mig-1',
        name: 'Incremental migration and breaking changes',
        input: 'Major framework upgrade with deprecated APIs.',
        expectedBehavior:
          'List breaking changes, design incremental phases, and check references/checklist.md.',
        criteria: ['breaking changes', 'incremental', 'references/checklist.md', 'rollback']
      }
    ]
  },
  accessibility: {
    category: 'accessibility',
    titleEs: 'Auditoría y Remediación de Accesibilidad Web (WCAG 2.2 AA)',
    titleEn: 'Web Accessibility Audit and Remediation (WCAG 2.2 AA)',
    summaryEs:
      'Evalúa e implementa mejoras de accesibilidad conforme a WCAG 2.2 AA: HTML semántico, atributos ARIA, gestión de foco, teclado y contraste.',
    summaryEn:
      'Evaluates and implements WCAG 2.2 AA accessibility improvements: semantic HTML, ARIA attributes, focus management, keyboard navigation, and contrast.',
    triggersEs: [
      'Cuando se construyen o auditan componentes de interfaz, formularios, modales o menús.',
      'Cuando se requiere cumplimiento WCAG 2.2 AA y soporte completo para lectores de pantalla.'
    ],
    triggersEn: [
      'When building or auditing UI components, forms, modals, or menus.',
      'When WCAG 2.2 AA compliance and screen reader support are required.'
    ],
    inputsEs: [
      'Código JSX/TSX/HTML y hojas de estilo o clases de los componentes.',
      'Flujos de interacción del usuario (apertura de diálogos, validación de errores, navegación).'
    ],
    inputsEn: [
      'JSX/TSX/HTML code and component styles or utility classes.',
      'User interaction flows (dialogs, form error validation, navigation).'
    ],
    stepsEs: [
      'Reemplazar contenedores genéricos (`div`, `span`) interactivos por elementos semánticos nativos (`button`, `nav`, `main`, `dialog`).',
      'Verificar navegación completa por teclado (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`) y trampas de foco en modales.',
      'Validar atributos ARIA (`aria-label`, `aria-expanded`, `aria-live`, `aria-invalid`) y asociación explícita de `label` con `input`.',
      'Contrastar cada componente con `references/checklist.md` y entregar el parche corregido.'
    ],
    stepsEn: [
      'Replace interactive generic containers (`div`, `span`) with native semantic elements (`button`, `nav`, `main`, `dialog`).',
      'Verify full keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`) and focus traps in modals.',
      'Validate ARIA attributes (`aria-label`, `aria-expanded`, `aria-live`, `aria-invalid`) and explicit `label`/`input` pairing.',
      'Check each component against `references/checklist.md` and deliver the remediated patch.'
    ],
    rulesEs: [
      'Priorizar HTML semántico nativo antes de añadir roles ARIA (primera regla de ARIA).',
      'Garantizar indicador de foco visible (`:focus-visible`) en todos los elementos interactivos.',
      'Asociar mensajes de error de formulario mediante `aria-describedby` y regiones `aria-live`.'
    ],
    rulesEn: [
      'Prefer native semantic HTML before adding ARIA roles (First Rule of ARIA).',
      'Guarantee visible focus indicators (`:focus-visible`) on all interactive elements.',
      'Associate form error messages using `aria-describedby` and `aria-live` regions.'
    ],
    qualityCriteriaEs: [
      'Todos los controles interactivos son operables exclusivamente con teclado.',
      'Cero elementos interactivos sin nombre accesible o etiqueta asociada.',
      'Criterio WCAG citado para cada hallazgo reportado.'
    ],
    qualityCriteriaEn: [
      'All interactive controls are operable via keyboard alone.',
      'Zero interactive elements without an accessible name or associated label.',
      'WCAG criterion cited for every reported finding.'
    ],
    antiPatternsEs: [
      'No usar `outline: none` sin proporcionar un indicador `:focus-visible` alternativo de alto contraste.',
      'No añadir `role="button"` a un `div` cuando se puede usar la etiqueta nativa `button`.'
    ],
    antiPatternsEn: [
      'Do not use `outline: none` without providing a high-contrast `:focus-visible` alternative.',
      'Do not add `role="button"` to a `div` when a native `button` element can be used.'
    ],
    checklistItemsEs: [
      'HTML semántico nativo en botones, enlaces, encabezados jerárquicos y regiones landmark.',
      'Soporte de teclado (`Tab`, `Enter`, `Escape`) y orden lógico de tabulación.',
      'Contraste mínimo 4.5:1 en texto normal y 3:1 en componentes gráficos (WCAG 2.2 AA).'
    ],
    checklistItemsEn: [
      'Native semantic HTML on buttons, links, hierarchical headings, and landmark regions.',
      'Keyboard support (`Tab`, `Enter`, `Escape`) and logical tab order.',
      'Minimum 4.5:1 contrast ratio for normal text and 3:1 for UI components (WCAG 2.2 AA).'
    ],
    defaultCasesEs: [
      {
        id: 'a11y-1',
        name: 'Conversión a HTML semántico y soporte de teclado',
        input: 'Botón personalizado creado con div onClick sin soporte para Enter ni Space.',
        expectedBehavior:
          'Reemplazar div por elemento semántico button, asegurar navegación por teclado y revisar references/checklist.md.',
        criteria: ['semántico', 'button', 'teclado', 'references/checklist.md']
      },
      {
        id: 'a11y-2',
        name: 'Validación de formularios con atributos ARIA',
        input:
          'Input de formulario sin label asociado ni anuncio de error para lector de pantalla.',
        expectedBehavior:
          'Asociar label explícito, añadir aria-invalid, aria-describedby y región aria-live.',
        criteria: ['label', 'aria-describedby', 'aria-live', 'WCAG']
      },
      {
        id: 'a11y-3',
        name: 'Preservación del indicador de foco visible',
        input: 'Hoja CSS que elimina el outline en todos los botones.',
        expectedBehavior:
          'Prohibir outline: none sin reemplazo y exigir :focus-visible con contraste adecuado.',
        criteria: ['outline: none', ':focus-visible', 'contraste']
      }
    ],
    defaultCasesEn: [
      {
        id: 'a11y-1',
        name: 'Semantic HTML and keyboard accessibility',
        input: 'Custom clickable div acting as a modal trigger.',
        expectedBehavior:
          'Replace with semantic button, ensure keyboard navigation and check references/checklist.md.',
        criteria: ['semantic', 'button', 'keyboard', 'references/checklist.md']
      }
    ]
  },
  performance: {
    category: 'performance',
    titleEs: 'Optimización de Rendimiento Web, Backend y Core Web Vitals',
    titleEn: 'Web, Backend, and Core Web Vitals Performance Optimization',
    summaryEs:
      'Detecta cuellos de botella de CPU, memoria, red, renderizado y consultas a base de datos, proponiendo optimizaciones medibles.',
    summaryEn:
      'Detects CPU, memory, network, rendering, and database bottlenecks, proposing measurable optimizations.',
    triggersEs: [
      'Cuando existen problemas de latencia, alto tiempo de carga (LCP/INP) o consumo excesivo de recursos.',
      'Cuando se busca reducir el tamaño del bundle JavaScript o eliminar re-renderizados y consultas N+1.'
    ],
    triggersEn: [
      'When facing high latency, slow load times (LCP/INP), or excessive resource consumption.',
      'When reducing JavaScript bundle size or eliminating re-renders and N+1 queries.'
    ],
    inputsEs: [
      'Componentes, consultas de datos, configuración de empaquetado o perfiles de ejecución.',
      'Métricas actuales o presupuestos de rendimiento objetivo.'
    ],
    inputsEn: [
      'Components, data queries, bundler config, or execution profiles.',
      'Current metrics or target performance budgets.'
    ],
    stepsEs: [
      'Identificar la ruta crítica de renderizado o ejecución y localizar operaciones bloqueantes.',
      'Auditar cascadas de peticiones (waterfalls), consultas N+1 y serialización de payloads excesivos.',
      'Analizar el tamaño de dependencias importadas en el cliente y aplicar carga diferida o ejecución en servidor.',
      'Contrastar con `references/checklist.md` y estimar la mejora esperada en latencia o tamaño de bundle.'
    ],
    stepsEn: [
      'Identify the critical rendering or execution path and locate blocking operations.',
      'Audit request waterfalls, N+1 queries, and oversized payload serialization.',
      'Analyze client-side imported dependencies and apply lazy loading or server execution.',
      'Check `references/checklist.md` and estimate expected improvement in latency or bundle size.'
    ],
    rulesEs: [
      'Justificar cada optimización explicando el cuello de botella exacto y la métrica impactada (LCP, INP, TTFB, memoria).',
      'Eliminar cascadas secuenciales (`await` en serie independientes) reemplazándolas por ejecución paralela (`Promise.all`).',
      'Evitar micro-optimizaciones prematuras que degraden la legibilidad sin impacto medible.'
    ],
    rulesEn: [
      'Justify every optimization by explaining the exact bottleneck and impacted metric (LCP, INP, TTFB, memory).',
      'Eliminate sequential waterfalls of independent awaits using parallel execution (`Promise.all`).',
      'Avoid premature micro-optimizations that hurt readability without measurable impact.'
    ],
    qualityCriteriaEs: [
      'Cada cambio identifica la complejidad o coste antes y después del parche.',
      'Eliminación verificable de cascadas de red o consultas redundantes.',
      'Cumplimiento de los puntos críticos de `references/checklist.md`.'
    ],
    qualityCriteriaEn: [
      'Every change identifies cost or complexity before and after the patch.',
      'Verifiable removal of network waterfalls or redundant queries.',
      'Compliance with critical items in `references/checklist.md`.'
    ],
    antiPatternsEs: [
      'No envolver cada función en `useMemo`/`useCallback` sin demostrar un coste real de cómputo o referencia.',
      'No importar librerías completas en el cliente cuando solo se utiliza una utilidad aislada.'
    ],
    antiPatternsEn: [
      'Do not wrap every function in `useMemo`/`useCallback` without proving real compute or referential cost.',
      'Do not import entire libraries on the client when only a single utility is needed.'
    ],
    checklistItemsEs: [
      'Paralelizar peticiones independientes con `Promise.all` y eliminar consultas N+1.',
      'Minimizar JavaScript enviado al navegador y priorizar recursos críticos (LCP, INP, CLS).',
      'Configurar cabeceras de caché, paginación e índices en consultas frecuentes.'
    ],
    checklistItemsEn: [
      'Parallelize independent requests with `Promise.all` and eliminate N+1 queries.',
      'Minimize client-side JavaScript and prioritize critical assets (LCP, INP, CLS).',
      'Configure caching headers, pagination, and indexes on frequent queries.'
    ],
    defaultCasesEs: [
      {
        id: 'perf-1',
        name: 'Eliminación de cascadas de red y consultas N+1',
        input:
          'Endpoint que ejecuta tres awaits independientes en serie y una consulta dentro de un bucle.',
        expectedBehavior:
          'Detectar cascada y consulta N+1, aplicar Promise.all y revisar references/checklist.md.',
        criteria: ['Promise.all', 'N+1', 'cascadas', 'references/checklist.md']
      },
      {
        id: 'perf-2',
        name: 'Optimización de bundle y métricas Core Web Vitals',
        input: 'Página con alto LCP e INP por importar librerías pesadas en el cliente.',
        expectedBehavior:
          'Reducir tamaño de bundle aplicando carga diferida o ejecución en servidor citando LCP e INP.',
        criteria: ['bundle', 'LCP', 'INP', 'carga diferida']
      },
      {
        id: 'perf-3',
        name: 'Rechazo de micro-optimizaciones sin evidencia',
        input: 'Código simple al que se pretende añadir memoización indiscriminada.',
        expectedBehavior:
          'Evitar micro-optimizaciones prematuras y centrarse en cuellos de botella medibles.',
        criteria: ['micro-optimizaciones', 'cuellos de botella', 'métrica']
      }
    ],
    defaultCasesEn: [
      {
        id: 'perf-1',
        name: 'Eliminating network waterfalls and N+1 queries',
        input: 'Handler running sequential independent awaits and loop queries.',
        expectedBehavior: 'Use Promise.all, fix N+1 queries, and verify references/checklist.md.',
        criteria: ['Promise.all', 'N+1', 'waterfalls', 'references/checklist.md']
      }
    ]
  },
  security: {
    category: 'security',
    titleEs: 'Auditoría de Seguridad de Aplicaciones y Mitigación OWASP',
    titleEn: 'Application Security Audit and OWASP Mitigation',
    summaryEs:
      'Audita el código en busca de vulnerabilidades OWASP Top 10, inyecciones, fallos de autenticación/autorización, exposición de secretos y dependencias inseguras.',
    summaryEn:
      'Audits code for OWASP Top 10 vulnerabilities, injections, auth flaws, secret exposure, and insecure dependencies.',
    triggersEs: [
      'Cuando se implementan flujos de autenticación, pagos, subida de archivos o endpoints públicos.',
      'Cuando se solicita una auditoría de seguridad o revisión de superficie de ataque.'
    ],
    triggersEn: [
      'When implementing authentication, payments, file uploads, or public endpoints.',
      'When a security audit or attack surface review is requested.'
    ],
    inputsEs: [
      'Controladores, middlewares, consultas a base de datos, manejo de sesiones y configuración.',
      'Modelo de permisos y orígenes de datos no confiables.'
    ],
    inputsEn: [
      'Controllers, middleware, database queries, session handling, and configuration.',
      'Permission model and untrusted data sources.'
    ],
    stepsEs: [
      'Trazar todas las fuentes de entrada no confiables (body, query, headers, parámetros, webhooks).',
      'Verificar validación estricta de esquemas (Zod), parametrización de consultas y sanitización de salida contra XSS/SQLi.',
      'Comprobar controles de autenticación y autorización a nivel de recurso (prevención de IDOR/BOLA).',
      'Auditar gestión de secretos, cabeceras HTTP (CSP, HSTS, CORS) y `references/checklist.md`.'
    ],
    stepsEn: [
      'Trace all untrusted input sources (body, query, headers, params, webhooks).',
      'Verify strict schema validation (Zod), query parameterization, and output sanitization against XSS/SQLi.',
      'Check authentication and object-level authorization controls (IDOR/BOLA prevention).',
      'Audit secret management, HTTP security headers (CSP, HSTS, CORS), and `references/checklist.md`.'
    ],
    rulesEs: [
      'Tratar toda entrada externa como maliciosa por defecto hasta ser validada con un esquema estricto.',
      'Prohibir concatenación directa de strings en consultas SQL o comandos de sistema operativo.',
      'Clasificar cada vulnerabilidad con su categoría OWASP, vector de explotación y parche inmediato.'
    ],
    rulesEn: [
      'Treat all external input as untrusted until validated with a strict schema.',
      'Forbid direct string concatenation in SQL queries or OS commands.',
      'Classify every vulnerability with its OWASP category, exploit vector, and immediate patch.'
    ],
    qualityCriteriaEs: [
      'Cada vulnerabilidad incluye vector de ataque, impacto y código remediado seguro.',
      'Validación de autorización verificada en cada mutación de datos.',
      'Cero secretos hardcodeados o expuestos al cliente.'
    ],
    qualityCriteriaEn: [
      'Every vulnerability includes attack vector, impact, and remediated secure code.',
      'Authorization checks verified on every data mutation.',
      'Zero hardcoded or client-exposed secrets.'
    ],
    antiPatternsEs: [
      'No confiar en validaciones ejecutadas únicamente en el navegador o cliente.',
      'No exponer trazas internas del servidor o detalles de base de datos en respuestas HTTP de error.'
    ],
    antiPatternsEn: [
      'Do not rely on client-only validation.',
      'Do not leak internal server stack traces or database details in HTTP error responses.'
    ],
    checklistItemsEs: [
      'Validación de esquemas en servidor (Zod) y consultas parametrizadas contra inyección.',
      'Control de acceso por recurso (prevención de IDOR) y sesiones seguras (`HttpOnly`, `Secure`, `SameSite`).',
      'Protección contra XSS, CSRF, SSRF y filtración de variables privadas.'
    ],
    checklistItemsEn: [
      'Server-side schema validation (Zod) and parameterized queries against injection.',
      'Object-level access control (IDOR prevention) and secure cookies (`HttpOnly`, `Secure`, `SameSite`).',
      'Protection against XSS, CSRF, SSRF, and private environment variable leaks.'
    ],
    defaultCasesEs: [
      {
        id: 'sec-1',
        name: 'Prevención de inyección y validación con esquemas',
        input: 'Endpoint que concatena parámetros de usuario en una consulta SQL sin validar.',
        expectedBehavior:
          'Reportar vulnerabilidad OWASP de inyección, exigir consultas parametrizadas y validación con Zod siguiendo references/checklist.md.',
        criteria: ['OWASP', 'inyección', 'parametrizadas', 'Zod', 'references/checklist.md']
      },
      {
        id: 'sec-2',
        name: 'Control de autorización contra IDOR y gestión de secretos',
        input:
          'Ruta que devuelve documentos por ID sin comprobar el propietario y expone clave en código.',
        expectedBehavior:
          'Detectar riesgo de autorización IDOR y exposición de secretos, proporcionando parche seguro.',
        criteria: ['IDOR', 'autorización', 'secretos', 'parche']
      },
      {
        id: 'sec-3',
        name: 'Mitigación de XSS, CSRF y cabeceras HTTP',
        input:
          'Aplicación que renderiza HTML sin sanitizar y carece de políticas CSP y cookies HttpOnly.',
        expectedBehavior:
          'Exigir sanitización contra XSS, protección CSRF y configuración de CSP y HttpOnly.',
        criteria: ['XSS', 'CSRF', 'CSP', 'HttpOnly']
      }
    ],
    defaultCasesEn: [
      {
        id: 'sec-1',
        name: 'Injection prevention and schema validation',
        input: 'Handler concatenating raw user input into SQL query.',
        expectedBehavior:
          'Flag OWASP injection risk, require parameterized queries, Zod validation, and check references/checklist.md.',
        criteria: ['OWASP', 'parameterized', 'Zod', 'references/checklist.md']
      }
    ]
  },
  seo: {
    category: 'seo',
    titleEs: 'Auditoría e Implementación de SEO Técnico y Datos Estructurados',
    titleEn: 'Technical SEO and Structured Data Audit and Implementation',
    summaryEs:
      'Optimiza indexabilidad, metadatos dinámicos, OpenGraph, etiquetas canónicas, sitemaps, jerarquía semántica y datos estructurados JSON-LD.',
    summaryEn:
      'Optimizes indexability, dynamic metadata, OpenGraph, canonical tags, sitemaps, semantic heading hierarchy, and JSON-LD structured data.',
    triggersEs: [
      'Cuando se crean páginas públicas, blogs, e-commerce o landing pages orientadas a buscadores.',
      'Cuando se audita indexación, metadatos o visibilidad en motores de búsqueda.'
    ],
    triggersEn: [
      'When building public pages, blogs, e-commerce, or search-facing landing pages.',
      'When auditing indexing, metadata, or search engine visibility.'
    ],
    inputsEs: [
      'Plantillas de página, configuración de metadatos (`generateMetadata` / `head`), `robots.txt` y `sitemap`.',
      'Palabras clave principales y tipo de entidad de negocio (Article, Product, Organization).'
    ],
    inputsEn: [
      'Page templates, metadata configuration (`generateMetadata` / `head`), `robots.txt`, and `sitemap`.',
      'Primary keywords and business entity schema type (Article, Product, Organization).'
    ],
    stepsEs: [
      'Auditar etiquetas `title`, `meta description`, `canonical` y directivas `robots` en cada ruta indexable.',
      'Verificar jerarquía única de encabezados (`h1` único por vista, secuencia lógica `h2` -> `h3`) y HTML semántico.',
      'Implementar metadatos OpenGraph/Twitter Cards y bloques de datos estructurados `JSON-LD` (`schema.org`).',
      'Validar contra `references/checklist.md` que las rutas dinámicas se incluyan en `sitemap.xml` y se rendericen en servidor (SSR/SSG).'
    ],
    stepsEn: [
      'Audit `title`, `meta description`, `canonical`, and `robots` directives on every indexable route.',
      'Verify heading hierarchy (single `h1` per view, logical `h2` -> `h3` sequence) and semantic HTML.',
      'Implement OpenGraph/Twitter Cards metadata and `JSON-LD` (`schema.org`) structured data blocks.',
      'Validate against `references/checklist.md` that dynamic routes are in `sitemap.xml` and server-rendered (SSR/SSG).'
    ],
    rulesEs: [
      'Garantizar que el contenido crítico para SEO se entregue renderizado desde el servidor (SSR/SSG) y no dependa solo de JS en cliente.',
      'Definir siempre URL canónica explícita para evitar penalizaciones por contenido duplicado.',
      'Validar que el bloque `JSON-LD` cumpla las propiedades obligatorias de `schema.org`.'
    ],
    rulesEn: [
      'Ensure SEO-critical content is server-rendered (SSR/SSG) rather than client-only JS.',
      'Always define an explicit canonical URL to prevent duplicate content penalties.',
      'Validate that `JSON-LD` blocks include required `schema.org` properties.'
    ],
    qualityCriteriaEs: [
      'Metadatos completos (`title`, `description`, `canonical`, `openGraph`) listos para copiar.',
      'Esquema `JSON-LD` válido incluido según el tipo de página.',
      'Jerarquía de encabezados y atributos `alt` en imágenes verificados.'
    ],
    qualityCriteriaEn: [
      'Complete metadata (`title`, `description`, `canonical`, `openGraph`) ready to apply.',
      'Valid `JSON-LD` schema included for the page type.',
      'Heading hierarchy and image `alt` attributes verified.'
    ],
    antiPatternsEs: [
      'No incluir múltiples etiquetas `h1` desconectadas ni omitir `meta description`.',
      'No bloquear recursos CSS/JS necesarios para el renderizado en `robots.txt`.'
    ],
    antiPatternsEn: [
      'Do not include multiple disconnected `h1` tags or omit `meta description`.',
      'Do not block rendering-critical CSS/JS assets in `robots.txt`.'
    ],
    checklistItemsEs: [
      'Título único (50-60 caracteres), descripción (120-160 caracteres) y URL `canonical` por ruta.',
      'Metadatos OpenGraph completos y bloque `JSON-LD` (`schema.org`) válido.',
      'Renderizado en servidor (SSR/SSG), jerarquía `h1` única y `sitemap.xml` actualizado.'
    ],
    checklistItemsEn: [
      'Unique title (50-60 chars), description (120-160 chars), and `canonical` URL per route.',
      'Complete OpenGraph metadata and valid `JSON-LD` (`schema.org`) block.',
      'Server rendering (SSR/SSG), single `h1` hierarchy, and updated `sitemap.xml`.'
    ],
    defaultCasesEs: [
      {
        id: 'seo-1',
        name: 'Metadatos completos, URL canónica y OpenGraph',
        input: 'Página pública de producto sin metadatos ni etiqueta canonical.',
        expectedBehavior:
          'Generar title, meta description, canonical y OpenGraph verificando references/checklist.md.',
        criteria: ['title', 'canonical', 'OpenGraph', 'references/checklist.md']
      },
      {
        id: 'seo-2',
        name: 'Datos estructurados JSON-LD y jerarquía h1',
        input: 'Artículo de blog con múltiples h1 y sin datos estructurados.',
        expectedBehavior:
          'Corregir jerarquía a un h1 único e inyectar bloque JSON-LD de schema.org.',
        criteria: ['h1', 'JSON-LD', 'schema.org']
      },
      {
        id: 'seo-3',
        name: 'Indexabilidad SSR/SSG y sitemap',
        input: 'Rutas dinámicas renderizadas solo en cliente y ausentes en sitemap.',
        expectedBehavior:
          'Recomendar renderizado en servidor (SSR/SSG) e inclusión en sitemap.xml y robots.txt.',
        criteria: ['SSR/SSG', 'sitemap.xml', 'robots.txt']
      }
    ],
    defaultCasesEn: [
      {
        id: 'seo-1',
        name: 'Metadata, canonical URL, and JSON-LD',
        input: 'Public landing page missing metadata and structured data.',
        expectedBehavior:
          'Add title, canonical, OpenGraph, JSON-LD, and check references/checklist.md.',
        criteria: ['canonical', 'OpenGraph', 'JSON-LD', 'references/checklist.md']
      }
    ]
  },
  testing: {
    category: 'testing',
    titleEs: 'Diseño de Suites de Pruebas Automatizadas (Unitarias, Integración y E2E)',
    titleEn: 'Automated Test Suite Design (Unit, Integration, and E2E)',
    summaryEs:
      'Diseña e implementa pruebas deterministas con alta cobertura de casos borde, manejo de errores y aislamiento de dependencias externas.',
    summaryEn:
      'Designs and implements deterministic tests covering happy paths, edge cases, error handling, and isolated external dependencies.',
    triggersEs: [
      'Cuando se añade lógica de negocio nueva sin cobertura de tests automatizados.',
      'Cuando se solicita crear pruebas con Vitest, Jest, Playwright o Testing Library.'
    ],
    triggersEn: [
      'When new business logic is added without automated test coverage.',
      'When creating tests with Vitest, Jest, Playwright, or Testing Library is requested.'
    ],
    inputsEs: [
      'Código fuente del módulo bajo prueba y sus dependencias.',
      'Runner de pruebas del proyecto (por ejemplo, Vitest) y contratos esperados.'
    ],
    inputsEn: [
      'Source code of the module under test and its dependencies.',
      'Project test runner (e.g., Vitest) and expected contracts.'
    ],
    stepsEs: [
      'Identificar todas las ramas de ejecución: camino feliz, valores límite (casos borde) y lanzamiento de errores.',
      'Estructurar cada prueba con el patrón `Arrange - Act - Assert` (AAA) y nombres descriptivos.',
      'Aislar efectos secundarios externos (reloj, red, sistema de archivos) con dobles de prueba o directorios temporales limpios.',
      'Verificar contra `references/checklist.md` que las aserciones validen resultados observables y no detalles internos frágiles.'
    ],
    stepsEn: [
      'Identify all execution branches: happy path, boundary values (edge cases), and error throws.',
      'Structure every test using the `Arrange - Act - Assert` (AAA) pattern and descriptive names.',
      'Isolate external side effects (clock, network, filesystem) using fakes/mocks or clean temp directories.',
      'Verify against `references/checklist.md` that assertions test observable outcomes rather than fragile internals.'
    ],
    rulesEs: [
      'Garantizar que las pruebas sean 100% deterministas e independientes del orden de ejecución.',
      'Incluir siempre pruebas para entradas inválidas, valores vacíos y manejo de excepciones.',
      'Limpiar cualquier recurso temporal (`afterEach`) para evitar contaminación entre tests.'
    ],
    rulesEn: [
      'Ensure tests are 100% deterministic and independent of execution order.',
      'Always include tests for invalid inputs, empty values, and exception handling.',
      'Clean up any temporary state (`afterEach`) to prevent cross-test pollution.'
    ],
    qualityCriteriaEs: [
      'Cobertura explícita de camino feliz, casos borde y estados de error.',
      'Cero dependencia de red real o tiempos de espera arbitrarios (`sleep`).',
      'Código de prueba compilable y ejecutable directamente con el runner del proyecto.'
    ],
    qualityCriteriaEn: [
      'Explicit coverage of happy path, edge cases, and error states.',
      'Zero dependency on live network or arbitrary `sleep` timers.',
      'Directly runnable test code matching the project test runner.'
    ],
    antiPatternsEs: [
      'No escribir tests con aserciones débiles (como solo comprobar `toBeDefined()`) cuando se conoce el valor exacto.',
      'No acoplar tests a propiedades privadas que rompan ante cualquier refactorización interna.'
    ],
    antiPatternsEn: [
      'Do not write weak assertions (`toBeDefined()` only) when the exact output value is known.',
      'Do not couple tests to private internals that break on safe refactors.'
    ],
    checklistItemsEs: [
      'Patrón `Arrange - Act - Assert` aplicado en cada bloque de prueba.',
      'Casos borde (nulos, límites, listas vacías) y errores explícitamente verificados.',
      'Aislamiento total de estado entre tests (`beforeEach` / `afterEach`).'
    ],
    checklistItemsEn: [
      '`Arrange - Act - Assert` pattern applied in every test block.',
      'Edge cases (nulls, boundaries, empty lists) and errors explicitly asserted.',
      'Full state isolation between tests (`beforeEach` / `afterEach`).'
    ],
    defaultCasesEs: [
      {
        id: 'test-1',
        name: 'Aplicación del patrón Arrange-Act-Assert y casos borde',
        input: 'Función validadora de pagos con múltiples ramas condicionales.',
        expectedBehavior:
          'Diseñar pruebas deterministas con patrón Arrange - Act - Assert cubriendo casos borde y errores según references/checklist.md.',
        criteria: ['Arrange - Act - Assert', 'casos borde', 'errores', 'references/checklist.md']
      },
      {
        id: 'test-2',
        name: 'Aislamiento y limpieza de efectos secundarios',
        input: 'Servicio que escribe archivos y consulta una API externa.',
        expectedBehavior:
          'Aislar dependencias externas y limpiar recursos en afterEach garantizando pruebas deterministas.',
        criteria: ['deterministas', 'afterEach', 'dependencias']
      },
      {
        id: 'test-3',
        name: 'Prevención de aserciones débiles',
        input: 'Suite de tests que solo usa toBeDefined() sin validar el contrato real.',
        expectedBehavior:
          'Evitar toBeDefined() aislado y verificar resultados observables exactos.',
        criteria: ['toBeDefined()', 'resultados observables', 'excepciones']
      }
    ],
    defaultCasesEn: [
      {
        id: 'test-1',
        name: 'Arrange-Act-Assert pattern and edge cases',
        input: 'Domain service with boundary conditions and error states.',
        expectedBehavior:
          'Write deterministic tests using Arrange - Act - Assert, cover edge cases, and check references/checklist.md.',
        criteria: [
          'Arrange - Act - Assert',
          'edge cases',
          'deterministic',
          'references/checklist.md'
        ]
      }
    ]
  },
  'repo-onboarding': {
    category: 'repo-onboarding',
    titleEs: 'Onboarding Técnico y Mapa Arquitectónico de Repositorios',
    titleEn: 'Technical Repository Onboarding and Architecture Mapping',
    summaryEs:
      'Analiza la estructura de un repositorio para generar un mapa arquitectónico, flujo de datos, comandos clave y guía de primer cambio para desarrolladores.',
    summaryEn:
      'Analyzes repository structure to generate an architecture map, data flow, key commands, and a first-contribution guide for engineers.',
    triggersEs: [
      'Cuando un desarrollador o agente se incorpora a un repositorio nuevo o desconocido.',
      'Cuando se necesita mapear módulos principales, puntos de entrada y flujo de ejecución.'
    ],
    triggersEn: [
      'When an engineer or agent joins a new or unfamiliar repository.',
      'When mapping core modules, entrypoints, and execution flow is needed.'
    ],
    inputsEs: [
      'Árbol de directorios, `package.json`, archivos de configuración y puntos de entrada (`src/`).',
      'Rol o área donde el usuario realizará sus primeras tareas.'
    ],
    inputsEn: [
      'Directory tree, `package.json`, configuration files, and entrypoints (`src/`).',
      'Role or area where the user will perform their first tasks.'
    ],
    stepsEs: [
      'Inspeccionar manifiestos (`package.json`, `tsconfig.json`, workflows CI) para identificar stack, scripts y requisitos.',
      'Trazar los puntos de entrada (`entrypoints`), capas de dominio y flujo de datos de extremo a extremo.',
      'Documentar cómo levantar el entorno local, ejecutar tests y validar cambios usando `references/checklist.md`.',
      'Proponer una ruta de lectura de los 5 archivos más importantes del repositorio.'
    ],
    stepsEn: [
      'Inspect manifests (`package.json`, `tsconfig.json`, CI workflows) to identify stack, scripts, and prerequisites.',
      'Trace entrypoints, domain layers, and end-to-end data flow.',
      'Document how to boot the local environment, run tests, and validate changes using `references/checklist.md`.',
      'Propose a reading path of the 5 most important files in the repository.'
    ],
    rulesEs: [
      'Basar el mapa arquitectónico únicamente en carpetas y archivos reales presentes en el repositorio.',
      'Destacar convenciones críticas del proyecto (linters, formato de commits, reglas de arquitectura).',
      'Incluir comandos exactos verificados en `package.json` para desarrollo, build y test.'
    ],
    rulesEn: [
      'Base the architecture map strictly on real folders and files present in the repository.',
      'Highlight critical project conventions (linters, commit format, architectural rules).',
      'Include exact commands verified from `package.json` for dev, build, and test.'
    ],
    qualityCriteriaEs: [
      'Mapa de directorios explicado con la responsabilidad de cada módulo.',
      'Secuencia clara de comandos desde clonación hasta ejecución de tests.',
      'Lista priorizada de archivos clave para entender el núcleo del sistema.'
    ],
    qualityCriteriaEn: [
      'Directory map explained with the responsibility of each module.',
      'Clear command sequence from clone to running tests.',
      'Prioritized list of key files to understand the core system.'
    ],
    antiPatternsEs: [
      'No listar un árbol de archivos crudo sin explicar qué rol cumple cada capa en la arquitectura.',
      'No asumir herramientas o bases de datos que no figuren en los archivos de configuración.'
    ],
    antiPatternsEn: [
      'Do not dump a raw file tree without explaining the role of each architectural layer.',
      'Do not assume tools or databases not present in configuration files.'
    ],
    checklistItemsEs: [
      'Requisitos de entorno (versión de Node.js, gestores de paquetes, variables `.env`).',
      'Puntos de entrada (`entrypoints`), arquitectura de carpetas y flujo de datos.',
      'Comandos de desarrollo, compilación, linting y pruebas verificados.'
    ],
    checklistItemsEn: [
      'Environment prerequisites (Node.js version, package manager, `.env` variables).',
      'Entrypoints, folder architecture, and data flow.',
      'Verified development, build, linting, and test commands.'
    ],
    defaultCasesEs: [
      {
        id: 'onb-1',
        name: 'Generación de mapa arquitectónico y puntos de entrada',
        input: 'Repositorio TypeScript con carpetas cli, commands, validators y tests.',
        expectedBehavior:
          'Explicar puntos de entrada (entrypoints), flujo de datos y responsabilidad por capa consultando references/checklist.md.',
        criteria: ['entrypoints', 'flujo de datos', 'package.json', 'references/checklist.md']
      },
      {
        id: 'onb-2',
        name: 'Ruta de lectura de archivos clave y comandos verificados',
        input: 'Nuevo desarrollador pide guía rápida para hacer su primer Pull Request.',
        expectedBehavior:
          'Proponer los 5 archivos más importantes, comandos de build y test y convenciones del proyecto.',
        criteria: ['archivos', 'build', 'test', 'convenciones']
      },
      {
        id: 'onb-3',
        name: 'Fidelidad estricta a la configuración real',
        input: 'Proyecto sin base de datos externa.',
        expectedBehavior:
          'Basar el análisis solo en archivos reales sin asumir herramientas inexistentes.',
        criteria: ['archivos reales', 'configuración']
      }
    ],
    defaultCasesEn: [
      {
        id: 'onb-1',
        name: 'Architecture map and entrypoint tracing',
        input: 'Monorepo or CLI codebase onboarding request.',
        expectedBehavior:
          'Map entrypoints, data flow, verified package.json commands, and check references/checklist.md.',
        criteria: ['entrypoints', 'data flow', 'package.json', 'references/checklist.md']
      }
    ]
  },
  refactoring: {
    category: 'refactoring',
    titleEs: 'Refactorización Estructural y Reducción de Deuda Técnica',
    titleEn: 'Structural Refactoring and Technical Debt Reduction',
    summaryEs:
      'Transforma código acoplado o complejo en módulos cohesivos, tipados y mantenibles sin alterar su comportamiento externo observable.',
    summaryEn:
      'Transforms coupled or complex code into cohesive, strongly-typed, maintainable modules without altering observable external behavior.',
    triggersEs: [
      'Cuando existen funciones extensas, alta complejidad ciclomática, código duplicado o acoplamiento fuerte.',
      'Cuando se prepara un módulo legado para facilitar nuevas funcionalidades o pruebas.'
    ],
    triggersEn: [
      'When facing long functions, high cyclomatic complexity, duplicated code, or tight coupling.',
      'When preparing a legacy module for new features or unit tests.'
    ],
    inputsEs: [
      'Archivo o módulo a refactorizar y sus consumidores actuales.',
      'Suite de tests existente o especificación del comportamiento esperado.'
    ],
    inputsEn: [
      'File or module to refactor and its current consumers.',
      'Existing test suite or expected behavior specification.'
    ],
    stepsEs: [
      'Identificar code smells concretos: funciones largas, condicionales anidados, duplicación, tipos débiles (`any`) y responsabilidades mezcladas.',
      'Verificar que los contratos públicos de entrada/salida estén cubiertos por tests antes de transformar.',
      'Aplicar extracciones incrementales (funciones puras, inversión de dependencias, guard clauses) guiadas por `references/checklist.md`.',
      'Comprobar que todos los tests y la validación de tipos pasen sin regresiones.'
    ],
    stepsEn: [
      'Identify concrete code smells: long functions, nested conditionals, duplication, weak types (`any`), and mixed responsibilities.',
      'Verify public input/output contracts are covered by tests before transforming.',
      'Apply incremental extractions (pure functions, dependency inversion, guard clauses) guided by `references/checklist.md`.',
      'Confirm all tests and typechecks pass without regressions.'
    ],
    rulesEs: [
      'Preservar estrictamente el comportamiento externo y las firmas públicas salvo que se solicite lo contrario.',
      'Descomponer condicionales profundos usando cláusulas de guarda (early returns) y funciones puras con propósito único.',
      'Reemplazar cualquier uso de `any` por tipos explícitos o genéricos seguros.'
    ],
    rulesEn: [
      'Strictly preserve external behavior and public signatures unless explicitly asked otherwise.',
      'Flatten deep conditionals using guard clauses (early returns) and single-purpose pure functions.',
      'Replace any usage of `any` with explicit types or safe generics.'
    ],
    qualityCriteriaEs: [
      'Reducción demostrable de complejidad ciclomática y duplicación.',
      '100% de compatibilidad con las llamadas e integraciones existentes.',
      'Tipado estricto completo sin uso de `any`.'
    ],
    qualityCriteriaEn: [
      'Demonstrable reduction in cyclomatic complexity and duplication.',
      '100% backward compatibility with existing callers.',
      'Strict typing throughout with zero `any` usage.'
    ],
    antiPatternsEs: [
      'No mezclar cambios de reglas de negocio nuevas dentro de un paso de refactorización pura.',
      'No introducir abstracciones prematuras o capas innecesarias que dificulten la lectura.'
    ],
    antiPatternsEn: [
      'Do not mix new business logic changes inside a pure refactoring step.',
      'Do not introduce premature abstractions or unnecessary indirection.'
    ],
    checklistItemsEs: [
      'Contratos públicos y comportamiento observable preservados sin regresiones.',
      'Extracción de funciones puras, cláusulas de guarda y eliminación de código duplicado.',
      'Tipado estricto verificado y tests existentes pasando en verde.'
    ],
    checklistItemsEn: [
      'Public contracts and observable behavior preserved without regressions.',
      'Extraction of pure functions, guard clauses, and removal of duplicated code.',
      'Strict typing verified and existing tests passing green.'
    ],
    defaultCasesEs: [
      {
        id: 'ref-1',
        name: 'Reducción de complejidad con funciones puras y guard clauses',
        input: 'Función de 200 líneas con 5 niveles de if anidados y lógica duplicada.',
        expectedBehavior:
          'Detectar code smells, aplicar cláusulas de guarda y extraer funciones puras verificando references/checklist.md.',
        criteria: [
          'code smells',
          'cláusulas de guarda',
          'funciones puras',
          'references/checklist.md'
        ]
      },
      {
        id: 'ref-2',
        name: 'Preservación del comportamiento externo y firmas públicas',
        input: 'Módulo consumido por otros 10 servicios del repositorio.',
        expectedBehavior:
          'Preservar el comportamiento externo y las firmas públicas verificando que los tests pasen.',
        criteria: ['comportamiento externo', 'firmas públicas', 'tests']
      },
      {
        id: 'ref-3',
        name: 'Eliminación de tipos any por tipado estricto',
        input: 'Utilidad llena de parámetros tipados como any.',
        expectedBehavior:
          'Reemplazar any por tipos explícitos o genéricos seguros sin mezclar lógica de negocio nueva.',
        criteria: ['any', 'tipos explícitos', 'lógica de negocio']
      }
    ],
    defaultCasesEn: [
      {
        id: 'ref-1',
        name: 'Complexity reduction while preserving public contracts',
        input: 'Legacy function with deep nesting and weak types.',
        expectedBehavior:
          'Apply guard clauses, extract pure functions, preserve public signatures, and check references/checklist.md.',
        criteria: [
          'guard clauses',
          'pure functions',
          'public signatures',
          'references/checklist.md'
        ]
      }
    ]
  }
};

export interface RenderSkillMarkdownParams {
  name: string;
  description: string;
  primaryCategory: SkillCategory;
  secondaryCategories: SkillCategory[];
  targetAgent: TargetAgent;
  language: SkillLanguage;
  detailLevel: DetailLevel;
  tags: string[];
}

function escapeYamlDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function renderSkillMarkdown(params: RenderSkillMarkdownParams): string {
  const tpl = CATEGORY_TEMPLATES[params.primaryCategory];
  const secondaryTpls = params.secondaryCategories.map((c) => CATEGORY_TEMPLATES[c]);
  const isEs = params.language === 'es';

  const cleanDescription = params.description.trim().slice(0, 1024).replace(/\r?\n/g, ' ');

  const extraRules = secondaryTpls.flatMap((st) =>
    isEs ? st.rulesEs.slice(0, 2) : st.rulesEn.slice(0, 2)
  );
  const extraSteps = secondaryTpls.flatMap((st) =>
    isEs ? st.stepsEs.slice(0, 1) : st.stepsEn.slice(0, 1)
  );

  const allSteps = [...(isEs ? tpl.stepsEs : tpl.stepsEn), ...extraSteps];
  const allRules = [...(isEs ? tpl.rulesEs : tpl.rulesEn), ...extraRules];
  const triggers = isEs ? tpl.triggersEs : tpl.triggersEn;
  const inputs = isEs ? tpl.inputsEs : tpl.inputsEn;
  const quality = isEs ? tpl.qualityCriteriaEs : tpl.qualityCriteriaEn;
  const antiPatterns = isEs ? tpl.antiPatternsEs : tpl.antiPatternsEn;

  const detailNoteEs =
    params.detailLevel === 'avanzado'
      ? 'Modo de detalle **avanzado**: incluye análisis exhaustivo por archivo, matriz de riesgos, parches completos y verificación de pruebas en `tests/cases.json`.'
      : params.detailLevel === 'basico'
        ? 'Modo de detalle **básico**: prioriza hallazgos críticos y parches directos de rápida aplicación.'
        : 'Modo de detalle **estándar**: equilibra diagnóstico estructurado, evidencia en archivos y parches accionables.';

  const detailNoteEn =
    params.detailLevel === 'avanzado'
      ? '**Advanced** detail mode: include exhaustive per-file analysis, risk matrix, full patches, and verification against `tests/cases.json`.'
      : params.detailLevel === 'basico'
        ? '**Basic** detail mode: prioritize critical findings and direct patches.'
        : '**Standard** detail mode: balance structured diagnosis, file evidence, and actionable patches.';

  if (isEs) {
    return `---
name: ${params.name}
description: "${escapeYamlDoubleQuoted(cleanDescription)}"
---

# ${params.name}: ${tpl.titleEs}

## Propósito

${tpl.summaryEs}

Solicitud base del skill: **${cleanDescription}**

- **Categoría principal:** \`${params.primaryCategory}\`
- **Agente objetivo:** \`${params.targetAgent}\`
- **Etiquetas detectadas:** ${params.tags.map((t) => `\`${t}\``).join(', ')}
- **Nivel operativo:** ${detailNoteEs}

## Cuándo activarse

${triggers.map((item) => `- ${item}`).join('\n')}

## Entradas esperadas

${inputs.map((item) => `- ${item}`).join('\n')}

## Proceso paso a paso

${allSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Reglas y restricciones

${allRules.map((rule) => `- ${rule}`).join('\n')}
- Consultar obligatoriamente la lista de verificación en \`references/checklist.md\` antes de emitir el resultado final.
- Validar que el comportamiento cumpla los escenarios definidos en \`tests/cases.json\`.

## Formato de salida

Entrega siempre una respuesta estructurada con las siguientes secciones:

1. **Resumen Ejecutivo y Veredicto**: Estado general (\`APROBADO\`, \`APROBADO CON OBSERVACIONES\` o \`REQUIERE CAMBIOS\`) y puntaje de riesgo.
2. **Archivos Afectados y Evidencia**: Tabla o lista con ruta exacta del archivo, línea aproximada y fragmento relevante.
3. **Hallazgos Priorizados**: Clasificados por severidad (\`CRÍTICO\`, \`ALTO\`, \`MEDIO\`, \`BAJO\`), explicando el impacto técnico en rendimiento, accesibilidad, seguridad o mantenibilidad.
4. **Parches Concretos Propuestos**: Bloques de código \`diff\` o reemplazos directos listos para aplicar.
5. **Verificación de Checklist**: Confirmación de los puntos evaluados desde \`references/checklist.md\`.

## Criterios de calidad

${quality.map((q) => `- ${q}`).join('\n')}

## Qué no debe hacer el agente

${antiPatterns.map((ap) => `- ${ap}`).join('\n')}

## Ejemplos de uso

### Ejemplo 1: Ejecución directa sobre cambios del repositorio

**Entrada del usuario:**

\`\`\`text
Aplica el skill ${params.name} sobre los archivos modificados en mi rama actual y propón parches concretos.
\`\`\`

**Respuesta esperada del agente:**

1. Inspecciona los archivos afectados y aplica los criterios de \`references/checklist.md\`.
2. Enumera cada hallazgo con su severidad (\`CRÍTICO\`, \`ALTO\`, \`MEDIO\`, \`BAJO\`), archivo y evidencia.
3. Entrega el bloque de código con el parche exacto y los pasos de verificación.
`;
  }

  return `---
name: ${params.name}
description: "${escapeYamlDoubleQuoted(cleanDescription)}"
---

# ${params.name}: ${tpl.titleEn}

## Purpose

${tpl.summaryEn}

Core skill request: **${cleanDescription}**

- **Primary category:** \`${params.primaryCategory}\`
- **Target agent:** \`${params.targetAgent}\`
- **Detected tags:** ${params.tags.map((t) => `\`${t}\``).join(', ')}
- **Operational level:** ${detailNoteEn}

## When to Activate

${triggers.map((item) => `- ${item}`).join('\n')}

## Expected Inputs

${inputs.map((item) => `- ${item}`).join('\n')}

## Step-by-Step Process

${allSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Rules and Constraints

${allRules.map((rule) => `- ${rule}`).join('\n')}
- Always review the verification items in \`references/checklist.md\` before producing the final output.
- Ensure behavior satisfies all scenarios defined in \`tests/cases.json\`.

## Output Format

Always deliver a structured response containing:

1. **Executive Summary & Verdict**: Overall status (\`APPROVED\`, \`APPROVED WITH COMMENTS\`, or \`CHANGES REQUESTED\`) and risk score.
2. **Affected Files & Evidence**: Exact file paths, approximate lines, and code evidence.
3. **Prioritized Findings**: Grouped by severity (\`CRITICAL\`, \`HIGH\`, \`MEDIUM\`, \`LOW\`), detailing technical risk.
4. **Concrete Code Patches**: Ready-to-apply \`diff\` or replacement code blocks.
5. **Checklist Verification**: Confirmation of items verified from \`references/checklist.md\`.

## Quality Criteria

${quality.map((q) => `- ${q}`).join('\n')}

## What the Agent Must NOT Do

${antiPatterns.map((ap) => `- ${ap}`).join('\n')}

## Usage Examples

### Example 1: Running the skill on repository changes

**User Input:**

\`\`\`text
Run the ${params.name} skill on the modified files in my current branch and propose concrete patches.
\`\`\`

**Expected Agent Behavior:**

1. Inspects affected files and applies \`references/checklist.md\`.
2. Lists each finding with severity (\`CRITICAL\`, \`HIGH\`, \`MEDIUM\`, \`LOW\`), file path, and evidence.
3. Provides exact code patches and verification commands.
`;
}

export function renderChecklistMarkdown(
  name: string,
  primaryCategory: SkillCategory,
  secondaryCategories: SkillCategory[],
  language: SkillLanguage
): string {
  const primary = CATEGORY_TEMPLATES[primaryCategory];
  const secondaries = secondaryCategories.map((c) => CATEGORY_TEMPLATES[c]);
  const isEs = language === 'es';

  const items = [
    ...(isEs ? primary.checklistItemsEs : primary.checklistItemsEn),
    ...secondaries.flatMap((s) => (isEs ? s.checklistItemsEs : s.checklistItemsEn))
  ];

  if (isEs) {
    return `# Checklist de Verificación: ${name}

Utiliza esta lista de control antes de dar por completada la ejecución del skill:

${items.map((item) => `- [ ] ${item}`).join('\n')}
- [ ] Todos los hallazgos incluyen ruta de archivo, severidad y evidencia concreta.
- [ ] Se han proporcionado parches de código verificables para cada problema reportado.
`;
  }

  return `# Verification Checklist: ${name}

Use this checklist before finalizing the skill execution:

${items.map((item) => `- [ ] ${item}`).join('\n')}
- [ ] Every finding includes file path, severity, and concrete code evidence.
- [ ] Verifiable code patches are provided for every reported issue.
`;
}

export function buildTestCases(
  primaryCategory: SkillCategory,
  language: SkillLanguage
): SkillTestCase[] {
  const tpl = CATEGORY_TEMPLATES[primaryCategory];
  return language === 'es' ? tpl.defaultCasesEs : tpl.defaultCasesEn;
}
