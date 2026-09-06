import type { Metadata } from 'next';
import { PortalDataProvider } from './_lib/PortalDataProvider';
import '@/styles/portal.css';

export const metadata: Metadata = {
  title: { default: 'UPSA Portal', template: '%s | UPSA Portal' },
  description: 'UPSA Community & Mentor Portal. Find mentors, connect with professionals, and grow your network.',
  robots: { index: false, follow: false },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <PortalDataProvider>{children}</PortalDataProvider>;
}
