import Link from 'next/link';
import { getResourcePageContent } from '@/lib/content';
import '@/styles/resources.css';

export const metadata = { title: 'Resources' };

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

        <div className="res-emergency">
          <div className="container">
            <span>{content.emergencyText}</span>
            <Link href={content.emergencyCtaHref || '/emergency'} className="btn-primary">{content.emergencyCtaLabel} &rarr;</Link>
          </div>
        </div>
      </div>
    </>
  );
}
