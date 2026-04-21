import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Menu,
  Quote,
  ShieldCheck,
  X,
} from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import vvvUrl from '../../vvv.webp';
import cccUrl from '../../ccc.webp';
import img2594Url from '../../IMG_2594-scaled-1.jpg';
import whatsappUrl from '../../WhatsApp-Image-2025-04-11-at-16.52.webp';
import { useApp } from '../context/AppContext';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  program: z.string().min(1, 'Please select a program'),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

type ProgramCategory = 'all' | 'medicine' | 'business' | 'engineering' | 'arts';

const palette = {
  primaryDark: '#0F0F1E',
  secondaryDark: '#1A1A2E',
  accentOrange: '#FFD166',
  accentYellow: '#FF6B35',
  textLight: '#F5F5F5',
  textMuted: '#A8A8B3',
  success: '#4CAF50',
  error: '#F44336',
} as const;

const programs = [
  {
    id: 'medicine',
    category: 'medicine' as const,
    title: 'Medicine & Health Sciences',
    desc: 'Strong English-taught programs with clinical exposure and clear admissions steps.',
    duration: '6 Years',
    language: 'English',
    price: 'From $5,000/year',
    badge: 'Popular',
    image: img2594Url,
  },
  {
    id: 'dentistry',
    category: 'medicine' as const,
    title: 'Dentistry',
    desc: 'Hands-on training and modern facilities with structured support from start to arrival.',
    duration: '5 Years',
    language: 'English',
    price: 'From $4,500/year',
    badge: 'High demand',
    image: cccUrl,
  },
  {
    id: 'business',
    category: 'business' as const,
    title: 'Business & Management',
    desc: 'International business programs designed for real-world skills and career outcomes.',
    duration: '4 Years',
    language: 'English',
    price: 'From $3,500/year',
    badge: 'Flexible',
    image: vvvUrl,
  },
  {
    id: 'engineering',
    category: 'engineering' as const,
    title: 'Engineering & IT',
    desc: 'Modern programs across software, data, and engineering tracks with guided admissions.',
    duration: '4 Years',
    language: 'English',
    price: 'From $3,800/year',
    badge: 'Future-proof',
    image: whatsappUrl,
  },
  {
    id: 'arts',
    category: 'arts' as const,
    title: 'Arts & Design',
    desc: 'Creative programs with international cohorts and smooth application pathways.',
    duration: '4 Years',
    language: 'English',
    price: 'From $3,000/year',
    badge: 'Creative',
    image: cccUrl,
  },
] as const;

const universities = [
  {
    id: 'tbilisi-state-university',
    name: 'Tbilisi State University',
    desc: "Georgia's oldest and most prestigious university.",
    stats: [
      { n: '100+', l: 'Programs' },
      { n: '#1', l: 'Ranking' },
    ],
  },
  {
    id: 'georgian-american-university',
    name: 'Georgian American University',
    desc: 'Modern programs with international orientation.',
    stats: [
      { n: '60+', l: 'Programs' },
      { n: 'Top', l: 'Choice' },
    ],
  },
  {
    id: 'grigol-robakidze-university',
    name: 'Grigol Robakidze University',
    desc: 'Recognized medical and business tracks.',
    stats: [
      { n: '40+', l: 'Programs' },
      { n: 'Strong', l: 'Support' },
    ],
  },
  {
    id: 'teaching-university-geomedi',
    name: 'Teaching University Geomedi',
    desc: 'Focused medical education and training.',
    stats: [
      { n: '10+', l: 'Tracks' },
      { n: 'Clinical', l: 'Practice' },
    ],
  },
] as const;

const faqs = [
  { q: 'How fast can I get accepted?', a: 'It depends on the university and your documents, but we aim for fast review and daily follow-up.' },
  { q: 'Do I need an English certificate?', a: 'Requirements vary by program. If needed, we guide you on the best option for your case.' },
  { q: 'Do you help with visa and arrival?', a: 'Yes. We support admission steps, visa paperwork guidance, arrival support, and next steps.' },
  { q: 'Can parents contact your team?', a: 'Yes. Parents can contact us any time and we provide clear updates.' },
] as const;

const testimonials = [
  {
    name: 'Sara',
    program: 'Medicine',
    quote: 'Everything was clear. I uploaded documents, followed steps, and got support quickly.',
  },
  {
    name: 'Omar',
    program: 'Dentistry',
    quote: 'The process felt organized. My family could understand what was happening at every stage.',
  },
  {
    name: 'Anita',
    program: 'Engineering',
    quote: 'Fast communication and a structured plan. I knew exactly what to do next.',
  },
] as const;

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function LandingPageV2() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [programFilter, setProgramFilter] = useState<ProgramCategory>('all');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  const universitiesRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { addApplication } = useApp();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
  });

  const filteredPrograms = useMemo(() => {
    if (programFilter === 'all') return programs;
    return programs.filter((p) => p.category === programFilter);
  }, [programFilter]);

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 6500);
    return () => window.clearInterval(t);
  }, []);

  const heroImages = useMemo(() => [vvvUrl, cccUrl, img2594Url, whatsappUrl], []);
  useEffect(() => {
    const t = window.setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 5000);
    return () => window.clearInterval(t);
  }, [heroImages.length]);

  const onSubmit = async (data: ApplicationForm) => {
    try {
      await addApplication({ ...data, status: 'submitted', stage: 'applied', createdAt: new Date().toISOString() });
      toast.success('Application submitted! Our team will contact you soon.');
      reset();
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  const heroImage = heroImages[heroIdx % heroImages.length];
  const scrollUniversities = (dir: -1 | 1) => {
    const el = universitiesRef.current;
    if (!el) return;
    const delta = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: palette.primaryDark, color: palette.textLight }} className="min-h-screen">
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-colors',
          navSolid ? 'backdrop-blur-md' : ''
        )}
        style={{
          backgroundColor: navSolid ? 'rgba(15,15,30,0.85)' : 'rgba(15,15,30,0.35)',
          borderBottom: navSolid ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <img src={logoUrl} alt="The Way" className="h-10 w-auto object-contain" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>TheWay Georgia</p>
              <p className="font-display text-lg font-black">Admissions</p>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-8">
            {[
              ['#programs', 'Programs'],
              ['#universities', 'Universities'],
              ['#process', 'Process'],
              ['#testimonials', 'Testimonials'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-bold hover:text-white transition-colors" style={{ color: palette.textMuted }}>
                {label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="btn btn-outline px-4 py-2 text-sm"
            >
              Portal Login
            </Link>
            <a
              href="#apply"
              className="btn btn-primary px-4 py-2 text-sm"
            >
              Apply Now
            </a>
          </div>

          <button className="lg:hidden p-2 rounded-lg border border-white/10 bg-white/5" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-[60]">
              <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="absolute right-0 top-0 bottom-0 w-[320px] p-6"
                style={{ backgroundColor: palette.secondaryDark, borderLeft: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-display font-black text-lg">Menu</p>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    ['#programs', 'Programs'],
                    ['#universities', 'Universities'],
                    ['#process', 'Process'],
                    ['#testimonials', 'Testimonials'],
                    ['#faq', 'FAQ'],
                    ['#apply', 'Apply'],
                  ].map(([href, label]) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl font-black"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                    >
                      {label}
                    </a>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl font-black text-sm text-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                  >
                    Login
                  </Link>
                  <a
                    href="#apply"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl font-black text-sm text-center"
                    style={{ backgroundColor: palette.accentOrange, color: palette.primaryDark }}
                  >
                    Apply
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main id="top" className="pt-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <motion.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                backgroundImage: `url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'saturate(1.05) contrast(1.05)',
              }}
            />
            <video
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              autoPlay
              muted
              loop
              playsInline
              poster={heroImage}
            >
              <source src="/campus-tour.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 30% 20%, rgba(255,209,102,0.18), transparent 55%), radial-gradient(circle at 70% 30%, rgba(255,107,53,0.14), transparent 60%), linear-gradient(180deg, rgba(15,15,30,0.82), rgba(15,15,30,0.96))` }} />
          </div>

          <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)', color: palette.textLight }}
                >
                  <ShieldCheck className="w-4 h-4" style={{ color: palette.accentYellow }} />
                  Admissions & visa guidance
                </div>

                <h1 className="mt-6 font-display font-black tracking-tight leading-[1.05] text-[36px] sm:text-[44px] lg:text-[56px]">
                  Your Future in Georgia Starts Here
                </h1>
                <p className="mt-5 max-w-2xl text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                  End-to-end support from application to arrival. Study at top Georgian universities with expert guidance and a clear step-by-step plan.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <a href="#apply" className="btn btn-primary btn-large"
                  >
                    Start Your Journey
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#universities" className="btn btn-outline btn-large"
                  >
                    View Universities
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
                  {[
                    { n: '5000+', l: 'Students Placed' },
                    { n: '15+', l: 'Partner Universities' },
                    { n: '98%', l: 'Success Rate' },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl p-4 border"
                      style={{ backgroundColor: 'rgba(26,26,46,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                    >
                      <p className="font-display font-black text-2xl">{s.n}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: palette.textMuted }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: 'rgba(26,26,46,0.55)', borderColor: 'rgba(255,255,255,0.10)', boxShadow: '0 18px 55px -40px rgba(0,0,0,0.55)' }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-black text-lg">Quick Start</p>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Free review</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {[
                        'Program selection matched to your profile',
                        'Document checklist + preparation guidance',
                        'Admission follow-up + arrival support',
                      ].map((t) => (
                        <div key={t} className="flex items-start gap-3 p-4 rounded-xl border"
                          style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                        >
                          <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: palette.accentYellow }} />
                          <p className="text-sm font-semibold" style={{ color: palette.textLight }}>{t}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Link to="/login" className="btn btn-outline px-4 py-3 text-sm text-center"
                      >
                        Portal Login
                      </Link>
                      <a href="#apply" className="btn btn-secondary px-4 py-3 text-sm text-center"
                      >
                        Apply Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 opacity-90">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Scroll to explore</span>
              <div className="w-6 h-10 rounded-full border flex items-start justify-center p-1" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.accentYellow }} animate={{ y: [0, 18, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
              </div>
            </div>
          </div>
        </section>

        <section id="programs" className="py-20" style={{ backgroundColor: palette.secondaryDark }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <h2 className="font-display font-black text-[28px] sm:text-[34px] lg:text-[40px]">Choose Your Path</h2>
              <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                Explore programs across top Georgian universities. Filter by category and view quick details.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                ['all', 'All Programs'],
                ['medicine', 'Medicine'],
                ['business', 'Business'],
                ['engineering', 'Engineering'],
                ['arts', 'Arts'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setProgramFilter(k as ProgramCategory)}
                  className="px-4 py-2 rounded-lg text-sm font-black border transition-colors"
                  style={{
                    backgroundColor: programFilter === k ? palette.accentOrange : 'rgba(255,255,255,0.06)',
                    color: programFilter === k ? palette.primaryDark : palette.textLight,
                    borderColor: programFilter === k ? palette.accentOrange : 'rgba(255,255,255,0.10)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPrograms.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.35 }}>
                  <div className="rounded-xl overflow-hidden border h-full flex flex-col"
                    style={{ backgroundColor: 'rgba(15,15,30,0.65)', borderColor: 'rgba(255,255,255,0.10)' }}
                  >
                    <div className="relative h-44">
                      <img src={p.image} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,15,30,0.10), rgba(15,15,30,0.85))' }} />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black"
                        style={{ backgroundColor: palette.accentYellow, color: palette.primaryDark }}
                      >
                        {p.badge}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-display font-black text-[22px] lg:text-[28px]">{p.title}</h3>
                      <p className="mt-3 text-sm font-medium" style={{ color: palette.textMuted }}>{p.desc}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {[p.duration, p.language, p.price].map((m) => (
                          <span key={m} className="px-3 py-1 rounded-full text-xs font-black border"
                            style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)', color: palette.textLight }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                      <a href="#apply" className="btn btn-primary mt-6 px-4 py-3 text-sm"
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="universities" className="py-20" style={{ backgroundColor: palette.primaryDark }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-3xl">
                <h2 className="font-display font-black text-[28px] sm:text-[34px] lg:text-[40px]">Partner Universities</h2>
                <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                  Study at Georgia&apos;s most recognized institutions with end-to-end support.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollUniversities(-1)}
                  className="p-3 rounded-lg border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                  aria-label="Previous universities"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollUniversities(1)}
                  className="p-3 rounded-lg border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                  aria-label="Next universities"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={universitiesRef} className="mt-10 flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory custom-scrollbar">
              {universities.map((u) => (
                <div
                  key={u.id}
                  className="min-w-[320px] max-w-[360px] snap-start rounded-xl border p-6"
                  style={{ backgroundColor: 'rgba(26,26,46,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)' }}
                  >
                    <GraduationCap className="w-6 h-6" style={{ color: palette.accentYellow }} />
                  </div>
                  <h3 className="mt-5 font-display font-black text-[22px] lg:text-[28px]">{u.name}</h3>
                  <p className="mt-3 text-sm font-medium" style={{ color: palette.textMuted }}>{u.desc}</p>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {u.stats.map((s) => (
                      <div key={s.l} className="rounded-lg border p-3"
                        style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                      >
                        <p className="font-display font-black text-xl">{s.n}</p>
                        <p className="text-[12px] font-bold" style={{ color: palette.textMuted }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <a href="#programs" className="btn btn-outline mt-6 px-4 py-3 text-sm w-full"
                  >
                    View Programs
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="py-20" style={{ backgroundColor: palette.secondaryDark }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <h2 className="font-display font-black text-[28px] sm:text-[34px] lg:text-[40px]">Simple 4-Step Process</h2>
              <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                From application to arrival, we guide you at every step with clear actions and checklists.
              </p>
            </div>

            <div className="mt-10 grid lg:grid-cols-4 gap-6">
              {[
                { n: '1', t: 'Application', d: 'Submit your documents and preferences through our online form.' },
                { n: '2', t: 'University Selection', d: 'We recommend the best program based on your profile and goals.' },
                { n: '3', t: 'Admission & Visa', d: 'We guide paperwork steps and follow up until your admission is ready.' },
                { n: '4', t: 'Arrival Support', d: 'Support with arrival, accommodation steps, and first-week orientation.' },
              ].map((s) => (
                <div key={s.n} className="rounded-xl border p-6 h-full"
                  style={{ backgroundColor: 'rgba(15,15,30,0.65)', borderColor: 'rgba(255,255,255,0.10)' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-black"
                    style={{ backgroundColor: palette.accentOrange, color: palette.primaryDark }}
                  >
                    {s.n}
                  </div>
                  <h3 className="mt-5 font-display font-black text-[22px] lg:text-[28px]">{s.t}</h3>
                  <p className="mt-3 text-sm font-medium" style={{ color: palette.textMuted }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20" style={{ backgroundColor: palette.primaryDark }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="max-w-3xl">
                <h2 className="font-display font-black text-[28px] sm:text-[34px] lg:text-[40px]">Student Success Stories</h2>
                <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                  Hear from students who started their journey with us.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTestimonialIdx((i) => (i - 1 + testimonials.length) % testimonials.length)}
                  className="p-3 rounded-lg border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTestimonialIdx((i) => (i + 1) % testimonials.length)}
                  className="p-3 rounded-lg border"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl border p-8"
                  style={{ backgroundColor: 'rgba(26,26,46,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                >
                  <Quote className="w-10 h-10" style={{ color: palette.accentYellow }} />
                  <p className="mt-4 text-lg font-semibold leading-relaxed" style={{ color: palette.textLight }}>
                    {testimonials[testimonialIdx].quote}
                  </p>
                  <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-display font-black">{testimonials[testimonialIdx].name}</p>
                      <p className="text-sm font-bold" style={{ color: palette.textMuted }}>{testimonials[testimonialIdx].program}</p>
                    </div>
                    <a href="#apply" className="btn btn-primary px-4 py-3 text-sm"
                    >
                      Start now
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20" style={{ backgroundColor: palette.secondaryDark }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <h2 className="font-display font-black text-[28px] sm:text-[34px] lg:text-[40px]">FAQ</h2>
              <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                Clear answers for students and families.
              </p>
            </div>

            <div className="mt-10 grid lg:grid-cols-2 gap-6">
              {faqs.map((f, idx) => {
                const open = activeFaq === idx;
                return (
                  <div key={f.q} className="rounded-xl border"
                    style={{ backgroundColor: 'rgba(15,15,30,0.65)', borderColor: 'rgba(255,255,255,0.10)' }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(open ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <HelpCircle className="w-5 h-5 shrink-0" style={{ color: palette.accentYellow }} />
                        <p className="font-black text-left truncate">{f.q}</p>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>
                        {open ? 'Hide' : 'View'}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          <div className="px-6 pb-6 text-sm font-medium leading-relaxed" style={{ color: palette.textMuted }}>
                            {f.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="apply" className="py-20" style={{ backgroundColor: palette.primaryDark }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <h2 className="font-display font-black text-[28px] sm:text-[34px] lg:text-[40px]">Apply Now</h2>
                <p className="mt-4 text-base sm:text-lg font-medium" style={{ color: palette.textMuted }}>
                  Submit your details and our team will contact you shortly.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    'Fast initial review and next steps',
                    'Clear checklist for your documents',
                    'Guidance through admission and arrival',
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-3 p-4 rounded-xl border"
                      style={{ backgroundColor: 'rgba(26,26,46,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                    >
                      <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: palette.accentYellow }} />
                      <p className="text-sm font-semibold">{t}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-xl border p-8"
                  style={{ backgroundColor: 'rgba(26,26,46,0.55)', borderColor: 'rgba(255,255,255,0.10)' }}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Full name</label>
                        <input
                          {...register('name')}
                          className="mt-2 w-full px-4 py-3 rounded-lg border font-semibold"
                          style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: palette.textLight }}
                        />
                        {errors.name && <p className="text-sm font-bold mt-2" style={{ color: palette.error }}>{errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Email</label>
                        <input
                          type="email"
                          {...register('email')}
                          className="mt-2 w-full px-4 py-3 rounded-lg border font-semibold"
                          style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: palette.textLight }}
                        />
                        {errors.email && <p className="text-sm font-bold mt-2" style={{ color: palette.error }}>{errors.email.message}</p>}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Phone</label>
                        <input
                          {...register('phone')}
                          className="mt-2 w-full px-4 py-3 rounded-lg border font-semibold"
                          style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: palette.textLight }}
                        />
                        {errors.phone && <p className="text-sm font-bold mt-2" style={{ color: palette.error }}>{errors.phone.message}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Country</label>
                        <input
                          {...register('country')}
                          className="mt-2 w-full px-4 py-3 rounded-lg border font-semibold"
                          style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: palette.textLight }}
                        />
                        {errors.country && <p className="text-sm font-bold mt-2" style={{ color: palette.error }}>{errors.country.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest" style={{ color: palette.textMuted }}>Program</label>
                      <select
                        {...register('program')}
                        className="mt-2 w-full px-4 py-3 rounded-lg border font-semibold appearance-none"
                        style={{ backgroundColor: 'rgba(15,15,30,0.55)', borderColor: 'rgba(255,255,255,0.12)', color: palette.textLight }}
                      >
                        <option value="">Select a program</option>
                        <option value="Medicine">Medicine</option>
                        <option value="Dentistry">Dentistry</option>
                        <option value="Business & Management">Business & Management</option>
                        <option value="Engineering & IT">Engineering & IT</option>
                        <option value="Arts & Design">Arts & Design</option>
                      </select>
                      {errors.program && <p className="text-sm font-bold mt-2" style={{ color: palette.error }}>{errors.program.message}</p>}
                    </div>
                    <button type="submit" className="w-full px-6 py-4 rounded-lg font-black text-base inline-flex items-center justify-center gap-2"
                      style={{ backgroundColor: palette.accentOrange, color: palette.primaryDark }}
                    >
                      Send Application
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12" style={{ backgroundColor: '#0B0B16' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="The Way" className="h-10 w-auto object-contain" />
                <p className="font-display font-black text-lg">The Way</p>
              </div>
              <p className="mt-4 text-sm font-medium" style={{ color: palette.textMuted }}>
                Premium student admissions support in Georgia - clear steps, fast follow-up, and full guidance.
              </p>
            </div>
            <div>
              <p className="font-black uppercase tracking-widest text-xs" style={{ color: palette.textMuted }}>Links</p>
              <div className="mt-4 space-y-2">
                {[
                  ['#programs', 'Programs'],
                  ['#universities', 'Universities'],
                  ['#process', 'Process'],
                  ['#testimonials', 'Testimonials'],
                  ['#faq', 'FAQ'],
                ].map(([href, label]) => (
                  <a key={href} href={href} className="block font-bold hover:text-white transition-colors" style={{ color: palette.textLight }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="font-black uppercase tracking-widest text-xs" style={{ color: palette.textMuted }}>Portal</p>
              <div className="mt-4 space-y-3">
                <Link to="/login" className="btn btn-outline w-full px-4 py-3 text-sm"
                >
                  Portal Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#apply" className="btn btn-secondary w-full px-4 py-3 text-sm"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-bold" style={{ color: palette.textMuted }}>(c) 2026 The Way</p>
          </div>
        </div>
      </footer>
    </div>
  );
}




