import Link from 'next/link';
import { getMeetups, formatDate, type Meetup } from '@/lib/content';
import '@/styles/meetups.css';

export const metadata = { title: 'City Meetups' };

function groupByState(meetups: Meetup[]) {
  return meetups.reduce<Record<string, Meetup[]>>((acc, meetup) => {
    const state = meetup.state || 'Other';
    if (!acc[state]) acc[state] = [];
    acc[state].push(meetup);
    return acc;
  }, {});
}

export default function MeetupsPage() {
  const pastMeetups = getMeetups().filter((meetup) => meetup.status !== 'upcoming');
  const byState = groupByState(pastMeetups);
  const states = Object.keys(byState).sort();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Community / Meetups</span>
          <h1>UPSA <em>Across America</em></h1>
          <p>
            Browse real photos and recaps from UPSA city meetups across the US.
            Upcoming city registration cards live on the homepage; this archive is
            for meetups that have already happened.
          </p>
        </div>
      </div>

      <div className="meetups-page">
        {states.length > 0 && (
          <div className="state-filter">
            {states.map((state) => (
              <a key={state} href={`#${state.replace(/\s+/g, '-').toLowerCase()}`} className="state-pill">
                {state} <span className="state-pill-count">{byState[state].length}</span>
              </a>
            ))}
          </div>
        )}

        {states.length > 0 ? (
          states.map((state) => (
            <section
              key={state}
              id={state.replace(/\s+/g, '-').toLowerCase()}
              className="state-section"
            >
              <div className="state-header">
                <h2 className="state-name">{state}</h2>
                <span className="state-count">
                  {byState[state].length} past meetup{byState[state].length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="meetups-grid">
                {byState[state].map((meetup) => (
                  <Link href={`/meetups/${meetup.slug}`} key={meetup.slug} className="meetup-card">
                    <div className="meetup-card-img">
                      {meetup.coverImage
                        ? <img src={meetup.coverImage} alt={meetup.title} loading="lazy" />
                        : <div className="meetup-card-placeholder">{meetup.city[0]}</div>
                      }
                    </div>
                    <div className="meetup-card-body">
                      <div className="meetup-card-top">
                        <span className="meetup-city">{meetup.city}</span>
                        <span className="meetup-date">{formatDate(meetup.date)}</span>
                      </div>
                      <h3>{meetup.title}</h3>
                      <p>{meetup.description}</p>
                      {meetup.attendees && (
                        <span className="meetup-att">{meetup.attendees} attended</span>
                      )}
                      <div className="meetup-gallery-hint">
                        {meetup.photos?.length > 0 && `${meetup.photos.length} photos ->`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="empty-state" style={{ padding: '120px 20px' }}>
            <p>No past meetups yet - add one from the CMS after your first city gathering.</p>
          </div>
        )}
      </div>
    </>
  );
}
