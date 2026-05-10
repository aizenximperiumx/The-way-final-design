import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Globe, 
  Languages, 
  Menu, 
  X, 
  ArrowRight, 
  Award, 
  Shield, 
  Heart, 
  TrendingUp, 
  GraduationCap, 
  BookOpen, 
  Phone, 
  Mail, 
  MapPin, 
  Users,
  Video,
  Camera
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import vvvUrl from '../../vvv.webp';
import cccUrl from '../../ccc.webp';
import img2594Url from '../../IMG_2594-scaled-1.jpg';
import whatsappUrl from '../../WhatsApp-Image-2025-04-11-at-16.52.webp';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  program: z.string().optional(),
  aviationDegree: z.string().optional(),
  studyLevel: z.string().min(1, 'Please select a study level'),
}).refine(data => data.program || data.aviationDegree, {
  message: "Please select either a regular program or an aviation degree",
  path: ["program"]
});

type ApplicationForm = z.infer<typeof applicationSchema>;

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { addApplication, language, setLanguage } = useAppStore();
  const navigate = useNavigate();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showApplyRibbon, setShowApplyRibbon] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const onScroll = () => setShowApplyRibbon(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const images = [vvvUrl, cccUrl, img2594Url, whatsappUrl];
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % images.length), 4500);
    return () => clearInterval(t);
  }, []);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema)
  });

  const onSubmit = async (data: ApplicationForm) => {
    try {
      await addApplication({
        ...data,
        status: 'submitted',
        stage: 'applied',
        createdAt: new Date().toISOString(),
      });
      toast.success(language === 'ar' ? 'ØªÙ… ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø·Ù„Ø¨ Ø¨Ù†Ø¬Ø§Ø­! Ø³ÙŠØªØµÙ„ Ø¨Ùƒ ÙØ±ÙŠÙ‚Ù†Ø§ Ù‚Ø±ÙŠØ¨Ù‹Ø§.' : 'Application submitted successfully! Our team will contact you soon.');
      reset();
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  const universityLinks = [
    { id: 'tbilisi-open-university', name: 'Tbilisi Open University' },
    { id: 'geomedi', name: 'Teaching University Geomedi' },
    { id: 'san-diego-state-university', name: 'San Diego State University' },
    { id: 'grigol-robakidze-university', name: 'Grigol Robakidze University' },
    { id: 'georgian-american-university', name: 'Georgian American University' },
  ] as const;

  const quickLinks = [
    { kind: 'anchor' as const, href: '#contact', label: language === 'ar' ? 'Ù‚Ø¯Ù‘Ù… Ø§Ù„Ø¢Ù†' : 'Apply Now' },
    { kind: 'anchor' as const, href: '#contact', label: language === 'ar' ? 'Ø§ØªØµÙ„ Ø¨Ù†Ø§' : 'Contact Us' },
    { kind: 'anchor' as const, href: '#about', label: language === 'ar' ? 'Ù…Ù† Ù†Ø­Ù†' : 'About Us' },
    { kind: 'route' as const, href: '/universities', label: language === 'ar' ? 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª' : 'Universities' },
    { kind: 'anchor' as const, href: '#services', label: language === 'ar' ? 'Ø®Ø¯Ù…Ø§ØªÙ†Ø§' : 'Our Services' },
    { kind: 'anchor' as const, href: '#blogs', label: language === 'ar' ? 'Ø§Ù„Ù…Ø¯ÙˆÙ†Ø©' : 'Blogs' },
    { kind: 'anchor' as const, href: '#faq', label: language === 'ar' ? 'Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©' : 'FAQ' },
  ] as const;


  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;
    toast.success(language === 'ar' ? 'ØªÙ… Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ø¨Ù†Ø¬Ø§Ø­!' : 'Subscribed successfully!');
    setNewsletterEmail('');
  };

  const t = {
    en: {
      nav: {
        about: 'About',
        programs: 'Programs',
        universities: 'Universities',
        contact: 'Contact',
        login: 'Portal Login',
        apply: 'Apply Now'
      },
      hero: {
        title: 'Your Future in Georgia Starts Here',
        subtitle: 'The Way is your trusted partner for university applications and student life in Georgia. Join 3,000+ students who achieved their dreams with us.',
        cta: 'Start Your Journey',
        secondaryCta: 'View Universities',
        badge: 'Official Partner of Top Universities'
      },
      stats: {
        students: '3,000+',
        years: '5+',
        universities: '20+',
        success: '99%'
      },
      about: {
        title: 'Why Choose The Way?',
        subtitle: 'More than just educational services, we create a complete journey for international students.',
        description: 'From your first inquiry to settling in your new university, we handle every detail of your transition to Georgia.',
        card1: {
          title: 'Trusted Guidance',
          desc: 'Over 5 years of experience helping students from across the Arab world.'
        },
        card2: {
          title: 'Full Support',
          desc: 'We assist with visas, residence permits, and finding the perfect home.'
        },
        card3: {
          title: 'Premium Network',
          desc: 'Direct partnerships with Georgia\'s most prestigious institutions.'
        }
      },
      programs: {
        title: 'Choose Your Program',
        subtitle: 'Accredited degrees tailored to your career goals',
        bachelor: 'Bachelor\'s',
        master: 'Master\'s',
        phd: 'Doctorate',
        cta: 'Learn More'
      },
      contact: {
        title: 'Get in Touch',
        subtitle: 'Join us and connect with your future today',
        formTitle: 'Submit Application',
        formDesc: 'Fill out the form below and our team will contact you shortly.',
        name: 'Full Name',
        email: 'Email Address',
        phone: 'Phone Number',
        country: 'Country',
        program: 'Select Program',
        aviation: 'Aviation Degree',
        level: 'Study Level',
        bachelor: 'Bachelor\'s',
        master: 'Master\'s',
        message: 'Your Message (Optional)',
        submit: 'Send Application'
      },
      footer: {
        slogan: 'The Right Path to Your Success',
        rights: '(c) 2026 The Way Georgia. All rights reserved.'
      }
    },
    ar: {
      nav: {
        about: 'Ù…Ù† Ù†Ø­Ù†',
        programs: 'Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬',
        universities: 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª',
        contact: 'Ø§ØªØµÙ„ Ø¨Ù†Ø§',
        login: 'Ø¯Ø®ÙˆÙ„ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©',
        apply: 'Ù‚Ø¯Ù… Ø§Ù„Ø¢Ù†'
      },
      hero: {
        title: 'Ù…Ø³ØªÙ‚Ø¨Ù„Ùƒ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙŠØ¨Ø¯Ø£ Ù…Ù† Ù‡Ù†Ø§',
        subtitle: 'The Way Ù‡ÙŠ Ø´Ø±ÙŠÙƒÙƒ Ø§Ù„Ù…ÙˆØ«ÙˆÙ‚ Ù„ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© ÙˆØ­ÙŠØ§Ø© Ø§Ù„Ø·Ù„Ø§Ø¨ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§. Ø§Ù†Ø¶Ù… Ø¥Ù„Ù‰ Ø£ÙƒØ«Ø± Ù…Ù† 3000 Ø·Ø§Ù„Ø¨ Ø­Ù‚Ù‚ÙˆØ§ Ø£Ø­Ù„Ø§Ù…Ù‡Ù… Ù…Ø¹Ù†Ø§.',
        cta: 'Ø§Ø¨Ø¯Ø£ Ø±Ø­Ù„ØªÙƒ',
        secondaryCta: 'Ø¹Ø±Ø¶ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª',
        badge: 'Ø´Ø±ÙŠÙƒ Ø±Ø³Ù…ÙŠ Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª'
      },
      stats: {
        students: '+3,000',
        years: '+5',
        universities: '+20',
        success: '99%'
      },
      about: {
        title: 'Ù„Ù…Ø§Ø°Ø§ ØªØ®ØªØ§Ø± The WayØŸ',
        subtitle: 'Ø£ÙƒØ«Ø± Ù…Ù† Ù…Ø¬Ø±Ø¯ Ø®Ø¯Ù…Ø§Øª ØªØ¹Ù„ÙŠÙ…ÙŠØ©ØŒ Ù†Ø­Ù† Ù†ØµÙ†Ø¹ Ø±Ø­Ù„Ø© Ù…ØªÙƒØ§Ù…Ù„Ø© Ù„Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠ.',
        description: 'Ù…Ù† Ø§Ø³ØªÙØ³Ø§Ø±Ùƒ Ø§Ù„Ø£ÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ø³ØªÙ‚Ø±Ø§Ø±Ùƒ ÙÙŠ Ø¬Ø§Ù…Ø¹ØªÙƒ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©ØŒ Ù†ØªÙˆÙ„Ù‰ ÙƒÙ„ ØªÙØ§ØµÙŠÙ„ Ø§Ù†ØªÙ‚Ø§Ù„Ùƒ Ø¥Ù„Ù‰ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
        card1: {
          title: 'ØªÙˆØ¬ÙŠÙ‡ Ù…ÙˆØ«ÙˆÙ‚',
          desc: 'Ø£ÙƒØ«Ø± Ù…Ù† 5 Ø³Ù†ÙˆØ§Øª Ù…Ù† Ø§Ù„Ø®Ø¨Ø±Ø© ÙÙŠ Ù…Ø³Ø§Ø¹Ø¯Ø© Ø§Ù„Ø·Ù„Ø§Ø¨ Ù…Ù† Ø¬Ù…ÙŠØ¹ Ø£Ù†Ø­Ø§Ø¡ Ø§Ù„Ø¹Ø§Ù„Ù… Ø§Ù„Ø¹Ø±Ø¨ÙŠ.'
        },
        card2: {
          title: 'Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„',
          desc: 'Ù†Ø³Ø§Ø¹Ø¯ ÙÙŠ Ø§Ù„ØªØ£Ø´ÙŠØ±Ø§Øª ÙˆØªØµØ§Ø±ÙŠØ­ Ø§Ù„Ø¥Ù‚Ø§Ù…Ø© ÙˆØ§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†Ø²Ù„ Ø§Ù„Ù…Ø«Ø§Ù„ÙŠ.'
        },
        card3: {
          title: 'Ø´Ø¨ÙƒØ© Ù…ØªÙ…ÙŠØ²Ø©',
          desc: 'Ø´Ø±Ø§ÙƒØ§Øª Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ø¹ Ø£Ø±Ù‚Ù‰ Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.'
        }
      },
      programs: {
        title: 'Ø§Ø®ØªØ± Ø¨Ø±Ù†Ø§Ù…Ø¬Ùƒ',
        subtitle: 'Ø¯Ø±Ø¬Ø§Øª Ù…Ø¹ØªÙ…Ø¯Ø© Ù…ØµÙ…Ù…Ø© Ù„Ø£Ù‡Ø¯Ø§ÙÙƒ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©',
        bachelor: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        master: 'Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        phd: 'Ø¯ÙƒØªÙˆØ±Ø§Ù‡',
        cta: 'ØªØ¹Ù„Ù… Ø§Ù„Ù…Ø²ÙŠØ¯'
      },
      contact: {
        title: 'ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§',
        subtitle: 'Ø§Ù†Ø¶Ù… Ø¥Ù„ÙŠÙ†Ø§ ÙˆØªÙˆØ§ØµÙ„ Ù…Ø¹ Ù…Ø³ØªÙ‚Ø¨Ù„Ùƒ Ø§Ù„ÙŠÙˆÙ…',
        formTitle: 'ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø·Ù„Ø¨',
        formDesc: 'Ø§Ù…Ù„Ø£ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø£Ø¯Ù†Ø§Ù‡ ÙˆØ³ÙŠØªØµÙ„ Ø¨Ùƒ ÙØ±ÙŠÙ‚Ù†Ø§ Ù‚Ø±ÙŠØ¨Ù‹Ø§.',
        name: 'Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„',
        email: 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ',
        phone: 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ',
        country: 'Ø§Ù„Ø¯ÙˆÙ„Ø©',
        program: 'Ø§Ø®ØªØ± Ø§Ù„Ø¨Ø±Ù†Ø§Ù…Ø¬',
        aviation: 'ØªØ®ØµØµ Ø§Ù„Ø·ÙŠØ±Ø§Ù†',
        level: 'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠ',
        bachelor: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        master: 'Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        message: 'Ø±Ø³Ø§Ù„ØªÙƒ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)',
        submit: 'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨'
      },
      footer: {
        slogan: 'Ø§Ù„Ø·Ø±ÙŠÙ‚ Ø§Ù„ØµØ­ÙŠØ­ Ù„Ù†Ø¬Ø§Ø­Ùƒ',
        rights: '(c) 2026 The Way Georgia. All rights reserved.'
      }
    }
  };

  const isRTL = language === 'ar';
  const content = t[language];

  return (
    <div className={`min-h-screen bg-[#050A14] ${isRTL ? 'font-arabic' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${navSolid ? 'bg-black' : 'bg-black/50'} backdrop-blur-md border-b border-white/10 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-white/70 hover:text-white font-medium transition-colors">{content.nav.about}</a>
              <a href="#programs" className="text-white/70 hover:text-white font-medium transition-colors">{content.nav.programs}</a>
              <a href="#contact" className="text-white/70 hover:text-white font-medium transition-colors">{content.nav.contact}</a>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-2 text-white/70 hover:text-white font-medium transition-colors"
              >
                <Languages className="w-5 h-5" />
                <span>{language === 'en' ? 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©' : 'English'}</span>
              </button>
              <Link 
                to="/login" 
                className="flex items-center gap-2 text-white font-semibold hover:text-amber-400 transition-colors"
              >
                <Users className="w-5 h-5" />
                {content.nav.login}
              </Link>
              <a 
                href="#contact" 
                className="bg-amber-500 text-black px-6 py-3 rounded-full font-bold hover:bg-white transition-all transform hover:scale-105"
              >
                {content.nav.apply}
              </a>
            </div>

            <div className="md:hidden flex items-center gap-4">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="text-white/80 hover:text-white"
              >
                <Languages className="w-6 h-6" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
                {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#050A14] border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-8 space-y-6">
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">{content.nav.about}</a>
                <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">{content.nav.programs}</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">{content.nav.contact}</a>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-amber-400">{content.nav.login}</Link>
                <a 
                  href="#contact" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full bg-amber-500 text-black text-center py-4 rounded-2xl font-black text-lg"
                >
                  {content.nav.apply}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-32 pb-24 overflow-hidden bg-[#050A14]">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050A14] to-[#050A14] z-0 pointer-events-none"></div>
        <div className="ambient-blob ambient-blob--1 z-0"></div>
        <div className="ambient-blob ambient-blob--2 z-0"></div>
        <div className="ambient-blob ambient-blob--3 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 text-amber-400 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-7 border border-white/10">
                <Award className="w-4 h-4" />
                {content.hero.badge}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                {content.hero.title}
              </h1>
              <p className="text-lg lg:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
                {content.hero.subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#contact" 
                  className="bg-amber-500 text-black px-8 py-4 rounded-full font-black text-lg flex items-center gap-2 hover:bg-white transition-all group"
                >
                  {content.hero.cta}
                  <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                </a>
                <Link
                  to="/universities"
                  className="bg-white/5 border border-white/15 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-white hover:text-black transition-all"
                >
                  {content.hero.secondaryCta}
                </Link>
                <a
                  href="https://wa.me/99550001800"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/5 border border-white/15 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-white hover:text-black transition-all"
                >
                  WhatsApp
                </a>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-14">
                <div>
                  <div className="text-3xl font-black text-white">{content.stats.students}</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Students</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{content.stats.years}</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Years</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{content.stats.universities}</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Partners</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{content.stats.success}</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Success</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div
                className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl border border-white/10 bg-black/40 flex items-center justify-center"
                onTouchStart={(e) => {
                  (window as unknown as { __touchX?: number }).__touchX = e.touches[0]?.clientX ?? 0;
                }}
                onTouchEnd={(e) => {
                  const touchState = (window as unknown as { __touchX?: number }).__touchX ?? 0;
                  const dx = e.changedTouches[0]?.clientX ? (e.changedTouches[0].clientX - touchState) : 0;
                  const imgs = [vvvUrl, cccUrl, img2594Url, whatsappUrl];
                  if (dx > 40) setHeroIdx((i) => (i - 1 + imgs.length) % imgs.length);
                  else if (dx < -40) setHeroIdx((i) => (i + 1) % imgs.length);
                }}
              >
                <motion.img
                  key={heroIdx}
                  src={[vvvUrl, cccUrl, img2594Url, whatsappUrl][heroIdx]}
                  alt="Campus"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-[300px] md:h-[560px] object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {[0,1,2,3].map((i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} aria-label={`Slide ${i+1}`}
                      className={`w-10 h-2 rounded-full ${i === heroIdx ? 'bg-amber-500' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Apply pill */}
      {showApplyRibbon && (
        <a href="#contact" className="fixed bottom-6 right-6 bg-amber-500 text-black px-6 py-3 rounded-full font-black shadow-xl shadow-amber-500/30 hover:bg-white transition-all z-50">
          Apply Now
        </a>
      )}

      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-end justify-between gap-8 mb-12">
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Why Choose The Way</p>
              <h2 className="text-4xl font-black tracking-tight">Accredited. End-to-End. Trusted.</h2>
              <p className="text-white/70 font-medium mt-3 max-w-2xl">We guide you through admissions, paperwork, recognition letters, ministry orders, and visa documents.</p>
            </div>
            <a href="#contact" className="bg-white/10 border border-white/10 text-white px-6 py-3 rounded-2xl font-black hover:bg-white hover:text-black transition-all">Talk to us</a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Accredited Partnerships', desc: 'Official relationships with top Georgian universities.' },
              { icon: Heart, title: 'End-to-End Support', desc: 'Translation, approvals, recognition, ministry, visa - all covered.' },
              { icon: TrendingUp, title: 'Proven Outcomes', desc: 'High acceptance and smooth onboarding for international students.' },
            ].map((card, i) => (
              <div key={i} className="group rounded-[32px] p-8 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-6">
                  <card.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black mb-2">{card.title}</h3>
                <p className="text-white/70 font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-8 mb-10">
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Your Path</p>
              <h2 className="text-4xl font-black text-black tracking-tight">Admission Steps</h2>
            </div>
            <a href="#contact" className="bg-black text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-500 hover:text-black transition-all">Start Application</a>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
            <div className="grid md:grid-cols-5 gap-6 relative">
              {[
                { label: 'Documents translation' },
                { label: 'University initial approval' },
                { label: 'Recognition letter' },
                { label: 'Ministry order' },
                { label: 'Visa required documents' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-[28px] border border-gray-100 p-6 hover:border-amber-200 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center">{i+1}</div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {i+1}</p>
                  </div>
                  <h3 className="text-sm font-black text-black">{s.label}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-8 mb-10">
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Student Stories</p>
              <h2 className="text-4xl font-black tracking-tight">What Students Say</h2>
            </div>
            <a href="https://wa.me/995574422522" target="_blank" rel="noreferrer" className="bg-white/10 border border-white/10 text-white px-6 py-3 rounded-2xl font-black hover:bg-white hover:text-black transition-all">WhatsApp Us</a>
          </div>
          <Testimonials />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gray-50 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-amber-600 font-black text-lg tracking-widest uppercase mb-4">{content.nav.about}</h2>
            <p className="text-4xl font-black text-black mb-6">{content.about.subtitle}</p>
            <p className="text-xl text-gray-600">{content.about.description}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: content.about.card1.title, desc: content.about.card1.desc },
              { icon: Heart, title: content.about.card2.title, desc: content.about.card2.desc },
              { icon: TrendingUp, title: content.about.card3.title, desc: content.about.card3.desc }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[32px] shadow-sm border border-gray-100"
              >
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-8">
                  <card.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-black mb-4">{card.title}</h3>
                <p className="text-gray-600 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-24 bg-white scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-amber-600 font-black text-lg tracking-widest uppercase mb-4">{content.programs.title}</h2>
              <p className="text-4xl font-black text-black">{content.programs.subtitle}</p>
            </div>
            <button className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-amber-500 hover:text-black transition-all">
              {content.programs.cta}
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: content.programs.bachelor, icon: GraduationCap, color: 'bg-blue-50 text-blue-600', imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200' },
              { title: content.programs.master, icon: BookOpen, color: 'bg-purple-50 text-purple-600', imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200' },
              { title: content.programs.phd, icon: Award, color: 'bg-amber-50 text-amber-600', imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200' }
            ].map((program, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="relative h-80 rounded-[32px] overflow-hidden mb-6">
                  <img 
                    src={program.imageUrl} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={program.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute bottom-8 left-8">
                    <div className={`w-12 h-12 ${program.color} rounded-xl flex items-center justify-center mb-4`}>
                      <program.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{program.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-black text-white relative overflow-hidden scroll-mt-28">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20">
            <div>
              <h2 className="text-amber-500 font-black text-lg tracking-widest uppercase mb-4">{content.contact.title}</h2>
              <p className="text-5xl font-black mb-8 leading-tight">{content.contact.subtitle}</p>
              
              <div className="space-y-8 mt-12">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Call Us</p>
                    <p className="text-xl font-bold">+995 574 42 25 22</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Email Us</p>
                    <p className="text-xl font-bold">info@theway.ge</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">Visit Us</p>
                    <p className="text-xl font-bold">Vakhtang chabukiani 2, Tbilisi, Georgia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[40px] p-10 text-black">
              <h3 className="text-3xl font-black mb-2">{content.contact.formTitle}</h3>
              <p className="text-gray-500 mb-8 font-medium">{content.contact.formDesc}</p>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.name}</label>
                    <input 
                      {...register('name')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.email}</label>
                    <input 
                      {...register('email')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message}</p>}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.phone}</label>
                    <input 
                      {...register('phone')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      placeholder="+995 ..."
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.country}</label>
                    <input 
                      {...register('country')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      placeholder="e.g. Saudi Arabia"
                    />
                    {errors.country && <p className="text-red-500 text-xs mt-1 font-bold">{errors.country.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.program}</label>
                    <select 
                      {...register('program')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                    >
                      <option value="">{content.contact.program}</option>
                      <option value="bachelor">Bachelor's Degree</option>
                      <option value="master">Master's Degree</option>
                      <option value="phd">Doctorate / PhD</option>
                    </select>
                    {errors.program && <p className="text-red-500 text-xs mt-1 font-bold">{errors.program.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.aviation}</label>
                    <select 
                      {...register('aviationDegree')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                    >
                      <option value="">{content.contact.aviation}</option>
                      <option value="pilot">Commercial Pilot License (CPL)</option>
                      <option value="atpl">Airline Transport Pilot License (ATPL)</option>
                      <option value="engineering">Aviation Engineering</option>
                      <option value="management">Aviation Management</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{content.contact.level}</label>
                  <select 
                    {...register('studyLevel')}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none"
                  >
                    <option value="">{content.contact.level}</option>
                    <option value="bachelor">{content.contact.bachelor}</option>
                    <option value="master">{content.contact.master}</option>
                  </select>
                  {errors.studyLevel && <p className="text-red-500 text-xs mt-1 font-bold">{errors.studyLevel.message}</p>}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-lg hover:bg-black hover:text-white transition-all transform hover:scale-[1.02] shadow-xl shadow-amber-500/20"
                >
                  {content.contact.submit}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-24 bg-white scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black text-black tracking-tight">{language === 'ar' ? 'Ø®Ø¯Ù…Ø§ØªÙ†Ø§' : 'Our Services'}</h2>
            <p className="mt-4 text-gray-600 font-medium">
              {language === 'ar' ? 'Ø®Ø¯Ù…Ø§Øª Ù…ØªÙƒØ§Ù…Ù„Ø© Ù…Ù† Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… Ø­ØªÙ‰ Ø§Ù„ÙˆØµÙˆÙ„.' : 'End-to-end support from application to arrival.'}
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { title: language === 'ar' ? 'Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ' : 'University Admission', desc: language === 'ar' ? 'ØªÙ‚Ø¯ÙŠÙ…ØŒ Ù…Ø±Ø§Ø¬Ø¹Ø©ØŒ ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø­ØªÙ‰ Ø§Ù„Ù‚Ø¨ÙˆÙ„.' : 'Apply, review, and follow up until acceptance.' },
              { title: language === 'ar' ? 'Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚ ÙˆØ§Ù„ØªØµØ¯ÙŠÙ‚' : 'Documents & Verification', desc: language === 'ar' ? 'ØªØ±Ø¬Ù…Ø©ØŒ Ù…Ø¹Ø§Ø¯Ù„Ø©ØŒ ÙˆØ£ÙˆØ§Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø©.' : 'Translation, recognition, and ministry order.' },
              { title: language === 'ar' ? 'Ø§Ù„ØªØ£Ø´ÙŠØ±Ø© ÙˆØ§Ù„ÙˆØµÙˆÙ„' : 'Visa & Arrival', desc: language === 'ar' ? 'Ø­Ø²Ù… Ø§Ù„ØªØ£Ø´ÙŠØ±Ø©ØŒ Ù…ÙˆØ§Ø¹ÙŠØ¯ØŒ ÙˆØ§Ø³ØªÙ‚Ø¨Ø§Ù„.' : 'Visa packs, appointments, and arrival support.' },
            ].map((s) => (
              <div key={s.title} className="tw-card tw-card-hover p-8">
                <h3 className="text-xl font-black text-black">{s.title}</h3>
                <p className="mt-3 text-gray-600 font-medium">{s.desc}</p>
                <a href="#contact" className="mt-6 inline-flex items-center gap-2 text-amber-600 font-black text-sm hover:text-black transition-colors">
                  {language === 'ar' ? 'Ù‚Ø¯Ù‘Ù… Ø§Ù„Ø¢Ù†' : 'Apply Now'}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="blogs" className="py-24 bg-gradient-to-b from-white to-gray-50 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black text-black tracking-tight">{language === 'ar' ? 'Ø§Ù„Ù…Ø¯ÙˆÙ†Ø©' : 'Blogs'}</h2>
              <p className="mt-4 text-gray-600 font-medium">{language === 'ar' ? 'Ù†ØµØ§Ø¦Ø­ Ø³Ø±ÙŠØ¹Ø© ÙˆØ£Ø¯Ù„Ø© Ù„Ù„Ø·Ù„Ø§Ø¨.' : 'Short guides and tips for students.'}</p>
            </div>
            <a href="#contact" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-500 hover:text-black transition-all">
              {language === 'ar' ? 'ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§' : 'Contact Us'}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-12 grid lg:grid-cols-3 gap-6">
            {[
              { title: language === 'ar' ? 'ÙƒÙŠÙ ØªØ®ØªØ§Ø± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©ØŸ' : 'How to choose a university', desc: language === 'ar' ? '3 Ø®Ø·ÙˆØ§Øª Ù„ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø®ÙŠØ§Ø± Ø§Ù„Ø£Ù†Ø³Ø¨.' : '3 steps to pick the best fit.' },
              { title: language === 'ar' ? 'Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©' : 'Essential documents checklist', desc: language === 'ar' ? 'ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ù‚Ø¨Ù„ Ø§Ù„ØªÙ‚Ø¯ÙŠÙ….' : 'Everything you need before applying.' },
              { title: language === 'ar' ? 'Ù…Ø§Ø°Ø§ Ø¨Ø¹Ø¯ Ø§Ù„Ù‚Ø¨ÙˆÙ„ØŸ' : 'What happens after acceptance', desc: language === 'ar' ? 'Ø§Ù„Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© Ø¨Ø´ÙƒÙ„ ÙˆØ§Ø¶Ø­.' : 'Next stages explained clearly.' },
            ].map((b) => (
              <div key={b.title} className="tw-card tw-card-hover p-8">
                <div className="tw-chip bg-amber-50 text-amber-700 border border-amber-100 w-fit">{language === 'ar' ? 'Ù…Ù‚Ø§Ù„' : 'Article'}</div>
                <h3 className="mt-4 text-xl font-black text-black">{b.title}</h3>
                <p className="mt-3 text-gray-600 font-medium">{b.desc}</p>
                <a href="#contact" className="mt-6 inline-flex items-center gap-2 text-amber-600 font-black text-sm hover:text-black transition-colors">
                  {language === 'ar' ? 'Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†' : 'Start Now'}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-white scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-black tracking-tight">{language === 'ar' ? 'Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø´Ø§Ø¦Ø¹Ø©' : 'FAQ'}</h2>
            <p className="mt-4 text-gray-600 font-medium">{language === 'ar' ? 'Ø£Ø¬ÙˆØ¨Ø© Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ø£Ù‡Ù… Ø§Ù„Ø£Ø³Ø¦Ù„Ø©.' : 'Direct answers to the most common questions.'}</p>
          </div>
          <div className="mt-12 grid lg:grid-cols-2 gap-6">
            {[
              { q: language === 'ar' ? 'Ù‡Ù„ ÙŠÙ…ÙƒÙ†Ù†ÙŠ Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… Ø¨Ø¯ÙˆÙ† Ø´Ù‡Ø§Ø¯Ø© Ù„ØºØ©ØŸ' : 'Can I apply without an English certificate?', a: language === 'ar' ? 'Ù†Ø¹Ù…. ÙŠÙ…ÙƒÙ†Ù†Ø§ Ù…Ø³Ø§Ø¹Ø¯ØªÙƒ ÙÙŠ Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø´Ù‡Ø§Ø¯Ø© Ù…Ø·Ù„ÙˆØ¨Ø© Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø±Ø­Ù„Ø©.' : 'Yes. We can help you obtain the required certificate during the process.' },
              { q: language === 'ar' ? 'ÙƒÙ… ØªØ³ØªØºØ±Ù‚ Ø¹Ù…Ù„ÙŠØ© Ø§Ù„Ù‚Ø¨ÙˆÙ„ØŸ' : 'How long does admission take?', a: language === 'ar' ? 'ÙŠØ¹ØªÙ…Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙˆØ§Ù„ÙˆØ«Ø§Ø¦Ù‚ØŒ Ù„ÙƒÙ†Ù†Ø§ Ù†ØªØ§Ø¨Ø¹ ÙŠÙˆÙ…ÙŠÙ‹Ø§ Ù„ØªÙ‚Ù„ÙŠÙ„ Ø§Ù„ÙˆÙ‚Øª.' : 'It depends on the university and documents, but we follow up daily to minimize delays.' },
              { q: language === 'ar' ? 'ÙƒÙŠÙ Ø£ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø¨Ø¹Ø¯ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ØŸ' : 'How do I contact the admin after account creation?', a: language === 'ar' ? 'Ù…Ù† Ø®Ù„Ø§Ù„ ØµÙØ­Ø© Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©.' : 'Via the Messages page inside the portal.' },
              { q: language === 'ar' ? 'Ù‡Ù„ ØªÙˆØ¬Ø¯ Ù…ØªØ§Ø¨Ø¹Ø© Ø¨Ø¹Ø¯ Ø§Ù„ÙˆØµÙˆÙ„ØŸ' : 'Do you support after arrival?', a: language === 'ar' ? 'Ù†Ø¹Ù…ØŒ Ù„Ø¯ÙŠÙ†Ø§ Ù…ØªØ§Ø¨Ø¹Ø© Ù„Ù„ÙˆØµÙˆÙ„ ÙˆØ§Ù„Ø¥Ù‚Ø§Ù…Ø© ÙˆØ§Ù„ÙˆØ«Ø§Ø¦Ù‚.' : 'Yes, we support arrival, residence, and document tracking.' },
            ].map((f) => (
              <div key={f.q} className="tw-card tw-card-hover p-8">
                <p className="text-lg font-black text-black">{f.q}</p>
                <p className="mt-3 text-gray-600 font-medium">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050A14] text-white">
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{language === 'ar' ? 'Ø§ØªØµÙ„ Ø¨Ù†Ø§' : 'Call us any time'}</p>
                  <p className="font-black text-white">+995 574 42 25 22</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{language === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email us 24/7'}</p>
                  <p className="font-black text-white">info@theway.ge</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{language === 'ar' ? 'Ù…ÙˆÙ‚Ø¹Ù†Ø§' : 'Our location'}</p>
                  <p className="font-black text-white">Vakhtang Chabukiani 2, Tbilisi, Georgia</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-4 gap-10">
            <div>
              <img src={logoUrl} alt="The Way" className="h-14 w-auto object-contain" />
              <p className="text-white/70 font-medium mt-5 leading-relaxed">
                {language === 'ar'
                  ? 'Ù†Ø­Ù† Ø´Ø±ÙƒØ© Ù…Ø¹ØªÙ…Ø¯Ø© Ù…Ø¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¹Ø§Ù‡Ø¯ ÙˆØ§Ù„Ù…Ø¯Ø§Ø±Ø³ Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø®Ø§ØµØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.'
                  : 'We are an accredited company with all public and private Georgian universities, institutes and schools.'}
              </p>
              <p className="text-white/60 font-black mt-8 uppercase tracking-widest text-xs">
                {language === 'ar' ? 'ØªØ§Ø¨Ø¹Ù†Ø§ Ø¹Ù„Ù‰:' : 'Follow us on:'}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="https://www.instagram.com/thewayge0?igsh=MTN3eWJ3dHpwYjZiOQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all">
                  <Camera className="w-5 h-5" />
                </a>
                <a href="https://www.tiktok.com/@theway.ge0?_r=1&_t=ZS-95vVkmR2ELa" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all">
                  <Video className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <p className="font-black text-lg">{language === 'ar' ? 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª' : 'University'}</p>
              <div className="w-10 h-1 bg-amber-500 rounded-full mt-3 mb-6" />
              <div className="space-y-3">
                {universityLinks.map((u) => (
                  <Link
                    key={u.id}
                    to={`/universities?u=${u.id}`}
                    className="block text-left text-white/70 hover:text-white font-medium transition-colors"
                  >
                    {u.name}
                  </Link>
                ))}
                <Link
                  to="/universities"
                  className="block text-left text-white/50 hover:text-white font-medium transition-colors"
                >
                  {language === 'ar' ? 'ÙƒÙ„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª' : 'All Universities'}
                </Link>
              </div>
            </div>

            <div>
              <p className="font-black text-lg">{language === 'ar' ? 'Ø±ÙˆØ§Ø¨Ø· Ø³Ø±ÙŠØ¹Ø©' : 'Quick Links'}</p>
              <div className="w-10 h-1 bg-amber-500 rounded-full mt-3 mb-6" />
              <div className="space-y-3">
                {quickLinks.map((l, idx) => (
                  l.kind === 'route' ? (
                    <Link
                      key={`${l.href}-${idx}`}
                      to={l.href}
                      className="block text-left text-white/70 hover:text-white font-medium transition-colors"
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      key={`${l.href}-${idx}`}
                      href={l.href}
                      className="block text-left text-white/70 hover:text-white font-medium transition-colors"
                    >
                      {l.label}
                    </a>
                  )
                ))}
              </div>
            </div>

            <div>
              <p className="font-black text-lg">{language === 'ar' ? 'ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§' : 'Get in touch!'}</p>
              <div className="w-10 h-1 bg-amber-500 rounded-full mt-3 mb-6" />
              <p className="text-white/70 font-medium leading-relaxed">
                {language === 'ar'
                  ? 'Ø§Ø´ØªØ±Ùƒ ÙÙŠ Ø§Ù„Ù†Ø´Ø±Ø© Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠØ© Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¢Ø®Ø± Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª ÙˆØ§Ù„Ø£Ø®Ø¨Ø§Ø±.'
                  : 'Subscribe our newsletter to get our latest updates & news.'}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="mt-6">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={language === 'ar' ? 'Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Enter Your Email'}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 w-full bg-amber-500 text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all"
                >
                  {language === 'ar' ? 'Ø§Ø´ØªØ±Ø§Ùƒ' : 'Subscribe'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 font-medium text-sm">{content.footer.rights}</p>
            <p className="text-white/40 font-medium text-sm">Copyright (c) 2026 The Way</p>
          </div>
        </div>
      </footer>
      {showApplyRibbon && (
        <a
          href="#contact"
          className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black px-5 py-3 rounded-full font-black shadow-xl hover:bg-white transition-all"
        >
          Apply Now
        </a>
      )}
    </div>
  );
};

function Testimonials() {
  const items = [
    {
      quote: 'The Way guided my entire admission - translation, approvals, and visa documents. I was enrolled in weeks.',
      name: 'Sara, Medicine',
      imageUrl: img2594Url
    },
    {
      quote: 'Reliable and fast. They handled recognition and ministry order while I focused on my studies.',
      name: 'Omar, Dentistry',
      imageUrl: cccUrl
    },
    {
      quote: 'Accredited and professional. I highly recommend them to any student heading to Georgia.',
      name: 'Anita, Nursing',
      imageUrl: vvvUrl
    },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);
  const current = items[idx];
  return (
    <div className="grid lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5">
        <div className="rounded-[32px] overflow-hidden border border-white/10 bg-white/5">
          <img src={current.imageUrl} alt={current.name} className="w-full h-[280px] object-cover" loading="lazy" />
        </div>
      </div>
      <div className="lg:col-span-7">
        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8">
          <p className="text-xl font-black leading-relaxed">{current.quote}</p>
          <p className="mt-4 text-white/60 font-bold">{current.name}</p>
          <div className="mt-6 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-10 h-2 rounded-full ${i === idx ? 'bg-amber-500' : 'bg-white/10'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;




