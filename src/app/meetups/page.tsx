import { getMeetups, formatDate } from '@/lib/content';
import GalleryClient, { type MeetupCard } from '@/components/GalleryClient';
import '@/styles/meetups.css';

export const metadata = { title: 'Gallery — UPSA City Meetups' };

export default function MeetupsPage() {
  const meetups = getMeetups()
    .filter(m => m.status === 'past')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const cards: MeetupCard[] = meetups.map(m => {
    const photos = m.photos?.length > 0 ? m.photos : m.coverImage ? [m.coverImage] : [];
    return {
      slug:        m.slug,
      city:        m.city,
      state:       m.state,
      date:        formatDate(m.date),
      description: m.description ?? '',
      photos,
    };
  });

  const states = [...new Set(meetups.map(m => m.state))].sort();

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

      <div className="meetups-page">
        {meetups.length === 0 ? (
          <p style={{ color: 'var(--ink-3)', fontSize: 15, padding: '80px 0' }}>
            No meetups yet — check back after our first city gathering.
          </p>
        ) : (
          <GalleryClient cards={cards} states={states} />
        )}
      </div>
    </>
  );
}
