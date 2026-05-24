import Link from 'next/link';
import HeroCounter from '@/components/HeroCounter';
import { formatDate, getHomeContent, getMeetups } from '@/lib/content';
import '@/styles/home.css';

export default function HomePage() {
  const home = getHomeContent();
  const chapters = home.chapters || [];

  const pastMeetups = getMeetups()
    .filter(meetup => meetup.displayOnHomepage && meetup.status === 'past')
    .sort((a, b) => (a.homepageOrder ?? 99) - (b.homepageOrder ?? 99));

  function emphasizedText(text = '', emphasis = '') {
    if (!emphasis || !text.includes(emphasis)) return text;
    const [before, after] = text.split(emphasis);
    return <>{before}<em>{emphasis}</em>{after}</>;
  }

  return (
    <>
      <section className="hero">
        <div className="hero-photo" />
        <div className="hero-veil" />
        <div className="hero-frame">
          <div className="hero-content">
            <div className="hero-bilingual" aria-label="Welcome">
              <span>Welcome</span>
              <span className="hero-bilingual-sep" aria-hidden="true">·</span>
              <span className="hero-bilingual-ur" lang="ur">خوش آمدید</span>
            </div>
            <h1 className="hero-h1">
              {home.heroTitleLine1}<br />
              {home.heroTitleLine2} <span style={{fontStyle:'italic',color:'rgba(255,255,255,.4)'}}>&#38;</span><br />
              {emphasizedText(home.heroTitleLine3, home.heroEmphasis)}
            </h1>
            <p className="hero-sub">{home.heroDescription}</p>
            <div className="hero-actions">
              <Link href={home.heroPrimaryHref || '/about'} className="hero-btn-white">{home.heroPrimaryLabel} &rarr;</Link>
              <Link href={home.heroSecondaryHref || '/join'} className="hero-btn-ghost">{home.heroSecondaryLabel}</Link>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          {home.heroStats?.map(stat => (
            <div className="stat-item" key={stat.label}>
              <HeroCounter value={stat.value} suffix={stat.suffix} />
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="chapter-strip">
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...chapters, ...chapters].map((c, i) => <span key={`${c}-${i}`}>{i % chapters.length === 0 ? c : `· ${c}`}</span>)}
          </div>
        </div>
      </div>

      <section className="home-section landmark-section liberty-section">
        <div className="landmark-photo liberty-photo" aria-hidden="true" />
        <div className="container" style={{maxWidth:'100%',padding:0}}>
          <div className="about-grid">
            <div className="about-body">
              <span className="sec-tag">-- {home.aboutTag}</span>
              <h2 className="sec-h2">{emphasizedText(home.aboutTitle, home.aboutTitleEmphasis)}</h2>
              {home.aboutParagraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              <div className="founder-note">
                <blockquote>&ldquo;{home.founderQuote}&rdquo;</blockquote>
                <cite>-- {home.founderCredit}</cite>
              </div>
              <div style={{marginTop:32}}>
                <Link href={home.aboutCtaHref || '/about'} className="btn-primary">{home.aboutCtaLabel} &rarr;</Link>
              </div>
            </div>
            <div className="about-visual">
              <div className="about-visual-overlay">
                <div className="stat">35<em>+</em></div>
                <small>Active chapters nationwide</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {pastMeetups.length > 0 && (
        <section className="home-section gathered-section">
          <span className="sec-tag">-- {home.pastMeetupsTag}</span>
          <h2 className="sec-h2">{emphasizedText(home.pastMeetupsTitle, home.pastMeetupsTitleEmphasis)}</h2>
          <div className="gathered-grid">
            {pastMeetups.map(meetup => (
              <Link href={`/meetups/${meetup.slug}`} className="gathered-card" key={meetup.slug}>
                <div className="gathered-img">
                  <img src={meetup.homepageImage || meetup.coverImage} alt={`${meetup.city} meetup`} loading="lazy" />
                  <div className="gathered-overlay">
                    <div className="gathered-city">{meetup.city}</div>
                    <div className="gathered-date">{formatDate(meetup.date)}</div>
                  </div>
                </div>
                <div className="gathered-info">
                  <h3>{meetup.title}</h3>
                  <span className="gathered-cta">View Gallery →</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{marginTop:40, textAlign:'center'}}>
            <Link href="/meetups" className="btn-outline">All Meetups &amp; Photos →</Link>
          </div>
        </section>
      )}

      <section className="home-section alt landmark-section mazar-section">
        <div className="landmark-photo mazar-photo" aria-hidden="true" />
        <span className="sec-tag">-- {home.valuesTag}</span>
        <h2 className="sec-h2">{emphasizedText(home.valuesTitle, home.valuesTitleEmphasis)}</h2>
        <div className="pillars-grid">
          {home.values?.map(value => (
            <div className="pillar" key={value.number}>
              <span className="pillar-num">{value.number}</span>
              <h3>{emphasizedText(value.title, value.emphasis || '')}</h3>
              <p>{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section" style={{textAlign:'center'}}>
        <span className="sec-tag" style={{justifyContent:'center', display:'flex'}}>-- {home.joinTag}</span>
        <h2 className="sec-h2" style={{maxWidth:680, margin:'0 auto'}}>
          {emphasizedText(home.joinTitle, home.joinTitleEmphasis)}
        </h2>
        <p style={{marginTop:20, color:'var(--ink-2)', fontSize:15, maxWidth:480, margin:'16px auto 0'}}>
          {home.joinDescription}
        </p>
        <div style={{marginTop:36, display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap'}}>
          <Link href={home.joinPrimaryHref || '/join'} className="btn-primary">{home.joinPrimaryLabel} &rarr;</Link>
          <Link href={home.joinSecondaryHref || '/chapters'} className="btn-outline">{home.joinSecondaryLabel}</Link>
        </div>
      </section>
    </>
  );
}
