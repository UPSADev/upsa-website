'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SiteSettings } from '@/lib/content';

export default function Nav({ settings }: { settings: SiteSettings }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function close() {
    setMenuOpen(false);
    setOpenSection(null);
  }

  function toggleSection(id: string) {
    setOpenSection(prev => prev === id ? null : id);
  }

  return (
    <>
      <nav className={`top${scrolled ? ' scrolled' : ''}`}>
        <Link href="/" className="nav-brand" onClick={close}>
          <Image src={settings.logo} alt="UPSA" width={52} height={52} className="nav-logo" priority unoptimized />
        </Link>

        <div className="nav-links">
          <div className="nav-drop-group">
            <button className="nav-drop-trigger">About <span className="nav-caret">▾</span></button>
            <div className="nav-dropdown">
              <Link href="/about">Our Story</Link>
              <Link href="/about#mission">Our Mission</Link>
              <Link href="/about#values">Our Values</Link>
            </div>
          </div>

          <div className="nav-drop-group">
            <button className="nav-drop-trigger">Community <span className="nav-caret">▾</span></button>
            <div className="nav-dropdown">
              <Link href="/events">Events</Link>
              <Link href="/workshops">Workshops & Seminars</Link>
              <Link href="/meetups">City Meetups</Link>
            </div>
          </div>

          {settings.navLinks.map(link => (
            <Link href={link.href} key={link.href}>{link.label}</Link>
          ))}
        </div>

        <Link href={settings.ctaHref} className="nav-cta">{settings.ctaLabel} →</Link>

        <button className={`nav-burger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className={`m-item${openSection === 'about' ? ' open' : ''}`}>
          <button className="m-link" onClick={() => toggleSection('about')}>About <span className="m-caret-icon">+</span></button>
          <div className="m-sub">
            <Link href="/about" onClick={close}>Our Story</Link>
            <Link href="/about#mission" onClick={close}>Our Mission</Link>
            <Link href="/about#values" onClick={close}>Our Values</Link>
          </div>
        </div>

        <div className={`m-item${openSection === 'community' ? ' open' : ''}`}>
          <button className="m-link" onClick={() => toggleSection('community')}>Community <span className="m-caret-icon">+</span></button>
          <div className="m-sub">
            <Link href="/events" onClick={close}>Events</Link>
            <Link href="/workshops" onClick={close}>Workshops & Seminars</Link>
            <Link href="/meetups" onClick={close}>City Meetups</Link>
          </div>
        </div>

        {settings.navLinks.map(link => (
          <div className="m-item" key={link.href}>
            <Link href={link.href} className="m-link" onClick={close}>{link.label}</Link>
          </div>
        ))}

        <Link href={settings.ctaHref} className="m-cta" onClick={close}>{settings.ctaLabel} →</Link>
      </div>
    </>
  );
}
