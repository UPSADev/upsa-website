import Link from 'next/link';
import { getAboutPageContent } from '@/lib/content';
import '@/styles/about.css';

export const metadata = { title: 'About UPSA' };

function emphasizedText(text: string, emphasis: string) {
  if (!emphasis || !text.includes(emphasis)) return text;
  const [before, after] = text.split(emphasis, 2);
  return <>{before}<em>{emphasis}</em>{after}</>;
}

export default function AboutPage() {
  const content = getAboutPageContent();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">{content.heroTag}</span>
          <h1>{emphasizedText(content.heroTitle, content.heroTitleEmphasis)}</h1>
          <p>{content.heroDescription}</p>
        </div>
      </div>

      <section className="about-story">
        <div className="container">
          <div className="story-grid">
            <div className="story-text">
              <span className="sec-tag">{content.storyTag}</span>
              <h2 className="sec-h2">{emphasizedText(content.storyTitle, content.storyTitleEmphasis)}</h2>
              {content.storyParagraphs.map((paragraph, index) => (
                <p key={paragraph} style={index ? { marginTop: 16 } : undefined}>{paragraph}</p>
              ))}
            </div>
            <div className="story-note-col">
              <div className="story-note">
                <span className="story-note-tag">{content.founderTag}</span>
                <blockquote>&ldquo;{content.founderQuote}&rdquo;</blockquote>
                <cite>{content.founderCredit}</cite>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-mv" id="mission">
        <div className="container">
          <div className="mv-grid">
            <div className="mv-box">
              <span className="sec-tag">{content.missionTitle}</span>
              <p>{content.missionDescription}</p>
            </div>
            <div className="mv-box">
              <span className="sec-tag">{content.visionTitle}</span>
              <p>{content.visionDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-culture">
        <div className="container">
          <span className="sec-tag">{content.cultureTag}</span>
          <h2 className="sec-h2">{emphasizedText(content.cultureTitle, content.cultureTitleEmphasis)}</h2>
          <p className="about-culture-sub">{content.cultureDescription}</p>
          <div className="culture-grid">
            {content.cultureCards.map((card) => (
              <div className="culture-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-values" id="values">
        <div className="container">
          <span className="sec-tag">{content.valuesTag}</span>
          <h2 className="sec-h2">{emphasizedText(content.valuesTitle, content.valuesTitleEmphasis)}</h2>
          <div className="values-grid">
            {content.values?.map((value) => (
              <div className="value-item" key={value.title}>
                <span className="value-num">{value.number}</span>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="about-stats">
        <div className="container">
          {content.stats.map((stat) => (
            <div className="about-stat" key={stat.l}>
              <span className="about-stat-n">{stat.n}</span>
              <span className="about-stat-l">{stat.l}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="about-cta">
        <div className="container">
          <h2 className="sec-h2">{emphasizedText(content.ctaTitle, content.ctaTitleEmphasis)}</h2>
          <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href={content.ctaPrimaryHref} className="btn-primary">{content.ctaPrimaryLabel} &rarr;</Link>
            <Link href={content.ctaSecondaryHref} className="btn-outline">{content.ctaSecondaryLabel}</Link>
          </div>
        </div>
      </section>

      <section style={{background: 'rgba(0,0,0,.02)', padding: '64px 0', marginTop: '64px'}}>
        <div className="container">
          <h2 className="sec-h2">Nonprofit Verification & Transparency</h2>
          <p style={{fontSize: '15px', lineHeight: '1.7', marginTop: '16px', maxWidth: '600px', marginBottom: '32px'}}>
            United Pakistani Students &amp; Alumni Association Inc. is a registered U.S. 501(c)(3) nonprofit organization (EIN: 39-3197690). Our nonprofit status is verified through the IRS and we operate with full transparency and public accountability.
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px'}}>
            <a href="https://www.irs.gov/charities-non-profits/tax-exempt-organization-search" target="_blank" rel="noopener" className="btn-outline" style={{textAlign: 'center', padding: '16px', textDecoration: 'none'}}>
              Verify on IRS Database
            </a>
            <Link href="/terms" className="btn-outline" style={{textAlign: 'center', padding: '16px'}}>
              Terms of Service
            </Link>
            <Link href="/privacy" className="btn-outline" style={{textAlign: 'center', padding: '16px'}}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
