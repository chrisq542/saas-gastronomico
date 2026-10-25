import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCustomerStatusWhatsAppUrl } from '@/lib/whatsapp/order-formatter';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
});

// GET: Obtener detalle de pedido por ID (usado en /order-status/[id])
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          include: { addresses: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar el pedido' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar estado de comanda (KDS / Gestión de Pedidos) — Requiere sesión autenticada y pertenencia al tenant
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, restaurantId: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    // Verificar aislamiento por tenant (excepto SUPERADMIN real)
    const isRealSuperadmin = sessionUser.role === 'SUPERADMIN' && !sessionUser.isDemo;
    if (!isRealSuperadmin && existingOrder.restaurantId !== sessionUser.restaurantId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para modificar pedidos de otro restaurante' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(validatedData.status ? { status: validatedData.status } : {}),
        ...(validatedData.notes !== undefined ? { notes: validatedData.notes } : {}),
      },
      include: {
        customer: {
          include: { addresses: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    const formatted: any = {
      ...updatedOrder,
      orderType: updatedOrder.deliveryType,
      subtotal: Number(updatedOrder.subtotal),
      deliveryFee: Number(updatedOrder.deliveryFee),
      total: Number(updatedOrder.total),
      items: updatedOrder.items.map((i) => ({
        ...i,
        productName: i.product?.name || 'Producto',
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.unitPrice) * i.quantity,
      })),
    };

    let customerWhatsAppNotificationUrl = '';
    if (validatedData.status) {
      customerWhatsAppNotificationUrl = generateCustomerStatusWhatsAppUrl(
        formatted,
        validatedData.status
      );
    }

    return NextResponse.json({
      success: true,
      data: formatted,
      customerWhatsAppNotificationUrl,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar el pedido' },
      { status: 500 }
    );
  }
}
