import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPhoneNumber, validateRut } from '@/lib/utils/formatters';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const customerSchema = z.object({
  restaurantId: z.string().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'Teléfono inválido'),
  rut: z.string().optional().nullable(),
  address: z
    .object({
      address: z.string().min(2, 'Dirección requerida'),
      commune: z.string().default('Santiago'),
      reference: z.string().optional().nullable(),
      street: z.string().optional(),
      number: z.string().optional(),
      apartment: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});

// GET: Buscar cliente por teléfono o RUT
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const rut = searchParams.get('rut');
    const restaurantId = searchParams.get('restaurantId');

    if (!phone && !rut) {
      return NextResponse.json(
        { success: false, error: 'Debe proveer parámetro "phone" o "rut"' },
        { status: 400 }
      );
    }

    const cleanedPhone = phone ? cleanPhoneNumber(phone) : undefined;

    const customer = await prisma.customer.findFirst({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
        OR: [
          ...(cleanedPhone ? [{ phone: cleanedPhone }] : []),
          ...(rut ? [{ rut }] : []),
        ],
      },
      include: {
        addresses: {
          orderBy: { createdAt: 'desc' },
          take: 3, // Máximo 3 direcciones por cliente
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: true, data: null }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: customer }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar cliente' },
      { status: 500 }
    );
  }
}

// POST: Crear cliente o actualizar datos básicos con validación de límite de 3 direcciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    const cleanPhone = cleanPhoneNumber(validatedData.phone);

    if (validatedData.rut && !validateRut(validatedData.rut)) {
      return NextResponse.json(
        { success: false, error: 'El formato del RUT ingresado no es válido' },
        { status: 400 }
      );
    }

    // Obtener ID del restaurante (por defecto sas-burger)
    let restaurantId = validatedData.restaurantId;
    if (!restaurantId) {
      const demoRestaurant = await prisma.restaurant.findFirst({
        where: { slug: 'sas-burger' },
      });
      restaurantId = demoRestaurant?.id || 'a1111111-1111-1111-1111-111111111111';
    }

    // Buscar si ya existe por teléfono dentro de este restaurante
    let customer = await prisma.customer.findFirst({
      where: { restaurantId, phone: cleanPhone },
      include: { addresses: true },
    });

    if (customer) {
      // Actualizar datos de cliente
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: validatedData.name,
          rut: validatedData.rut || customer.rut,
        },
        include: { addresses: true },
      });
    } else {
      // Crear nuevo cliente
      customer = await prisma.customer.create({
        data: {
          restaurantId,
          name: validatedData.name,
          phone: cleanPhone,
          rut: validatedData.rut,
        },
        include: { addresses: true },
      });
    }

    // Agregar dirección si fue enviada y no excede el límite de 3
    if (validatedData.address) {
      const addressCount = customer.addresses.length;
      if (addressCount >= 3) {
        return NextResponse.json(
          {
            success: false,
            error: 'El cliente ya cuenta con el máximo permitido de 3 direcciones registradas',
            customer,
          },
          { status: 422 }
        );
      }

      const fullAddressText =
        validatedData.address.address ||
        `${validatedData.address.street || ''} ${validatedData.address.number || ''} ${
          validatedData.address.apartment ? 'Depto ' + validatedData.address.apartment : ''
        }`.trim();

      await prisma.address.create({
        data: {
          customerId: customer.id,
          address: fullAddressText || 'Dirección no especificada',
          commune: validatedData.address.commune || validatedData.address.city || 'Santiago',
          reference: validatedData.address.reference,
        },
      });

      // Refrescar cliente con nueva dirección
      customer = await prisma.customer.findUniqueOrThrow({
        where: { id: customer.id },
        include: { addresses: true },
      });
    }

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error creating/updating customer:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar cliente' },
      { status: 500 }
    );
  }
}
