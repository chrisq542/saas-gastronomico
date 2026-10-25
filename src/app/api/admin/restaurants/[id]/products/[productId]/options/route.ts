import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getAuth() {
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

// GET /api/admin/restaurants/[id]/products/[productId]/options
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const product = await prisma.product.findFirst({
      where: { id: params.productId, restaurantId: params.id },
      include: {
        optionGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product.optionGroups,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al obtener opciones' },
      { status: 500 }
    );
  }
}

// POST /api/admin/restaurants/[id]/products/[productId]/options
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const auth = getAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const product = await prisma.product.findFirst({
      where: { id: params.productId, restaurantId: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Producto no encontrado en este restaurante' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Acción 1: Aplicar plantilla predeterminada (ej. Hamburguesas)
    if (action === 'APPLY_PRESET') {
      const presetType = body.presetType || 'BURGER';

      if (presetType === 'BURGER') {
        const doubleMeatPrice = body.doubleMeatPrice !== undefined ? Number(body.doubleMeatPrice) : 2500;
        const cheesePrice = body.cheesePrice !== undefined ? Number(body.cheesePrice) : 1000;
        const baconPrice = body.baconPrice !== undefined ? Number(body.baconPrice) : 1200;

        // Crear Grupo de Agregados
        const extrasGroup = await prisma.productOptionGroup.create({
          data: {
            productId: product.id,
            name: 'Agregados & Extras',
            isRequired: false,
            minSelect: 0,
            maxSelect: 5,
            sortOrder: 1,
            options: {
              create: [
                { name: 'Doble Carne', price: doubleMeatPrice, sortOrder: 1 },
                { name: 'Queso Cheddar Extra', price: cheesePrice, sortOrder: 2 },
                { name: 'Tocino Crocante', price: baconPrice, sortOrder: 3 },
                { name: 'Cebolla Caramelizada', price: 800, sortOrder: 4 },
              ],
            },
          },
          include: { options: true },
        });

        // Crear Grupo de Quitar Ingredientes
        const removeGroup = await prisma.productOptionGroup.create({
          data: {
            productId: product.id,
            name: 'Quitar Ingredientes (Sin...)',
            isRequired: false,
            minSelect: 0,
            maxSelect: 10,
            sortOrder: 2,
            options: {
              create: [
                { name: 'Sin Cebolla', price: 0, sortOrder: 1 },
                { name: 'Sin Tomate', price: 0, sortOrder: 2 },
                { name: 'Sin Pepinillos', price: 0, sortOrder: 3 },
                { name: 'Sin Mayonesa / Salsa', price: 0, sortOrder: 4 },
              ],
            },
          },
          include: { options: true },
        });

        return NextResponse.json({
          success: true,
          message: 'Plantilla de hamburguesas agregada con éxito',
          data: [extrasGroup, removeGroup],
        });
      }
    }

    // Acción 2: Crear nuevo grupo de opciones
    if (action === 'CREATE_GROUP' || !action) {
      const { name, minSelect = 0, maxSelect = 10, isRequired = false, options = [] } = body;

      if (!name || !name.trim()) {
        return NextResponse.json(
          { success: false, message: 'El nombre del grupo es obligatorio' },
          { status: 400 }
        );
      }

      const newGroup = await prisma.productOptionGroup.create({
        data: {
          productId: product.id,
          name: name.trim(),
          minSelect: Number(minSelect) || 0,
          maxSelect: Number(maxSelect) || 10,
          isRequired: Boolean(isRequired),
          options: {
            create: options.map((opt: any, idx: number) => ({
              name: opt.name.trim(),
              price: Number(opt.price) || 0,
              isAvailable: opt.isAvailable !== false,
              sortOrder: idx + 1,
            })),
          },
        },
        include: {
          options: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Grupo de opciones creado con éxito',
        data: newGroup,
      });
    }

    // Acción 3: Agregar una opción a un grupo existente
    if (action === 'ADD_OPTION') {
      const { groupId, name, price = 0, isAvailable = true } = body;

      if (!groupId || !name || !name.trim()) {
        return NextResponse.json(
          { success: false, message: 'groupId y name son requeridos' },
          { status: 400 }
        );
      }

      const group = await prisma.productOptionGroup.findFirst({
        where: { id: groupId, productId: product.id },
      });

      if (!group) {
        return NextResponse.json(
          { success: false, message: 'Grupo no encontrado' },
          { status: 404 }
        );
      }

      const newOption = await prisma.productOption.create({
        data: {
          groupId: group.id,
          name: name.trim(),
          price: Number(price) || 0,
          isAvailable: Boolean(isAvailable),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Opción agregada exitosamente',
        data: newOption,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Acción no reconocida' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/restaurants/[id]/products/[productId]/options
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const auth = getAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { groupId, optionId } = body;

    // Actualizar Grupo
    if (groupId) {
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.minSelect !== undefined) updateData.minSelect = Number(body.minSelect);
      if (body.maxSelect !== undefined) updateData.maxSelect = Number(body.maxSelect);
      if (body.isRequired !== undefined) updateData.isRequired = Boolean(body.isRequired);
      if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

      const updated = await prisma.productOptionGroup.update({
        where: { id: groupId, productId: params.productId },
        data: updateData,
        include: { options: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Grupo actualizado con éxito',
        data: updated,
      });
    }

    // Actualizar Opción
    if (optionId) {
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.price !== undefined) updateData.price = Number(body.price);
      if (body.isAvailable !== undefined) updateData.isAvailable = Boolean(body.isAvailable);
      if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

      const updated = await prisma.productOption.update({
        where: { id: optionId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        message: 'Opción actualizada con éxito',
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Se requiere groupId u optionId' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al actualizar' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/restaurants/[id]/products/[productId]/options
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const auth = getAuth();
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const optionId = searchParams.get('optionId');

    if (groupId) {
      await prisma.productOptionGroup.delete({
        where: { id: groupId, productId: params.productId },
      });
      return NextResponse.json({
        success: true,
        message: 'Grupo de opciones eliminado con éxito',
      });
    }

    if (optionId) {
      await prisma.productOption.delete({
        where: { id: optionId },
      });
      return NextResponse.json({
        success: true,
        message: 'Opción eliminada con éxito',
      });
    }

    return NextResponse.json(
      { success: false, message: 'groupId o optionId es requerido' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al eliminar' },
      { status: 500 }
    );
  }
}
