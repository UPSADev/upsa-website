import Link from 'next/link';
import { getEmergencyPageContent } from '@/lib/content';
import '@/styles/emergency.css';

export const metadata = { title: 'Emergency Support' };

export default function EmergencyPage() {
  const content = getEmergencyPageContent();

  function emphasizedText(text = '', emphasis = '') {
    if (!emphasis || !text.includes(emphasis)) return text;
    const [before, after] = text.split(emphasis);
    return <>{before}<em>{emphasis}</em>{after}</>;
  }

  return (
    <>
      <div className="emergency-hero">
        <div className="eh-inner">
          <span className="eh-tag">{content.heroTag}</span>
          <h1>{emphasizedText(content.heroTitle, content.heroTitleEmphasis)}</h1>
          <p>{content.heroDescription}</p>
          <a href={`mailto:${content.emergencyEmail}`} className="eh-btn">Contact UPSA Emergency Support</a>
        </div>
      </div>

      <section className="emergency-section urgent-note">
        <div className="container">
          <h2>{content.urgentTitle}</h2>
          <p>{content.urgentDescription}</p>
        </div>
      </section>

      <section className="emergency-section">
        <div className="container">
          <span className="sec-tag">Immediate Help</span>
          <h2 className="sec-h2">Call or text <em>right now</em>.</h2>
          <div className="hotlines-grid">
            {content.hotlines?.map(h => (
              <div className="hotline-card" key={h.name}>
                <div className="hotline-body">
                  <div className="hotline-name">{h.name}</div>
                  <div className="hotline-number"><a href={h.href}>{h.number}</a></div>
                  <div className="hotline-note">{h.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {content.sections?.map(section => (
        <section className="emergency-section emergency-section--alt" key={section.cat}>
          <div className="container">
            <div className="er-header">
              <span className="sec-tag">{section.cat}</span>
            </div>
            <div className="er-grid">
              {section.items.map(item => (
                <div className="er-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  {item.links && (
                    <div className="er-links">
                      {item.links.map(link => (
                        <a href={link.href} key={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="emergency-reach">
        <div className="container">
          <h2 className="sec-h2">{emphasizedText(content.reachTitle, content.reachTitleEmphasis)}</h2>
          <p style={{marginTop:16, color:'var(--ink-2)', fontSize:15, maxWidth:620}}>{content.reachDescription}</p>
          <div style={{marginTop:32, display:'flex', gap:14, flexWrap:'wrap'}}>
            <a href={`mailto:${content.emergencyEmail}`} className="btn-primary">Email Emergency Support &rarr;</a>
            <Link href="/contact" className="btn-outline">General Contact</Link>
          </div>
        </div>
      </section>
    </>
  );
}
