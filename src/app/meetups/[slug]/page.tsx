import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMeetup, getMeetups, formatDate } from '@/lib/content';
import '@/styles/meetups.css';

export async function generateStaticParams() {
  return getMeetups().map(m => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMeetup(slug);
  if (!m) return {};
  return { title: m.title, description: m.description };
}

export default async function MeetupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMeetup(slug);
  if (!m) notFound();

  return (
    <>
      {/* Cover hero */}
      <div className="meetup-detail-hero" style={m.coverImage ? {backgroundImage:`url(${m.coverImage})`} : undefined}>
        <div className="meetup-detail-overlay" />
        <div className="meetup-detail-inner">
          <Link href="/meetups" className="detail-back">← All Meetups</Link>
          <div className="meetup-detail-location">
            <span className="meetup-detail-city">{m.city}, {m.state}</span>
          </div>
          <h1>{m.title}</h1>
          <div className="meetup-detail-info">
            <span>📅 {formatDate(m.date)}</span>
            {m.attendees && <span>👥 {m.attendees} attended</span>}
            <span>{m.photos?.length || 0} photos</span>
          </div>
        </div>
      </div>

      <div className="meetup-detail-body container">
        <p className="detail-lead">{m.description}</p>

        {/* Photo gallery */}
        {m.photos && m.photos.length > 0 && (
          <div className="photo-gallery">
            <h2 className="gallery-heading">Photos from the Meetup</h2>
            <div className="gallery-grid">
              {m.photos.map((src, i) => (
                <div key={i} className="gallery-item">
                  <img src={src} alt={`${m.city} meetup photo ${i + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {m.body && (
          <div className="detail-body prose" dangerouslySetInnerHTML={{ __html: m.body }} />
        )}

        <div style={{marginTop:48}}>
          <Link href="/meetups" className="btn-outline">← View All Meetups</Link>
        </div>
      </div>
    </>
  );
}
