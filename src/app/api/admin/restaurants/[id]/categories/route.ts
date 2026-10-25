import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTenantAdminAccess } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/restaurants/[id]/categories
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await verifyTenantAdminAccess(params.id);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, message: access.error || 'Acceso no autorizado' },
        { status: access.status || 403 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: params.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

// POST /api/admin/restaurants/[id]/categories
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await verifyTenantAdminAccess(params.id);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, message: access.error || 'Acceso no autorizado' },
        { status: access.status || 403 }
      );
    }

    if (access.isDemo) {
      const count = await prisma.category.count({
        where: { restaurantId: params.id },
      });
      if (count >= 12) {
        return NextResponse.json(
          {
            success: false,
            message: 'Modo Demo (Sandbox): Límite máximo de 12 categorías alcanzado.',
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { name, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'El nombre de la categoría es obligatorio' },
        { status: 400 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        restaurantId: params.id,
        name: name.trim(),
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
        isActive: true,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Categoría creada con éxito', data: newCategory },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al crear categoría' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/restaurants/[id]/categories
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await verifyTenantAdminAccess(params.id);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, message: access.error || 'Acceso no autorizado' },
        { status: access.status || 403 }
      );
    }

    const body = await req.json();
    const { categoryId, id, name, sortOrder, isActive } = body;
    const targetId = categoryId || id;

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: 'ID de la categoría requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (typeof sortOrder === 'number') updateData.sortOrder = sortOrder;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updated = await prisma.category.update({
      where: { id: targetId, restaurantId: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría actualizada correctamente',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al actualizar categoría' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/restaurants/[id]/categories
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await verifyTenantAdminAccess(params.id);
    if (!access.authorized) {
      return NextResponse.json(
        { success: false, message: access.error || 'Acceso no autorizado' },
        { status: access.status || 403 }
      );
    }

    if (access.isDemo) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Modo Demo (Sandbox): Por seguridad, la eliminación de categorías está deshabilitada en la tienda de prueba.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'ID de la categoría requerido' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId, restaurantId: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Categoría eliminada correctamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al eliminar categoría' },
      { status: 500 }
    );
  }
}
