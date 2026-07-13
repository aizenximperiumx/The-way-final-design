import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';

/**
 * Public privacy policy — required by Google Play & the App Store
 * (listed as https://theway.ge/privacy). Covers both the website and the
 * student mobile app.
 */

const NAVY = '#0A1628';
const GOLD = '#F5A800';
const SERIF = "'Playfair Display', Georgia, serif";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold mb-3" style={{ color: NAVY, fontFamily: SERIF }}>{title}</h2>
    <div className="space-y-3 text-[15px] leading-[1.85] text-gray-600">{children}</div>
  </section>
);

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Header */}
    <header style={{ background: NAVY }}>
      <div className="max-w-3xl mx-auto px-6 py-14">
        <Link to="/" className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-wide uppercase mb-8" style={{ color: 'rgba(245,240,232,0.6)' }}>
          <ArrowLeft className="w-4 h-4" /> theway.ge
        </Link>
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
          <div className="w-px h-10" style={{ background: 'rgba(245,168,0,0.35)' }} />
          <ShieldCheck className="w-8 h-8" style={{ color: GOLD }} />
        </div>
        <h1 className="mt-6 text-4xl font-black text-white" style={{ fontFamily: SERIF }}>Privacy Policy</h1>
        <p className="mt-3 text-[14px]" style={{ color: 'rgba(245,240,232,0.65)' }}>
          The Way — theway.ge and the “The Way — Study in Georgia” mobile app · Effective 13 July 2026
        </p>
      </div>
    </header>

    {/* Body */}
    <main className="max-w-3xl mx-auto px-6 py-12">
      <Section title="Who we are">
        <p>
          The Way (“we”, “us”) is a student recruitment and consultancy company helping international
          students enroll in universities in Georgia. This policy explains what personal data we collect
          through our website and our student mobile app, why we collect it, and the choices you have.
        </p>
      </Section>

      <Section title="What we collect">
        <p>We only collect what your enrollment genuinely needs:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Identity & contact details</strong> — name, email address, phone number, date of birth, nationality.</li>
          <li><strong>Enrollment documents</strong> — passports, diplomas, transcripts, photos and similar documents you (or your advisor, with your knowledge) upload for admission, visa and residency processing.</li>
          <li><strong>Messages</strong> — your one-to-one chat with your advisor inside the app or portal.</li>
          <li><strong>Application details</strong> — chosen university, program, and the progress of your case.</li>
          <li><strong>Device push token</strong> — only if you enable notifications, so we can send you case updates. It never identifies you publicly.</li>
        </ul>
        <p>We do <strong>not</strong> collect your location, contacts, browsing history, or advertising identifiers, and we show no ads.</p>
      </Section>

      <Section title="Why we use it">
        <ul className="list-disc pl-5 space-y-2">
          <li>To process your university admission, visa and residence permit.</li>
          <li>To let your personal advisor guide you and answer your questions.</li>
          <li>To operate your student member card and partner discounts after you arrive.</li>
          <li>To notify you about the progress of your case and relevant announcements.</li>
        </ul>
        <p>We never sell your data, and we never use it for advertising.</p>
      </Section>

      <Section title="Who we share it with">
        <p>
          Only where your enrollment requires it: the university you apply to, translation/notary providers,
          and Georgian authorities handling recognition, visas and residence permits. Our technical service
          providers (secure cloud hosting and email delivery) process data on our behalf under their own
          security obligations and cannot use it for anything else.
        </p>
      </Section>

      <Section title="Security & retention">
        <p>
          All data travels over encrypted connections (HTTPS) and is stored with access restricted to the
          staff working on your case. Optionally, the mobile app lets you add a PIN App Lock on your device.
          We keep your records while your case is active or your student membership is in use, and delete or
          anonymize them when they are no longer needed or when you ask us to.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can ask us at any time to access, correct, export, or <strong>delete</strong> your personal data —
          including deleting your account entirely. Email us or message your advisor; we respond within 30 days.
          If you are under 18, your parent or guardian provides these requests and consents on your behalf.
        </p>
      </Section>

      <Section title="Contact">
        <p className="flex items-center gap-2">
          <Mail className="w-4 h-4" style={{ color: GOLD }} />
          <a href="mailto:info@theway.ge" className="font-semibold" style={{ color: NAVY }}>info@theway.ge</a>
        </p>
        <p>WhatsApp: +995 571 009 550 · Tbilisi, Georgia</p>
        <p className="text-[13px] text-gray-400">
          If we materially change this policy, we will post the new version here with a new effective date.
        </p>
      </Section>
    </main>

    <footer className="py-8 text-center text-[12px] text-gray-400 border-t border-gray-100">
      © {new Date().getFullYear()} The Way · <Link to="/" className="underline">theway.ge</Link>
    </footer>
  </div>
);

export default PrivacyPage;
