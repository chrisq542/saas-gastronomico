import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TenantCatalogClient from './TenantCatalogClient';
import type { Metadata } from 'next';

import { BASE_URL } from '@/constants/seo';

export const revalidate = 30;

const getRestaurantBySlug = cache(async (slug: string) => {
  if (!slug) return null;
  return prisma.restaurant.findUnique({
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
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug?.toLowerCase().trim();
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return { title: 'Restaurante no encontrado | Menú Digital' };
  }

  const title = `${restaurant.name} | Menú Digital y Pedidos Online`;
  const description = `Consulta el menú digital de ${restaurant.name} y pide online. Personaliza tus ingredientes y envía tu pedido directo por WhatsApp sin comisiones.`;
  const canonicalUrl = `${BASE_URL}/${slug}`;
  const ogImageUrl = restaurant.bannerUrl || restaurant.logoUrl || `${BASE_URL}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
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
      url: canonicalUrl,
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: restaurant.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
    icons: restaurant.logoUrl ? { icon: restaurant.logoUrl, shortcut: restaurant.logoUrl, apple: restaurant.logoUrl } : undefined,
  };
}

export default async function TenantCatalogPage({ params }: { params: { slug: string } }) {
  const slug = params.slug?.toLowerCase().trim();

  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant || !restaurant.isActive) {
    redirect('/');
  }

  const restaurantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    image: restaurant.bannerUrl || restaurant.logoUrl || `${BASE_URL}/opengraph-image`,
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
