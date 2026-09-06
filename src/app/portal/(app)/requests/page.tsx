'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CURRENT_USER_ID, usePortalData } from '../../_lib/PortalDataProvider';
import { REQUEST_TYPE_LABELS } from '../../_lib/mock-data';
import Avatar from '../../_components/Avatar';
import StatusPill from '../../_components/StatusPill';

export default function RequestsPage() {
  const { state, respondToRequest, cancelRequest } = usePortalData();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');

  const incoming = state.requests.filter(r => r.toId === CURRENT_USER_ID).slice().reverse();
  const outgoing = state.requests.filter(r => r.fromId === CURRENT_USER_ID).slice().reverse();
  const pendingIncoming = incoming.filter(r => r.status === 'pending').length;
  const pendingOutgoing = outgoing.filter(r => r.status === 'pending').length;

  const list = tab === 'incoming' ? incoming : outgoing;

  return (
    <>
      <div className="portal-page-head">
        <h1>Requests</h1>
        <p>Manage connection requests you&apos;ve sent and received. Declines are private, you&apos;ll never be asked for a reason.</p>
      </div>

      <div className="tabs">
        <button className={tab === 'incoming' ? 'active' : ''} onClick={() => setTab('incoming')}>
          Incoming {pendingIncoming > 0 && <span className="count">{pendingIncoming}</span>}
        </button>
        <button className={tab === 'outgoing' ? 'active' : ''} onClick={() => setTab('outgoing')}>
          Outgoing {pendingOutgoing > 0 && <span className="count">{pendingOutgoing}</span>}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <span>{tab === 'incoming' ? "No incoming requests yet." : "You haven't sent any requests yet."}</span>
          {tab === 'outgoing' && <p style={{ marginTop: 14 }}><Link href="/portal/discover" className="btn-outline btn-sm">Browse Discover</Link></p>}
        </div>
      ) : (
        <div className="req-list">
          {list.map(r => {
            const other = state.members[tab === 'incoming' ? r.fromId : r.toId];
            if (!other) return null;
            return (
              <div className="req-card" key={r.id}>
                <Link href={`/portal/professionals/${other.id}`}>
                  <Avatar name={other.name} initials={other.initials} color={other.avatarColor} size="md" />
                </Link>
                <div className="req-card-body">
                  <div className="req-card-top">
                    <Link href={`/portal/professionals/${other.id}`} className="req-card-name">{other.name}</Link>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="req-card-sub">{other.role ? `${other.role} · ${other.company}` : other.headline} &middot; {r.createdAt}</div>
                  <div className="req-card-tags"><span>{REQUEST_TYPE_LABELS[r.requestType]}</span></div>
                  <p className="req-card-msg">
                    {tab === 'outgoing' && r.status === 'declined'
                      ? 'This professional isn’t able to connect right now.'
                      : `“${r.message}”`}
                  </p>
                  {tab === 'incoming' && r.status === 'pending' && (
                    <div className="req-card-actions">
                      <button className="btn-primary btn-sm" onClick={() => respondToRequest(r.id, 'accepted')}>Accept</button>
                      <button className="btn-outline btn-sm" onClick={() => respondToRequest(r.id, 'declined')}>Decline</button>
                    </div>
                  )}
                  {tab === 'outgoing' && r.status === 'pending' && (
                    <div className="req-card-actions">
                      <button className="btn-ghost" onClick={() => cancelRequest(r.id)}>Cancel request</button>
                    </div>
                  )}
                  {r.status === 'accepted' && (
                    <div className="req-card-actions">
                      <Link href="/portal/connections" className="btn-outline btn-sm">View connection</Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
