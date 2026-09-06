'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CURRENT_USER_ID, usePortalData } from '../../../_lib/PortalDataProvider';
import Avatar from '../../../_components/Avatar';
import StatusPill from '../../../_components/StatusPill';
import RoleTag from '../../../_components/RoleTag';
import SendRequestModal from '../../../_components/SendRequestModal';

export default function ProfessionalDetail({ id }: { id: string }) {
  const { state } = usePortalData();
  const [modalOpen, setModalOpen] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const professional = state.members[id];

  if (!professional) {
    return (
      <div className="empty-state">
        <span>We couldn&apos;t find that profile.</span>
        <p style={{ marginTop: 14 }}><Link href="/portal/discover" className="btn-outline btn-sm">Back to Discover</Link></p>
      </div>
    );
  }

  const existingRequest = state.requests.find(r => r.fromId === CURRENT_USER_ID && r.toId === id);
  const canRequest = !existingRequest || ['declined', 'expired', 'cancelled'].includes(existingRequest.status);

  return (
    <>
      <div className="pf-detail-head">
        <Avatar name={professional.name} initials={professional.initials} color={professional.avatarColor} size="lg" />
        <div className="pf-detail-info">
          <div style={{ marginBottom: 8 }}><RoleTag isProfessional={professional.isProfessional} /></div>
          <h1>{professional.name}</h1>
          <div className="headline">{professional.role} &middot; {professional.company}</div>
          <div className="meta-line">{professional.university} &middot; {professional.location} &middot; {professional.industry}</div>
        </div>
        <div className="pf-detail-actions">
          {justSent || (existingRequest && existingRequest.status === 'pending') ? (
            <StatusPill status="pending" />
          ) : existingRequest && !canRequest ? (
            <StatusPill status={existingRequest.status} />
          ) : canRequest ? (
            <button className="btn-primary" onClick={() => setModalOpen(true)}>Send connection request &rarr;</button>
          ) : null}
        </div>
      </div>

      <div className="detail-card">
        <h3>About</h3>
        <p>{professional.bio}</p>
      </div>

      <div className="detail-card">
        <h3>Open to</h3>
        <div className="pf-card-avail">
          {professional.availability.mentor && <span className="avail-pill mentor">Mentorship</span>}
          {professional.availability.networking && <span className="avail-pill networking">Networking</span>}
          {professional.availability.referrals && <span className="avail-pill referrals">Considers referrals</span>}
          {!professional.availability.mentor && !professional.availability.networking && (
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Not currently open to new connections.</span>
          )}
        </div>
        {professional.availability.referrals && (
          <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-3)' }}>
            A referral is never guaranteed. It&apos;s entirely {professional.name.split(' ')[0]}&apos;s discretion.
          </p>
        )}
      </div>

      <div className="detail-card">
        <h3>Skills &amp; expertise</h3>
        <div className="skill-pills">
          {professional.skills.map(s => <span key={s}>{s}</span>)}
        </div>
      </div>

      {modalOpen && (
        <SendRequestModal
          professional={professional}
          onClose={() => setModalOpen(false)}
          onSent={() => { setModalOpen(false); setJustSent(true); }}
        />
      )}
    </>
  );
}
