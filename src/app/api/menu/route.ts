import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    let restaurantId: string | undefined;
    if (slug) {
      const rest = await prisma.restaurant.findUnique({
        where: { slug },
      });
      if (rest) {
        restaurantId = rest.id;
      }
    }

    const categories = await prisma.category.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el catálogo del menú' },
      { status: 500 }
    );
  }
}
