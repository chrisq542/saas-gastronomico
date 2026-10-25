import { MetadataRoute } from 'next';
import { BASE_URL } from '@/constants/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/*/checkout', '/checkout', '/order-status/*'],
        disallow: [
          '/api/',
          '/tenants/',
          '/orders',
          '/kds',
          '/products',
          '/*/_not-found',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/tenants/', '/kds'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
