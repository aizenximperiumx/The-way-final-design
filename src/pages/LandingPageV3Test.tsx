import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Camera,
  Check,
  Globe,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import vvvUrl from '../../vvv.webp';
import cccUrl from '../../ccc.webp';
import img2594Url from '../../IMG_2594-scaled-1.jpg';
import whatsappUrl from '../../WhatsApp-Image-2025-04-11-at-16.52.webp';
import landingPageTestUrl from '../../landing page test.webp';
import ugPhotoUrl from '../../University of Georgia ( UG ).jpg';
import gauPhotoUrl from '../../Georgian American University (GAU).jpg';
import ibsuPhotoUrl from '../../International Black Sea University (IBSU).jpg';
import tsmuPhotoUrl from '../../Tbilisi state medical university ( TSMU ).jpg';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  program: z.string().min(1, 'Please select a program'),
  aviationDegree: z.string().optional(),
  studyLevel: z.string().min(1, 'Please select a study level'),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

function AnimatedCount({ target, suffix }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const durationMs = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [target]);
  return (
    <span className="v3-serif text-[32px] sm:text-[34px] font-bold tracking-tight text-[var(--v3-yellow)] leading-none">
      {value.toLocaleString()}{suffix ?? ''}
    </span>
  );
}

export default function LandingPageV3Test() {
  const { user } = useAuth();
  const [navSolid, setNavSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { addApplication } = useApp();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
  });
  const selectedProgram = watch('program');

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const marqueeItems = useMemo(() => ([
    'Medicine',
    'Dentistry',
    'Pharmacy',
    'Engineering',
    'Law',
    'Business',
    'Architecture',
    'Computer Science',
    'Aviation',
  ]), []);

  const onSubmit = async (data: ApplicationForm) => {
    try {
      await addApplication({ ...data, status: 'submitted', stage: 'applied', createdAt: new Date().toISOString() });
      toast.success('Application submitted! Our team will contact you soon.');
      reset();
      window.setTimeout(() => navigate('/login'), 900);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  return (
    <div className="v3 min-h-screen">
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-[60]" style={{ background: 'var(--v3-yellow)' }}>
        <div className="max-w-7xl mx-auto px-6 h-[42px] flex items-center justify-between">
          <div className="flex items-center gap-7 text-[12px] font-medium" style={{ color: 'var(--v3-navy)' }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Vakhtang Chabukiani 2, Tbilisi, Georgia
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              info@theway.ge
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              +995 571 009 550
            </div>
          </div>
          <div className="flex items-center gap-3">
            {[
              { icon: Globe, label: 'TikTok', href: 'https://www.tiktok.com/@theway.ge0?_r=1&_t=ZS-95vVkmR2ELa' },
              { icon: Camera, label: 'Instagram', href: 'https://www.instagram.com/thewayge0?igsh=MTN3eWJ3dHpwYjZiOQ%3D%3D&utm_source=qr' },
              { icon: Video, label: 'YouTube', href: 'https://www.youtube.com/@thewaygeorgia' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--v3-yellow)] hover:scale-110 transition-transform"
                style={{ background: 'var(--v3-navy)' }}
                aria-label={s.label}
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <nav
        className="fixed left-0 right-0 z-50 transition-colors"
        style={{
          top: navSolid ? 0 : 42,
          background: navSolid ? 'rgba(10,22,40,0.98)' : 'var(--v3-navy)',
          borderBottom: '1px solid rgba(245,168,0,0.10)',
          backdropFilter: navSolid ? 'blur(16px)' : undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="#home" className="flex items-center">
            <img src={logoUrl} alt="The Way" className="h-10 sm:h-11 w-auto object-contain" />
          </a>

          <div className="hidden lg:flex items-center gap-10">
            {[
              ['#home', 'Home'],
              ['/universities', 'Universities'],
              ['#services', 'Our Services'],
              ['#about', 'About Us'],
            ].map(([href, label]) => (
              href.startsWith('/') ? (
                <Link
                  key={href}
                  to={href}
                  className="text-[12px] tracking-[1.5px] uppercase font-medium transition-colors"
                  style={{ color: 'rgba(245,240,232,0.75)' }}
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  className="text-[12px] tracking-[1.5px] uppercase font-medium transition-colors"
                  style={{ color: 'rgba(245,240,232,0.75)' }}
                >
                  {label}
                </a>
              )
            ))}
            <a
              href={user ? "/login" : "#contact"}
              className="v3-btn-fx px-6 py-3 text-[11px] tracking-[2.5px] uppercase font-bold inline-flex items-center gap-2"
              style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 4 }}
            >
              {user ? "Go to Dashboard" : "Register Now"} <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <button
            type="button"
            className="lg:hidden p-2"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" style={{ color: 'var(--v3-yellow)' }} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80]">
            <div className="absolute inset-0" style={{ background: 'rgba(10,22,40,0.98)' }} onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full max-w-sm px-6 text-center">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-6 right-6 p-2"
                  aria-label="Close menu"
                >
                  <X className="w-7 h-7" style={{ color: 'var(--v3-yellow)' }} />
                </button>
                {[
                  ['#home', 'Home'],
                  ['/universities', 'Universities'],
                  ['#services', 'Our Services'],
                  ['#about', 'About Us'],
                  ['#contact', 'Contact Us'],
                  ['/login', user ? 'Dashboard' : 'Portal Login'],
                ].map(([href, label]) => (
                  <div key={href} className="py-4">
                    {href.startsWith('/') ? (
                      <Link
                        to={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="v3-serif text-3xl font-bold"
                        style={{ color: 'var(--v3-white)' }}
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="v3-serif text-3xl font-bold"
                        style={{ color: 'var(--v3-white)' }}
                      >
                        {label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="home" className="pt-[72px] lg:pt-[114px]">
        <section className="relative min-h-screen md:h-[100vh] overflow-hidden flex flex-col md:flex-row md:items-center">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(245,168,0,0.07) 0%, transparent 60%), linear-gradient(135deg, #0A1628 0%, #0D1F3C 50%, #0A1628 100%)' }} />
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(245,168,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,168,0,0.04) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          <div className="absolute inset-0 opacity-25">
            <img src={img2594Url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,22,40,0.30), rgba(10,22,40,0.94))' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20 md:py-0 flex-grow flex flex-col justify-center">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-[2px]" style={{ background: 'var(--v3-yellow)' }} />
                <p className="text-[10px] sm:text-[11px] tracking-[2px] sm:tracking-[4px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>
                  Your Gateway to Education in Georgia
                </p>
              </div>
              <h1 className="v3-serif mt-6 font-black leading-[1.1] sm:leading-[0.93] text-[34px] xs:text-[38px] sm:text-[74px] lg:text-[96px]" style={{ color: 'var(--v3-white)' }}>
                Study in<br />
                <em className="italic" style={{ color: 'var(--v3-yellow)' }}>Georgia</em><br />
                <span className="block mt-2 md:mt-0" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.18)', color: 'transparent', fontSize: '0.85em' }}>The Right Way</span>
              </h1>
              <p className="v3-body mt-6 text-[15px] sm:text-[20px] leading-[1.6] sm:leading-[1.75] max-w-[520px]" style={{ color: 'rgba(245,240,232,0.65)' }}>
                We guide international students through every step of enrolling in Georgia&apos;s top universities - from application to graduation and beyond.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-wrap gap-3">
                <Link
                  to="/universities"
                  className="v3-btn-fx w-full sm:w-auto px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold inline-flex items-center justify-center gap-2"
                  style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 4 }}
                >
                  Explore Universities <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#contact"
                  className="v3-btn-fx w-full sm:w-auto px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-semibold inline-flex items-center justify-center gap-2 border-2"
                  style={{ borderColor: 'rgba(255,255,255,0.40)', color: 'var(--v3-white)', borderRadius: 4 }}
                >
                  Apply Now - Free
                </a>
              </div>
            </div>
          </div>

          <div className="absolute left-6 bottom-[124px] hidden lg:flex items-center gap-4">
            <div className="w-px h-14" style={{ background: 'linear-gradient(to bottom, transparent, var(--v3-yellow))' }} />
            <div className="text-[9px] tracking-[3px] uppercase" style={{ color: 'rgba(245,168,0,0.55)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Scroll
            </div>
          </div>

          <div className="relative md:absolute left-0 right-0 bottom-0 grid grid-cols-2 lg:grid-cols-4 border-t" style={{ borderColor: 'var(--v3-glass-border)', background: 'rgba(10,22,40,0.95)', backdropFilter: 'blur(16px)' }}>
            {[
              { n: 5000, s: '+', l: 'Students Enrolled' },
              { n: 40, s: '+', l: 'Partner Universities' },
              { n: 15, s: '+', l: 'Years Experience' },
              { n: 98, s: '%', l: 'Success Rate' },
            ].map((it) => (
              <div key={it.l} className="px-4 sm:px-6 py-4 sm:py-5 border-r last:border-r-0 border-b lg:border-b-0" style={{ borderColor: 'var(--v3-glass-border)' }}>
                <AnimatedCount target={it.n} suffix={it.s} />
                <div className="text-[9px] sm:text-[10px] tracking-[1.5px] sm:tracking-[2px] uppercase mt-1" style={{ color: 'rgba(245,240,232,0.45)' }}>
                  {it.l}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="v3-marquee">
          <div className="v3-marquee-inner">
            {[...marqueeItems, ...marqueeItems].map((t, idx) => (
              <div key={`${t}-${idx}`} className="flex items-center gap-6 px-6 py-4 text-[11px] font-bold tracking-[3px] uppercase" style={{ color: 'var(--v3-navy)', whiteSpace: 'nowrap' }}>
                {t}
                <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(10,22,40,0.35)' }} />
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="py-24">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative overflow-hidden border" style={{ borderColor: 'var(--v3-glass-border)', background: 'linear-gradient(135deg, var(--v3-navy-mid), var(--v3-navy-light))', height: 540 }}>
                <img src={landingPageTestUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
                <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(245,168,0,0.04) 44px, rgba(245,168,0,0.04) 45px), repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(245,168,0,0.04) 44px, rgba(245,168,0,0.04) 45px)' }} />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 40% 70%, rgba(245,168,0,0.12) 0%, transparent 65%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-8" style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.97), transparent)' }}>
                  <div className="inline-block px-3 py-1 text-[10px] tracking-[2px] uppercase font-bold rounded-sm" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }}>
                    Trusted Since 2009
                  </div>
                  <div className="v3-serif mt-3 text-[22px] font-bold" style={{ color: 'var(--v3-white)' }}>
                    Your Education Partner
                  </div>
                  <div className="mt-3">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 border"
                      style={{ borderColor: 'rgba(245,168,0,0.18)', background: 'rgba(10,22,40,0.55)', color: 'rgba(245,240,232,0.70)' }}
                    >
                      <MapPin className="w-4 h-4" style={{ color: 'var(--v3-yellow)' }} />
                      <span className="text-[10px] tracking-[2px] uppercase font-bold">Tbilisi Only</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block absolute top-10 -right-6 w-[168px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                style={{ background: 'var(--v3-navy-mid)', borderColor: 'var(--v3-glass-border)' }}
              >
                <div className="v3-serif text-[42px] font-black leading-none" style={{ color: 'var(--v3-yellow)' }}>40+</div>
                <div className="mt-2 text-[10px] tracking-[2px] uppercase" style={{ color: 'rgba(245,240,232,0.45)' }}>
                  Partner Universities
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
                <div className="text-[10px] tracking-[4px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>
                  About The Way
                </div>
              </div>
              <h2 className="v3-serif mt-5 text-[38px] sm:text-[52px] font-bold leading-[1.08]" style={{ color: 'var(--v3-white)' }}>
                Your Bridge to<br /><em className="italic" style={{ color: 'var(--v3-yellow)' }}>World-Class</em><br />Education in Georgia
              </h2>
              <p className="v3-body mt-5 text-[18px] leading-[1.82]" style={{ color: 'rgba(245,240,232,0.62)' }}>
                The Way is a leading student recruitment and consultancy company helping international students gain admission to Georgia&apos;s top universities. We simplify every step of the process of studying abroad.
              </p>
              <p className="v3-body mt-4 text-[18px] leading-[1.82]" style={{ color: 'rgba(245,240,232,0.62)' }}>
                From choosing the right university and program, to visa support, accommodation, and ongoing student care - we are with you every step of the way.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Free university admission consulting',
                  'Official partner network across Georgia',
                  'Full visa & document support',
                  'Accommodation assistance',
                  'Airport pickup & arrival support',
                  'Ongoing student care throughout your studies',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[14px] leading-[1.5]" style={{ color: 'rgba(245,240,232,0.70)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center mt-[2px]" style={{ background: 'var(--v3-yellow)' }}>
                      <Check className="w-3 h-3" style={{ color: 'var(--v3-navy)' }} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#services" className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold inline-flex items-center gap-2" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 4 }}>
                  Learn More About Us
                </a>
                <a href="#contact" className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold border-2" style={{ borderColor: 'var(--v3-yellow)', color: 'var(--v3-yellow)', borderRadius: 4 }}>
                  Apply Free
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24" style={{ background: 'rgba(13,31,60,0.40)' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-3">
                <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
                <div className="text-[10px] tracking-[4px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>
                  Why Georgia
                </div>
                <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
              </div>
              <h2 className="v3-serif mt-5 text-[38px] sm:text-[52px] font-bold" style={{ color: 'var(--v3-white)' }}>
                Why Study in <em className="italic" style={{ color: 'var(--v3-yellow)' }}>Georgia?</em>
              </h2>
            </div>

            <div className="mt-14 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { t: 'WHO-Recognized Degrees', d: 'Georgian university degrees are recognized worldwide - your degree opens doors globally.' },
                { t: 'Affordable Tuition Fees', d: 'Study at a fraction of the cost compared to Europe or the US - without compromising quality.' },
                { t: 'English-Taught Programs', d: 'Most programs are offered fully in English, making Georgia accessible to international students.' },
                { t: 'Safe & Welcoming Country', d: 'Georgia is ranked among the safest countries with a warm culture that welcomes students.' },
                { t: 'Modern Universities', d: 'Modern facilities, teaching hospitals, and internationally qualified professors.' },
                { t: 'Vibrant Student Life', d: 'A thriving international community in a city blending ancient history and modern energy.' },
              ].map((c) => (
                <div key={c.t} className="p-8 border transition-colors v3-card-float"
                  style={{ borderColor: 'var(--v3-glass-border)', background: 'var(--v3-glass)' }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5 border"
                    style={{ background: 'rgba(245,168,0,0.10)', borderColor: 'rgba(245,168,0,0.20)' }}
                  >
                    <ShieldCheck className="w-6 h-6" style={{ color: 'var(--v3-yellow)' }} />
                  </div>
                  <div className="v3-serif text-[20px] font-bold" style={{ color: 'var(--v3-white)' }}>{c.t}</div>
                  <div className="mt-3 text-[13px] leading-[1.72]" style={{ color: 'rgba(245,240,232,0.50)' }}>{c.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
                  <div className="text-[10px] tracking-[4px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>
                    What We Offer
                  </div>
                </div>
                <h2 className="v3-serif mt-5 text-[38px] sm:text-[52px] font-bold" style={{ color: 'var(--v3-white)' }}>
                  Our <em className="italic" style={{ color: 'var(--v3-yellow)' }}>Services</em>
                </h2>
              </div>
              <a href="#contact" className="v3-btn-fx px-6 py-3 text-[10px] tracking-[2.5px] uppercase font-bold border-2 inline-flex items-center gap-2"
                style={{ borderColor: 'var(--v3-yellow)', color: 'var(--v3-yellow)', borderRadius: 4 }}
              >
                Apply Free <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-14 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { n: '01 --', t: 'University Admission', d: 'Free consultation and complete application support to get you admitted into your chosen university and program.', img: cccUrl },
                { n: '02 --', t: 'Visa & Documents', d: 'Full support with student visa applications, translation, notarization, and all official paperwork required.', img: whatsappUrl },
                { n: '03 --', t: 'Accommodation', d: 'We help you find safe, comfortable, and affordable accommodation near your university before you arrive.', img: vvvUrl },
              ].map((c) => (
                <div key={c.t} className="relative overflow-hidden border p-8 v3-card-float"
                  style={{ borderColor: 'var(--v3-glass-border)', background: 'var(--v3-glass)' }}
                >
                  <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.10]" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,22,40,0.35), rgba(10,22,40,0.92))' }} />
                  <div className="relative">
                    <div className="text-[10px] font-bold tracking-[3px]" style={{ color: 'rgba(245,168,0,0.60)' }}>{c.n}</div>
                    <div className="v3-serif mt-3 text-[22px] font-bold" style={{ color: 'var(--v3-white)' }}>{c.t}</div>
                    <div className="mt-3 text-[13px] leading-[1.72]" style={{ color: 'rgba(245,240,232,0.50)' }}>{c.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="universities" className="py-24" style={{ background: 'rgba(13,31,60,0.40)' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="text-[13px] font-bold tracking-[3px] uppercase" style={{ color: 'var(--v3-yellow)' }}>
                Choose your university
              </div>
              <h2 className="v3-serif mt-3 text-[32px] sm:text-[42px] font-bold" style={{ color: 'var(--v3-white)' }}>
                Partner <em className="italic" style={{ color: 'var(--v3-yellow)' }}>Universities</em>
              </h2>
              <p className="mt-3 text-[14px] tracking-[1px]" style={{ color: 'rgba(245,240,232,0.45)' }}>
                A preview list - open any university to see full details, fees, and requirements.
              </p>
            </div>

            <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-3 gap-7">
              {[
                { id: 'ug', abbr: 'UG', name: 'University of Georgia', location: 'Tbilisi, Georgia', img: ugPhotoUrl, badge: 'Popular', tags: ['Medicine', 'Dentistry', 'IT', 'Business'] },
                { id: 'aoug', abbr: 'GAU', name: 'Georgian American University', location: 'Tbilisi, Georgia', img: gauPhotoUrl, badge: 'Accredited', tags: ['Medicine', 'Business'] },
                { id: 'ibsu', abbr: 'IBSU', name: 'International Black Sea University', location: 'Tbilisi, Georgia', img: ibsuPhotoUrl, badge: 'English Programs', tags: ['Business', 'CS', 'IR', 'Design'] },
                { id: 'tsmu', abbr: 'TSMU', name: 'Tbilisi State Medical University', location: 'Tbilisi, Georgia', img: tsmuPhotoUrl, badge: 'Medical Focus', tags: ['Medicine', 'Dentistry', 'Pharmacy', 'Nursing'] },
              ].map((u) => (
                <Link
                  key={u.id}
                  to={`/universities/${u.id}`}
                  className="rounded-lg overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)] block v3-card-float"
                  style={{ background: 'var(--v3-navy-mid)' }}
                >
                  <div className="relative h-[200px]" style={{ background: 'var(--v3-white)' }}>
                    <img src={u.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.0), rgba(255,255,255,0.0), rgba(10,22,40,0.22))' }} />
                    <div className="absolute top-3 right-3 px-3 py-1 text-[9px] font-bold tracking-[1.5px] uppercase"
                      style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 2 }}
                    >
                      {u.badge}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: 'var(--v3-yellow)' }}>{u.abbr}</div>
                    <div className="v3-serif mt-2 text-[18px] font-bold" style={{ color: 'var(--v3-white)' }}>{u.name}</div>
                    <div className="mt-2 text-[12px]" style={{ color: 'rgba(245,240,232,0.45)' }}>{u.location}</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {u.tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 text-[10px] tracking-[1px] uppercase border"
                          style={{ color: 'rgba(245,240,232,0.50)', borderColor: 'rgba(245,168,0,0.20)', borderRadius: 2 }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/universities"
                className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold inline-flex items-center gap-2"
                style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 4 }}
              >
                View All Universities <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#contact"
                className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-semibold inline-flex items-center gap-2 border-2"
                style={{ borderColor: 'rgba(255,255,255,0.40)', color: 'var(--v3-white)', borderRadius: 4 }}
              >
                Ask For More Info
              </a>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
                <div className="text-[10px] tracking-[4px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>
                  Student Stories
                </div>
              </div>
              <div className="v3-serif mt-5 text-[96px] leading-[0.75]" style={{ color: 'var(--v3-yellow)', opacity: 0.15 }}>
                &quot;
              </div>
              <div className="mt-3 flex gap-1" style={{ color: 'var(--v3-yellow)' }}>
                {'*****'.split('').map((s, i) => <span key={i} className="text-[16px]">{s}</span>)}
              </div>
              <p className="v3-body mt-5 text-[22px] italic leading-[1.62]" style={{ color: 'var(--v3-white)' }}>
                &quot;The Way made my dream of studying in Georgia a reality. They handled everything - admission, documents, and accommodation. I arrived prepared and supported.&quot;
              </p>
              <div className="mt-7 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center v3-serif text-[18px] font-bold" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }}>
                  A
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--v3-white)' }}>Ahmed Al-Rashidi</div>
                  <div className="text-[11px] tracking-[1px]" style={{ color: 'rgba(245,240,232,0.45)' }}>Medical Student - From Jordan</div>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 border p-6" style={{ borderColor: 'var(--v3-glass-border)', background: 'rgba(245,168,0,0.04)', borderRadius: 4 }}>
                <div className="flex gap-1" style={{ color: 'var(--v3-yellow)' }}>
                  {'*****'.split('').map((s, i) => <span key={i} className="text-[12px]">{s}</span>)}
                </div>
                <p className="v3-body mt-3 text-[15px] italic leading-[1.6]" style={{ color: 'rgba(245,240,232,0.70)' }}>
                  &quot;I was confused about which university to choose. The consultants guided me perfectly. Now I&apos;m in my second year and couldn&apos;t be happier.&quot;
                </p>
                <div className="mt-3 text-[11px] font-bold tracking-[1px]" style={{ color: 'var(--v3-yellow)' }}>
                  - Priya Sharma - Dentistry Student, India
                </div>
              </div>
              {[
                { t: 'Fast, professional, genuinely caring. Best decision I ever made.', a: '- David Osei - Ghana' },
                { t: 'They answered every question instantly. Outstanding support team.', a: '- Fatima Malik - Pakistan' },
              ].map((x) => (
                <div key={x.a} className="border p-6" style={{ borderColor: 'var(--v3-glass-border)', background: 'var(--v3-glass)', borderRadius: 4 }}>
                  <div className="flex gap-1" style={{ color: 'var(--v3-yellow)' }}>
                    {'*****'.split('').map((s, i) => <span key={i} className="text-[12px]">{s}</span>)}
                  </div>
                  <p className="v3-body mt-3 text-[15px] italic leading-[1.6]" style={{ color: 'rgba(245,240,232,0.70)' }}>
                    &quot;{x.t}&quot;
                  </p>
                  <div className="mt-3 text-[11px] font-bold tracking-[1px]" style={{ color: 'var(--v3-yellow)' }}>
                    {x.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 relative overflow-hidden" id="contact">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(245,168,0,0.10) 0%, transparent 65%), linear-gradient(135deg, var(--v3-navy-mid), var(--v3-navy))' }} />
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(245,168,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,168,0,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-3">
                <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
                <div className="text-[10px] tracking-[4px] uppercase font-semibold" style={{ color: 'var(--v3-yellow)' }}>
                  Begin Your Journey
                </div>
                <div className="w-8 h-px" style={{ background: 'var(--v3-yellow)' }} />
              </div>
              <h2 className="v3-serif mt-5 text-[38px] sm:text-[64px] font-black leading-[0.96]" style={{ color: 'var(--v3-white)' }}>
                Start Your Studies<br /><em className="italic" style={{ color: 'var(--v3-yellow)' }}>in Georgia Today</em>
              </h2>
              <p className="v3-body mt-4 text-[20px] leading-[1.7] max-w-[520px] mx-auto" style={{ color: 'rgba(245,240,232,0.55)' }}>
                Free consultation. No hidden fees. Expert guidance to get you into the university of your dreams.
              </p>
            </div>

            <div className="mt-12 grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 border p-8" style={{ borderColor: 'rgba(245,168,0,0.12)', background: 'rgba(245,168,0,0.03)' }}>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5" style={{ color: 'var(--v3-yellow)' }} />
                  <p className="text-[10px] tracking-[3px] uppercase font-bold" style={{ color: 'var(--v3-yellow)' }}>Contact</p>
                </div>
                <div className="mt-6 space-y-5">
                  {[
                    { icon: MapPin, label: 'Office', value: 'Vakhtang Chabukiani 2, Tbilisi, Georgia' },
                    { icon: Mail, label: 'Email', value: 'info@theway.ge' },
                    { icon: Phone, label: 'Phone', value: '+995 571 009 550' },
                  ].map((it) => (
                    <div key={it.label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,168,0,0.10)' }}>
                        <it.icon className="w-5 h-5" style={{ color: 'var(--v3-yellow)' }} />
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[3px] uppercase font-bold" style={{ color: 'var(--v3-yellow)' }}>{it.label}</div>
                        <div className="mt-1 text-[15px] font-medium" style={{ color: 'var(--v3-white)' }}>{it.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <p className="text-[10px] tracking-[3px] uppercase font-bold mb-4" style={{ color: 'var(--v3-yellow)' }}>Follow Us</p>
                  <div className="flex gap-3">
                    <a href="https://www.instagram.com/thewayge0?igsh=MTN3eWJ3dHpwYjZiOQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border hover:bg-[var(--v3-yellow)] hover:text-[var(--v3-navy)] transition-all"
                      style={{ borderColor: 'rgba(245,168,0,0.25)', background: 'rgba(245,168,0,0.05)', color: 'var(--v3-yellow)' }}
                      aria-label="Instagram"
                    >
                      <Camera className="w-5 h-5" />
                    </a>
                    <a href="https://www.tiktok.com/@theway.ge0?_r=1&_t=ZS-95vVkmR2ELa" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border hover:bg-[var(--v3-yellow)] hover:text-[var(--v3-navy)] transition-all"
                      style={{ borderColor: 'rgba(245,168,0,0.25)', background: 'rgba(245,168,0,0.05)', color: 'var(--v3-yellow)' }}
                      aria-label="TikTok"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                    <a href="https://www.youtube.com/@thewaygeorgia" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center border hover:bg-[var(--v3-yellow)] hover:text-[var(--v3-navy)] transition-all"
                      style={{ borderColor: 'rgba(245,168,0,0.25)', background: 'rgba(245,168,0,0.05)', color: 'var(--v3-yellow)' }}
                      aria-label="YouTube"
                    >
                      <Video className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="v3-serif text-[36px] font-bold" style={{ color: 'var(--v3-white)' }}>
                  Apply <em className="italic" style={{ color: 'var(--v3-yellow)' }}>Free</em>
                </div>
                <div className="mt-8 border p-8" style={{ borderColor: 'rgba(245,168,0,0.12)', background: 'rgba(255,255,255,0.02)' }}>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Full name</label>
                        <input
                          {...register('name')}
                          className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                          style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                          placeholder="Your name"
                        />
                        {errors.name && <p className="mt-2 text-[12px] font-semibold" style={{ color: '#F44336' }}>{errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Email</label>
                        <input
                          type="email"
                          {...register('email')}
                          className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                          style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                          placeholder="you@email.com"
                        />
                        {errors.email && <p className="mt-2 text-[12px] font-semibold" style={{ color: '#F44336' }}>{errors.email.message}</p>}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Phone</label>
                        <input
                          {...register('phone')}
                          className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                          style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                          placeholder="+1..."
                        />
                        {errors.phone && <p className="mt-2 text-[12px] font-semibold" style={{ color: '#F44336' }}>{errors.phone.message}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Country</label>
                        <input
                          {...register('country')}
                          className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                          style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                          placeholder="Your country"
                        />
                        {errors.country && <p className="mt-2 text-[12px] font-semibold" style={{ color: '#F44336' }}>{errors.country.message}</p>}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Program</label>
                        <select
                          {...register('program')}
                          className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                          style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                        >
                          <option value="">Select a program</option>
                          <option value="Medicine">Medicine</option>
                          <option value="Dentistry">Dentistry</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Business">Business</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Aviation">Aviation</option>
                        </select>
                        {errors.program && <p className="mt-2 text-[12px] font-semibold" style={{ color: '#F44336' }}>{errors.program.message}</p>}
                      </div>
                      {selectedProgram === 'Aviation' && (
                        <div>
                          <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Aviation Degree (Optional)</label>
                          <select
                            {...register('aviationDegree')}
                            className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                            style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                          >
                            <option value="">None / Not Aviation</option>
                            <option value="CPL">Commercial Pilot License (CPL)</option>
                            <option value="ATPL">Airline Transport Pilot License (ATPL)</option>
                            <option value="Engineering">Aviation Engineering</option>
                            <option value="Management">Aviation Management</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-[2.5px] uppercase mb-2" style={{ color: 'rgba(245,240,232,0.45)' }}>Study Level</label>
                      <select
                        {...register('studyLevel')}
                        className="w-full px-4 py-3 text-[13px] outline-none border rounded"
                        style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(245,168,0,0.12)', color: '#000' }}
                      >
                        <option value="">Select Level</option>
                        <option value="Bachelor">Bachelor&apos;s</option>
                        <option value="Master">Master&apos;s</option>
                      </select>
                      {errors.studyLevel && <p className="mt-2 text-[12px] font-semibold" style={{ color: '#F44336' }}>{errors.studyLevel.message}</p>}
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="v3-btn-fx w-full px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold inline-flex items-center justify-center gap-2"
                        style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 4 }}
                      >
                        Submit Application <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link to="/login" className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-semibold border-2 inline-flex items-center gap-2"
                    style={{ borderColor: 'rgba(255,255,255,0.40)', color: 'var(--v3-white)', borderRadius: 4 }}
                  >
                    Portal Login <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: '#050b14', borderTop: '1px solid rgba(245,168,0,0.12)' }}>
        <div className="py-5" style={{ background: 'var(--v3-yellow)' }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[13px] font-semibold" style={{ color: 'var(--v3-navy)' }}>Start your journey with a free consultation</div>
            <a href="#contact" className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold inline-flex items-center gap-2"
              style={{ background: 'var(--v3-navy)', color: 'var(--v3-yellow)', borderRadius: 999 }}
            >
              Apply Free <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
              </div>
              <p className="mt-4 text-[13px] leading-[1.82]" style={{ color: 'rgba(245,240,232,0.38)', maxWidth: 320 }}>
                Helping international students gain admission to Georgia&apos;s top universities with clear steps, fast follow-up, and full guidance.
              </p>
              <div className="mt-6 flex gap-2">
                {[
                  { icon: Globe, label: 'TikTok', href: 'https://www.tiktok.com/@theway.ge0?_r=1&_t=ZS-95vVkmR2ELa' },
                  { icon: Camera, label: 'Instagram', href: 'https://www.instagram.com/thewayge0?igsh=MTN3eWJ3dHpwYjZiOQ%3D%3D&utm_source=qr' },
                  { icon: Video, label: 'YouTube', href: 'https://www.youtube.com/@thewaygeorgia' },
                ].map((s, idx) => (
                  <a key={idx} href={s.href} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center border hover:bg-amber-500 hover:text-black transition-all"
                    style={{ borderColor: 'rgba(245,168,0,0.20)', color: 'rgba(245,240,232,0.38)' }}
                    aria-label={s.label}
                  >
                    <s.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: 'var(--v3-yellow)' }}>Links</div>
              <div className="mt-5 space-y-2">
                {[
                  ['#home', 'Home'],
                  ['/universities', 'Universities'],
                  ['#services', 'Our Services'],
                  ['#about', 'About'],
                  ['#contact', 'Contact'],
                ].map(([href, label]) => (
                  href.startsWith('/') ? (
                    <Link key={href} to={href} className="block text-[13px] font-medium transition-colors" style={{ color: 'rgba(245,240,232,0.43)' }}>
                      {label}
                    </Link>
                  ) : (
                    <a key={href} href={href} className="block text-[13px] font-medium transition-colors" style={{ color: 'rgba(245,240,232,0.43)' }}>
                      {label}
                    </a>
                  )
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: 'var(--v3-yellow)' }}>Portal</div>
              <div className="mt-5 space-y-3">
                  <Link to="/login" className="v3-btn-fx px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-semibold border-2 inline-flex items-center gap-2"
                  style={{ borderColor: 'rgba(255,255,255,0.40)', color: 'var(--v3-white)', borderRadius: 4 }}
                >
                  {user ? 'My Dashboard' : 'Portal Login'}
                </Link>
                <a href={user ? "/login" : "#contact"} className="v3-btn-fx block px-10 py-4 text-[11px] tracking-[2.5px] uppercase font-bold text-center"
                  style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)', borderRadius: 4 }}
                >
                  {user ? 'Return to Portal' : 'Apply Now - Free'}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t" style={{ borderColor: 'rgba(245,168,0,0.07)' }}>
            <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.25)' }}>(c) 2026 The Way</p>
            <div className="flex items-center gap-6">
              <a href="#contact" className="text-[11px]" style={{ color: 'rgba(245,240,232,0.25)' }}>Support</a>
              <a href="#contact" className="text-[11px]" style={{ color: 'rgba(245,240,232,0.25)' }}>Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
