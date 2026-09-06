'use client';

import { useRef, useState } from 'react';
import { usePortalData } from '../../_lib/PortalDataProvider';
import Avatar from '../../_components/Avatar';
import RoleTag from '../../_components/RoleTag';

export default function ProfilePage() {
  const { currentUser, state, updateProfile, setResume } = usePortalData();
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [university, setUniversity] = useState(currentUser.university);
  const [major, setMajor] = useState(currentUser.major ?? '');
  const [bio, setBio] = useState(currentUser.bio);
  const [skillsText, setSkillsText] = useState(currentUser.skills.join(', '));

  function save() {
    updateProfile({
      name,
      university,
      major,
      bio,
      skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditing(false);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const okType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
    if (!okType) {
      window.alert('Please upload a PDF, DOC, or DOCX file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('Resume files are limited to 5 MB.');
      return;
    }
    setResume({ fileName: file.name, sizeLabel: `${Math.round(file.size / 1024)} KB`, uploadedAt: 'Just now' });
  }

  return (
    <>
      <div className="portal-page-head-row" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, color: 'var(--ink)' }}>My Profile</h1>
          <p style={{ marginTop: 6, fontSize: 14.5, color: 'var(--ink-3)' }}>This is what other members see when they view your profile.</p>
        </div>
        {!editing && <button className="btn-outline btn-sm" onClick={() => setEditing(true)}>Edit profile</button>}
      </div>

      <div className="profile-head">
        <Avatar name={currentUser.name} initials={currentUser.initials} color={currentUser.avatarColor} size="lg" />
        <div>
          <div style={{ marginBottom: 8 }}><RoleTag isProfessional={currentUser.isProfessional} /></div>
          <h1>{currentUser.name}</h1>
          <div className="sub">{currentUser.headline}</div>
        </div>
      </div>

      {editing ? (
        <div className="detail-card">
          <h3>Edit details</h3>
          <div className="field">
            <label htmlFor="p-name">Full name</label>
            <input id="p-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="p-university">University / company</label>
              <input id="p-university" value={university} onChange={e => setUniversity(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-major">Major / role</label>
              <input id="p-major" value={major} onChange={e => setMajor(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="p-bio">About</label>
            <textarea id="p-bio" value={bio} onChange={e => setBio(e.target.value)} rows={4} />
          </div>
          <div className="field">
            <label htmlFor="p-skills">Skills &amp; interests (comma separated)</label>
            <input id="p-skills" value={skillsText} onChange={e => setSkillsText(e.target.value)} />
          </div>
          <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-primary btn-sm" onClick={save}>Save changes</button>
            <button className="btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="profile-grid">
          <div className="detail-card">
            <h3>About</h3>
            <p>{currentUser.bio}</p>
          </div>
          <div className="detail-card">
            <h3>Education</h3>
            <p>{currentUser.university}{currentUser.major ? `, ${currentUser.major}` : ''}</p>
          </div>
          <div className="detail-card">
            <h3>Skills &amp; interests</h3>
            <div className="skill-pills">
              {currentUser.skills.length ? currentUser.skills.map(s => <span key={s}>{s}</span>) : <span style={{ color: 'var(--ink-3)' }}>None added yet</span>}
            </div>
          </div>
          <div className="detail-card">
            <h3>Availability</h3>
            <div className="pf-card-avail">
              {currentUser.availability.mentor && <span className="avail-pill mentor">Open to mentoring</span>}
              {currentUser.availability.networking && <span className="avail-pill networking">Open to networking</span>}
              {!currentUser.availability.mentor && !currentUser.availability.networking && (
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Not discoverable. Change this in Settings.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, color: 'var(--ink)', margin: '30px 0 14px' }}>Resume</h2>
      <div className="detail-card">
        {state.resume ? (
          <div className="resume-file">
            <div>
              <div className="name">{state.resume.fileName}</div>
              <div className="meta">{state.resume.sizeLabel} &middot; uploaded {state.resume.uploadedAt} &middot; private by default</div>
            </div>
            <div className="resume-actions">
              <button className="btn-outline btn-sm">Download</button>
              <button className="btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>Replace</button>
              <button className="btn-ghost" onClick={() => setResume(null)}>Delete</button>
            </div>
          </div>
        ) : (
          <div className="resume-drop">
            <strong>No resume uploaded</strong>
            Kept private here. You choose who to share it with from your Connections.
            <div style={{ marginTop: 14 }}>
              <button className="btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>Upload resume</button>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFilePick} />
        <p className="hint" style={{ marginTop: 12 }}>PDF, DOC, or DOCX &middot; up to 5 MB. No one can see this until you choose to share it with a specific connection.</p>
      </div>
    </>
  );
}
