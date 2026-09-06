import Link from 'next/link';

export const metadata = { title: 'Welcome' };

export default function PortalLandingPage() {
  return (
    <div className="portal-guest">
      <header className="portal-guest-header">
        <div className="portal-guest-brand">
          <img src="/images/logos/upsa-logo.png" alt="" width={32} height={32} />
          UPSA Portal
        </div>
        <Link href="/" className="portal-guest-back">&larr; unitedpsa.org</Link>
      </header>

      <section className="portal-hero">
        <span className="sec-tag">Community &amp; Mentor Portal</span>
        <h1>Find your <em>mentor</em>. Grow the network.</h1>
        <p className="lede">
          A home for UPSA students, alumni, and professionals to find mentorship, discuss careers, and build a
          nationwide professional network. Free, always.
        </p>
        <div className="portal-hero-actions">
          <Link href="/portal/sign-up" className="btn-primary">Create an account &rarr;</Link>
          <Link href="/portal/sign-in" className="btn-outline">Sign in</Link>
        </div>
      </section>

      <div className="portal-value-grid">
        <div className="portal-value-card">
          <span className="step">Discover</span>
          <h3>Find the right person</h3>
          <p>Search UPSA professionals by company, industry, university, and what they&apos;re open to.</p>
        </div>
        <div className="portal-value-card">
          <span className="step">Connect</span>
          <h3>Send a real request</h3>
          <p>A short message, sent directly. No cold outreach, no guesswork about who&apos;s open to talking.</p>
        </div>
        <div className="portal-value-card">
          <span className="step">Grow</span>
          <h3>Build the relationship</h3>
          <p>Once accepted, coordinate a conversation and keep the connection going in one place.</p>
        </div>
      </div>

      <div className="portal-disclaimer">
        <blockquote>
          The portal is completely free to use. No subscription, donation, or payment is ever required to
          find a mentor, network, or request a connection. Referrals mentioned by a professional are never
          guaranteed. Providing one is entirely at that individual&apos;s discretion.
        </blockquote>
      </div>
    </div>
  );
}
