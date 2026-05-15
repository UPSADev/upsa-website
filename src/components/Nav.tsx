'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SiteSettings } from '@/lib/content';

export default function Nav({ settings }: { settings: SiteSettings }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1180) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.nav-drop-group')) setDesktopDropdown(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDesktopDropdown(null);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function close() {
    setMenuOpen(false);
    setOpenSection(null);
    setDesktopDropdown(null);
  }

  function toggleSection(id: string) {
    setOpenSection(prev => (prev === id ? null : id));
  }

  function toggleDesktopDropdown(id: string) {
    setDesktopDropdown(prev => (prev === id ? null : id));
  }

  return (
    <>
      <nav className={`top${scrolled ? ' scrolled' : ''}`}>
        <Link href="/" className="nav-brand" onClick={close}>
          <Image src={settings.logo} alt="UPSA" width={52} height={52} className="nav-logo" priority unoptimized />
        </Link>
 <span className="nav-brand-text" style={{ marginLeft: '0.75rem', color: '#113a16'}}>
            United Pakistani Students & Alumni Association
          </span>

        <div className="nav-links">
          <div className={`nav-drop-group${desktopDropdown === 'about' ? ' open' : ''}`}>
            <button
              type="button"
              className="nav-drop-trigger"
              aria-haspopup="true"
              aria-expanded={desktopDropdown === 'about'}
              onClick={() => toggleDesktopDropdown('about')}
            >
              About <span className="nav-caret">v</span>
            </button>
            <div className="nav-dropdown">
              <Link href="/about" onClick={close}>Our Story</Link>
              <Link href="/about#mission" onClick={close}>Our Mission</Link>
              <Link href="/about#values" onClick={close}>Our Values</Link>
            </div>
          </div>

          <div className={`nav-drop-group${desktopDropdown === 'community' ? ' open' : ''}`}>
            <button
              type="button"
              className="nav-drop-trigger"
              aria-haspopup="true"
              aria-expanded={desktopDropdown === 'community'}
              onClick={() => toggleDesktopDropdown('community')}
            >
              Community <span className="nav-caret">v</span>
            </button>
            <div className="nav-dropdown">
              <Link href="/events" onClick={close}>Events</Link>
              <Link href="/workshops" onClick={close}>Workshops & Seminars</Link>
              <Link href="/meetups" onClick={close}>City Meetups</Link>
            </div>
          </div>

          {settings.navLinks.map(link => (
            <Link href={link.href} key={link.href} onClick={close}>{link.label}</Link>
          ))}
        </div>

        <Link href={settings.ctaHref} className="nav-cta" onClick={close}>{settings.ctaLabel} &rarr;</Link>

        <button
          className={`nav-burger${menuOpen ? ' open' : ''}`}
          onClick={() => {
            setMenuOpen(open => !open);
            setDesktopDropdown(null);
          }}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
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

        <Link href={settings.ctaHref} className="m-cta" onClick={close}>{settings.ctaLabel} &rarr;</Link>
      </div>
    </>
  );
}
