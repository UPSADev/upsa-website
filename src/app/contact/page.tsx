import ContactForm from '@/components/ContactForm';
import { getContactPageContent } from '@/lib/content';
import '@/styles/contact.css';

export const metadata = { title: 'Contact' };

function emphasizedText(text: string, emphasis: string) {
  if (!emphasis || !text.includes(emphasis)) return text;
  const [before, after] = text.split(emphasis, 2);
  return <>{before}<em>{emphasis}</em>{after}</>;
}

export default function ContactPage() {
  const content = getContactPageContent();

  return (
    <>
      <div className="page-hero">
        <div className="inner">
          <span className="ph-tag">{content.heroTag}</span>
          <h1>{emphasizedText(content.heroTitle, content.heroTitleEmphasis)}</h1>
          <p>{content.heroDescription}</p>
        </div>
      </div>

      <section className="contact-page">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <span className="sec-tag">{content.infoTag}</span>
              <h2 className="sec-h2">{emphasizedText(content.infoTitle, content.infoTitleEmphasis)}</h2>

              <div className="c-items">
                {content.contacts.map((item) => (
                  <div className="c-item" key={item.label}>
                    <span className="c-icon">{item.icon}</span>
                    <div>
                      <div className="c-label">{item.label}</div>
                      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener' : undefined}>
                        {item.text}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="c-socials">
                {content.socials.map((social) => (
                  <a href={social.href} target="_blank" rel="noopener" className="c-social-btn" key={social.label}>
                    {social.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="contact-form-wrap">
              <ContactForm
                submitLabel={content.submitLabel}
                successTitle={content.successTitle}
                successDescription={content.successDescription}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
