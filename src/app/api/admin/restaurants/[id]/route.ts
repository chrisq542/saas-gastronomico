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
    if (user.role === 'SUPERADMIN') return user;
  } catch {
    return null;
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const restaurantId = params.id;
    const body = await req.json();
    const { isActive, name, phone, customDomain } = body;

    const dataToUpdate: any = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (name) dataToUpdate.name = name.trim();
    if (phone) dataToUpdate.phone = phone.trim();
    if (customDomain !== undefined) {
      dataToUpdate.customDomain = customDomain
        ? customDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        : null;
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: 'Restaurante actualizado con éxito',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error actualizando restaurante:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error al actualizar restaurante' },
      { status: 500 }
    );
  }
}
