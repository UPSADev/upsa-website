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
          <div className="f-legal">
            <h4>Nonprofit Transparency</h4>
            <p>United Pakistani Students &amp; Alumni Association Inc.</p>
            <p>Registered U.S. 501(c)(3) Nonprofit Organization</p>
            <p>EIN: 39-3197690</p>
            <p>Official website: <a href="https://www.unitedpsa.org" target="_blank" rel="noopener">www.unitedpsa.org</a></p>
            <p>Official contact email: <a href="mailto:upsa.network@gmail.com">upsa.network@gmail.com</a></p>
            <p>Mailing address: 971 US Highway 202 N Ste A, Branchburg, NJ 08876</p>
          </div>
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
