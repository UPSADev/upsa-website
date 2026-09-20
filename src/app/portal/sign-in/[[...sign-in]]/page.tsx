import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { portalClerkAppearance } from '@/lib/portal-clerk-appearance';

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

          <SignIn
            path="/portal/sign-in"
            routing="path"
            signUpUrl="/portal/sign-up"
            forceRedirectUrl="/portal/dashboard"
            appearance={portalClerkAppearance}
          />
        </div>
      </div>
    </div>
  );
}
