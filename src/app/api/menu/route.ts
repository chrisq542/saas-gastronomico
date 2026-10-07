import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isAvailable: true },
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
