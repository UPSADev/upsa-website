'use client';

import Link from 'next/link';
import { usePortalData } from '../../_lib/PortalDataProvider';
import { REQUEST_TYPE_LABELS } from '../../_lib/types';
import Avatar from '../../_components/Avatar';
import StatusPill from '../../_components/StatusPill';

export default function ConnectionsPage() {
  const { state, currentUserId, completeConnection, cancelConnection, shareResumeWithConnection } = usePortalData();

  const connections = state.connections.filter(c => c.memberIds.includes(currentUserId));

  return (
    <>
      <div className="portal-page-head">
        <h1>My Connections</h1>
        <p>People you&apos;ve connected with. Mark a connection complete once you&apos;ve had your conversation.</p>
      </div>

      {connections.length === 0 ? (
        <div className="empty-state">
          <span>No connections yet. Accepted requests will show up here.</span>
          <p style={{ marginTop: 14 }}><Link href="/portal/discover" className="btn-outline btn-sm">Browse Discover</Link></p>
        </div>
      ) : (
        <div className="conn-grid">
          {connections.map(c => {
            const otherId = c.memberIds.find(id => id !== currentUserId)!;
            const other = state.members[otherId];
            if (!other) return null;
            const sourceRequest = state.requests.find(r => r.id === c.requestId);
            return (
              <div className="conn-card" key={c.id}>
                <div className="conn-card-top">
                  <Avatar name={other.name} initials={other.initials} color={other.avatarColor} imageUrl={other.avatarUrl} size="md" />
                  <div>
                    <div className="conn-card-name">{other.name}</div>
                    <div className="conn-card-sub">{other.role ? `${other.role} · ${other.company}` : other.headline}</div>
                  </div>
                </div>
                <div className="conn-card-sub">
                  Connected {c.since}
                  {sourceRequest && <> &middot; {REQUEST_TYPE_LABELS[sourceRequest.requestType]}</>}
                </div>

                <div className="conn-card-sub">
                  {state.resumeSharedWith.includes(c.id) ? (
                    <span style={{ color: 'var(--moss)', fontWeight: 600 }}>Resume shared with {other.name.split(' ')[0]}</span>
                  ) : state.resume ? (
                    <button className="btn-ghost" style={{ padding: 0 }} onClick={() => shareResumeWithConnection(c.id)}>
                      Share resume with {other.name.split(' ')[0]}
                    </button>
                  ) : (
                    <span>No resume uploaded yet. <Link href="/portal/profile" style={{ color: 'var(--moss)', fontWeight: 600 }}>Add one</Link> to share it here.</span>
                  )}
                </div>

                <div className="conn-card-foot">
                  <StatusPill status={c.status} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/portal/messages/${c.id}`} className="btn-outline btn-sm">Message</Link>
                    {c.status === 'active' && (
                      <button className="btn-primary btn-sm" onClick={() => completeConnection(c.id)}>Mark complete</button>
                    )}
                  </div>
                </div>
                {c.status === 'active' && (
                  <button className="btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => cancelConnection(c.id)}>
                    Cancel connection
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
