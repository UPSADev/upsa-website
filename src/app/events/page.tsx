import Link from 'next/link';
import { getEvents, formatDate } from '@/lib/content';
import '@/styles/listing.css';

export const metadata = { title: 'Events' };

export default function EventsPage() {
  const all = getEvents();
  const upcoming = all.filter(e => e.status === 'upcoming');
  const past = all.filter(e => e.status === 'past');

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Events</span>
          <h1>Events &amp; <em>Gatherings</em></h1>
          <p>
            From campus socials to national conferences — everything UPSA has coming up,
            and everything we&apos;ve done. Register directly from each event.
          </p>
        </div>
      </div>

      <div className="listing-page">
        {upcoming.length > 0 && (
          <section className="listing-section">
            <div className="listing-header">
              <span className="sec-tag">Upcoming</span>
              <span className="listing-count">{upcoming.length} event{upcoming.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="listing-grid">
              {upcoming.map(e => (
                <Link href={`/events/${e.slug}`} key={e.slug} className="card lcard">
                  {e.image && (
                    <div className="lcard-img">
                      <img src={e.image} alt={e.title} loading="lazy" />
                    </div>
                  )}
                  <div className="lcard-body">
                    <div className="lcard-meta">
                      <span className="badge badge-upcoming">Upcoming</span>
                      <span className="lcard-date">{formatDate(e.date)}</span>
                    </div>
                    <h3 className="lcard-title">{e.title}</h3>
                    <p className="lcard-desc">{e.description}</p>
                    <div className="lcard-loc">📍 {e.location}</div>
                    <div className="lcard-foot">
                      <span className="lcard-link">View Details →</span>
                      {e.registerUrl && (
                        <span className="badge badge-live"><span className="dot" />Register</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="listing-section listing-section--past">
            <div className="listing-header">
              <span className="sec-tag">Past Events</span>
              <span className="listing-count">{past.length} event{past.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="listing-grid">
              {past.map(e => (
                <Link href={`/events/${e.slug}`} key={e.slug} className="card lcard lcard--past">
                  {e.image && (
                    <div className="lcard-img">
                      <img src={e.image} alt={e.title} loading="lazy" />
                    </div>
                  )}
                  <div className="lcard-body">
                    <div className="lcard-meta">
                      <span className="badge badge-past">Past</span>
                      <span className="lcard-date">{formatDate(e.date)}</span>
                    </div>
                    <h3 className="lcard-title">{e.title}</h3>
                    <p className="lcard-desc">{e.description}</p>
                    <div className="lcard-loc">📍 {e.location}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {all.length === 0 && (
          <div className="empty-state" style={{padding:'120px 20px'}}>
            <p>No events yet — add your first event from the CMS admin panel.</p>
          </div>
        )}
      </div>
    </>
  );
}
