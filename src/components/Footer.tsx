import Link from 'next/link';
import Image from 'next/image';
import type { SiteSettings } from '@/lib/content';

export default function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="f-grid">
        <div className="f-brand">
          <Image src={settings.logo} alt="UPSA" width={88} height={88} className="f-logo" unoptimized />
          <span className="f-brand-name">United Pakistani Students &amp; Alumni Association</span>
          <p>{settings.footerDescription}</p>
        </div>

        {settings.footerColumns.map(column => (
          <div className="f-col" key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map(link => link.href.startsWith('http') || link.href.startsWith('mailto:')
              ? <a href={link.href} key={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener' : undefined}>{link.label}</a>
              : <Link href={link.href} key={link.href}>{link.label}</Link>
            )}
          </div>
        ))}
      </div>

      <div className="f-bottom">
        <span>© {year} UPSA · United Pakistani Students &amp; Alumni Association</span>
        <div className="f-socials">
          {settings.socialLinks.map(link => (
            <a href={link.href} key={link.href} target="_blank" rel="noopener">{link.label}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
