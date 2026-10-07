# 🍔 FastFood SaaS - Guía de Contribución y Flujo de Equipo

Bienvenido al repositorio de **FastFood SaaS**. Este documento define la arquitectura de trabajo, la estrategia de versionamiento y la asignación de responsabilidades para nuestro equipo de **3 desarrolladores**.

---

## 👥 1. Matriz de Roles y Responsabilidades (Equipo de 3)

| Desarrollador | Enfoque Principal | Áreas de Código Asignadas |
|---|---|---|
| **Dev 1 (Front - Experiencia Cliente)** | Flujo público, Catálogo, Carrito y Checkout | `src/app/(public)/**`, `src/components/public/**`, integración de estados de cliente en localStorage/Zustand. |
| **Dev 2 (Front - Operaciones & KDS)** | Dashboard de Cocina en Tiempo Real y Comandas | `src/app/(admin)/**`, suscripciones Supabase Realtime en UI, `src/components/tickets/**`, estilos `@page` de impresión 80mm. |
| **Dev 3 (Backend, Datos & Integraciones)** | API REST, Modelado de Datos, Triggers y WhatsApp | `src/app/api/**`, `src/lib/supabase/**`, `prisma/schema.prisma`, `src/lib/whatsapp/**`, RLS y validaciones con Zod. |

> **Nota:** Aunque cada desarrollador tiene propiedad primaria sobre su módulo, las revisiones de código cruzadas son obligatorias antes de integrar cambios.

---

## 🌿 2. Estrategia de Ramas (Git Branching Model)

Utilizamos una adaptación ágil de **GitFlow**:

```text
main (Producción)
  │
  ├── develop (Integración continua / Staging)
        ├── feat/public/checkout-guest (Dev 1)
        ├── feat/admin/kds-realtime-board (Dev 2)
        └── feat/api/orders-crud-zod (Dev 3)
```

### Tipos de Ramas:
1. `main`:
   - Código en producción. Totalmente estable.
   - **Regla estricta:** PROHIBIDO commitear directamente a `main`.
   - Solo recibe merges desde `develop` mediante un **Release PR**.
2. `develop`:
   - Rama central de integración y staging continuo.
   - **Regla estricta:** PROHIBIDO commitear directamente a `develop`.
   - Todas las ramas de desarrollo se integran aquí vía Pull Request.
3. `feat/<nombre-issue>`:
   - Creada desde: `develop`
   - Merge hacia: `develop`
   - Convención de nombres: `feat/<nombre-issue>` (ej: `feat/issue-1-public-checkout`, `feat/issue-2-kds-realtime`).
4. `fix/<nombre-issue>`:
   - Para correcciones de bugs en el ciclo de pruebas sobre `develop`.
5. `hotfix/<nombre-descriptivo>`:
   - Solo para errores críticos en producción. Nace de `main` y se mergea tanto a `main` como a `develop`.

---

## 🔄 3. Flujo de Trabajo Diario (Paso a Paso)

### 1. Iniciar una tarea
```bash
# Asegurarse de tener la última versión de develop
git checkout develop
git pull origin develop

# Crear rama de feature
git checkout -b feat/kds/realtime-sound
```

### 2. Estándar de Commits (Conventional Commits)
Los mensajes deben ser en español o inglés, concisos y con prefijos estándar:
- `feat: agregar selector de método de pago en checkout`
- `fix: corregir cálculo de subtotal con descuentos`
- `refactor: modularizar hook de suscripción realtime de supabase`
- `chore: actualizar dependencias y schema de prisma`
- `docs: actualizar variables de entorno en .env.example`

### 3. Mantener la rama actualizada
Antes de abrir un Pull Request, haz rebase o merge de `develop`:
```bash
git checkout develop
git pull origin develop
git checkout feat/kds/realtime-sound
git merge develop
```

---

## 🔀 4. Flujo de Pull Requests (PR) y Code Review

1. **Crear PR siempre hacia `develop`** (nunca directamente hacia `main`).
2. **Título del PR:** Seguir convención: `feat: [Módulo] Descripción breve`.
3. **Cuerpo del PR y Cierre de Issues:**
   - Debe incluir la referencia al issue correspondiente: `Closes #ID` o `Resolves #ID` (ej: `Closes #1`).
   - Resumen del cambio implementado.
   - Pasos para probar localmente.
   - Capturas de pantalla o video si aplica UI / KDS.
4. **Revisión de Código Obligatoria:**
   - **Mínimo 1 aprobación (Peer Review)** de otro desarrollador del equipo.
   - Si el cambio toca base de datos o APIs (`prisma/` o `src/app/api`), **Dev 3 debe dar visto bueno**.
   - Si el cambio toca la experiencia de compra, **Dev 1 debe revisar**.
   - Si el cambio afecta impresión o KDS, **Dev 2 debe revisar**.
5. **Criterios de Aceptación Técnicos:**
   - [ ] No hay errores de TypeScript (`npm run build`).
   - [ ] No hay advertencias de linter (`npm run lint`).
   - [ ] Los esquemas de datos están sincronizados (`npx prisma validate`).
   - [ ] El squash & merge mantiene un historial limpio.

---

## 🛠️ 5. Comandos de Desarrollo y Base de Datos

### Instalación inicial:
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env.local
# (Completar con credenciales de Supabase y DB)

# 3. Generar cliente de Prisma
npm run db:generate
```

### Ejecución:
```bash
# Servidor de desarrollo Next.js (http://localhost:3000)
npm run dev

# Abrir Prisma Studio para inspeccionar datos
npm run db:studio
```

### Manejo de Base de Datos:
```bash
# Empujar cambios de schema a Supabase (Desarrollo rápido)
npm run db:push

# Crear migración versionada
npm run db:migrate -- --name nombre_de_migracion
```

---

## 🚨 6. Reglas de Oro del Proyecto
1. **Nunca exponer la clave `SUPABASE_SERVICE_ROLE_KEY` en código cliente** (`src/app/(public)` o componentes con `'use client'`).
2. **Respetar la restricción de 3 direcciones por cliente:** tanto en la interfaz como en las validaciones de API.
3. **Impresión térmica:** Todo estilo del ticket debe probarse con la emulación de impresión del navegador (`Ctrl + P` o `Cmd + P` seleccionando papel 80mm).
4. **WhatsApp links:** Los números telefónicos deben sanitizarse siempre al formato internacional E.164 sin símbolos ni ceros iniciales (`569XXXXXXXX`).
