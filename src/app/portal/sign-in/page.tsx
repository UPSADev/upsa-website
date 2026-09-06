import Link from 'next/link';

export const metadata = { title: 'Sign In' };

export default function PortalSignInPage() {
  return (
    <div className="portal-guest">
      <header className="portal-guest-header">
        <div className="portal-guest-brand">
          <img src="/images/logos/upsa-logo.png" alt="" width={32} height={32} />
          UPSA Portal
        </div>
        <Link href="/portal" className="portal-guest-back">&larr; Back</Link>
      </header>

      <div className="portal-auth-wrap">
        <div className="portal-auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to continue to your UPSA Portal.</p>

          <button type="button" className="btn-google">
            <span className="dot" /> Continue with Google
          </button>
          <div className="portal-auth-divider">or</div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@example.com" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autoComplete="off" />
          </div>

          <Link href="/portal/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Sign in &rarr;
          </Link>

          <p className="portal-auth-foot">
            Don&apos;t have an account? <Link href="/portal/sign-up">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
