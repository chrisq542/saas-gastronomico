import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

// GET /api/admin/restaurants/[id]/users - Listar usuarios del tenant
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      where: { restaurantId: params.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST /api/admin/restaurants/[id]/users - Crear un nuevo usuario para el tenant
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const restaurantId = params.id;
    const body = await req.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'El correo electrónico ya está registrado' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRole = role === 'KITCHEN' ? 'KITCHEN' : 'STORE_ADMIN';

    const newUser = await prisma.user.create({
      data: {
        restaurantId,
        email: normalizedEmail,
        passwordHash,
        role: validRole,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Usuario creado con éxito', data: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al crear usuario' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/restaurants/[id]/users - Eliminar un usuario específico
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Se requiere userId' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId, restaurantId: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
