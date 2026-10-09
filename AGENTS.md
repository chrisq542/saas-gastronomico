# 📋 Lineamientos y Guía Arquitectónica del Proyecto (Antigravity & Equipo)

Este documento define las reglas de diseño, arquitectura de carpetas, estándares de código y convenciones que rigen el desarrollo de **saas-gastronomico**. Todo agente de IA y desarrollador debe seguir estas directrices de manera obligatoria y continua.

---

## ⚡ Regla de Refactorización Retroactiva (Mandatoria)

> **Principio de Evaluación Continua:**  
> Cada vez que se solicite crear una nueva funcionalidad, corregir un bug o modificar una pantalla existente:
> 1. **Evaluar el archivo intervenido:** Si es un archivo monolítico (> 400-500 líneas), tiene modales embebidos o usa cadenas de texto mágicas ("magic strings"), **debe ser refactorizado modularmente** como parte de la tarea.
> 2. **Desacoplar componentes:** Separar lógica de presentación, modales y tablas en componentes más pequeños.
> 3. **Migrar a constantes:** Reemplazar rutas, roles y estados fijos por importaciones desde `@/constants`.

---

## 🏗️ 1. Arquitectura de Carpetas y Organización

```text
src/
├── app/                        # Next.js App Router
│   ├── (public)/               # Portal de clientes finales ([slug], checkout)
│   ├── (admin)/                # Panel del local (orders, kds, products)
│   ├── superadmin/             # Consola maestra multi-tenant
│   │   ├── _components/        # Componentes privados de superadmin
│   │   ├── tenants/            # Sub-rutas de tenants
│   │   └── page.tsx            # Orquestador liviano (< 150 líneas)
│   ├── api/                    # Endpoints backend REST (/admin, /superadmin, /auth)
│   └── login/                  # Portal unificado de login
│
├── components/                 # Componentes transversales
│   ├── ui/                     # UI Kit agnóstico (Modal, Button, Input, Badge, Table, Dialog)
│   ├── layout/                 # Estructuras maestras (AdminHeader, AdminSidebar, PageHeader)
│   └── shared/                 # Componentes con lógica de negocio compartida (tickets, theme)
│
├── constants/                  # Constantes inmutables del sistema (roles, rutas, pedidos, env)
├── context/                    # Contextos de React globales (CartContext, etc.)
├── lib/                        # Clientes backend (prisma.ts, auth, whatsapp, supabase)
├── types/                      # Interfaces y tipos TypeScript
└── utils/                      # Funciones utilitarias puras (formateadores, helpers)
```

---

## 🧩 2. Estándares para Componentes y Modales

1. **Modales Reutilizables:**
   * **Prohibido embeber modales directos en el JSX de un `page.tsx`.**
   * Todo modal debe basarse en un componente atómico `src/components/ui/Modal.tsx` (con soporte para backdrop con desenfoque, tecla ESC, accesibilidad y cierre al hacer clic fuera).
   * Los modales con formularios específicos (ej. `TenantFormModal.tsx`, `TenantUsersModal.tsx`) deben residir en la carpeta `_components/` de la vista correspondiente o en `src/components/`.

2. **Componentes Privados de Página (`_components/`):**
   * Cuando una vista requiera tablas complejas, filtros, métricas o modales propios, se debe crear una carpeta `_components/` dentro de la ruta (Next.js omite del enrutamiento las carpetas con guión bajo).
   * El archivo `page.tsx` sólo debe coordinar estado, llamadas a la API y renderizar los submódulos.

3. **UI Kit Genérico (`src/components/ui/`):**
   * Crear componentes limpios, accesibles y consistentes en diseño (variantes primarias, secundarias, peligro, modo oscuro y claro).

---

## 🔒 3. Manejo de Constantes y Variables (`src/constants/`)

* **Cero "Magic Strings":** Queda estrictamente prohibido usar cadenas de texto crudas para roles, rutas y estados de pedido.
* **Archivos obligatorios:**
  * `roles.ts`: Definición de `ROLES` (`SUPERADMIN`, `STORE_ADMIN`, `KITCHEN`).
  * `routes.ts`: Mapa centralizado de rutas (`ROUTES.SUPERADMIN.ROOT`, `ROUTES.LOGIN`, `ROUTES.TENANT.ADMIN(slug)`).
  * `orders.ts`: Estados (`ORDER_STATUS`), tipos de entrega (`DELIVERY_TYPE`) y métodos de pago (`PAYMENT_METHOD`), incluyendo etiquetas legibles en español y clases de color Tailwind.
  * `env.ts`: Variables de entorno y dominios (`ROOT_DOMAIN`, `ROOT_URL`, etc.).

---

## 🎨 4. Estética y Experiencia de Usuario (UI/UX)

* **Tema Dual:** Soporte completo de modo Claro y Oscuro con Tailwind (`dark:...`), usando paletas profesionales en tonos zinc/neutral.
* **Feedback Inmediato:**
  * Utilizar notificaciones tipo toast unificadas para acciones exitosas o errores en lugar de `alert()` o alertas fijas invasivas.
  * Estados de carga claros (`loading`, spinners sutiles, botones deshabilitados mientras se procesa).
* **Diseño Premium:** Bordes sutiles, microanimaciones de transición (`transition-colors`, `transition-all`), sombras refinadas (`shadow-xs` / `shadow-sm`).

---

## 🛠️ 5. Base de Datos y Tipos

* **Sincronización con Prisma:**  
  Ante cualquier cambio en `prisma/schema.prisma`:
  * Ejecutar `npx prisma generate` para sincronizar los tipos.
  * Usar los tipos generados de `@prisma/client` (`Restaurant`, `User`, `Order`, `Role`, etc.) como fuente primaria de verdad.
