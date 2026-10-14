# Checklist de Revisión de Pull Requests en Next.js

Verifica cada uno de los siguientes puntos durante la auditoría del Pull Request:

- [ ] **[Rendimiento - Frontera Servidor/Cliente]**: Los componentes en `app/` son Server Components por defecto; `"use client"` se aplica únicamente en las hojas interactivas.
- [ ] **[Rendimiento - Cascadas de Red]**: Las consultas independientes en el servidor se ejecutan en paralelo mediante `Promise.all` evitando cascadas secuenciales y consultas N+1.
- [ ] **[Rendimiento - Recursos y Core Web Vitals]**: Uso correcto de `next/image` con dimensiones explícitas, optimización de fuentes y control del tamaño de bundle (LCP, INP, CLS).
- [ ] **[Accesibilidad - Semántica y Teclado]**: Elementos interactivos construidos con etiquetas nativas (`button`, `a`, `dialog`), soporte completo de teclado (`Tab`, `Enter`, `Escape`) y foco visible (`:focus-visible`).
- [ ] **[Accesibilidad - ARIA y Formularios]**: Atributos `aria-label`, `aria-expanded`, `aria-live` válidos y asociación explícita de `label` con cada `input`.
- [ ] **[Seguridad - Server Actions y Route Handlers]**: Validación obligatoria de entradas con esquemas `Zod` y comprobación de autenticación/autorización (prevención de IDOR).
- [ ] **[Seguridad - Secretos y XSS]**: Ninguna clave privada se expone mediante `NEXT_PUBLIC_` ni en props serializadas al cliente; ausencia de `dangerouslySetInnerHTML` sin sanitizar.
