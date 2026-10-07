import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'FastFood SaaS - Sistema de Pedidos y KDS',
  description: 'Plataforma SaaS para restaurantes de comida rápida con KDS en tiempo real y comanda 80mm.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
