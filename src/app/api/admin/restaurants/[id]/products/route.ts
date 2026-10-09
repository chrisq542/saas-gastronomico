import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getSuperadminAuth() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('auth_session');

  if (!sessionCookie || !sessionCookie.value) return null;
  try {
    const user = JSON.parse(sessionCookie.value);
    if (user.role === 'SUPERADMIN' || user.role === 'STORE_ADMIN') return user;
  } catch {
    return null;
  }
  return null;
}

// GET /api/admin/restaurants/[id]/products
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await prisma.product.findMany({
      where: { restaurantId: params.id },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// POST /api/admin/restaurants/[id]/products
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getSuperadminAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { categoryId, name, description, price, imageUrl, isActive } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'Categoría, nombre y precio son campos requeridos' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        restaurantId: params.id,
        categoryId,
        name: name.trim(),
        description: description ? description.trim() : null,
        price: Number(price),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        isActive: typeof isActive === 'boolean' ? isActive : true,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, message: 'Producto creado con éxito', data: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al crear producto' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/restaurants/[id]/products
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getSuperadminAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { productId, categoryId, name, description, price, imageUrl, isActive } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'productId es requerido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (price !== undefined) updateData.price = Number(price);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? imageUrl.trim() : null;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updated = await prisma.product.update({
      where: { id: productId, restaurantId: params.id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Producto actualizado con éxito',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/restaurants/[id]/products
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getSuperadminAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'productId o id es requerido' },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: productId, restaurantId: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado correctamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
