import { ROOT_DOMAIN } from './env';

const rawAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : undefined) ||
  (process.env.NODE_ENV === 'production' ? `https://${ROOT_DOMAIN}` : 'http://localhost:3000');

const isLocal = rawAppUrl.includes('localhost') || rawAppUrl.includes('127.0.0.1');

export const BASE_URL = (
  rawAppUrl.startsWith('http')
    ? rawAppUrl
    : isLocal
    ? `http://${rawAppUrl}`
    : `https://${rawAppUrl}`
).replace(/\/+$/, '');

export const SEO_CONFIG = {
  siteName: 'FastFood SaaS - Menús Digitales para Restaurantes',
  defaultTitle: 'Menús Digitales y Carta QR para Restaurantes | FastFood SaaS',
  titleTemplate: '%s | FastFood SaaS',
  defaultDescription:
    'Plataforma SaaS para crear menús digitales con código QR, recibir pedidos online por WhatsApp sin comisiones y gestionar cocina con monitor KDS en vivo.',
  keywords: [
    'saas para abrir menus digitales para restaurantes',
    'abrir menu digital para restaurante',
    'crear carta digital qr',
    'menu digital para restaurantes',
    'carta online para restaurantes',
    'software para restaurantes',
    'saas gastronomico chile',
    'pedidos online para restaurantes',
    'carta qr sin comisiones',
    'sistema de pedidos whatsapp restaurante',
    'kds cocina en tiempo real',
    'menu digital con agregados e ingredientes',
    'gestion de pedidos comida rapida',
    'carta digital interactiva',
    'software pedidos gastronomicos',
    'pos y menu digital para bares y cafeterias',
  ],
  locale: 'es_CL',
  type: 'website',
  themeColor: '#09090b',
  twitterHandle: '@fastfoodsaas',
  categories: ['Food & Drink', 'Business Software', 'E-commerce'],
  author: 'FastFood SaaS Team',
} as const;

export const SAAS_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: SEO_CONFIG.siteName,
      description: SEO_CONFIG.defaultDescription,
      inLanguage: 'es-CL',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'FastFood SaaS - Plataforma de Menús Digitales',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      url: BASE_URL,
      description:
        'SaaS especializado para que restaurantes, cadenas y locales gastronómicos puedan abrir y gestionar su menú digital interactivo, recibir pedidos a WhatsApp y sincronizar comandas con cocina en tiempo real.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CLP',
        availability: 'https://schema.org/InStock',
        description: 'Plan inicial y demo en vivo sin costo.',
      },
      featureList: [
        'Creación instantánea de Menú Digital interactivo con código QR',
        'Personalización de agregados, modificadores y opciones de ingredientes (Doble carne, sin cebolla, etc.)',
        'Recepción automática de pedidos por WhatsApp con desglose de ítems',
        'Monitor de cocina KDS (Kitchen Display System) en tiempo real con WebSockets',
        'Impresión térmica automática de comandas de 80mm',
        'Aislamiento multi-tenant independiente para cada sucursal o restaurante',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cómo funciona este SaaS para abrir menús digitales en restaurantes?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'FastFood SaaS permite a cualquier restaurante crear su carta o menú digital en minutos. Obtendrás un enlace único y códigos QR para tus mesas o redes sociales donde tus clientes pueden ver fotos, personalizar ingredientes y hacer pedidos directos sin intermediarios.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cobran comisiones por los pedidos que recibe mi restaurante?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. A diferencia de las apps tradicionales de delivery que cobran entre un 20% y 30%, en nuestra plataforma SaaS todos los pedidos son 100% directos para tu restaurante sin comisiones por transacción.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Los clientes pueden personalizar sus pedidos con ingredientes extra o quitarlos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí. Puedes configurar opciones personalizadas como doble carne, queso cheddar, salsas o quitar ingredientes específicos (ej. sin cebolla), con precios adicionales calculados en tiempo real.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo se reciben los pedidos en el restaurante?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Los pedidos se envían con formato optimizado al WhatsApp del local y se sincronizan instantáneamente en la pantalla de cocina (KDS) y en la comanda térmica de 80mm.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué tipo de restaurantes pueden usar este software?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Es ideal para locales de comida rápida, hamburgueserías, pizzerías, cafeterías, bares, sushi bars y cadenas gastronómicas con una o múltiples sucursales.',
          },
        },
      ],
    },
  ],
};
