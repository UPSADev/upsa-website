import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvent, getEvents, formatDate } from '@/lib/content';
import '@/styles/detail.css';

export async function generateStaticParams() {
  return getEvents().map(e => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};
  return { title: event.title, description: event.description };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <>
      {/* Hero banner */}
      <div className="detail-hero" style={event.image ? {backgroundImage:`url(${event.image})`} : undefined}>
        <div className="detail-hero-overlay" />
        <div className="detail-hero-inner">
          <Link href="/events" className="detail-back">← Back to Events</Link>
          <div className="detail-hero-meta">
            <span className={`badge ${event.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}`}>
              {event.status === 'upcoming' ? 'Upcoming' : 'Past Event'}
            </span>
            <span className="detail-category">{event.category}</span>
          </div>
          <h1>{event.title}</h1>
          <div className="detail-hero-info">
            <span>📅 {formatDate(event.date)}</span>
            <span>📍 {event.location}</span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        {/* Main content */}
        <div className="detail-main">
          <p className="detail-lead">{event.description}</p>
          {event.body && (
            <div
              className="detail-body prose"
              dangerouslySetInnerHTML={{ __html: event.body }}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="detail-sidebar">
          <div className="detail-info-card">
            <h3>Event Details</h3>
            <dl>
              <dt>Date</dt>
              <dd>{formatDate(event.date)}</dd>
              {event.endDate && <><dt>End Date</dt><dd>{formatDate(event.endDate)}</dd></>}
              <dt>Location</dt>
              <dd>{event.location}</dd>
              {event.state && <><dt>State</dt><dd>{event.state}</dd></>}
              <dt>Category</dt>
              <dd>{event.category}</dd>
            </dl>

            {event.registerUrl && event.status === 'upcoming' && (
              <a
                href={event.registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{marginTop:24, width:'100%', justifyContent:'center'}}
              >
                Register Now →
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
