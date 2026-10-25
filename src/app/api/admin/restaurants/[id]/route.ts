import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEMO_TENANT_SLUG, getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getSuperadminAuth() {
  const user = await getSessionUser();
  if (!user || user.role !== 'SUPERADMIN' || user.isDemo) return null;
  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = await getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
            orders: true,
            users: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: restaurant });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error al obtener restaurante' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = await getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const restaurantId = params.id;
    const body = await req.json();
    const { isActive, name, phone, rut, logoUrl, bannerUrl, address, customDomain, slug, planType, planExpiresAt } = body;

    const dataToUpdate: any = {};
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;
    if (name) dataToUpdate.name = name.trim();
    if (phone) dataToUpdate.phone = phone.trim();
    if (rut !== undefined) dataToUpdate.rut = rut ? rut.trim() : null;
    if (logoUrl !== undefined) dataToUpdate.logoUrl = logoUrl ? logoUrl.trim() : null;
    if (bannerUrl !== undefined) dataToUpdate.bannerUrl = bannerUrl ? bannerUrl.trim() : null;
    if (address !== undefined) dataToUpdate.address = address ? address.trim() : null;
    if (planType) dataToUpdate.planType = planType.trim();
    if (planExpiresAt !== undefined) dataToUpdate.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;

    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      const existing = await prisma.restaurant.findFirst({
        where: { slug: cleanSlug, NOT: { id: restaurantId } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'El subdominio ya está ocupado por otro restaurante' },
          { status: 409 }
        );
      }
      dataToUpdate.slug = cleanSlug;
    }

    if (customDomain !== undefined) {
      const cleanDomain = customDomain
        ? customDomain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        : null;
      if (cleanDomain) {
        const existingDomain = await prisma.restaurant.findFirst({
          where: { customDomain: cleanDomain, NOT: { id: restaurantId } },
        });
        if (existingDomain) {
          return NextResponse.json(
            { success: false, message: 'El dominio personalizado ya está asignado a otro restaurante' },
            { status: 409 }
          );
        }
      }
      dataToUpdate.customDomain = cleanDomain;
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const superadmin = await getSuperadminAuth();
    if (!superadmin) {
      return NextResponse.json(
        { success: false, message: 'Acceso no autorizado' },
        { status: 403 }
      );
    }

    const target = await prisma.restaurant.findUnique({
      where: { id: params.id },
      select: { slug: true },
    });

    if (target?.slug === DEMO_TENANT_SLUG) {
      return NextResponse.json(
        {
          success: false,
          message: 'El restaurante de demostración (sas-burger) está protegido contra eliminación.',
        },
        { status: 403 }
      );
    }

    await prisma.restaurant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Restaurante y todos sus datos asociados fueron eliminados',
    });
  } catch (error: any) {
    console.error('Error eliminando restaurante:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error al eliminar restaurante' },
      { status: 500 }
    );
  }
}
