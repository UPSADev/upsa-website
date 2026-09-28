'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortalData } from '../../_lib/PortalDataProvider';
import type { Member } from '../../_lib/types';
import Avatar from '../../_components/Avatar';

export default function DiscoverPage() {
  const { loadProfessionals } = usePortalData();
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [university, setUniversity] = useState('');
  const [mentorOnly, setMentorOnly] = useState(false);
  const [networkingOnly, setNetworkingOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // A fresh search is starting - not derivable from existing state, so this
    // has to be an explicit flag rather than a computed value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    loadProfessionals({ company, industry, university, mentor: mentorOnly, networking: networkingOnly })
      .then(list => {
        if (!cancelled) setResults(list);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, industry, university, mentorOnly, networkingOnly]);

  const visible = search
    ? results.filter(m => {
        const haystack = `${m.name} ${m.role ?? ''} ${m.company ?? ''} ${m.skills.join(' ')}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
    : results;

  function resetFilters() {
    setSearch('');
    setCompany('');
    setIndustry('');
    setUniversity('');
    setMentorOnly(false);
    setNetworkingOnly(false);
  }

  const hasFilters = search || company || industry || university || mentorOnly || networkingOnly;

  return (
    <>
      <div className="portal-page-head">
        <h1>Discover</h1>
        <p>Find UPSA professionals and mentors by company, industry, university, or what they&apos;re open to.</p>
      </div>

      <div className="filter-bar">
        <div className="filter-field" style={{ minWidth: 220 }}>
          <label htmlFor="f-search">Search</label>
          <input id="f-search" placeholder="Name, role, or skill" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-field">
          <label htmlFor="f-company">Company</label>
          <input id="f-company" placeholder="Any company" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="filter-field">
          <label htmlFor="f-industry">Industry</label>
          <input id="f-industry" placeholder="Any industry" value={industry} onChange={e => setIndustry(e.target.value)} />
        </div>
        <div className="filter-field">
          <label htmlFor="f-university">University</label>
          <input id="f-university" placeholder="Any university" value={university} onChange={e => setUniversity(e.target.value)} />
        </div>
        <div className="filter-checks">
          <label className="filter-check">
            <input type="checkbox" checked={mentorOnly} onChange={e => setMentorOnly(e.target.checked)} /> Mentorship
          </label>
          <label className="filter-check">
            <input type="checkbox" checked={networkingOnly} onChange={e => setNetworkingOnly(e.target.checked)} /> Networking
          </label>
        </div>
        {!!hasFilters && <button className="filter-reset" onClick={resetFilters}>Clear filters</button>}
      </div>

      <p className="filter-count">
        {loading ? 'Searching…' : `${visible.length} professional${visible.length === 1 ? '' : 's'} found`}
      </p>

      {!loading && visible.length === 0 ? (
        <div className="empty-state"><span>No one matches those filters yet. Try clearing a few.</span></div>
      ) : (
        <div className="pf-grid">
          {visible.map(pro => (
            <Link href={`/portal/professionals/${pro.id}`} key={pro.id} className="card pf-card">
              <div className="pf-card-top">
                <Avatar name={pro.name} initials={pro.initials} color={pro.avatarColor} imageUrl={pro.avatarUrl} size="md" />
                <div>
                  <div className="pf-card-name">{pro.name}</div>
                  <div className="pf-card-headline">{pro.role} &middot; {pro.company}</div>
                </div>
              </div>
              <div className="pf-card-meta">
                <span>{pro.university}</span>
                <span>{pro.industry}</span>
              </div>
              <p className="pf-card-bio">{pro.bio}</p>
              <div className="pf-card-foot">
                <div className="pf-card-avail">
                  {pro.availability.mentor && <span className="avail-pill mentor">Mentor</span>}
                  {pro.availability.networking && <span className="avail-pill networking">Networking</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
