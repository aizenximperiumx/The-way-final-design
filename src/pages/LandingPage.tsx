import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Award, 
  TrendingUp, 
  Shield, 
  Heart, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Users,
  Video,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../store/appStore';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';

// Import images
import vvvUrl from '../../vvv.jpg';
import cccUrl from '../../ccc.jpg';
import img2594Url from '../../IMG_2594.jpg';
import whatsappUrl from '../../whatsapp image.jpg';

const applicationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
  program: z.string().min(1, 'Please select a program'),
  aviationDegree: z.string().optional(),
  studyLevel: z.string().min(1, 'Please select a study level'),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { addApplication } = useAppStore();
  const [navSolid, setNavSolid] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    // Force a scroll to top on load to ensure proper rendering
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setNavSolid(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema)
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    try {
      await addApplication({
        ...data,
        status: 'submitted',
        stage: 'applied',
        createdAt: new Date().toISOString()
      });
      toast.success('Application submitted successfully!');
      reset();
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] font-sans" dir="ltr">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${navSolid ? 'bg-black' : 'bg-black/50'} backdrop-blur-md border-b border-white/10 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-white/70 hover:text-white font-medium transition-colors">About</a>
              <a href="#programs" className="text-white/70 hover:text-white font-medium transition-colors">Programs</a>
              <Link to="/universities" className="text-white/70 hover:text-white font-medium transition-colors">Universities</Link>
              <a href="#contact" className="text-white/70 hover:text-white font-medium transition-colors">Contact</a>
              <Link 
                to="/login" 
                className="flex items-center gap-2 text-white font-semibold hover:text-amber-400 transition-colors"
              >
                <Users className="w-5 h-5" />
                Portal Login
              </Link>
              <a 
                href="#contact" 
                className="bg-amber-500 text-black px-6 py-3 rounded-full font-bold hover:bg-white transition-all transform hover:scale-105"
              >
                Apply Now
              </a>
            </div>

            <div className="md:hidden flex items-center gap-4">
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
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">About</a>
                <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">Programs</a>
                <Link to="/universities" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">Universities</Link>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-white">Contact</a>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-xl font-bold text-amber-400">Portal Login</Link>
                <a 
                  href="#contact" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full bg-amber-500 text-black text-center py-4 rounded-2xl font-black text-lg"
                >
                  Apply Now
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
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 text-amber-400 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-7 border border-white/10">
                <Award className="w-4 h-4" />
                Official Partner of Top Universities
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Your Future in Georgia Starts Here
              </h1>
              <p className="text-lg lg:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
                The Way is your trusted partner for university applications and student life in Georgia. Join 3,000+ students who achieved their dreams with us.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#contact" 
                  className="bg-amber-500 text-black px-8 py-4 rounded-full font-black text-lg flex items-center gap-2 hover:bg-white transition-all group"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <Link
                  to="/universities"
                  className="bg-white/5 border border-white/15 text-white px-8 py-4 rounded-full font-black text-lg hover:bg-white hover:text-black transition-all"
                >
                  View Universities
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
                  <div className="text-3xl font-black text-white">3,000+</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Students</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">5+</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Years</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">20+</div>
                  <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Partners</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">99%</div>
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
                className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl border border-white/10 bg-black/40 flex items-center justify-center min-h-[300px] md:min-h-[560px]"
              >
                <motion.img
                  key={heroIdx}
                  src={[vvvUrl, cccUrl, img2594Url, whatsappUrl][heroIdx]}
                  alt="Campus"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="w-full h-auto max-h-[300px] md:max-h-[560px] object-contain"
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
      
      {/* Features section */}
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

      {/* Steps section */}
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

      {/* Form section */}
      <section id="contact" className="py-24 bg-white scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-amber-600 font-black text-lg tracking-widest uppercase mb-4">Get in Touch</h2>
              <p className="text-5xl font-black text-black mb-8 leading-tight">Join us and connect with your future today</p>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Office</p>
                    <p className="text-xl font-bold text-black">Vakhtang Chabukiani 2, Tbilisi, Georgia</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-xl font-bold text-black">info@theway.ge</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-xl font-bold text-black">+995 571 009 550</p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Follow Us</p>
                  <div className="flex items-center gap-3">
                    <a href="https://www.instagram.com/thewayge0?igsh=MTN3eWJ3dHpwYjZiOQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-amber-500 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
                      <Camera className="w-5 h-5" />
                    </a>
                    <a href="https://www.tiktok.com/@theway.ge0?_r=1&_t=ZS-95vVkmR2ELa" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-amber-500 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
                      <Globe className="w-5 h-5" />
                    </a>
                    <a href="https://www.youtube.com/@thewaygeorgia" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-amber-500 text-black flex items-center justify-center hover:bg-black hover:text-white transition-all">
                      <Video className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100">
              <h3 className="text-3xl font-black text-black mb-2">Submit Application</h3>
              <p className="text-gray-500 font-medium mb-10">Fill out the form below and our team will contact you shortly.</p>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label>
                    <input 
                      {...register('name')}
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-black"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
                    <input 
                      {...register('email')}
                      placeholder="john@example.com"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-black"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phone Number</label>
                    <input 
                      {...register('phone')}
                      placeholder="+995 ..."
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-black"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Country</label>
                    <input 
                      {...register('country')}
                      placeholder="Georgia"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-black"
                    />
                    {errors.country && <p className="text-red-500 text-xs mt-1 font-bold">{errors.country.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select Program</label>
                    <select 
                      {...register('program')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none text-black"
                    >
                      <option value="" className="text-gray-400">Select Program</option>
                      <option value="medicine" className="text-black">Medicine</option>
                      <option value="dentistry" className="text-black">Dentistry</option>
                      <option value="pharmacy" className="text-black">Pharmacy</option>
                      <option value="engineering" className="text-black">Engineering</option>
                      <option value="business" className="text-black">Business</option>
                      <option value="computer_science" className="text-black">Computer Science</option>
                      <option value="aviation" className="text-black">Aviation</option>
                    </select>
                    {errors.program && <p className="text-red-500 text-xs mt-1 font-bold">{errors.program.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Aviation Degree</label>
                    <select 
                      {...register('aviationDegree')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none text-black"
                    >
                      <option value="" className="text-gray-400">Aviation Degree (Optional)</option>
                      <option value="pilot" className="text-black">Commercial Pilot License (CPL)</option>
                      <option value="atpl" className="text-black">Airline Transport Pilot License (ATPL)</option>
                      <option value="engineering" className="text-black">Aviation Engineering</option>
                      <option value="management" className="text-black">Aviation Management</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Study Level</label>
                    <select 
                      {...register('studyLevel')}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-2xl outline-none transition-all font-medium appearance-none text-black"
                    >
                      <option value="" className="text-gray-400">Select Study Level</option>
                      <option value="bachelor" className="text-black">Bachelor's</option>
                      <option value="master" className="text-black">Master's</option>
                    </select>
                    {errors.studyLevel && <p className="text-red-500 text-xs mt-1 font-bold">{errors.studyLevel.message}</p>}
                  </div>
                  <div className="hidden md:block" />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-lg hover:bg-black hover:text-white transition-all shadow-xl shadow-amber-500/20"
                >
                  Send Application
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white pt-24 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <img src={logoUrl} alt="The Way" className="h-16 w-auto mb-8 object-contain" />
              <p className="text-white/60 text-lg max-w-sm mb-8">The Right Path to Your Success. Join our community and start your international journey today.</p>
                <div className="flex items-center gap-3 mt-4">
                  <a href="https://www.instagram.com/thewayge0?igsh=MTN3eWJ3dHpwYjZiOQ%3D%3D&utm_source=qr" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all">
                    <Camera className="w-5 h-5" />
                  </a>
                  <a href="https://www.tiktok.com/@theway.ge0?_r=1&_t=ZS-95vVkmR2ELa" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all">
                    <Globe className="w-5 h-5" />
                  </a>
                  <a href="https://www.youtube.com/@thewaygeorgia" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all">
                    <Video className="w-5 h-5" />
                  </a>
                </div>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-8">Quick Links</h4>
              <ul className="space-y-4">
                <li><a href="#about" className="text-white/60 hover:text-white transition-colors">About Us</a></li>
                <li><Link to="/universities" className="text-white/60 hover:text-white transition-colors">Universities</Link></li>
                <li><a href="#programs" className="text-white/60 hover:text-white transition-colors">Our Programs</a></li>
                <li><a href="#contact" className="text-white/60 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-8">Newsletter</h4>
              <p className="text-white/60 mb-6">Subscribe to get the latest updates about studying in Georgia.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Your Email"
                  className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-amber-500 transition-all w-full"
                />
                <button className="bg-amber-500 text-black p-3 rounded-xl hover:bg-white transition-all">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            (c) 2026 The Way Georgia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
