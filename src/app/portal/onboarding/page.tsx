'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalData } from '../_lib/PortalDataProvider';
import { ApiError } from '../_lib/api';
import Avatar from '../_components/Avatar';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, updateProfile, uploadAvatar } = usePortalData();
  const [step, setStep] = useState(currentUser.hasAvatar ? 2 : 1);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [headline, setHeadline] = useState(currentUser.headline);
  const [university, setUniversity] = useState(currentUser.university);
  const [major, setMajor] = useState(currentUser.major ?? '');
  const [bio, setBio] = useState(currentUser.bio);
  const [mentor, setMentor] = useState(currentUser.availability.mentor);
  const [networking, setNetworking] = useState(currentUser.availability.networking);

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      window.alert('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('Profile photos are limited to 5 MB.');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not upload that photo. Try again.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function finish() {
    try {
      await updateProfile({
        name,
        headline,
        university,
        major,
        bio,
        availability: { ...currentUser.availability, mentor, networking },
      });
      router.push('/portal/dashboard');
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not save your profile. Try again.');
    }
  }

  return (
    <div className="portal-guest">
      <header className="portal-guest-header">
        <div className="portal-guest-brand">
          <img src="/images/logos/upsa-logo.png" alt="" width={32} height={32} />
          UPSA Portal
        </div>
        <Link href="/portal" className="portal-guest-back">Save &amp; exit</Link>
      </header>

      <div className="portal-auth-wrap">
        <div className="portal-auth-card wide">
          <div className="onboarding-steps">
            <span className={step >= 1 ? 'done' : ''} />
            <span className={step >= 2 ? 'done' : ''} />
            <span className={step >= 3 ? 'done' : ''} />
          </div>

          {step === 1 && (
            <>
              <h1>Add a profile photo</h1>
              <p className="sub">Required so other members know who they&apos;re talking to. JPG, PNG, or WEBP, up to 5 MB.</p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: '10px 0 26px' }}>
                <Avatar
                  name={name || 'You'}
                  initials={currentUser.initials || 'U'}
                  color={currentUser.avatarColor}
                  size="lg"
                  imageUrl={previewUrl ?? currentUser.avatarUrl}
                />
                <button type="button" className="btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : currentUser.hasAvatar || previewUrl ? 'Replace photo' : 'Choose photo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoPick} />
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setStep(2)}
                disabled={!currentUser.hasAvatar && !previewUrl}
              >
                Continue &rarr;
              </button>
              {!currentUser.hasAvatar && !previewUrl && (
                <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>A photo is required to continue.</p>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1>Tell us about you</h1>
              <p className="sub">This is what other members will see. You can change it any time.</p>

              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="headline">Title</label>
                <input
                  id="headline"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="e.g. CS Junior @ UCF, or Software Engineer @ Microsoft"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="university">University or company</label>
                  <input id="university" value={university} onChange={e => setUniversity(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="major">Major / role</label>
                  <input id="major" value={major} onChange={e => setMajor(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="bio">One-line about you</label>
                <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                <span className="hint">Shown on your profile and to anyone you request a connection with.</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>
                  Continue &rarr;
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1>What are you looking for?</h1>
              <p className="sub">You can turn these on or off any time from Settings.</p>

              <div className="availability-grid">
                <label className="avail-toggle" htmlFor="mentor-toggle">
                  <span className="copy">
                    <strong>Open to being a mentor</strong>
                    <span>Turn this on if others can discover you and request mentorship. Not required to use the portal.</span>
                  </span>
                  <span className="switch">
                    <input id="mentor-toggle" type="checkbox" checked={mentor} onChange={e => setMentor(e.target.checked)} />
                    <span className="track" />
                  </span>
                </label>
                <label className="avail-toggle" htmlFor="networking-toggle">
                  <span className="copy">
                    <strong>Open to professional networking</strong>
                    <span>Appear in Discover so other members can find and message you.</span>
                  </span>
                  <span className="switch">
                    <input id="networking-toggle" type="checkbox" checked={networking} onChange={e => setNetworking(e.target.checked)} />
                    <span className="track" />
                  </span>
                </label>
              </div>

              <p className="hint" style={{ margin: '4px 0 22px' }}>
                You&apos;ll always stay hidden from Discover unless you turn one of these on. Visibility is opt-in by default.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-outline" onClick={() => setStep(2)}>Back</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={finish}>
                  Finish setup &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
