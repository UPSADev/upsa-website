'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePortalData } from '../../_lib/PortalDataProvider';
import { ApiError } from '../../_lib/api';
import type { Member } from '../../_lib/types';
import Avatar from '../../_components/Avatar';

const EMPTY_TEXT = { search: '', company: '', industry: '', university: '' };

export default function DiscoverPage() {
  const { loadProfessionals } = usePortalData();
  const [results, setResults] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // What's typed right now vs. what's been sent to the server (debounced, so
  // typing doesn't fire a request per keystroke).
  const [text, setText] = useState(EMPTY_TEXT);
  const [applied, setApplied] = useState(EMPTY_TEXT);
  const [mentorOnly, setMentorOnly] = useState(false);
  const [networkingOnly, setNetworkingOnly] = useState(false);

  // Bumped on every new search so a slow "load more" from an old search can't
  // append its results to a newer one.
  const searchId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setApplied({ ...text, search: text.search.trim() }), 300);
    return () => window.clearTimeout(timer);
  }, [text]);

  const filters = { ...applied, mentor: mentorOnly, networking: networkingOnly };

  useEffect(() => {
    const id = ++searchId.current;
    // A fresh search is starting - not derivable from existing state, so this
    // has to be an explicit flag rather than a computed value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    loadProfessionals({ ...applied, mentor: mentorOnly, networking: networkingOnly })
      .then(res => {
        if (searchId.current !== id) return;
        setResults(res.members);
        setHasMore(res.hasMore);
        setPage(1);
      })
      .catch(() => {
        if (searchId.current === id) setResults([]);
      })
      .finally(() => {
        if (searchId.current === id) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, mentorOnly, networkingOnly]);

  async function loadMore() {
    const id = searchId.current;
    setLoadingMore(true);
    try {
      const res = await loadProfessionals(filters, page + 1);
      if (searchId.current !== id) return;
      setResults(prev => [...prev, ...res.members]);
      setHasMore(res.hasMore);
      setPage(p => p + 1);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not load more people. Try again.');
    } finally {
      setLoadingMore(false);
    }
  }

  function resetFilters() {
    setText(EMPTY_TEXT);
    setApplied(EMPTY_TEXT);
    setMentorOnly(false);
    setNetworkingOnly(false);
  }

  const hasFilters = text.search || text.company || text.industry || text.university || mentorOnly || networkingOnly;

  return (
    <>
      <div className="portal-page-head">
        <h1>Discover</h1>
        <p>Find UPSA professionals and mentors by company, industry, university, or what they&apos;re open to.</p>
      </div>

      <div className="filter-bar">
        <div className="filter-field" style={{ minWidth: 220 }}>
          <label htmlFor="f-search">Search</label>
          <input id="f-search" placeholder="Name, role, or skill" value={text.search} onChange={e => setText(t => ({ ...t, search: e.target.value }))} />
        </div>
        <div className="filter-field">
          <label htmlFor="f-company">Company</label>
          <input id="f-company" placeholder="Any company" value={text.company} onChange={e => setText(t => ({ ...t, company: e.target.value }))} />
        </div>
        <div className="filter-field">
          <label htmlFor="f-industry">Industry</label>
          <input id="f-industry" placeholder="Any industry" value={text.industry} onChange={e => setText(t => ({ ...t, industry: e.target.value }))} />
        </div>
        <div className="filter-field">
          <label htmlFor="f-university">University</label>
          <input id="f-university" placeholder="Any university" value={text.university} onChange={e => setText(t => ({ ...t, university: e.target.value }))} />
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
        {loading ? 'Searching…' : `${results.length}${hasMore ? '+' : ''} professional${results.length === 1 && !hasMore ? '' : 's'} found`}
      </p>

      {!loading && results.length === 0 ? (
        <div className="empty-state"><span>No one matches those filters yet. Try clearing a few.</span></div>
      ) : (
        <>
          <div className="pf-grid">
            {results.map(pro => (
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
          {hasMore && (
            <p style={{ textAlign: 'center', marginTop: 22 }}>
              <button className="btn-outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </p>
          )}
        </>
      )}
    </>
  );
}
