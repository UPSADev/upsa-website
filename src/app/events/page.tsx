import Link from 'next/link';
import { getEvents, formatDate, type Event } from '@/lib/content';
import '@/styles/listing.css';

export const metadata = { title: 'Events' };

function eventPlaceholder(event: Event) {
  const words = event.title.split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  return (
    <div className="event-placeholder" aria-label={`${event.title} placeholder`}>
      <span className="event-placeholder-category">{event.category}</span>
      <strong>{initials || 'UP'}</strong>
    </div>
  );
}

export default function EventsPage() {
  const all = getEvents();
  const upcoming = all.filter((event) => event.status === 'upcoming');
  const past = all.filter((event) => event.status === 'past');

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Events</span>
          <h1>Events &amp; <em>Gatherings</em></h1>
          <p>
            Cultural celebrations, annual galas, Eid dinners, Independence Day programs,
            and special UPSA gatherings. City mixers belong under City Meetups.
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
              {upcoming.map((event) => (
                <Link href={`/events/${event.slug}`} key={event.slug} className="card lcard">
                  <div className="lcard-img">
                    {eventPlaceholder(event)}
                  </div>
                  <div className="lcard-body">
                    <div className="lcard-meta">
                      <span className="badge badge-upcoming">Upcoming</span>
                      <span className="lcard-date">{formatDate(event.date)}</span>
                    </div>
                    <h3 className="lcard-title">{event.title}</h3>
                    <p className="lcard-desc">{event.description}</p>
                    <div className="lcard-loc">{event.location}</div>
                    <div className="lcard-foot">
                      <span className="lcard-link">View Details -&gt;</span>
                      {event.registerUrl && (
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
              {past.map((event) => (
                <Link href={`/events/${event.slug}`} key={event.slug} className="card lcard lcard--past">
                  <div className="lcard-img">
                    {eventPlaceholder(event)}
                  </div>
                  <div className="lcard-body">
                    <div className="lcard-meta">
                      <span className="badge badge-past">Past</span>
                      <span className="lcard-date">{formatDate(event.date)}</span>
                    </div>
                    <h3 className="lcard-title">{event.title}</h3>
                    <p className="lcard-desc">{event.description}</p>
                    <div className="lcard-loc">{event.location}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {all.length === 0 && (
          <div className="empty-state" style={{ padding: '120px 20px' }}>
            <p>No events yet - add your first celebration, gala, or cultural program from the CMS.</p>
          </div>
        )}
      </div>
    </>
  );
}
