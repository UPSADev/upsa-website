'use client';

import { useState } from 'react';
import { usePortalData } from '../../_lib/PortalDataProvider';

export default function SettingsPage() {
  const { currentUser, state, updateProfile, setDeactivated } = usePortalData();
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function toggle(key: 'mentor' | 'networking' | 'referrals', value: boolean) {
    updateProfile({ availability: { ...currentUser.availability, [key]: value } });
  }

  function handleDeactivate() {
    if (window.confirm('Deactivate your account? Your profile will stop appearing in Discover.')) {
      setDeactivated(true);
      flash('Account deactivated.');
    }
  }

  if (state.deactivated) {
    return (
      <div className="empty-state">
        <span>Your account is deactivated.</span>
        <p style={{ marginTop: 14 }}>
          <button className="btn-primary btn-sm" onClick={() => { setDeactivated(false); flash('Account reactivated.'); }}>
            Reactivate account
          </button>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="portal-page-head">
        <h1>Settings &amp; Privacy</h1>
        <p>Control what other members can see and how you show up in Discover.</p>
      </div>

      <div className="settings-section">
        <h2>Discoverability</h2>
        <p className="desc">Off by default. Turning these on is what makes your profile visible to other members in Discover.</p>
        <div className="settings-row">
          <div className="copy">
            <strong>Open to mentoring</strong>
            <span>Appear in Discover for members looking for a mentor.</span>
          </div>
          <span className="switch">
            <input type="checkbox" checked={currentUser.availability.mentor} onChange={e => toggle('mentor', e.target.checked)} />
            <span className="track" />
          </span>
        </div>
        <div className="settings-row">
          <div className="copy">
            <strong>Open to networking</strong>
            <span>Appear in Discover for general professional networking.</span>
          </div>
          <span className="switch">
            <input type="checkbox" checked={currentUser.availability.networking} onChange={e => toggle('networking', e.target.checked)} />
            <span className="track" />
          </span>
        </div>
        <div className="settings-row">
          <div className="copy">
            <strong>Consider referral conversations</strong>
            <span>Shown as a note on your profile. A referral is never guaranteed, this only signals you&apos;re open to the conversation.</span>
          </div>
          <span className="switch">
            <input type="checkbox" checked={currentUser.availability.referrals} onChange={e => toggle('referrals', e.target.checked)} />
            <span className="track" />
          </span>
        </div>
      </div>

      <div className="settings-section">
        <h2>Privacy</h2>
        <p className="desc">These are built in and not something you need to manage.</p>
        <div className="settings-row">
          <div className="copy">
            <strong>Show my email after a connection is accepted</strong>
            <span>Your email stays hidden until both sides have accepted a request.</span>
          </div>
          <span className="switch"><input type="checkbox" defaultChecked disabled /><span className="track" /></span>
        </div>
        <div className="settings-row">
          <div className="copy">
            <strong>Resume stays private by default</strong>
            <span>Only shared with a specific professional when you opt in on a request.</span>
          </div>
          <span className="switch"><input type="checkbox" defaultChecked disabled /><span className="track" /></span>
        </div>
      </div>

      <div className="settings-section danger-zone">
        <h2>Deactivate account</h2>
        <p className="desc">Your profile stops appearing in Discover. You can reactivate any time.</p>
        <button className="btn-outline btn-sm" onClick={handleDeactivate}>Deactivate account</button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
