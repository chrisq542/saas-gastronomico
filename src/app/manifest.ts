import { MetadataRoute } from 'next';
import { SEO_CONFIG } from '@/constants/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_CONFIG.siteName,
    short_name: 'FastFood SaaS',
    description: SEO_CONFIG.defaultDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
