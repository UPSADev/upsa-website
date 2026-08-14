import Link from 'next/link';
import '@/styles/legal.css';

export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Legal</span>
          <h1>Terms of Service</h1>
          <p>Last updated July 26, 2026. Governing the use of UPSA's website and services.</p>
        </div>
      </div>

      <section className="legal-section">
        <div className="container">
          <div className="legal-content">

            <div className="legal-info-box">
              <p><strong>Organization:</strong> United Pakistani Students & Alumni Association Inc.</p>
              <p><strong>Status:</strong> Registered U.S. 501(c)(3) Nonprofit Organization</p>
              <p><strong>EIN:</strong> 39-3197690</p>
            </div>

            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the United Pakistani Students & Alumni Association (UPSA) website and services, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use our website or services.</p>

            <h2>2. About UPSA</h2>
            <p>United Pakistani Students & Alumni Association Inc. is a registered U.S. 501(c)(3) nonprofit organization dedicated to uniting Pakistani students and alumni across America into one compounding network of opportunity, mentorship, and belonging.</p>

            <h2>3. Use License</h2>
            <p>We grant you a limited, non-exclusive, revocable license to access and use our website for lawful purposes only. You agree not to:</p>
            <ul>
              <li>Reproduce, distribute, or transmit content without permission</li>
              <li>Engage in any conduct that disrupts the normal flow of dialogue in our community</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Collect or track personal information of others without consent</li>
            </ul>

            <h2>4. Disclaimer of Warranties</h2>
            <p>The UPSA website and services are provided on an "AS IS" and "AS AVAILABLE" basis. UPSA makes no warranties, expressed or implied, regarding the website or services, including accuracy, completeness, fitness for a particular purpose, or non-infringement of third-party rights.</p>

            <h2>5. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, UPSA shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the website or services.</p>

            <h2>6. Third-Party Links</h2>
            <p>Our website may contain links to third-party websites. UPSA is not responsible for the content, accuracy, or practices of external sites. Your use of third-party sites is at your own risk and subject to their terms.</p>

            <h2>7. User-Generated Content</h2>
            <p>Any comments, feedback, or content you submit to UPSA may be used for organizational purposes without compensation to you. You retain intellectual property rights to your content, but grant UPSA a non-exclusive license to use it.</p>

            <h2>8. Community Conduct</h2>
            <p>Users agree to conduct themselves respectfully and professionally on UPSA platforms. We reserve the right to remove content or restrict access for violations of this policy, including harassment, hate speech, spam, or illegal activity.</p>

            <h2>9. Modifications to Terms</h2>
            <p>UPSA reserves the right to modify these terms at any time. Continued use of the website following changes constitutes acceptance of revised terms. We will notify users of material changes via email or website notice.</p>

            <h2>10. Governing Law</h2>
            <p>These terms are governed by the laws of the State of New Jersey, without regard to its conflict of law principles.</p>

            <h2>11. Contact & Questions</h2>
            <p>For questions regarding these Terms of Service, please <Link href="/contact">contact us</Link> directly or email <strong>upsa.network@gmail.com</strong>.</p>

            <hr className="legal-divider" />
            <p className="legal-footer">Last Updated: July 26, 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
