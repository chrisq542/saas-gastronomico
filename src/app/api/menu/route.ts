import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || request.headers.get('x-tenant-slug');
    const customDomain = request.headers.get('x-custom-domain');

    let restaurant: any = null;
    if (slug) {
      restaurant = await prisma.restaurant.findUnique({
        where: { slug },
      });
    } else if (customDomain) {
      restaurant = await prisma.restaurant.findUnique({
        where: { customDomain },
      });
    }

    // Si se especificó un slug o dominio pero no existe o está inactivo
    if ((slug || customDomain) && (!restaurant || !restaurant.isActive)) {
      return NextResponse.json(
        { success: false, notFound: true, error: 'Restaurante no encontrado o inactivo' },
        { status: 404 }
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        ...(restaurant ? { restaurantId: restaurant.id } : {}),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
      restaurant: restaurant
        ? {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            phone: restaurant.phone,
            customDomain: restaurant.customDomain,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el catálogo del menú' },
      { status: 500 }
    );
  }
}
