import { ImageResponse } from 'next/og';
import { SEO_CONFIG } from '@/constants/seo';

export const runtime = 'edge';

export const alt = SEO_CONFIG.siteName;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '40px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '8px 24px',
            borderRadius: '9999px',
            fontSize: 22,
            color: '#34d399',
            marginBottom: '28px',
          }}
        >
          SaaS Gastronómico para Restaurantes
        </div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            textAlign: 'center',
            lineHeight: 1.15,
            maxWidth: '1000px',
            marginBottom: '20px',
          }}
        >
          Abre el Menú Digital de tu Restaurante
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '850px',
            lineHeight: 1.4,
            marginBottom: '36px',
          }}
        >
          Carta QR interactiva, pedidos directos por WhatsApp sin comisiones y monitor de cocina KDS en tiempo real
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: 20,
            color: '#10b981',
            fontWeight: 600,
          }}
        >
          <span>✓ 0% Comisiones</span>
          <span>•</span>
          <span>✓ Agregados & Extras</span>
          <span>•</span>
          <span>✓ Comanda Térmica 80mm</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
