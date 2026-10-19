import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { BASE_URL } from '@/constants/seo';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        createdAt: true,
      },
    });

    const tenantRoutes: MetadataRoute.Sitemap = restaurants.map((r) => ({
      url: `${BASE_URL}/${r.slug}`,
      lastModified: r.createdAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    return [...staticRoutes, ...tenantRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
