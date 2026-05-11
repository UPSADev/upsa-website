import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import OpeningMotion from '@/components/OpeningMotion';
import { getSiteSettings } from '@/lib/content';
import '@/styles/globals.css';
import '@/styles/nav.css';
import '@/styles/footer.css';
import '@/styles/opening-motion.css';

export const metadata: Metadata = {
  title: { default: 'UPSA — United Pakistani Students & Alumni Association', template: '%s | UPSA' },
  description: 'United Pakistani Students & Alumni Association. Bridging generations, building futures across 35+ US campuses.',
  openGraph: {
    siteName: 'UPSA',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSiteSettings();

  return (
    <html lang="en">
      <head>
        {/* Netlify Identity — required for Decap CMS login redirect */}
        <script src="https://identity.netlify.com/v1/netlify-identity-widget.js" async />
      </head>
      <body>
        <OpeningMotion logo={settings.logo} />
        <Nav settings={settings} />
        <main>{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
