'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePortalData, CURRENT_USER_ID } from '../_lib/PortalDataProvider';
import Avatar from './Avatar';
import RoleTag from './RoleTag';

const NAV_ITEMS = [
  { href: '/portal/dashboard', label: 'Dashboard' },
  { href: '/portal/discover', label: 'Discover' },
  { href: '/portal/requests', label: 'Requests', countKey: 'incoming' as const },
  { href: '/portal/connections', label: 'Connections' },
  { href: '/portal/messages', label: 'Messages' },
  { href: '/portal/profile', label: 'My Profile' },
  { href: '/portal/settings', label: 'Settings' },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, state } = usePortalData();
  const [open, setOpen] = useState(false);

  const incomingCount = state.requests.filter(r => r.toId === CURRENT_USER_ID && r.status === 'pending').length;

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar${open ? ' open' : ''}`}>
        <div className="portal-sidebar-brand">
          <img src="/images/logos/upsa-logo.png" alt="" />
          <div>
            <span>UPSA Portal</span>
          </div>
        </div>

        <div className="portal-sidebar-user">
          <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.avatarColor} size="sm" />
          <div>
            <div className="name">{currentUser.name}</div>
            <div className="role">{currentUser.headline}</div>
            <div style={{ marginTop: 6 }}><RoleTag isProfessional={currentUser.isProfessional} /></div>
          </div>
        </div>

        <nav className="portal-nav" aria-label="Portal navigation">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/portal/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                {item.countKey === 'incoming' && incomingCount > 0 && <span className="count">{incomingCount}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="portal-sidebar-foot">
          <Link href="/portal" onClick={() => setOpen(false)}>Log out</Link>
          <Link href="/" onClick={() => setOpen(false)}>&larr; Back to unitedpsa.org</Link>
        </div>
      </aside>

      <div className="portal-main">
        <div className="portal-topbar">
          <button className="portal-mobile-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle navigation" aria-expanded={open}>
            <span />
            Menu
          </button>
        </div>
        <div className="portal-content">{children}</div>
      </div>
    </div>
  );
}
