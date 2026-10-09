import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
            categories: true,
            orders: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: restaurants });
  } catch (error: any) {
    console.error('Error obteniendo restaurantes en /api/admin/restaurants:', error);
    return NextResponse.json(
      { success: false, message: 'Error consultando restaurantes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validar sesión del Superadmin
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('auth_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, message: 'No autenticado. Inicie sesión como Superadmin.' },
        { status: 401 }
      );
    }

    let currentUser: any;
    try {
      currentUser = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Sesión inválida.' },
        { status: 401 }
      );
    }

    if (currentUser?.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado: solo el SUPERADMIN puede crear inquilinos.' },
        { status: 403 }
      );
    }

    // 2. Extraer y validar campos
    const body = await req.json();
    const { name, slug, customDomain, phone, adminEmail, adminPassword } = body;

    if (!name || !slug || !phone || !adminEmail || !adminPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Todos los campos obligatorios deben estar presentes (nombre, slug/subdominio, teléfono, email, contraseña).',
        },
        { status: 400 }
      );
    }

    // Normalizar slug (subdominio)
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!cleanSlug || cleanSlug.length < 2) {
      return NextResponse.json(
        { success: false, message: 'El subdominio debe tener al menos 2 caracteres alfanuméricos válidos.' },
        { status: 400 }
      );
    }

    // Palabras reservadas que no pueden usarse como subdominio
    const reservedWords = [
      'api',
      'admin',
      'superadmin',
      'login',
      'logout',
      'kds',
      'orders',
      'products',
      'checkout',
      'www',
      'app',
      'mail',
      'auth',
      'dashboard',
      'demo',
      'test',
      'dev',
    ];

    if (reservedWords.includes(cleanSlug)) {
      return NextResponse.json(
        { success: false, message: `El subdominio "${cleanSlug}" es una palabra reservada del sistema.` },
        { status: 400 }
      );
    }

    // Normalizar customDomain (si viene)
    let cleanCustomDomain: string | null = null;
    if (customDomain && customDomain.trim()) {
      cleanCustomDomain = customDomain
        .toLowerCase()
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, ''); // eliminar puerto si viene
    }

    const normalizedEmail = adminEmail.toLowerCase().trim();

    // 3. Validar duplicados en la base de datos
    const [existingSlug, existingEmail, existingDomain] = await Promise.all([
      prisma.restaurant.findUnique({ where: { slug: cleanSlug } }),
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      cleanCustomDomain
        ? prisma.restaurant.findUnique({ where: { customDomain: cleanCustomDomain } })
        : Promise.resolve(null),
    ]);

    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: `El subdominio "${cleanSlug}" ya está registrado por otro restaurante.` },
        { status: 409 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: `El correo "${normalizedEmail}" ya está registrado para otro usuario.` },
        { status: 409 }
      );
    }

    if (existingDomain) {
      return NextResponse.json(
        { success: false, message: `El dominio "${cleanCustomDomain}" ya está asignado a otro restaurante.` },
        { status: 409 }
      );
    }

    // 4. Hashear contraseña para el Store Admin
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 5. Transacción atómica de aprovisionamiento del Tenant
    const newRestaurant = await prisma.$transaction(async (tx) => {
      // A. Crear registro del restaurante
      const restData: any = {
        name: name.trim(),
        slug: cleanSlug,
        phone: phone.trim().replace(/[^\d+]/g, ''),
        isActive: true,
      };

      if (cleanCustomDomain) {
        restData.customDomain = cleanCustomDomain;
      }

      const rest = await tx.restaurant.create({
        data: restData,
      });

      // B. Crear cuenta de administrador para la tienda (STORE_ADMIN)
      await tx.user.create({
        data: {
          restaurantId: rest.id,
          email: normalizedEmail,
          passwordHash,
          role: 'STORE_ADMIN',
        },
      });

      // C. Crear categorías iniciales sugeridas para que el menú no comience vacío
      await tx.category.createMany({
        data: [
          { restaurantId: rest.id, name: 'Platos Principales', sortOrder: 1 },
          { restaurantId: rest.id, name: 'Acompañamientos & Extras', sortOrder: 2 },
          { restaurantId: rest.id, name: 'Bebidas & Refrescos', sortOrder: 3 },
        ],
      });

      return rest;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inquilino gastronómico aprovisionado exitosamente.',
        data: newRestaurant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creando restaurante en /api/admin/restaurants:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error interno al aprovisionar el restaurante' },
      { status: 500 }
    );
  }
}
