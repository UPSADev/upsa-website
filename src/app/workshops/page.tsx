import Link from 'next/link';
import { getWorkshops, formatDate } from '@/lib/content';
import '@/styles/listing.css';

export const metadata = { title: 'Workshops & Seminars' };

export default function WorkshopsPage() {
  const all = getWorkshops();
  const upcoming = all.filter(w => w.status === 'upcoming');
  const past = all.filter(w => w.status === 'past');

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Workshops</span>
          <h1>Workshops &amp; <em>Seminars</em></h1>
          <p>
            Professional development, career panels, immigration workshops, and cultural
            seminars — skills and knowledge to help you thrive in the US.
          </p>
        </div>
      </div>

      <div className="listing-page">
        {upcoming.length > 0 && (
          <section className="listing-section">
            <div className="listing-header">
              <span className="sec-tag">Upcoming</span>
              <span className="listing-count">{upcoming.length} session{upcoming.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="listing-grid">
              {upcoming.map(w => (
                <Link href={`/workshops/${w.slug}`} key={w.slug} className="card lcard">
                  {w.image && <div className="lcard-img"><img src={w.image} alt={w.title} loading="lazy" /></div>}
                  <div className="lcard-body">
                    <div className="lcard-meta">
                      <span className="badge badge-upcoming">{w.type}</span>
                      <span className="lcard-date">{formatDate(w.date)}</span>
                    </div>
                    <h3 className="lcard-title">{w.title}</h3>
                    <p className="lcard-desc">{w.description}</p>
                    <div className="lcard-loc">🏫 {w.host} · 📍 {w.location}</div>
                    <div className="lcard-foot">
                      <span className="lcard-link">View Details →</span>
                      {w.seats && <span className="lcard-seats">{w.seats} seats</span>}
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
              <span className="sec-tag">Past Sessions</span>
              <span className="listing-count">{past.length} session{past.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="listing-grid">
              {past.map(w => (
                <Link href={`/workshops/${w.slug}`} key={w.slug} className="card lcard lcard--past">
                  {w.image && <div className="lcard-img"><img src={w.image} alt={w.title} loading="lazy" /></div>}
                  <div className="lcard-body">
                    <div className="lcard-meta">
                      <span className="badge badge-past">{w.type}</span>
                      <span className="lcard-date">{formatDate(w.date)}</span>
                    </div>
                    <h3 className="lcard-title">{w.title}</h3>
                    <p className="lcard-desc">{w.description}</p>
                    <div className="lcard-loc">🏫 {w.host}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {all.length === 0 && (
          <div className="empty-state" style={{padding:'120px 20px'}}>
            <p>No workshops yet — add one from the admin panel.</p>
          </div>
        )}
      </div>
    </>
  );
}
