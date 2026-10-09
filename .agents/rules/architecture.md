# Reglas de Arquitectura y Refactorización Retroactiva

1. **Refactorización Retroactiva Obligatoria:**
   - Ante cualquier solicitud que toque una pantalla existente, evaluar si el archivo supera las 150-200 líneas o tiene modales y elementos monolíticos.
   - Refactorizar descomponiendo en subcomponentes (`_components/` de la ruta o `src/components/ui/`).
   
2. **Constantes y Tipos:**
   - Usar siempre `@/constants` (`ROLES`, `ROUTES`, `ORDER_STATUS`, `ENV`).
   - Evitar "magic strings".

3. **Modales:**
   - Nunca embeber modales directos en el JSX de las páginas.
   - Usar componentes de modal desacoplados construidos sobre `src/components/ui/Modal.tsx`.
