import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import TenantCatalogClient from './TenantCatalogClient';
import type { Metadata } from 'next';

import { BASE_URL } from '@/constants/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug?.toLowerCase().trim();
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true, bannerUrl: true, address: true, phone: true },
  });

  if (!restaurant) {
    return { title: 'Restaurante no encontrado | Menú Digital' };
  }

  const title = `${restaurant.name} | Menú Digital, Carta QR y Pedidos Online`;
  const description = `Consulta la carta digital y realiza tu pedido online en ${restaurant.name}. Personaliza agregados, ingredientes y pide directo a WhatsApp sin comisiones.`;

  return {
    title,
    description,
    keywords: [
      `menu digital ${restaurant.name}`,
      `carta digital ${restaurant.name}`,
      `pedidos online ${restaurant.name}`,
      `carta qr ${restaurant.name}`,
      'menu digital para restaurantes',
      'pedidos a domicilio sin comisiones',
      'fast food',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      images: restaurant.bannerUrl || restaurant.logoUrl ? [{ url: restaurant.bannerUrl || restaurant.logoUrl! }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: restaurant.bannerUrl || restaurant.logoUrl ? [restaurant.bannerUrl || restaurant.logoUrl!] : undefined,
    },
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
            include: {
              optionGroups: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  options: {
                    where: { isAvailable: true },
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    redirect(getRootRedirectUrl());
  }

  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    image: restaurant.bannerUrl || restaurant.logoUrl || undefined,
    telephone: restaurant.phone,
    address: restaurant.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: restaurant.address,
        }
      : undefined,
    url: `${BASE_URL}/${restaurant.slug}`,
    menu: `${BASE_URL}/${restaurant.slug}`,
    servesCuisine: 'Gastronomía / Fast Food',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantJsonLd),
        }}
      />
      <TenantCatalogClient
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          phone: restaurant.phone,
          rut: restaurant.rut,
          logoUrl: restaurant.logoUrl,
          bannerUrl: restaurant.bannerUrl,
          address: restaurant.address,
          customDomain: restaurant.customDomain,
          menuPdfUrl: restaurant.menuPdfUrl,
          schedule: (restaurant as any).schedule || null,
        }}
        initialCategories={JSON.parse(JSON.stringify(restaurant.categories))}
      />
    </>
  );
}
