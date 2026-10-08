import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
