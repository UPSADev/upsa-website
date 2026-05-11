import Link from 'next/link';
import { getMeetupsByState, getMeetups, formatDate } from '@/lib/content';
import '@/styles/meetups.css';

export const metadata = { title: 'City Meetups' };

export default function MeetupsPage() {
  const byState = getMeetupsByState();
  const total = getMeetups().length;
  const states = Object.keys(byState).sort();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Meetups</span>
          <h1>UPSA <em>Across America</em></h1>
          <p>
            From California to Connecticut — we&apos;re building community in cities
            across the US. Explore meetups by state, see the photos, and find your
            city&apos;s next gathering.
          </p>
        </div>
      </div>

      <div className="meetups-page">
        {/* State filter pills */}
        {states.length > 0 && (
          <div className="state-filter">
            {states.map(s => (
              <a key={s} href={`#${s.replace(/\s+/g,'-').toLowerCase()}`} className="state-pill">
                {s} <span className="state-pill-count">{byState[s].length}</span>
              </a>
            ))}
          </div>
        )}

        {states.length > 0 ? (
          states.map(state => (
            <section
              key={state}
              id={state.replace(/\s+/g,'-').toLowerCase()}
              className="state-section"
            >
              <div className="state-header">
                <h2 className="state-name">{state}</h2>
                <span className="state-count">{byState[state].length} meetup{byState[state].length !== 1 ? 's' : ''}</span>
              </div>

              <div className="meetups-grid">
                {byState[state].map(m => (
                  <Link href={`/meetups/${m.slug}`} key={m.slug} className="meetup-card">
                    <div className="meetup-card-img">
                      {m.coverImage
                        ? <img src={m.coverImage} alt={m.title} loading="lazy" />
                        : <div className="meetup-card-placeholder">{m.city[0]}</div>
                      }
                    </div>
                    <div className="meetup-card-body">
                      <div className="meetup-card-top">
                        <span className="meetup-city">{m.city}</span>
                        <span className="meetup-date">{formatDate(m.date)}</span>
                      </div>
                      <h3>{m.title}</h3>
                      <p>{m.description}</p>
                      {m.attendees && (
                        <span className="meetup-att">{m.attendees} attended</span>
                      )}
                      <div className="meetup-gallery-hint">
                        {m.photos?.length > 0 && `${m.photos.length} photos →`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="empty-state" style={{padding:'120px 20px'}}>
            <p>No meetups yet — add your first city meetup from the admin panel.</p>
          </div>
        )}
      </div>
    </>
  );
}
