import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCustomerStatusWhatsAppUrl } from '@/lib/whatsapp/order-formatter';
import { z } from 'zod';
import { Order as OrderType } from '@/types';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional(),
  kitchenNotes: z.string().optional().nullable(),
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
        customer: true,
        address: true,
        items: true,
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

// PATCH: Actualizar estado de comanda (KDS) o pago
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
        ...(validatedData.paymentStatus ? { paymentStatus: validatedData.paymentStatus } : {}),
        ...(validatedData.kitchenNotes !== undefined ? { kitchenNotes: validatedData.kitchenNotes } : {}),
      },
      include: {
        customer: true,
        address: true,
        items: true,
      },
    });

    // Formatear tipos numéricos
    const formatted: OrderType = {
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      deliveryFee: Number(updatedOrder.deliveryFee),
      discount: Number(updatedOrder.discount),
      total: Number(updatedOrder.total),
      items: updatedOrder.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
    };

    // Generar enlace de notificación opcional para WhatsApp del cliente
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
