import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import TenantCatalogClient from './TenantCatalogClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug?.toLowerCase().trim();
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true },
  });

  if (!restaurant) {
    return { title: 'Restaurante no encontrado' };
  }

  return {
    title: `${restaurant.name} | Menú Digital`,
    description: `Carta digital y pedidos online para ${restaurant.name}`,
    icons: restaurant.logoUrl ? { icon: restaurant.logoUrl, shortcut: restaurant.logoUrl, apple: restaurant.logoUrl } : undefined,
  };
}

function getRootRedirectUrl(): string {
  const reqHeaders = headers();
  const host = reqHeaders.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http:' : 'https:';

  if (host.includes('.localhost')) {
    const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
    return `${protocol}//localhost${port}/`;
  }

  if (host.includes('.lvh.me')) {
    const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
    return `${protocol}//lvh.me${port}/`;
  }

  const hostWithoutPort = host.split(':')[0];
  const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
  const parts = hostWithoutPort.split('.');
  if (parts.length > 2) {
    return `${protocol}//${parts.slice(1).join('.')}${port}/`;
  }

  return `${protocol}//${host}/`;
}

export default async function TenantCatalogPage({ params }: { params: { slug: string } }) {
  const slug = params.slug?.toLowerCase().trim();

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    redirect(getRootRedirectUrl());
  }

  return (
    <TenantCatalogClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        phone: restaurant.phone,
        rut: restaurant.rut,
        logoUrl: restaurant.logoUrl,
        address: restaurant.address,
        customDomain: restaurant.customDomain,
      }}
      initialCategories={JSON.parse(JSON.stringify(restaurant.categories))}
    />
  );
}
