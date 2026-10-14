# nextjs-pr-reviewer

Revisa Pull Requests de Next.js para detectar problemas de rendimiento, accesibilidad y seguridad, y propone parches concretos listos para aplicar.

## Instalación con Agent Skills CLI

```bash
npx skills add DRC09/SkillForge --skill nextjs-pr-reviewer
```

## Qué revisa

- **Rendimiento:** frontera Server/Client Components, hidratación innecesaria, cascadas de red (`Promise.all`), `next/image` y Core Web Vitals.
- **Accesibilidad (WCAG 2.2 AA):** HTML semántico, atributos ARIA, navegación por teclado y foco visible.
- **Seguridad (OWASP):** validación con Zod en Server Actions y Route Handlers, IDOR, XSS y exposición de secretos con `NEXT_PUBLIC_`.

## Estructura del Skill

- `SKILL.md`: Instrucciones principales del agente y frontmatter YAML.
- `skillforge.config.json`: Metadatos y configuración de SkillForge.
- `references/checklist.md`: Lista de control técnica de apoyo.
- `tests/cases.json`: Casos de prueba para evaluación estática.

## Validación y Pruebas Locales

```bash
npx skillforge validate ./skills/nextjs-pr-reviewer
npx skillforge test ./skills/nextjs-pr-reviewer
npx skillforge pack ./skills/nextjs-pr-reviewer
```

## Licencia

MIT
