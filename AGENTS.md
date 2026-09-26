# AGENTS.md

Vue 3 + Pinia + Fabric.js v7 + Tailwind v4 + Vitest. Usar **pnpm**. Shell: PowerShell.

## Comunicación

- Responder en español. Textos de la UI (labels, `aria-label`, mensajes) en inglés.
- Implementar directamente; no proponer cambios de modo.

## Código

- TypeScript estricto, sin `any`. Tipar con precisión; `unknown` solo cuando sea imprescindible (datos externos sin validar) y siempre con validación. Tipos compartidos en `src/types/*.d.ts` con `import type`.
- Tabs en código, 2 espacios en JSON/MD, LF. Imports con `@/`. No hay ESLint: seguir el formato de los archivos vecinos.
- Dominio en `src/models`, estado en stores Pinia setup (`manga`, `editor`, `history`), lógica pura en `src/lib`, plugins del canvas en `src/features/<nombre>/index.ts` (registrar en `src/features/index.ts`).
- Constantes como `as const satisfies Record<...>` (ver `lib/editor/editorEnums.ts`). Estado de Fabric en `shallowRef`.
- Reutilizar `NumberInput`, `CustomSelect`, `ConfirmModal`, `createConfirmPayload<T>()` y las clases Tailwind de componentes equivalentes (incluidas variantes `dark:`).
- Desplegables siempre hacia abajo. `<input type="color">` superpuesto al swatch (`absolute inset-0 size-full opacity-0`), nunca `sr-only`.
- Botones de icono con `aria-label` y `title`; toggles con `aria-pressed`.
- Comentarios solo para restricciones no evidentes, breves y en español.

## Dominio

- Mutar el documento solo desde el store `manga` y registrar historial con `recordHistory(HISTORY_LABEL.X)`. Previsualizaciones en vivo no registran.
- Mantener retrocompatibilidad en `fromJSON`, historial y layouts. Si cambia el formato, migrar `src/layouts/*.json` sin reordenar claves.
- Objetos auxiliares del canvas: `isGuide = true`, `excludeFromExport: true`, `evented: false`.

## Tests

- En `src/__tests__/` replicando la ruta del código. Obligatorios en modelos, stores, `lib`, composables y emits de componentes.
- Componentes: `mount` con `global: { plugins: [pinia], stubs: { Icon: true } }`, seleccionar por `aria-label`/`data-testid`.
- Stores: `setActivePinia(createPinia())` en `beforeEach`; acciones del canvas vía `editorStore.registerCanvas({...vi.fn()})`.
- Fabric: mocks mínimos del canvas, no un canvas real.
- Al cambiar comportamiento, actualizar los tests existentes.

## Verificación antes de terminar

```powershell
pnpm exec vitest run <specs afectados>   # o sin argumentos si el cambio es transversal
pnpm exec vue-tsc --build --force
```

- Los specs en subcarpetas de `__tests__` no entran en el type check: tiparlos con cuidado.
- Cambios visuales: comprobar en el navegador si hay dev server.
- Archivos temporales en `%TEMP%`, nunca en el repo. No hacer commits sin que se pida.
