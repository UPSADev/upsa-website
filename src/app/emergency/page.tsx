import Link from 'next/link';
import { getEmergencyPageContent } from '@/lib/content';
import '@/styles/contact.css';

export const metadata = { title: 'Emergency Support' };

function emphasizedText(text: string, emphasis: string) {
  if (!emphasis || !text.includes(emphasis)) return text;
  const [before, after] = text.split(emphasis, 2);
  return <>{before}<em>{emphasis}</em>{after}</>;
}

export default function EmergencyPage() {
  const content = getEmergencyPageContent();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">{content.heroTag}</span>
          <h1>{emphasizedText(content.heroTitle, content.heroTitleEmphasis)}</h1>
          <p>{content.heroDescription}</p>
        </div>
      </div>

      <section className="contact-page">
        <div className="container">
          <div className="emergency-urgent" style={{marginBottom: '60px'}}>
            <h2 className="sec-h2">{content.urgentTitle}</h2>
            <p style={{fontSize: '15px', lineHeight: '1.7', marginBottom: '24px'}}>{content.urgentDescription}</p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px'}}>
              {content.hotlines.map(h => (
                <a key={h.name} href={h.href} className="res-hotline-card" rel="noopener" style={{textDecoration: 'none'}}>
                  <div className="rhc-number">{h.number}</div>
                  <div className="rhc-name">{h.name}</div>
                  <p className="rhc-desc">{h.note}</p>
                </a>
              ))}
            </div>
          </div>

          {content.sections.map(section => (
            <div key={section.cat} style={{marginBottom: '48px'}}>
              <h3 className="sec-h2" style={{marginBottom: '28px'}}>{section.cat}</h3>
              <div style={{display: 'grid', gap: '32px'}}>
                {section.items.map(item => (
                  <div key={item.title}>
                    <h4 style={{fontSize: '16px', fontWeight: 600, marginBottom: '8px'}}>{item.title}</h4>
                    <p style={{fontSize: '14px', lineHeight: '1.7', color: 'rgba(0,0,0,.7)', marginBottom: '12px'}}>{item.desc}</p>
                    {item.links && (
                      <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                        {item.links.map(link => (
                          <a key={link.href} href={link.href} target="_blank" rel="noopener" className="btn-outline" style={{fontSize: '13px', padding: '8px 16px'}}>
                            {link.label} →
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{padding: '32px 24px', background: 'rgba(0,0,0,.03)', borderRadius: '8px', marginTop: '64px'}}>
            <h3 className="sec-h2">{emphasizedText(content.reachTitle, content.reachTitleEmphasis)}</h3>
            <p style={{fontSize: '15px', lineHeight: '1.7', marginTop: '16px'}}>{content.reachDescription}</p>
            <div style={{marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
              <a href={`mailto:${content.emergencyEmail}`} className="btn-primary">Email Us</a>
              <Link href="/contact" className="btn-outline">Contact Form</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
