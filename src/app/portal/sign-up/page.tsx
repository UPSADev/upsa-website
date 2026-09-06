import Link from 'next/link';

export const metadata = { title: 'Create Account' };

export default function PortalSignUpPage() {
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
          <h1>Create your account</h1>
          <p className="sub">Join the UPSA Community &amp; Mentor Portal. It&apos;s free.</p>

          <button type="button" className="btn-google">
            <span className="dot" /> Continue with Google
          </button>
          <div className="portal-auth-divider">or</div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="fname">First name</label>
              <input id="fname" type="text" placeholder="Aisha" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="lname">Last name</label>
              <input id="lname" type="text" placeholder="Raza" autoComplete="off" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="you@example.com" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" autoComplete="off" />
          </div>

          <label className="portal-checkbox-row" htmlFor="agree">
            <input id="agree" type="checkbox" defaultChecked />
            <span>The portal is free to use. No payment or donation is ever required to access mentorship or networking.</span>
          </label>

          <Link href="/portal/onboarding" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Create account &rarr;
          </Link>

          <p className="portal-auth-foot">
            Already have an account? <Link href="/portal/sign-in">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
