# Guía de Contribución a SkillForge

¡Gracias por tu interés en mejorar **SkillForge**!

## Flujo de desarrollo local

1. Haz un fork y clona el repositorio:

   ```bash
   git clone https://github.com/DRC09/SkillForge.git
   cd SkillForge
   npm install
   ```

2. Crea una rama descriptiva:

   ```bash
   git checkout -b feat/mi-mejora
   ```

3. Ejecuta la CLI en modo desarrollo:

   ```bash
   npx tsx src/cli/index.ts create "Descripción del skill" --yes
   ```

## Verificación obligatoria antes de abrir un Pull Request

Todos estos comandos deben pasar sin errores ni advertencias:

```bash
npm run format
npm run typecheck
npm run lint
npm test
npm run build
```

## Convenciones

- **Código, identificadores, nombres de archivo y comentarios:** en inglés.
- **Mensajes de la CLI, prompts, errores y plantillas por defecto:** en español (salvo `--lang en`).
- **Imports ESM:** todas las importaciones relativas deben incluir la extensión `.js`.
- **Logging:** nunca uses `console.*`; usa el logger central de `src/utils/logger.ts`.
- **Dependencias:** no añadas dependencias nuevas sin discutirlo antes en un issue. El ZIP se genera de forma nativa en `src/utils/zip.ts`.
- **Pruebas:** toda funcionalidad nueva debe incluir pruebas en `tests/skillforge.test.ts`.

## Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).

## Código de Conducta

Al participar en este proyecto aceptas respetar nuestro [Código de Conducta](./CODE_OF_CONDUCT.md).
