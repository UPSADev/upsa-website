import Link from 'next/link';
import '@/styles/legal.css';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Legal</span>
          <h1>Privacy Policy</h1>
          <p>Last updated July 26, 2026. How we collect, use, and protect your personal information.</p>
        </div>
      </div>

      <section className="legal-section">
        <div className="container">
          <div className="legal-content">

            <div className="legal-info-box">
              <p><strong>Organization:</strong> United Pakistani Students & Alumni Association Inc.</p>
              <p><strong>EIN:</strong> 39-3197690</p>
              <p><strong>Address:</strong> 971 US Highway 202 N Ste A, Branchburg, NJ 08876</p>
              <p><strong>Email:</strong> upsa.network@gmail.com</p>
            </div>

            <h2>1. Our Commitment to Privacy</h2>
            <p>United Pakistani Students & Alumni Association Inc. ("UPSA") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our services.</p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Information You Provide</h3>
            <ul>
              <li><strong>Contact Forms:</strong> Name, email, phone number, message content</li>
              <li><strong>Join Forms:</strong> Full name, email, university, graduation year, location</li>
              <li><strong>Event Registration:</strong> Details needed for event attendance</li>
              <li><strong>Communications:</strong> Any information shared when contacting us</li>
            </ul>

            <h3>Information We Automatically Collect</h3>
            <ul>
              <li><strong>Website Usage:</strong> Pages visited, time spent, links clicked</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> To improve user experience and analyze website traffic</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information for:</p>
            <ul>
              <li>Responding to inquiries and providing requested services</li>
              <li>Sending newsletters and event updates (with your consent)</li>
              <li>Improving website functionality and user experience</li>
              <li>Analyzing website traffic and engagement</li>
              <li>Complying with legal obligations</li>
              <li>Nonprofit program administration and member communications</li>
            </ul>
            <p><strong>We never sell your personal information to third parties.</strong></p>

            <h2>4. How We Share Your Information</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>UPSA Leadership & Volunteers:</strong> To coordinate events and services</li>
              <li><strong>Chapter Leaders:</strong> For local chapter coordination</li>
              <li><strong>Service Providers:</strong> Email and hosting platforms (under strict confidentiality agreements)</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect safety</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>We implement reasonable security measures to protect your information:</p>
            <ul>
              <li>Secure HTTPS connection for all website traffic</li>
              <li>Limited access to personal data (authorized staff only)</li>
              <li>Regular security assessments and updates</li>
              <li>Compliance with nonprofit data protection standards</li>
            </ul>
            <p>However, no online transmission is completely secure. We cannot guarantee absolute security.</p>

            <h2>6. Cookies & Tracking Technologies</h2>
            <p>Our website uses cookies and similar technologies to:</p>
            <ul>
              <li>Remember your preferences</li>
              <li>Track website analytics (Google Analytics)</li>
              <li>Enable login functionality for members</li>
              <li>Improve overall user experience</li>
            </ul>
            <p>You can control cookie settings in your browser. Note that disabling cookies may affect website functionality.</p>

            <h2>7. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request what personal data we hold about you</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request removal of your data (subject to legal obligations)</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p>To exercise these rights, contact us at <strong>upsa.network@gmail.com</strong>.</p>

            <h2>8. Email Communications</h2>
            <p>If you subscribe to our mailing list:</p>
            <ul>
              <li>We send updates about UPSA events, opportunities, and network news</li>
              <li>You can unsubscribe at any time using the link in our emails</li>
              <li>We respect your communication preferences</li>
              <li>We never share your email with third parties for marketing</li>
            </ul>

            <h2>9. Children's Privacy</h2>
            <p>Our website is not intended for children under 13. We do not knowingly collect information from children under 13. If we become aware of such collection, we will delete it immediately.</p>

            <h2>10. International Users</h2>
            <p>If you are located outside the United States:</p>
            <ul>
              <li>Your information is collected and processed in the U.S.</li>
              <li>U.S. data protection laws may differ from your country's laws</li>
              <li>By using our website, you consent to this transfer and processing</li>
            </ul>

            <h2>11. Third-Party Links</h2>
            <p>Our website contains links to external sites. This Privacy Policy does not apply to third-party websites. We encourage you to review their privacy policies.</p>

            <h2>12. Updates to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of our website indicates acceptance of the updated policy.</p>

            <h2>13. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>
            <ul>
              <li><strong>Email:</strong> upsa.network@gmail.com</li>
              <li><strong>Mailing Address:</strong> 971 US Highway 202 N Ste A, Branchburg, NJ 08876</li>
              <li><strong>Website:</strong> <Link href="/contact">Contact Form</Link></li>
            </ul>

            <hr className="legal-divider" />
            <p className="legal-footer">Last Updated: July 26, 2026</p>
          </div>
        </div>
      </section>
    </>
  );
}
