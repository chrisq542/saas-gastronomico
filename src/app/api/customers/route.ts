import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPhoneNumber, validateRut } from '@/lib/utils/formatters';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const customerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().nullable(),
  rut: z.string().optional().nullable(),
  address: z
    .object({
      street: z.string().min(2, 'Calle requerida'),
      number: z.string().min(1, 'Número requerido'),
      apartment: z.string().optional().nullable(),
      city: z.string().default('Santiago'),
      reference: z.string().optional().nullable(),
    })
    .optional(),
});

// GET: Buscar cliente por teléfono o RUT (autocompletado en checkout)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const rut = searchParams.get('rut');

    if (!phone && !rut) {
      return NextResponse.json(
        { success: false, error: 'Debe proveer parámetro "phone" o "rut"' },
        { status: 400 }
      );
    }

    const cleanedPhone = phone ? cleanPhoneNumber(phone) : undefined;

    const customer = await prisma.customer.findFirst({
      where: {
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

    // Buscar si ya existe por teléfono
    let customer = await prisma.customer.findFirst({
      where: { phone: cleanPhone },
      include: { addresses: true },
    });

    if (customer) {
      // Actualizar datos de cliente
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: validatedData.name,
          email: validatedData.email || customer.email,
          rut: validatedData.rut || customer.rut,
        },
        include: { addresses: true },
      });
    } else {
      // Crear nuevo cliente
      customer = await prisma.customer.create({
        data: {
          name: validatedData.name,
          phone: cleanPhone,
          email: validatedData.email,
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

      await prisma.address.create({
        data: {
          customerId: customer.id,
          street: validatedData.address.street,
          number: validatedData.address.number,
          apartment: validatedData.address.apartment,
          city: validatedData.address.city,
          reference: validatedData.address.reference,
          isDefault: addressCount === 0,
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
