---
name: nextjs-pr-reviewer
description: 'Revisa Pull Requests de Next.js para detectar problemas de rendimiento, accesibilidad y seguridad, y propone cambios accionables.'
---

# nextjs-pr-reviewer: Auditoría y Revisión Estructurada de Pull Requests en Next.js

## Propósito

Analiza diffs y archivos modificados en proyectos Next.js (App Router y Pages Router) para detectar regresiones de rendimiento, barreras de accesibilidad (WCAG 2.2 AA) y vulnerabilidades de seguridad (OWASP), entregando parches de código concretos y listos para aplicar.

- **Categoría principal:** `code-review`
- **Agente objetivo:** `generic`
- **Etiquetas detectadas:** `nextjs`, `code-review`, `performance`, `accessibility`, `security`

## Cuándo activarse

- Cuando el usuario solicita revisar un Pull Request, commit o diff en un repositorio Next.js.
- Antes de fusionar cambios de componentes React Server/Client, Server Actions, Route Handlers o `next.config`.
- Cuando se requiere una auditoría combinada de rendimiento (Core Web Vitals), accesibilidad (ARIA/teclado) y seguridad (validación Zod y secretos).

## Entradas esperadas

- Diff del Pull Request (`git diff`) o lista de archivos `.tsx`, `.ts` y configuración modificados.
- Estructura de rutas del proyecto (`app/` o `pages/`).
- Reglas de negocio o restricciones de arquitectura del repositorio.

## Proceso paso a paso

1. Inspeccionar los archivos afectados y clasificarlos por capa: Server Components, Client Components (`"use client"`), Server Actions (`"use server"`), Route Handlers (`app/api/`) y configuración.
2. Evaluar el impacto en rendimiento: detectar uso innecesario de `"use client"` en árboles altos, hidratación excesiva, cascadas de red secuenciales (`await` en serie reemplazables por `Promise.all`), consultas N+1 y ausencia de `next/image`.
3. Auditar accesibilidad (WCAG 2.2 AA): verificar HTML semántico (`button`, `nav`, `main`, `dialog`), atributos ARIA (`aria-label`, `aria-expanded`, `aria-live`), navegación por teclado (`Tab`, `Enter`, `Escape`) y gestión de foco (`:focus-visible`).
4. Verificar superficie de seguridad (OWASP): exigir validación de esquemas con Zod en Server Actions y Route Handlers, prevenir exposición de claves privadas en variables `NEXT_PUBLIC_`, mitigar XSS (`dangerouslySetInnerHTML`), CSRF, SSRF e IDOR.
5. Contrastar cada archivo revisado con `references/checklist.md` para asegurar cobertura completa.
6. Redactar el informe priorizado citando ruta del archivo, línea aproximada, severidad (`CRÍTICO`, `ALTO`, `MEDIO`, `BAJO`), riesgo técnico y bloque de parche concreto.

## Reglas y restricciones

- Citar siempre el archivo afectado y la evidencia exacta del código antes de emitir una recomendación.
- Priorizar hallazgos en cuatro niveles: `CRÍTICO`, `ALTO`, `MEDIO` y `BAJO`.
- Proporcionar un parche de código concreto (`diff` o bloque reemplazo) para cada hallazgo `CRÍTICO` o `ALTO`.
- Verificar explícitamente límites entre servidor y cliente, exposición de secretos y atributos de accesibilidad.
- Consultar obligatoriamente la lista de verificación en `references/checklist.md` antes de emitir el veredicto.
- Validar que el análisis cubra los escenarios definidos en `tests/cases.json`.

## Formato de salida

Entrega siempre una respuesta estructurada con las siguientes secciones:

1. **Resumen Ejecutivo y Veredicto**: Estado general (`APROBADO`, `APROBADO CON OBSERVACIONES` o `REQUIERE CAMBIOS`) y desglose por rendimiento, accesibilidad y seguridad.
2. **Archivos Afectados y Evidencia**: Ruta del archivo, líneas analizadas y componente o endpoint impactado.
3. **Hallazgos Priorizados**: Clasificados por severidad (`CRÍTICO`, `ALTO`, `MEDIO`, `BAJO`) con explicación del riesgo.
4. **Parches Concretos Propuestos**: Bloques `diff` listos para aplicar en el Pull Request.
5. **Verificación de Checklist**: Estado de los puntos de `references/checklist.md`.

## Criterios de calidad

- Cada hallazgo incluye ruta del archivo, explicación técnica del riesgo y parche verificable.
- Cero falsos positivos genéricos sin referencia al código analizado.
- Cobertura explícita de rendimiento, accesibilidad y seguridad en el resumen ejecutivo.

## Qué no debe hacer el agente

- No emitir comentarios vagos sin mostrar el parche exacto de código.
- No aprobar un Pull Request sin verificar antes la exposición de secretos o la validación de entradas en Server Actions.
- No recomendar mover todo el árbol a Client Components cuando basta con aislar una hoja interactiva.

## Ejemplos de uso

### Ejemplo 1: Revisión de un Pull Request con Server Actions y componentes UI

**Entrada del usuario:**

```text
Revisa los cambios de este PR en app/checkout/page.tsx y app/actions/payment.ts usando nextjs-pr-reviewer.
```

**Respuesta esperada del agente:**

1. Clasifica `app/checkout/page.tsx` como Server Component y `app/actions/payment.ts` como Server Action (`"use server"`).
2. Reporta como `CRÍTICO` la ausencia de validación con Zod en la Server Action y el riesgo de IDOR al actualizar el pedido sin comprobar el propietario.
3. Reporta como `ALTO` la cascada de `await` secuenciales en la página y propone paralelizar con `Promise.all`.
4. Señala como `MEDIO` el botón de pago construido con `div` sin `aria-label` ni soporte de teclado.
5. Entrega el parche concreto:

```diff
- export async function pay(formData: FormData) {
-   await db.order.update({ where: { id: formData.get('orderId') }, data: { paid: true } });
- }
+ const PaySchema = z.object({ orderId: z.string().uuid() });
+
+ export async function pay(formData: FormData) {
+   const session = await auth();
+   const { orderId } = PaySchema.parse({ orderId: formData.get('orderId') });
+   await db.order.update({ where: { id: orderId, userId: session.user.id }, data: { paid: true } });
+ }
```

### Ejemplo 2: Auditoría de secretos expuestos al cliente

**Entrada del usuario:**

```text
Usa nextjs-pr-reviewer para revisar si este PR filtra secretos en next.config.js o en variables de entorno.
```

**Respuesta esperada del agente:**

1. Busca variables con prefijo `NEXT_PUBLIC_` que contengan claves privadas y props serializadas al cliente.
2. Clasifica cualquier secreto expuesto como `CRÍTICO` y propone moverlo a una variable solo de servidor.
3. Verifica el estado de cada punto de `references/checklist.md` y emite el veredicto `REQUIERE CAMBIOS` si persiste algún hallazgo `CRÍTICO`.
