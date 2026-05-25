import Link from 'next/link';
import HeroCounter from '@/components/HeroCounter';
import { formatDate, getHomeContent, getMeetups, getTeam, getWorkshops } from '@/lib/content';
import '@/styles/home.css';

export default function HomePage() {
  const home = getHomeContent();
  const chapters = home.chapters || [];

  const homepageMeetups = getMeetups()
    .filter(meetup => meetup.displayOnHomepage)
    .sort((a, b) => (a.homepageOrder ?? 99) - (b.homepageOrder ?? 99));

  const upcomingMeetups = homepageMeetups.filter(meetup => meetup.status === 'upcoming');

  const homepageWorkshops = getWorkshops()
    .filter(workshop => workshop.displayOnHomepage)
    .sort((a, b) => (a.homepageOrder ?? 99) - (b.homepageOrder ?? 99));

  const upcomingSessions = homepageWorkshops.filter(workshop => workshop.status === 'upcoming');
  const pastSessions = homepageWorkshops.filter(workshop => workshop.status === 'past');

  const team = getTeam();

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

      <div className="emergency-strip">
        <div className="es-text">
          <h3>{home.emergencyTitle}</h3>
          <p>{home.emergencyDescription}</p>
        </div>
        <Link href={home.emergencyCtaHref || '/emergency'} className="es-btn">{home.emergencyCtaLabel} &rarr;</Link>
      </div>

      <section className="home-section alt meetup-program-section">
        <span className="sec-tag">-- {home.meetupsTag}</span>
        <h2 className="sec-h2">{emphasizedText(home.meetupsTitle, home.meetupsTitleEmphasis)}</h2>
        <div className="meetup-program-grid">
          {upcomingMeetups.map(meetup => (
            <article className="meetup-card card" key={meetup.slug}>
              <div className={`city-photo city-photo-${meetup.stateCode.toLowerCase()}`} style={{ backgroundImage: `url(${meetup.homepageImage || meetup.coverImage})` }}>
                <span>{meetup.stateCode}</span>
              </div>
              <div className="event-card-body">
                <div className="event-card-meta">
                  <span className="badge badge-upcoming">Upcoming</span>
                  <span className="event-date">{formatDate(meetup.date)}</span>
                </div>
                <h3>{meetup.city} Meetup</h3>
                <p>{meetup.description}</p>
                <div className="event-card-loc">{meetup.state}</div>
                <div className="event-card-footer">
                  <a href={meetup.registerUrl || '#'} className="event-card-link">Register Here &rarr;</a>
                  <span className="badge badge-live"><span className="dot" /> Registration Open</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <span className="sec-tag">-- The Team</span>
        <h2 className="sec-h2">The people <em>behind UPSA.</em></h2>
        <div className="home-team-grid">
          {team.map(member => (
            <div className="home-team-card" key={member.slug}>
              <div className="home-team-portrait">
                {member.photo
                  ? <img src={member.photo} alt={member.name} loading="lazy" />
                  : <div className="home-team-fallback">{member.name[0]}</div>
                }
                <div className="home-team-overlay">
                  <span className="home-team-name">{member.name}</span>
                  <span className="home-team-role">{member.role}</span>
                  {(member.bio || member.linkedin) && (
                    <div className="home-team-reveal">
                      {member.bio && <p className="home-team-bio">{member.bio}</p>}
                      {member.linkedin && (
                        <a href={member.linkedin} className="home-team-li" target="_blank" rel="noopener noreferrer">
                          LinkedIn &rarr;
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section alt learning-section">
        <span className="sec-tag">-- {home.workshopsTag}</span>
        <h2 className="sec-h2">{emphasizedText(home.workshopsTitle, home.workshopsTitleEmphasis)}</h2>
        <div className="learning-grid">
          {upcomingSessions.map(session => (
            <article className="learning-feature card" key={session.slug}>
              <div className="session-poster session-poster-upcoming" style={session.image ? { backgroundImage: `url(${session.image})` } : undefined} aria-label={`${session.title} flyer`} />
              <div className="event-card-body">
                <div className="event-card-meta">
                  <span className="badge badge-upcoming">Upcoming</span>
                  <span className="event-date">{formatDate(session.date)}</span>
                </div>
                <h3>{session.title}</h3>
                <p>{session.description}</p>
                <div className="event-card-footer">
                  <a href={session.registerUrl || '#'} className="event-card-link">Register for Your Spot &rarr;</a>
                  <span className="badge badge-live"><span className="dot" /> Seats Open</span>
                </div>
              </div>
            </article>
          ))}
          <div className="past-sessions">
            <h3>Past Sessions</h3>
            {pastSessions.map(session => (
              <article className="past-session-card" key={session.slug}>
                <div className="session-poster session-poster-past" style={session.image ? { backgroundImage: `url(${session.image})` } : undefined} aria-label={`${session.title} flyer`} />
                <div>
                  <div className="event-card-meta">
                    <span className="badge badge-past">{session.type}</span>
                    <span className="event-date">{formatDate(session.date)}</span>
                  </div>
                  <h4>{session.title}</h4>
                  <p>{session.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
