'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePortalData } from '../../_lib/PortalDataProvider';
import type { Member } from '../../_lib/types';
import Avatar from '../../_components/Avatar';
import StatusPill from '../../_components/StatusPill';

export default function DashboardPage() {
  const { currentUser, currentUserId, state, loadProfessionals } = usePortalData();
  const [suggested, setSuggested] = useState<Member[]>([]);

  useEffect(() => {
    loadProfessionals({}).then(list => {
      const alreadyRequested = new Set(
        state.requests.filter(r => r.fromId === currentUserId).map(r => r.toId)
      );
      setSuggested(list.filter(m => m.id !== currentUserId && !alreadyRequested.has(m.id)).slice(0, 3));
    });
    // Only ever needs to run once on mount, against whatever's already loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outgoing = state.requests.filter(r => r.fromId === currentUserId);
  const incomingPending = state.requests.filter(r => r.toId === currentUserId && r.status === 'pending');
  const activeConnections = state.connections.filter(
    c => c.memberIds.includes(currentUserId) && c.status === 'active'
  );
  const pendingOutgoing = outgoing.filter(r => r.status === 'pending');

  const recentActivity = [...state.requests]
    .filter(r => r.fromId === currentUserId || r.toId === currentUserId)
    .slice(-4)
    .reverse();

  const profileFieldsFilled = [currentUser.name, currentUser.university, currentUser.bio, currentUser.major].filter(Boolean).length;
  const completeness = Math.round((profileFieldsFilled / 4) * 100);

  return (
    <>
      <div className="portal-page-head">
        <h1>Welcome back, {currentUser.name.split(' ')[0]}</h1>
        <p>Here&apos;s what&apos;s happening in your UPSA network.</p>
      </div>

      <div className="profile-grid" style={{ marginBottom: 22 }}>
        <div className="detail-card">
          <h3>Profile completeness</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, height: 8, background: 'var(--paper-deep)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${completeness}%`, height: '100%', background: 'var(--moss)' }} />
            </div>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: 'var(--ink-2)' }}>{completeness}%</span>
          </div>
          {completeness < 100 && (
            <p style={{ marginTop: 12 }}>
              <Link href="/portal/profile" style={{ color: 'var(--moss)', fontWeight: 600 }}>Finish your profile &rarr;</Link>
            </p>
          )}
        </div>
        <div className="detail-card">
          <h3>Snapshot</h3>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: 'var(--ink)' }}>{incomingPending.length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Incoming requests</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: 'var(--ink)' }}>{pendingOutgoing.length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Awaiting reply</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, color: 'var(--ink)' }}>{activeConnections.length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Active connections</div>
            </div>
          </div>
        </div>
      </div>

      <div className="portal-page-head-row" style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: 'var(--ink)' }}>Suggested for you</h2>
        <Link href="/portal/discover" className="btn-ghost" style={{ padding: 0 }}>See all &rarr;</Link>
      </div>
      <div className="pf-grid" style={{ marginBottom: 32 }}>
        {suggested.map(pro => (
          <Link href={`/portal/professionals/${pro.id}`} key={pro.id} className="card pf-card">
            <div className="pf-card-top">
              <Avatar name={pro.name} initials={pro.initials} color={pro.avatarColor} imageUrl={pro.avatarUrl} size="md" />
              <div>
                <div className="pf-card-name">{pro.name}</div>
                <div className="pf-card-headline">{pro.role} &middot; {pro.company}</div>
              </div>
            </div>
            <div className="pf-card-avail">
              {pro.availability.mentor && <span className="avail-pill mentor">Mentor</span>}
              {pro.availability.networking && <span className="avail-pill networking">Networking</span>}
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: 'var(--ink)', marginBottom: 14 }}>Recent activity</h2>
      {recentActivity.length === 0 ? (
        <p className="empty-state"><span>Nothing yet. Head to Discover to send your first request.</span></p>
      ) : (
        <div className="req-list">
          {recentActivity.map(r => {
            const outgoingReq = r.fromId === currentUserId;
            const other = state.members[outgoingReq ? r.toId : r.fromId];
            if (!other) return null;
            return (
              <div className="req-card" key={r.id}>
                <Avatar name={other.name} initials={other.initials} color={other.avatarColor} imageUrl={other.avatarUrl} size="sm" />
                <div className="req-card-body">
                  <div className="req-card-top">
                    <span className="req-card-name">
                      {outgoingReq ? `You requested ${other.name}` : `${other.name} requested to connect`}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="req-card-sub">{r.createdAt}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
