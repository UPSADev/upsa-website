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
          <div className="hero-urdu" aria-label="Welcome — Khush Aamadeed">
            <div className="hero-urdu-script" lang="ur">خوش آمدید</div>
            <div className="hero-urdu-line" aria-hidden="true" />
            <div className="hero-urdu-eng">Welcome</div>
          </div>
          <div className="hero-content">
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

      {pastMeetups.length > 0 && (
        <section className="home-section gathered-section">
          <span className="sec-tag">{home.pastMeetupsTag}</span>
          <h2 className="sec-h2">{emphasizedText(home.pastMeetupsTitle, home.pastMeetupsTitleEmphasis)}</h2>
          <div className="gathered-grid">
            {pastMeetups.map(meetup => (
              <Link
                href={`/meetups#${(meetup.state || '').replace(/\s+/g, '-').toLowerCase()}`}
                className="gathered-card"
                key={meetup.slug}
              >
                <div className="gathered-img">
                  <img src={meetup.homepageImage || meetup.coverImage} alt={`${meetup.city} meetup`} loading="lazy" />
                </div>
                <div className="gathered-overlay">
                  <span className="gathered-event-type">Community Meetup</span>
                  <div className="gathered-city">{meetup.city}</div>
                  <div className="gathered-state">{meetup.state}</div>
                  <div className="gathered-date">{formatDate(meetup.date)}</div>
                </div>
                <span className="gathered-cta">See City Gallery →</span>
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
        <span className="sec-tag">{home.valuesTag}</span>
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
        <span className="sec-tag" style={{justifyContent:'center', display:'flex'}}>{home.joinTag}</span>
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
