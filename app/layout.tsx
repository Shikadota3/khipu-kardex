import type { Metadata } from 'next';
import { inter, jetbrainsMono, playfair } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kardex KHIPU',
  description: 'Sistema profesional de control de inventarios y Kardex KHIPU',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="bg-[#F5F5F4] text-[#1A1A1A] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
