import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPhoneNumber, validateRut } from '@/lib/utils/formatters';
import { generateOrderWhatsAppUrl } from '@/lib/whatsapp/order-formatter';
import { z } from 'zod';
import { Order as OrderType } from '@/types';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'El nombre es obligatorio'),
    phone: z.string().min(8, 'Teléfono celular requerido'),
    email: z.string().email().optional().nullable(),
    rut: z.string().optional().nullable(),
  }),
  orderType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
  addressId: z.string().optional().nullable(),
  address: z
    .object({
      street: z.string().min(2),
      number: z.string().min(1),
      apartment: z.string().optional().nullable(),
      city: z.string().default('Santiago'),
      reference: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  paymentMethod: z.enum(['CASH', 'CARD_ON_DELIVERY', 'TRANSFER', 'ONLINE']),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        notes: z.string().optional().nullable(),
      })
    )
    .min(1, 'El pedido debe incluir al menos un producto'),
});

// GET: Consultar listado de pedidos (KDS y Admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(phone
          ? {
              customer: {
                phone: { contains: cleanPhoneNumber(phone) },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        customer: true,
        address: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar pedidos' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo pedido sin registro (Checkout Público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const cleanPhone = cleanPhoneNumber(data.customer.phone);

    if (data.customer.rut && !validateRut(data.customer.rut)) {
      return NextResponse.json(
        { success: false, error: 'El RUT ingresado no es válido' },
        { status: 400 }
      );
    }

    // 1. Validar y obtener productos desde la base de datos (seguridad de precios)
    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'Uno o más productos seleccionados no existen' },
        { status: 400 }
      );
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 2. Transacción de Base de Datos
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 2.1 Upsert del cliente por teléfono
      let customer = await tx.customer.findFirst({
        where: { phone: cleanPhone },
        include: { addresses: true },
      });

      if (customer) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: data.customer.name,
            email: data.customer.email || customer.email,
            rut: data.customer.rut || customer.rut,
          },
          include: { addresses: true },
        });
      } else {
        customer = await tx.customer.create({
          data: {
            name: data.customer.name,
            phone: cleanPhone,
            email: data.customer.email,
            rut: data.customer.rut,
          },
          include: { addresses: true },
        });
      }

      // 2.2 Gestión de dirección si es DELIVERY
      let addressId: string | null = data.addressId || null;

      if (data.orderType === 'DELIVERY' && !addressId && data.address) {
        // Enforce máximo 3 direcciones
        const existingAddresses = customer.addresses || [];
        if (existingAddresses.length < 3) {
          const newAddress = await tx.address.create({
            data: {
              customerId: customer.id,
              street: data.address.street,
              number: data.address.number,
              apartment: data.address.apartment,
              city: data.address.city,
              reference: data.address.reference,
              isDefault: existingAddresses.length === 0,
            },
          });
          addressId = newAddress.id;
        } else {
          // Si ya tiene 3, reutiliza la última o la por defecto
          addressId = existingAddresses[0].id;
        }
      }

      // 2.3 Calcular subtotal con precios reales de base de datos
      let subtotal = 0;
      const orderItemsData = data.items.map((item) => {
        const prod = productMap.get(item.productId)!;
        const priceNum = Number(prod.price);
        const itemSubtotal = priceNum * item.quantity;
        subtotal += itemSubtotal;

        return {
          productId: prod.id,
          productName: prod.name,
          unitPrice: priceNum,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          notes: item.notes,
        };
      });

      const deliveryFee =
        data.orderType === 'DELIVERY'
          ? Number(process.env.NEXT_PUBLIC_DEFAULT_DELIVERY_FEE || 2000)
          : 0;
      const total = subtotal + deliveryFee;

      // 2.4 Crear Pedido
      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          addressId: addressId,
          orderType: data.orderType,
          status: 'PENDING',
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PENDING',
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          discount: 0,
          total: total,
          notes: data.notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          customer: true,
          address: true,
          items: true,
        },
      });

      return order;
    });

    // Formatear pedido para generar link de WhatsApp
    const formattedOrder: OrderType = {
      ...createdOrder,
      subtotal: Number(createdOrder.subtotal),
      deliveryFee: Number(createdOrder.deliveryFee),
      discount: Number(createdOrder.discount),
      total: Number(createdOrder.total),
      items: createdOrder.items.map((it) => ({
        ...it,
        unitPrice: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
    };

    const whatsappUrl = generateOrderWhatsAppUrl({
      order: formattedOrder,
    });

    return NextResponse.json(
      {
        success: true,
        data: formattedOrder,
        whatsappUrl: whatsappUrl,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el pedido' },
      { status: 500 }
    );
  }
}
