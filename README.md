# 🍔 SaaS Gastronómico

Sistema SaaS de gestión y pedidos de comida rápida de alta rotación (inspirado en **Fu-do** y **OlaClick**), diseñado para locales gastronómicos, pizzerías y hamburgueserías.

Incluye catálogo digital de menú, carrito interactivo, **checkout ágil sin registro**, monitor de cocina en tiempo real (**KDS** con WebSockets), generador de comandas para **impresoras térmicas de 80mm** y enlace estructurado a **WhatsApp**.

---

## 🛠️ Stack Tecnológico

- **Framework Web:** [Next.js 14](https://nextjs.org/) (App Router, React Server & Client Components)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) con verificación estricta (`strict: true`)
- **Base de Datos & Realtime:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Supabase Realtime, Row Level Security)
- **ORM:** [Prisma ORM](https://www.prisma.io/) (Modelado relacional, cliente tipado y migraciones)
- **Estilos & UI:** [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Validación de Esquemas:** [Zod](https://zod.dev/)

---

## 🚀 Guía de Inicio Rápido (Quickstart)

### 1. Prerrequisitos
- Node.js 18.17+ o 20+
- npm 9+ o pnpm
- Cuenta de Supabase o instancia local de PostgreSQL

### 2. Instalación de Dependencias
```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd fastfood-saas

# Instalar dependencias
npm install
```

### 3. Configuración del Entorno
Duplica el archivo de ejemplo y completa tus credenciales de Supabase:
```bash
cp .env.example .env.local
```

Variables clave requeridas:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
NEXT_PUBLIC_RESTAURANT_PHONE="56912345678"
```

### 4. Sincronizar Base de Datos y Seed
```bash
# Generar tipos de Prisma
npm run db:generate

# Empujar el esquema a la base de datos
npm run db:push

# Cargar categorías y productos de prueba (Smash burgers, papas, bebidas)
npm run db:seed
```

### 5. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🧭 Vistas y Rutas Principales

| Ruta | Descripción | Público / Admin |
|---|---|---|
| `/` | Catálogo de menú por categorías con selector de notas | Público |
| `/checkout` | Checkout para comensales sin registro y botón directo a WhatsApp | Público |
| `/kds` | Kitchen Display System con actualización en tiempo real y sonido | Admin / Cocina |
| `/orders` | Bandeja de pedidos con búsqueda por Teléfono y RUT | Admin |
| `/products` | Catálogo interno y switch de disponibilidad de stock | Admin |
| `/api/orders` | Endpoint REST para creación y consulta de pedidos | API |
| `/api/customers`| Endpoint para consulta y registro con regla de máx 3 direcciones | API |

---

## 🖨️ Impresión Térmica de Comandas (80mm)
El componente `ThermalTicket80mm` utiliza la regla CSS estándar:
```css
@page {
  size: 80mm auto;
  margin: 0;
}
```
Permite imprimir directamente en impresoras de tickets POS (Epson TM-T20, Bixolon, Xprinter, etc.) con formato de corte y texto monoespaciado de alta legibilidad.

---

## 👥 Equipo y Contribución
Para conocer la estrategia de ramas (`main`, `develop`, `feat/*`), la convención de Pull Requests y la distribución para el equipo de 3 desarrolladores, consulta [CONTRIBUTING.md](CONTRIBUTING.md).
