import Link from 'next/link';
import { getResourcePageContent } from '@/lib/content';
import '@/styles/resources.css';

export const metadata = { title: 'Resources' };

const HOTLINES = [
  {
    name: 'Emergency Services',
    number: '911',
    desc: 'Police, fire, ambulance — call immediately for any life-threatening emergency.',
    href: 'tel:911',
  },
  {
    name: 'Suicide & Crisis Lifeline',
    number: '988',
    desc: 'Free, confidential crisis support 24/7. Call or text 988.',
    href: 'tel:988',
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    desc: 'Free 24/7 crisis counseling via text message.',
    href: 'sms:741741&body=HOME',
  },
  {
    name: 'National Domestic Violence Hotline',
    number: '1-800-799-7233',
    desc: 'Confidential support for domestic violence situations.',
    href: 'tel:18007997233',
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    desc: 'Free, confidential treatment referrals for mental health and substance use.',
    href: 'tel:18006624357',
  },
  {
    name: 'HUD Housing & Shelter',
    number: '1-800-569-4287',
    desc: 'Emergency housing and shelter resources for those in need.',
    href: 'tel:18005694287',
  },
];

export default function ResourcesPage() {
  const content = getResourcePageContent();

  function emphasizedText(text = '', emphasis = '') {
    if (!emphasis || !text.includes(emphasis)) return text;
    const [before, after] = text.split(emphasis);
    return <>{before}<em>{emphasis}</em>{after}</>;
  }

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">{content.heroTag}</span>
          <h1>{emphasizedText(content.heroTitle, content.heroTitleEmphasis)}</h1>
          <p>{content.heroDescription}</p>
        </div>
      </div>

      <div className="res-nav">
        <div className="container">
          {content.categories?.map(c => (
            <a key={c.id} href={`#${c.id}`} className="res-nav-item">
              <span>{c.icon}</span>
              <span>{c.title}</span>
            </a>
          ))}
          <a href="#safety" className="res-nav-item">
            <span>⚑</span>
            <span>Safety &amp; Hotlines</span>
          </a>
        </div>
      </div>

      <div className="res-page">
        {content.categories?.map(c => (
          <section key={c.id} id={c.id} className="res-section">
            <div className="container">
              <div className="res-section-head">
                <span className="res-icon">{c.icon}</span>
                <h2 className="sec-h2">{c.title}</h2>
              </div>
              <div className="res-grid">
                {c.items.map(item => (
                  <div className="res-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Safety & Hotlines section */}
        <section id="safety" className="res-section res-safety-section">
          <div className="container">
            <div className="res-section-head">
              <span className="res-icon" aria-hidden="true">⚑</span>
              <h2 className="sec-h2">Important Hotlines &amp; Safety Resources</h2>
            </div>

            <div className="res-safety-disclaimer">
              <strong>Please note:</strong> UPSAA is not providing legal advice and is not an immigration or legal advisory organization. The information below consists of publicly available general resources for emergency and safety situations only. For legal or immigration matters, please consult a licensed attorney or your university&rsquo;s Designated School Official (DSO).
            </div>

            <div className="res-hotlines-grid">
              {HOTLINES.map(h => (
                <a key={h.name} href={h.href} className="res-hotline-card" rel="noopener">
                  <div className="rhc-number">{h.number}</div>
                  <div className="rhc-name">{h.name}</div>
                  <p className="rhc-desc">{h.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
