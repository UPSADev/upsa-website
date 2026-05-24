import { getChapters } from '@/lib/content';
import '@/styles/chapters.css';

export const metadata = { title: 'University Chapters' };

export default function ChaptersPage() {
  const chapters = getChapters();

  // Group chapters by state
  const byState = chapters.reduce<Record<string, typeof chapters>>((acc, c) => {
    if (!acc[c.state]) acc[c.state] = [];
    acc[c.state].push(c);
    return acc;
  }, {});

  const states = Object.keys(byState).sort();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">Network / Chapters</span>
          <h1>35<em>+</em> chapters across <em>America</em>.</h1>
          <p>
            Every UPSA chapter is a home base for Pakistani students at that university.
            Find your campus, connect with your local chapter leadership, and plug in
            from day one.
          </p>
        </div>
      </div>

      <div className="chapters-page">
        {states.length > 0 ? (
          states.map(state => (
            <section key={state} className="ch-state-section">
              <div className="ch-state-header">
                <h2>{state}</h2>
                <span>{byState[state].length} chapter{byState[state].length !== 1 ? 's' : ''}</span>
              </div>
              <div className="ch-grid">
                {byState[state].map(ch => (
                  <div className="ch-card" key={ch.slug}>
                    {ch.logo && (
                      <div className="ch-logo">
                        <img src={ch.logo} alt={ch.university} loading="lazy" />
                      </div>
                    )}
                    <div className="ch-body">
                      <div className="ch-university">{ch.university}</div>
                      <div className="ch-city">{ch.city}, {ch.stateCode}</div>
                      {ch.memberCount && (
                        <div className="ch-members">{ch.memberCount} members</div>
                      )}
                      <div className="ch-links">
                        {ch.instagram && (
                          <a href={ch.instagram} target="_blank" rel="noopener" className="ch-link">Instagram</a>
                        )}
                        {ch.email && (
                          <a href={`mailto:${ch.email}`} className="ch-link">Email</a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          // No chapters in CMS yet — show the static list
          <div className="ch-static">
            <div className="container">
              <p className="ch-static-note">
                Chapters are managed through the admin panel. Below is our current network:
              </p>
              <div className="ch-static-grid">
                {[
                  'Drexel University','Cornell University','Texas A&M University',
                  'Columbia University','Penn State University','Illinois Tech',
                  'University of Massachusetts','UC Berkeley','University of South Florida',
                  'UT Dallas','Kent State University','Oregon State University',
                  'University of Oklahoma','UCF','Wichita State University',
                  'Cleveland State University','University of Florida','University of Illinois',
                ].map(u => (
                  <div className="ch-simple-card" key={u}>{u}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
