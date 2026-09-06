'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CURRENT_USER_ID, usePortalData } from '../../_lib/PortalDataProvider';
import { COMPANIES, INDUSTRIES, UNIVERSITIES } from '../../_lib/mock-data';
import Avatar from '../../_components/Avatar';

export default function DiscoverPage() {
  const { state } = usePortalData();
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [university, setUniversity] = useState('');
  const [mentorOnly, setMentorOnly] = useState(false);
  const [networkingOnly, setNetworkingOnly] = useState(false);

  const results = useMemo(() => {
    return Object.values(state.members).filter(m => {
      if (!m.isProfessional || !m.visible || m.id === CURRENT_USER_ID) return false;
      if (company && m.company !== company) return false;
      if (industry && m.industry !== industry) return false;
      if (university && m.university !== university) return false;
      if (mentorOnly && !m.availability.mentor) return false;
      if (networkingOnly && !m.availability.networking) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${m.name} ${m.role ?? ''} ${m.company ?? ''} ${m.skills.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [state.members, search, company, industry, university, mentorOnly, networkingOnly]);

  function resetFilters() {
    setSearch(''); setCompany(''); setIndustry(''); setUniversity(''); setMentorOnly(false); setNetworkingOnly(false);
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
          <select id="f-company" value={company} onChange={e => setCompany(e.target.value)}>
            <option value="">All companies</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-industry">Industry</label>
          <select id="f-industry" value={industry} onChange={e => setIndustry(e.target.value)}>
            <option value="">All industries</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-university">University</label>
          <select id="f-university" value={university} onChange={e => setUniversity(e.target.value)}>
            <option value="">All universities</option>
            {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
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

      <p className="filter-count">{results.length} professional{results.length === 1 ? '' : 's'} found</p>

      {results.length === 0 ? (
        <div className="empty-state"><span>No one matches those filters yet. Try clearing a few.</span></div>
      ) : (
        <div className="pf-grid">
          {results.map(pro => (
            <Link href={`/portal/professionals/${pro.id}`} key={pro.id} className="card pf-card">
              <div className="pf-card-top">
                <Avatar name={pro.name} initials={pro.initials} color={pro.avatarColor} size="md" />
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
