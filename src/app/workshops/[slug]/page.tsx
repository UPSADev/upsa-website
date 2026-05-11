import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getWorkshop, getWorkshops, formatDate } from '@/lib/content';
import '@/styles/detail.css';

export async function generateStaticParams() {
  return getWorkshops().map(w => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = getWorkshop(slug);
  if (!w) return {};
  return { title: w.title, description: w.description };
}

export default async function WorkshopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = getWorkshop(slug);
  if (!w) notFound();

  return (
    <>
      <div className="detail-hero" style={w.image ? {backgroundImage:`url(${w.image})`} : undefined}>
        <div className="detail-hero-overlay" />
        <div className="detail-hero-inner">
          <Link href="/workshops" className="detail-back">← Back to Workshops</Link>
          <div className="detail-hero-meta">
            <span className={`badge ${w.status === 'upcoming' ? 'badge-upcoming' : 'badge-past'}`}>
              {w.type}
            </span>
          </div>
          <h1>{w.title}</h1>
          <div className="detail-hero-info">
            <span>📅 {formatDate(w.date)}</span>
            <span>🏫 {w.host}</span>
            <span>📍 {w.location}</span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <p className="detail-lead">{w.description}</p>
          {w.body && <div className="detail-body prose" dangerouslySetInnerHTML={{ __html: w.body }} />}
        </div>

        <aside className="detail-sidebar">
          <div className="detail-info-card">
            <h3>Session Details</h3>
            <dl>
              <dt>Date</dt><dd>{formatDate(w.date)}</dd>
              <dt>Type</dt><dd>{w.type}</dd>
              <dt>Host</dt><dd>{w.host}</dd>
              <dt>Location</dt><dd>{w.location}</dd>
              {w.seats && <><dt>Seats</dt><dd>{w.seats} available</dd></>}
            </dl>
            {w.registerUrl && w.status === 'upcoming' && (
              <a href={w.registerUrl} target="_blank" rel="noopener noreferrer"
                className="btn-primary" style={{marginTop:24, width:'100%', justifyContent:'center'}}>
                Register Now →
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
