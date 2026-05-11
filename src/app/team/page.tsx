import Link from 'next/link';
import { getTeam } from '@/lib/content';
import '@/styles/team.css';

export const metadata = { title: 'Leadership Team' };

export default function TeamPage() {
  const team = getTeam();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">About / Team</span>
          <h1>The people <em>behind</em> UPSA</h1>
          <p>
            A team of students, alumni, and community leaders dedicated to building
            the most connected Pakistani network in America.
          </p>
        </div>
      </div>

      <section className="team-page">
        {team.length > 0 ? (
          <div className="team-grid">
            {team.map(m => (
              <div className="team-card" key={m.slug}>
                <div className="team-portrait">
                  {m.photo
                    ? <img src={m.photo} alt={m.name} loading="lazy" />
                    : <div className="team-fallback">{m.name[0]}</div>
                  }
                </div>
                <div className="team-body">
                  <div className="team-name">
                    {m.linkedin
                      ? <a href={m.linkedin} target="_blank" rel="noopener">{m.name}</a>
                      : m.name
                    }
                  </div>
                  <div className="team-role">{m.role}</div>
                  {m.bio && <p className="team-bio">{m.bio}</p>}
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener" className="team-li">
                      LinkedIn →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Team members will appear here — add them from the admin panel.</p>
          </div>
        )}
      </section>
    </>
  );
}
