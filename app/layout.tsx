import type { Metadata, Viewport } from 'next';
import './globals.css';

const TITLE = 'Кварта: обжарка кофе в Минске';
const DESC = 'Небольшая обжарка в Минске. Жарим в четверг, привозим в пятницу. Три кофе по 250 г, дрип-пакеты, подписка.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://kvarta-coffee.vercel.app'),
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    type: 'website',
    locale: 'ru_BY',
    siteName: 'Кварта',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'Кварта: обжарка кофе в Минске' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC, images: ['/og.jpg'] },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3eee5' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Podkova:wght@500;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
