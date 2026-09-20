import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { portalClerkAppearance } from '@/lib/portal-clerk-appearance';

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

          <SignUp
            path="/portal/sign-up"
            routing="path"
            signInUrl="/portal/sign-in"
            forceRedirectUrl="/portal/onboarding"
            appearance={portalClerkAppearance}
          />

          <p className="portal-auth-foot" style={{ marginTop: 18 }}>
            The portal is free to use. No payment or donation is ever required to access mentorship or networking.
          </p>
        </div>
      </div>
    </div>
  );
}
