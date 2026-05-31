'use client';

import { useState } from 'react';

export default function ContactForm({
  submitLabel,
  successTitle,
  successDescription,
}: {
  submitLabel: string;
  successTitle: string;
  successDescription: string;
}) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString(),
    }).then(() => setSent(true)).catch(() => setSent(true));
  }

  if (sent) {
    return (
      <div className="contact-success">
        <span className="contact-success-icon">OK</span>
        <h3>{successTitle}</h3>
        <p>{successDescription}</p>
      </div>
    );
  }

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      onSubmit={handleSubmit}
      className="contact-form"
    >
      <input type="hidden" name="form-name" value="contact" />
      <input type="hidden" name="bot-field" />
      <div className="cf-row">
        <div className="cf-group">
          <label htmlFor="cf-name">Full Name</label>
          <input id="cf-name" name="name" type="text" placeholder="Your name" required />
        </div>
        <div className="cf-group">
          <label htmlFor="cf-email">Email Address</label>
          <input id="cf-email" name="email" type="email" placeholder="you@example.com" required />
        </div>
      </div>
      <div className="cf-group">
        <label htmlFor="cf-subject">Subject</label>
        <select id="cf-subject" name="subject" required defaultValue="">
          <option value="" disabled>Select a topic</option>
          <option>General</option>
          <option>Website</option>
        </select>
      </div>
      <div className="cf-group">
        <label htmlFor="cf-msg">Message</label>
        <textarea id="cf-msg" name="message" rows={6} placeholder="Your message..." required />
      </div>
      <button type="submit" className="btn-primary cf-submit">
        {submitLabel} &rarr;
      </button>
    </form>
  );
}
