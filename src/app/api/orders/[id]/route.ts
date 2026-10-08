import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCustomerStatusWhatsAppUrl } from '@/lib/whatsapp/order-formatter';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
});

// GET: Obtener detalle de pedido por ID
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

// PATCH: Actualizar estado de comanda (KDS)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
