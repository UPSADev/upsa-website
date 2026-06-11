import Link from 'next/link';
import HeroCounter from '@/components/HeroCounter';
import HeroWelcome from '@/components/HeroWelcome';
import EventCalendar from '@/components/EventCalendar';
import { formatDate, getHomeContent, getMeetups, getTeam } from '@/lib/content';
import { getGoogleCalendarEvents } from '@/lib/google-calendar';
import '@/styles/home.css';
import '@/styles/events-cal.css';

export const revalidate = 300;

const CHAPTER_LOGOS: Record<string, string> = {
  'Drexel':          '/images/logos/drexel.png',
  'Cornell':         '/images/logos/cornell.png',
  'Texas A&M':       '/images/logos/texas_am.png',
  'Columbia':        '/images/logos/columbia_university.png',
  'Penn State':      '/images/logos/penn_state.png',
  'Illinois Tech':   '/images/logos/illinois_inst_of_tech.png',
  'UMass':           '/images/logos/UMass.png',
  'UC Berkeley':     '/images/logos/university_of_california.jpeg',
  'USF':             '/images/logos/usf.png',
  'UT Dallas':       '/images/logos/utd.png',
  'Kent State':      '/images/logos/kent_state.png',
  'Oregon State':    '/images/logos/oregon_state.png',
  'Oklahoma':        '/images/logos/ou.png',
  'UCF':             '/images/logos/ucf.png',
  'Wichita State':   '/images/logos/wichita_state_uni.jpg',
  'Cleveland State': '/images/logos/Cleveland_State_University.png',
  'U of Florida':    '/images/logos/university_of_florida.png',
  'U of Illinois':   '/images/logos/u_of_illinois.png',
};

export default async function HomePage() {
  const home = getHomeContent();
  const chapters = home.chapters || [];
  const team = getTeam();

  const pastMeetups = getMeetups()
    .filter(m => m.displayOnHomepage && m.status === 'past')
    .sort((a, b) => (a.homepageOrder ?? 99) - (b.homepageOrder ?? 99))
    .slice(0, 6);

  const calEvents = await getGoogleCalendarEvents();

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
          <HeroWelcome />
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
            {[...chapters, ...chapters].map((c, i) => (
              <span key={`${c}-${i}`} className="marquee-item">
                {i % chapters.length !== 0 && (
                  <span className="marquee-dot" aria-hidden="true">·</span>
                )}
                {CHAPTER_LOGOS[c] && (
                  <img
                    src={CHAPTER_LOGOS[c]}
                    alt=""
                    aria-hidden="true"
                    className="marquee-logo"
                    loading="lazy"
                  />
                )}
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="home-section home-about-section">
        <div className="about-photo-left" aria-hidden="true" />
        <div className="about-content-col">
          <div className="about-copy">
            <span className="sec-tag">{home.aboutTag || 'About UPSA'}</span>
            <h2 className="sec-h2">
              {emphasizedText(home.aboutTitle || 'A network built for you.', home.aboutTitleEmphasis || 'for you.')}
            </h2>
            {(home.aboutParagraphs || []).map((p, i) => (
              <p className="about-para" key={i}>{p}</p>
            ))}
            <Link href={home.aboutCtaHref || '/about'} className="btn-outline about-cta">
              {home.aboutCtaLabel || 'Learn Our Story'} &rarr;
            </Link>
          </div>
          {home.founderQuote && (
            <div className="founder-note about-founder-note">
              <blockquote>&ldquo;{home.founderQuote}&rdquo;</blockquote>
              <cite>{home.founderCredit}</cite>
            </div>
          )}
        </div>
        <div className="about-photo-right" aria-hidden="true" />
      </section>

      {pastMeetups.length > 0 && (
        <section className="home-section alt gathered-section">
          <span className="sec-tag">{home.pastMeetupsTag}</span>
          <h2 className="sec-h2">{emphasizedText(home.pastMeetupsTitle, home.pastMeetupsTitleEmphasis)}</h2>
          <div className="gathered-grid">
            {pastMeetups.map(meetup => (
              <Link
                href={`/meetups#${meetup.slug}`}
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
            <Link href="/meetups" className="btn-outline">View All Gallery Photos →</Link>
          </div>
        </section>
      )}

      <section className="home-section home-cal-section">
        <span className="sec-tag">What&rsquo;s Coming</span>
        <h2 className="sec-h2">Upcoming <em>events</em></h2>
        <div className="home-cal-wrap">
          <EventCalendar events={calEvents} />
        </div>
      </section>

      {team.length > 0 && (
        <section className="home-section">
          <span className="sec-tag">The Team</span>
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
      )}

      <section className="home-section alt" style={{textAlign:'center'}}>
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
