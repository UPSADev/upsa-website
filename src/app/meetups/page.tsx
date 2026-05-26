import { getMeetups, formatDate, type Meetup } from '@/lib/content';
import GalleryGrid from '@/components/GalleryGrid';
import '@/styles/meetups.css';

export const metadata = { title: 'Gallery — UPSA City Meetups' };

function getPhotos(m: Meetup): string[] {
  if (m.photos?.length > 0) return m.photos;
  if (m.coverImage) return [m.coverImage];
  return [];
}

export default function MeetupsPage() {
  const meetups = getMeetups()
    .filter(m => m.status === 'past')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Gallery</span>
          <h1>UPSA <em>Across America</em></h1>
          <p>
            Real moments from UPSA city gatherings across the United States.
            Every photo is a room full of people who showed up.
          </p>
        </div>
      </div>

      <div className="events-list">
        {meetups.length === 0 ? (
          <p style={{ color: 'var(--ink-3)', fontSize: 15, padding: '80px 0' }}>
            No meetups yet — check back after our first city gathering.
          </p>
        ) : meetups.map(m => (
          <section key={m.slug} id={m.slug} className="event-section">
            <div className="event-meta">
              <span className="event-city">{m.city}</span>
              <span className="event-date-tag">{formatDate(m.date)}</span>
            </div>
            {m.description && <p className="event-desc">{m.description}</p>}
            {getPhotos(m).length > 0 && (
              <GalleryGrid photos={getPhotos(m)} city={m.city} title={m.title} />
            )}
          </section>
        ))}
      </div>
    </>
  );
}
