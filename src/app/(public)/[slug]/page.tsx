import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import TenantCatalogClient from './TenantCatalogClient';

export const dynamic = 'force-dynamic';

function getRootRedirectUrl(): string {
  const reqHeaders = headers();
  const host = reqHeaders.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http:' : 'https:';

  // Si estamos en localhost (ej: noexiste.localhost:3000 -> http://localhost:3000)
  if (host.includes('.localhost')) {
    const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
    return `${protocol}//localhost${port}/`;
  }

  // Si estamos en lvh.me (ej: noexiste.lvh.me:3000 -> http://lvh.me:3000)
  if (host.includes('.lvh.me')) {
    const port = host.split(':')[1] ? `:${host.split(':')[1]}` : '';
    return `${protocol}//lvh.me${port}/`;
  }

  // En producción (ej: noexiste.saasgastronomico.cl -> https://saasgastronomico.cl)
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

  // Si el subdominio/slug no existe o el restaurante está inactivo, redirigir a la página principal
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
        customDomain: restaurant.customDomain,
      }}
      initialCategories={JSON.parse(JSON.stringify(restaurant.categories))}
    />
  );
}
