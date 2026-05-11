import Link from 'next/link';
import { getJoinPageContent } from '@/lib/content';
import '@/styles/join.css';

export const metadata = { title: 'Join the Network' };

function emphasizedText(text: string, emphasis: string) {
  if (!emphasis || !text.includes(emphasis)) return text;
  const [before, after] = text.split(emphasis, 2);
  return <>{before}<em>{emphasis}</em>{after}</>;
}

export default function JoinPage() {
  const content = getJoinPageContent();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">{content.heroTag}</span>
          <h1>{emphasizedText(content.heroTitle, content.heroTitleEmphasis)}</h1>
          <p>{content.heroDescription}</p>
        </div>
      </div>

      <section className="join-section">
        <div className="container">
          <div className="join-grid">
            {content.paths.map((path) => (
              <div className="join-card" key={path.tag} style={{ '--accent': path.accent } as React.CSSProperties}>
                <div className="join-card-tag">{path.tag}</div>
                <h2>{path.title}</h2>
                <p>{path.desc}</p>
                <ul>
                  {path.perks.map((perk) => <li key={perk}>{perk}</li>)}
                </ul>
                <a href={path.url} target="_blank" rel="noopener" className="join-card-btn">{path.cta} &rarr;</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="join-process">
        <div className="container">
          <span className="sec-tag">{content.processTag}</span>
          <h2 className="sec-h2">{emphasizedText(content.processTitle, content.processTitleEmphasis)}</h2>
          <div className="steps-grid">
            {content.steps.map((step) => (
              <div className="step-item" key={step.n}>
                <div className="step-num">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="join-questions">
        <div className="container">
          <span>{content.questionsText}</span>
          <Link href={content.questionsCtaHref} className="btn-outline" style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>
            {content.questionsCtaLabel} &rarr;
          </Link>
        </div>
      </div>
    </>
  );
}
