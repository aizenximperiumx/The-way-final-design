import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChevronLeft, ExternalLink, Globe, GraduationCap, MapPin, Search, X } from 'lucide-react';
import logoUrl from '../../thewaynewlogo-removebg-preview.png';
import ugPhotoUrl from '../../University of Georgia ( UG ).jpg';
import gauPhotoUrl from '../../Georgian American University (GAU).jpg';
import tsuPhotoUrl from '../../Ivane Javakhishvili Tbilisi State University (TSU).jpg';
import ssuPhotoUrl from '../../Georgian aviation university ( SSU ).jpg';
import ibsuPhotoUrl from '../../International Black Sea University (IBSU).jpg';
import tsmuPhotoUrl from '../../Tbilisi state medical university ( TSMU ).jpg';
import gtuPhotoUrl from '../../Georgian Technical University (GTU).jpg';
import cuPhotoUrl from '../../(Caucasus university (CU.jpg';
import seuPhotoUrl from '../../Georgian National University (SEU).jpg';
import ciuPhotoUrl from '../../Caucasus International University (CIU).jpg';
import iliaPhotoUrl from '../../Ilia State University (ISU).jpg';
import altePhotoUrl from '../../Alte University.jpg';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../lib/i18n';
import LanguageToggle from '../components/LanguageToggle';

type ProgramRow = { program: string; duration?: string; fee?: string };
type ProgramSection = { title: string; rows: ProgramRow[] };

type University = {
  id: string;
  name: string;
  nameEn?: string;
  imageUrl?: string;
  city?: string;
  cityEn?: string;
  address?: string;
  website?: string;
  description: string[];
  descriptionEn?: string[];
  specialties?: string[];
  specialtiesEn?: string[];
  advantages?: string[];
  advantagesEn?: string[];
  admissionRequirements?: string[];
  admissionRequirementsEn?: string[];
  programSections?: ProgramSection[];
  programSectionsEn?: ProgramSection[];
  whyTheWay?: string[];
  whyTheWayEn?: string[];
  registrationSteps?: string[];
  registrationStepsEn?: string[];
  faq?: { q: string; a: string }[];
  faqEn?: { q: string; a: string }[];
};

const rawUniversities: University[] = [
  {
    id: 'ug',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§',
    nameEn: 'University of Georgia (UG)',
    imageUrl: ugPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    cityEn: 'Tbilisi',
    address: 'Merab Kostava St, Tbilisi 0171, Georgia',
    website: 'https://www.ug.edu.ge/en',
    description: [
      'ØªÙ‚Ø¹ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙÙŠ Ù‚Ù„Ø¨ Ø§Ù„Ø¹Ø§ØµÙ…Ø© ØªØ¨Ù„ÙŠØ³ÙŠ ÙˆÙ‡ÙŠ ØªØ¹ØªØ¨Ø± Ù…Ù† Ø£ÙƒØ¨Ø± ÙˆØ§Ø¹Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø®Ø§ØµØ© ÙÙŠ Ø§Ù„Ø¨Ù„Ø§Ø¯ Ø­ÙŠØ« ØªÙ†Ø¯Ø±Ø¬ Ø¶Ù…Ù† Ø£ÙØ¶Ù„ 7 Ù…Ø¤Ø³Ø³Ø§Øª ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ù„Ù‰ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù…Ù†Ø·Ù‚Ø©.',
      'ÙˆØªÙ‚Ø¯Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø±Ø§Ù…Ø¬ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ ÙˆØ§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ± Ø¨Ø§Ù„Ù„ØºØªÙŠÙ† Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù…Ù…Ø§ ÙŠÙ…Ù†Ø­ Ø§Ù„Ø·Ù„Ø§Ø¨ ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¯ÙˆÙ„ÙŠØ© Ù…ØªÙ…ÙŠØ²Ø© Ù„Ø£ÙƒØ«Ø± Ù…Ù† 8000 Ø·Ø§Ù„Ø¨ Ù…Ù† Ø¯Ø§Ø®Ù„ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ®Ø§Ø±Ø¬Ù‡Ø§.',
      'ÙˆØªØ´ØªÙ‡Ø± Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø¨Ø§Ù„ØªØ²Ø§Ù…Ù‡Ø§ Ø¨Ù†Ø¸Ø§Ù… Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ù†Ø¶Ø¨Ø· ÙˆØ¨Ù†ÙŠØ© ØªØ­ØªÙŠØ© Ø­Ø¯ÙŠØ«Ø© Ù…Ù…Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„Ø·Ù„Ø§Ø¨ Ù…Ù† ØªÙ„Ù‚ÙŠ ØªØ¹Ù„ÙŠÙ… Ø¹Ø§Ù„ÙŠ Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ§ÙƒØªØ³Ø§Ø¨ Ù…Ù‡Ø§Ø±Ø§Øª Ø¹Ù…Ù„ÙŠØ© ØªØ¤Ù‡Ù„Ù‡Ù… Ù„ÙØ±Øµ Ø¹Ù…Ù„ Ù‚ÙˆÙŠØ© ÙˆÙ…Ù†Ø§ÙØ³Ø© ÙÙŠ Ù…Ø®ØªÙ„Ù Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª ÙÙŠ Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ.',
    ],
    specialties: [
      'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ',
      'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†',
      'Ø§Ù„ØµÙŠØ¯Ù„Ø©',
      'Ø§Ù„ØªÙ…Ø±ÙŠØ¶',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø©',
      'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨ ÙˆØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',
      'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„',
      'Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø§Ù†Ø³Ø§Ù†ÙŠØ© ÙˆØ§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ©',
      'Ø§Ù„Ù‚Ø§Ù†ÙˆÙ† Ø§Ù„Ø¯ÙˆÙ„ÙŠ',
    ],
    advantages: [
      'ØªØµÙ†ÙŠÙ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ø±Ù…ÙˆÙ‚ Ø­ÙŠØ« ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø£Ø¹Ù„Ù‰ Ø¬Ø§Ù…Ø¹Ø© Ø®Ø§ØµØ© ÙÙŠ Ø§Ù„Ø¨Ù„Ø§Ø¯ØŒ ÙˆØ¶Ù…Ù† Ø£ÙØ¶Ù„ 7 Ù…Ø¤Ø³Ø³Ø§Øª ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙÙŠ Ø§Ù„Ù…Ù†Ø·Ù‚Ø©.',
      'ØªÙ‚Ø¯Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø£ÙƒØ«Ø± Ù…Ù† 50 Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ø¹ØªÙ…Ø¯ ÙÙŠ Ù…Ø®ØªÙ„Ù Ø§Ù„Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ©ØŒ ÙˆØ¨Ø§Ù„Ù„ØºØªÙŠÙ† Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù„ØªÙ„Ø§Ø¦Ù… Ø§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø§Ù„Ø·Ù„Ø§Ø¨ Ù…Ù† Ù…Ø®ØªÙ„Ù Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª.',
      'Ù‡ÙŠØ¦Ø© ØªØ¯Ø±ÙŠØ³ Ø¯ÙˆÙ„ÙŠØ© Ø­ÙŠØ« ÙŠØ¹Ù…Ù„ ÙÙŠ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù†Ø®Ø¨Ø© Ù…Ù† Ø§Ù„Ø£Ø³Ø§ØªØ°Ø© Ø§Ù„Ù…Ø­Ù„ÙŠÙŠÙ† ÙˆØ§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ†.',
      'ØªØªÙ…ØªØ¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø­Ø±Ù… Ø¬Ø§Ù…Ø¹ÙŠ Ø¹ØµØ±ÙŠ ÙˆÙ…Ø²ÙˆØ¯ Ø¨Ù…Ø®ØªØ¨Ø±Ø§Øª Ø­Ø¯ÙŠØ«Ø© ÙˆÙ‚Ø§Ø¹Ø§Øª Ø¯Ø±Ø§Ø³Ø© Ø°ÙƒÙŠØ© ÙˆÙ…ÙƒØªØ¨Ø© Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© ÙˆÙˆØ³Ø§Ø¦Ù„ ØªØ¹Ù„ÙŠÙ… Ø±Ù‚Ù…ÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø©.',
      'ÙØ±Øµ Ø¹Ù…Ù„ Ù‚ÙˆÙŠØ© Ø¨Ø¹Ø¯ Ø§Ù„ØªØ®Ø±Ø¬ ÙˆØ°Ù„Ùƒ Ø¨ÙØ¶Ù„ Ø§Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø¹Ù…Ù„ÙŠ ÙˆØ§Ù„ØªØ±ÙƒÙŠØ² Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªØ·Ø¨ÙŠÙ‚.',
      'Ø¨ÙŠØ¦Ø© Ø¯ÙˆÙ„ÙŠØ© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª Ù…Ù† Ø£ÙƒØ«Ø± Ù…Ù† 70 Ø¯ÙˆÙ„Ø©.',
      'Ø³Ù‡ÙˆÙ„Ø© Ø§Ù„Ù‚Ø¨ÙˆÙ„ ÙˆØ§Ù„Ø¯Ø¹Ù… Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ø­ÙŠØ« ØªÙˆÙØ± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ù‚Ø¨ÙˆÙ„ Ù…ÙŠØ³Ø±Ø© ÙˆØ¯Ø¹Ù… Ù…Ø³ØªÙ…Ø± Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† ÙˆØ§Ù„Ø¹Ø±Ø¨.',
    ],
    admissionRequirements: [
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ©.',
      'ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø´Ù‡Ø§Ø¯Ø© Ù…ÙŠÙ„Ø§Ø¯ Ø§Ù„Ø·Ø§Ù„Ø¨ ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ù… ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ø¨ ÙÙŠ Ø­Ø§Ù„Ø© ÙƒØ§Ù† Ø¹Ù…Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£Ù‚Ù„ Ù…Ù† 18 Ø¹Ø§Ù….',
      'Ù…Ù‚Ø§Ø¨Ù„Ø© Ø´Ø®ØµÙŠØ© Ù„Ù„Ø·Ø§Ù„Ø¨ Ù„Ù„ØªØ­Ø¯Ø« Ø¹Ù† Ø£Ø³Ø¨Ø§Ø¨ Ø§Ø®ØªÙŠØ§Ø±Ù‡ Ù„Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆÙ„Ù…Ø§Ø°Ø§ Ø§Ø®ØªØ§Ø± Ù‡Ø°Ø§ Ø§Ù„ØªØ®ØµØµØŒ ÙˆÙŠØ¬Ø¨ Ø¹Ù„Ù‰ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ù† ÙŠØ¸Ù‡Ø± Ø¬ÙˆØ§Ø² Ø³ÙØ±Ù‡ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø§Ù„ØªÙ…Ø±ÙŠØ¶', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„ØµÙŠØ¯Ù„Ø©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ÙÙ‚Ù‡ Ø§Ù„Ù„ØºÙˆÙŠØ§Øª', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© ÙˆØ§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…Ø¯Ù†ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '6500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', duration: '5 Ø³Ù†ÙˆØ§Øª', fee: '6000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù‚Ø§Ù†ÙˆÙ† Ø§Ù„Ø¯ÙˆÙ„ÙŠ', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ…', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø±ÙŠØ§Ø¯Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4900 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø¯Ø±Ø§Ø³Ø§Øª Ø§Ù„Ø§Ù…Ù†ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø­ÙˆÙƒÙ…Ø© Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ÙƒÙŠÙ…ÙŠØ§Ø¡ Ø¯ÙˆØ§Ø¦ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ÙÙ‚Ù‡ Ø§Ù„Ù„ØºÙˆÙŠØ§Øª', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
    ],
    whyTheWay: [
      'Ø´Ø±Ø§ÙƒØ© Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ø¹ Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø± Ù…ØµÙ…Ù… Ø®ØµÙŠØµÙ‹Ø§ Ù„Ø§Ø­ØªÙŠØ§Ø¬Ø§ØªÙƒ Ù…Ù† Ù„Ø­Ø¸Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§ ÙˆØ­ØªÙ‰ Ø¨Ø¯Ø¡ Ø§Ù„Ø¯Ø±Ø§Ø³Ø©.',
      'Ø´ÙØ§ÙÙŠØ© ÙƒØ§Ù…Ù„Ø© ÙÙŠ ÙƒÙ„ Ø§Ù„ØªÙØ§ØµÙŠÙ„.',
      'Ù„Ø§ Ø±Ø³ÙˆÙ… Ù…Ø®ÙÙŠØ© ÙˆÙ„Ø§ Ù…ÙØ§Ø¬Ø¢Øª ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹Ø©.',
      'Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…ØªØ®ØµØµØ© ÙŠÙ‚Ø¯Ù…Ù‡Ø§ ÙØ±ÙŠÙ‚ Ù…Ù† Ø§Ù„Ø®Ø¨Ø±Ø§Ø¡ Ø¨Ø£Ø³Ø¹Ø§Ø± Ù…Ù†Ø§Ø³Ø¨Ø©.',
      'Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¯Ù‚ÙŠÙ‚Ø© Ù…Ù† Ù…Ø³ØªØ´Ø§Ø±ÙŠÙ†Ø§ ÙÙŠ ÙƒÙ„ Ù…Ø±Ø­Ù„Ø©.',
    ],
    registrationSteps: [
      'Ù†ØªØ±Ø¬Ù… ÙˆÙ†ÙˆØ«Ù‚ Ø£ÙˆØ±Ø§Ù‚Ùƒ Ù…Ù† ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ØŒ ÙˆÙ†ØªÙ‚Ø¯Ù… Ø¨Ù‡Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ 72 Ø³Ø§Ø¹Ø© ÙÙ‚Ø·.',
      'Ù†Ø¬Ø±ÙŠ Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙˆÙ†Ø³ØªØ®Ø±Ø¬ Ù„Ùƒ Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ ÙÙŠ 10 Ø£ÙŠØ§Ù….',
      'Ù†Ø­ØµÙ„ Ø¹Ù„Ù‰ Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø¯Ø±Ø§Ø³ØªÙƒ Ø®Ù„Ø§Ù„ 7 Ø§ÙŠØ§Ù….',
      'Ù†ØµØ¯Ø± Ø£Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„ØªØ¨Ø¯Ø£ Ø§Ø³ØªØ¹Ø¯Ø§Ø¯Ø§ØªÙƒ Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© ÙÙŠ 5 Ø§ÙŠØ§Ù….',
      'ÙÙŠ Ø­Ø§Ù„ Ø§Ù„Ø­Ø§Ø¬Ø© Ù„ØªØ£Ø´ÙŠØ±Ø© Ø·Ø§Ù„Ø¨ Ù†Ù‚ÙˆÙ… Ø¨Ø¥Ø±Ø³Ø§Ù„ ÙØ§ØªÙˆØ±Ø© Ø±Ø³ÙˆÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ù…Ù† Ø§Ù„Ø¯ÙØ¹ØŒ Ù„ØªØ¨Ø¯Ø£ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„ÙÙŠØ²Ø§ Ø¨ÙƒÙ„ Ø³Ù‡ÙˆÙ„Ø©.',
      'ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø·Ù„Ø§Ø¨ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‚Ø§Ø¨Ù„Ø© Ø§Ù„Ø´Ø®ØµÙŠØ© Ø¨Ù†ÙØ³ Ø§Ù„Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©.',
    ],
    faq: [
      { q: 'Ø£ÙŠÙ† ØªÙ‚Ø¹ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ØªÙ‚Ø¹ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙÙŠ Ø§Ù„Ø¹Ø§ØµÙ…Ø© ØªØ¨Ù„ÙŠØ³ÙŠ ÙˆÙ‡ÙŠ ÙˆØ§Ø­Ø¯Ø© Ù…Ù† Ø£Ø¨Ø±Ø² Ø§Ù„Ù…Ø¯Ù† ÙÙŠ Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø²ØŒ Ù…Ù…Ø§ ÙŠØ¬Ø¹Ù„Ù‡Ø§ ÙˆØ¬Ù‡Ø© Ù…Ø«Ø§Ù„ÙŠØ© Ù„Ù„Ø¯Ø±Ø§Ø³Ø© ÙˆØ§Ù„Ù…Ø¹ÙŠØ´Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ†.' },
      { q: 'Ù‡Ù„ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ØºØ§Ù„ÙŠØ©ØŸ', a: 'ØªØ¹ØªØ¨Ø± Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…ÙŠØ³ÙˆØ±Ø© Ø§Ù„ØªÙƒÙ„ÙØ© Ø¨Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ù…Ø¹ Ø¯ÙˆÙ„ Ø£ÙˆØ±ÙˆØ¨Ø§ Ø§Ù„ØºØ±Ø¨ÙŠØ© ÙˆØ£Ù…Ø±ÙŠÙƒØ§.' },
      { q: 'Ù‡Ù„ Ù„ØºØ© Ø¬ÙˆØ±Ø¬ÙŠØ§ ØµØ¹Ø¨Ø©ØŸ', a: 'ØªØ¹Ø¯ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© (Ø§Ù„ÙƒØ§Ø±ØªÙÙŠÙ„ÙŠØ©) Ù„ØºØ© ÙØ±ÙŠØ¯Ø© Ù…Ù† Ù†ÙˆØ¹Ù‡Ø§ ÙˆÙ„Ù‡Ø§ Ø£Ø¨Ø¬Ø¯ÙŠØ© Ø®Ø§ØµØ© Ø¨Ù‡Ø§ØŒ Ù„Ø°Ù„Ùƒ ØªØ¨Ø¯Ùˆ ØµØ¹Ø¨Ø© ÙÙŠ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© Ù„ØºÙŠØ± Ø§Ù„Ù†Ø§Ø·Ù‚ÙŠÙ† Ø¨Ù‡Ø§ØŒ ÙˆÙ„ÙƒÙ† Ù„Ø§ Ø¯Ø§Ø¹ÙŠ Ù„Ù„Ù‚Ù„Ù‚ ÙÙ…Ø¹Ø¸Ù… Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© ØªØ¯Ø±Ø³ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙˆÙ„Ø§ ÙŠØ´ØªØ±Ø· ØªØ¹Ù„Ù… Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© Ù„Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ©.' },
    ],
    descriptionEn: [
      'The University of Georgia is located in the heart of the capital, Tbilisi, and is considered one of the largest and highest-ranked private universities in the country, ranked among the top 7 educational institutions in the region.',
      'The university offers accredited academic programs at the bachelor\'s and master\'s levels in both Georgian and English, providing students with a distinguished international educational experience for more than 8,000 students from inside and outside Georgia.',
      'The University of Georgia is known for its commitment to a disciplined academic system and modern infrastructure, enabling students to receive high-quality education and acquire practical skills that qualify them for strong and competitive job opportunities across various sectors in the global job market.',
    ],
    specialtiesEn: [
      'Human Medicine',
      'Dentistry',
      'Pharmacy',
      'Nursing',
      'Engineering',
      'Computer Science and Information Technology',
      'Business Administration',
      'Humanities and Social Sciences',
      'International Law',
    ],
    advantagesEn: [
      'Prestigious academic ranking, as the University of Georgia is the highest-ranked private university in the country and among the top 7 educational institutions in the region.',
      'The university offers more than 50 accredited academic programs at various degree levels, in both Georgian and English to suit the needs of students from different cultures.',
      'International teaching staff, with an elite group of local and international professors working at the university.',
      'The university features a modern campus equipped with advanced laboratories, smart classrooms, an electronic library, and advanced digital learning tools.',
      'Strong job opportunities after graduation thanks to practical training and a focus on applicable skills.',
      'An international, multicultural environment with students from more than 70 countries.',
      'Easy admission and academic support, as the university provides streamlined admission procedures and continuous support for international and Arab students.',
    ],
    admissionRequirementsEn: [
      'Copy of the student\'s passport.',
      'Personal photo.',
      'Email address.',
      'Copy of the high school certificate.',
      'A birth certificate and copies of both parents\' passports are required if the student is under 18 years old.',
      'A personal interview where the student discusses their reasons for choosing to study in Georgia and why they chose their major; the student must show their passport during the video.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s',
        rows: [
          { program: 'Nursing', duration: '4 years', fee: '$4,000/year' },
          { program: 'Pharmacy', duration: '4 years', fee: '$4,500/year' },
          { program: 'Computer Science', duration: '4 years', fee: '$4,500/year' },
          { program: 'Business Analytics', duration: '4 years', fee: '$4,000/year' },
          { program: 'Business Administration', duration: '4 years', fee: '$4,000/year' },
          { program: 'Philology', duration: '4 years', fee: '$4,000/year' },
          { program: 'Electrical and Electronic Engineering', duration: '4 years', fee: '$4,500/year' },
          { program: 'Computer Engineering', duration: '4 years', fee: '$4,500/year' },
          { program: 'Civil Engineering', duration: '4 years', fee: '$4,500/year' },
          { program: 'Business Analytics', duration: '3 years', fee: '$4,000/year' },
          { program: 'Business Administration', duration: '3 years', fee: '$4,500/year' },
          { program: 'Human Medicine (MD)', duration: '6 years', fee: '$6,500/year' },
          { program: 'Dentistry', duration: '5 years', fee: '$6,000/year' },
        ],
      },
      {
        title: 'Master\'s',
        rows: [
          { program: 'Business Administration', duration: '2 years', fee: '$4,000/year' },
          { program: 'International Law', duration: '2 years', fee: '$4,000/year' },
          { program: 'Education Management', duration: '2 years', fee: '$4,000/year' },
          { program: 'Computer Science', duration: '2 years', fee: '$4,500/year' },
          { program: 'Entrepreneurship', duration: '2 years', fee: '$4,900/year' },
          { program: 'Security Studies', duration: '2 years', fee: '$4,000/year' },
          { program: 'Global Governance', duration: '2 years', fee: '$4,000/year' },
          { program: 'Pharmaceutical Chemistry', duration: '2 years', fee: '$4,500/year' },
          { program: 'Philology', duration: '2 years', fee: '$4,000/year' },
        ],
      },
    ],
    whyTheWayEn: [
      'Direct partnership with the best accredited universities.',
      'Continuous personal support designed specifically for your needs from the moment you contact us until you start your studies.',
      'Complete transparency in all details.',
      'No hidden fees and no unexpected surprises.',
      'Specialized academic consultations provided by a team of experts at affordable prices.',
      'Precise follow-up from our advisors at every stage.',
    ],
    registrationStepsEn: [
      'We translate and notarize your documents and submit them directly to the university within just 72 hours.',
      'We conduct university exams and obtain your preliminary acceptance letter within 10 days.',
      'We obtain the official Ministry approval to continue your studies within 7 days.',
      'We issue the final Ministry order so you can begin your university preparations within 5 days.',
      'If a student visa is needed, we send the university fee invoice within 5 days of payment so you can start visa procedures easily.',
      'Training students for the personal interview in the required format.',
    ],
    faqEn: [
      { q: 'Where is the University of Georgia located?', a: 'The University of Georgia is located in the capital city of Tbilisi, one of the most prominent cities in the Caucasus region, making it an ideal destination for studying and living for international students.' },
      { q: 'Is studying in Georgia expensive?', a: 'Studying in Georgia is considered affordable compared to Western European countries and America.' },
      { q: 'Is the Georgian language difficult?', a: 'The Georgian language (Kartvelian) is unique and has its own alphabet, so it may seem difficult at first for non-native speakers. However, there is no need to worry, as most international university programs are taught in English, and learning Georgian is not required for academic studies.' },
    ],
  },
  {
    id: 'aoug',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©',
    imageUrl: gauPhotoUrl,
    description: [
      'ØªØ³Ø¹Ù‰ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ© Ø¥Ù„Ù‰ Ø£Ù† ØªÙƒÙˆÙ† Ø¯Ø§Ø¦Ù…Ø§ ÙÙŠ Ø·Ù„ÙŠØ¹Ø© Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…Ù† Ø­ÙŠØ« ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù…Ø¹Ø±ÙØ© Ø§Ù„Ù†Ø¸Ø±ÙŠØ© ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ© Ø¹Ù† Ø·Ø±ÙŠÙ‚ ØªÙˆÙÙŠØ± ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªÙƒØ§Ù…Ù„Ø© ÙˆÙ…ØªÙ…ÙŠØ²Ø© Ù„ÙƒÙ„ Ø·Ø§Ù„Ø¨ ØªØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ ÙˆØ§Ù„ØªØ£Ù‡ÙŠÙ„ Ø§Ù„Ù…Ù‡Ù†ÙŠ Ø§Ù„Ø¹Ù…Ù„ÙŠ.',
      'ÙˆØªÙ„ØªØ²Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø¯Ø¹Ù… Ø·Ù„Ø§Ø¨Ù‡Ø§ ÙÙŠ ÙƒÙ„ Ø®Ø·ÙˆØ© Ù…Ù† Ø±Ø­Ù„ØªÙ‡Ù… Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø­ÙŠØ« ØªØ¹Ù…Ù„ Ø¨Ø´ÙƒÙ„ ÙˆØ«ÙŠÙ‚ Ù…Ø¹Ù‡Ù… Ù„Ù…Ø³Ø§Ø¹Ø¯ØªÙ‡Ù… Ø¹Ù„Ù‰ Ø§ÙƒØªØ´Ø§Ù Ù‚Ø¯Ø±Ø§ØªÙ‡Ù… ÙˆØªØ·ÙˆÙŠØ±Ù‡Ø§ØŒ Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ù‡Ù… Ù„Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ù…Ù‡Ù†ÙŠ Ø§Ù„Ù†Ø§Ø¬Ø­ ÙˆØ§Ù„Ù…Ù„ÙŠØ¡ Ø¨Ø§Ù„ÙØ±Øµ Ø§Ù„Ù…Ø¬Ø²ÙŠØ© ÙÙŠ Ø§Ù„Ù…Ø³ØªÙ‚Ø¨Ù„.',
    ],
    specialties: ['Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„'],
    advantages: [
      'Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØ§Ù„Ø§Ø¹ØªØ±Ø§Ù Ø§Ù„Ø¯ÙˆÙ„ÙŠ ÙØ§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…Ø¹ØªÙ…Ø¯Ø© Ù…Ù† Ù…Ù†Ø¸Ù…Ø© Ø§Ù„ØµØ­Ø© Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© (WHO) ÙˆØ§Ù„Ù„Ø¬Ù†Ø© Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„ÙˆØ·Ù†ÙŠØ© (NMC)ØŒ Ø§Ù„Ø¥Ø¶Ø§ÙØ© Ø¥Ù„Ù‰ Ø§Ø¹ØªÙ…Ø§Ø¯Ù‡Ø§ Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø¹Ù„ÙˆÙ… ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ù…Ø§ ÙŠØ¬Ø¹Ù„ Ø´Ù‡Ø§Ø¯ØªÙ‡Ø§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ ÙÙŠ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø¯ÙˆÙ„ Ø§Ù„Ø¹Ø§Ù„Ù….',
      'Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ© Ø§Ù„ØªÙŠ ØªØ¹ØªÙ…Ø¯Ù‡Ø§ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø­ÙŠØ« ØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù†Ø¸Ø§Ù… Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ ØµØ§Ø±Ù… Ù‚Ø§Ø¦Ù… Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©ØŒ Ù…Ù…Ø§ ÙŠØ¶Ù…Ù† Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª Ø¹Ø§Ù„Ù…ÙŠØ§Ù‹.',
      'Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø­Ø¯ÙŠØ«Ø© Ø¥Ø° ØªÙˆÙØ± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…Ø±Ø§ÙÙ‚ ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªØ·ÙˆØ±Ø© ÙˆÙ…Ø¹Ø§Ù…Ù„ Ù…Ø¬Ù‡Ø²Ø© ÙˆØ£Ø³Ø§Ù„ÙŠØ¨ ØªØ¯Ø±ÙŠØ³ Ø­Ø¯ÙŠØ«Ø© ØªØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø§Ù„Ø¬Ø§Ù†Ø¨ Ø§Ù„Ù†Ø¸Ø±ÙŠ ÙˆØ§Ù„ØªØ·Ø¨ÙŠÙ‚ÙŠ.',
      'ØªØ¶Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù‡ÙŠØ¦Ø© ØªØ¯Ø±ÙŠØ³ Ù…Ø¤Ù‡Ù„Ø© Ù…ÙƒÙˆÙ†Ø© Ù…Ù† Ù†Ø®Ø¨Ø© Ù…Ù† Ø§Ù„Ø£Ø³Ø§ØªØ°Ø© ÙˆØ§Ù„Ø®Ø¨Ø±Ø§Ø¡ Ø§Ù„Ø­Ø§ØµÙ„ÙŠÙ† Ø¹Ù„Ù‰ Ø¯Ø±Ø¬Ø§Øª Ø¹Ù„Ù…ÙŠØ© Ù…Ø±Ù…ÙˆÙ‚Ø© ÙˆØ®Ø¨Ø±Ø© Ø¯ÙˆÙ„ÙŠØ© ÙÙŠ Ù…Ø¬Ø§Ù„Ø§ØªÙ‡Ù….',
      'Ø¯Ø¹Ù… Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ ÙˆØ´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø± Ù…Ø¹ Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø¯Ø¹Ù… Ù„Ù„Ø·Ù„Ø§Ø¨ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ ÙˆØ§Ù„Ù†ÙØ³ÙŠ ÙˆØ§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØŒ Ù…Ø¹ ØªÙˆÙÙŠØ± Ø¨Ø±Ø§Ù…Ø¬ ØªØ¯Ø±ÙŠØ¨ÙŠØ© ÙˆÙ…Ù‡Ù†ÙŠØ© Ù„ØªØ£Ù‡ÙŠÙ„Ù‡Ù… Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„.',
      'Ù…ÙˆÙ‚Ø¹ Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ ÙˆØ¨ÙŠØ¦Ø© Ø¢Ù…Ù†Ø© Ø­ÙŠØ« ØªÙ‚Ø¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ù…ÙˆÙ‚Ø¹ ÙŠØ³Ù‡Ù„ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„ÙŠÙ‡ Ù…Ù…Ø§ ÙŠØ³Ù‡Ù… ÙÙŠ ØªØ­Ø³ÙŠÙ† ØªØ¬Ø±Ø¨ØªÙ‡Ù… Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙˆØ§Ù„Ù…Ø¹ÙŠØ´ÙŠØ©.',
      'Ø±Ø³ÙˆÙ… Ø¯Ø±Ø§Ø³ÙŠØ© ØªÙ†Ø§ÙØ³ÙŠØ© Ø¨Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ù…Ø¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ© Ø§Ù„Ø£Ø®Ø±Ù‰ØŒ Ù…Ø¹ ØªÙ‚Ø¯ÙŠÙ… ØªØ¹Ù„ÙŠÙ… Ø¨Ø¬ÙˆØ¯Ø© Ø¹Ø§Ù„ÙŠØ© ÙˆØªÙƒØ§Ù„ÙŠÙ Ù…Ø¹Ù‚ÙˆÙ„Ø© Ù†Ø³Ø¨ÙŠÙ‹Ø§.',
    ],
    admissionRequirements: [
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ©.',
      'ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø´Ù‡Ø§Ø¯Ø© Ù…ÙŠÙ„Ø§Ø¯ Ø§Ù„Ø·Ø§Ù„Ø¨ ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ù… ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ø¨ ÙÙŠ Ø­Ø§Ù„Ø© ÙƒØ§Ù† Ø¹Ù…Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£Ù‚Ù„ Ù…Ù† 18 Ø¹Ø§Ù….',
      'ÙÙŠØ¯ÙŠÙˆ ØªØ¹Ø±ÙŠÙÙŠ Ù„Ù„Ø·Ø§Ù„Ø¨ Ù„Ø§ ÙŠÙ‚Ù„ Ø¹Ù† 80 Ø«Ø§Ù†ÙŠØ© ÙˆÙ„Ø§ ÙŠØ²ÙŠØ¯ Ø¹Ù† 120 Ø«Ø§Ù†ÙŠØ©ØŒ ÙˆÙŠØ¸Ù‡Ø± ÙÙŠÙ‡ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø¬ÙˆØ§Ø² Ø³ÙØ±Ù‡ ÙˆÙŠØªØ­Ø¯Ø« Ø¹Ù† Ø³Ø¨Ø¨ Ø§Ø®ØªÙŠØ§Ø±Ù‡ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù„Ù„Ø¯Ø±Ø§Ø³Ø© ÙˆÙ„Ù…Ø§Ø°Ø§ Ø§Ø®ØªØ§Ø± Ù‡Ø°Ø§ Ø§Ù„ØªØ®ØµØµ.',
      'Ø§Ø®ØªØ¨Ø§Ø± ØªØ­Ø¯ÙŠØ¯ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© (ØºÙŠØ± Ù…Ø·Ù„ÙˆØ¨ ÙÙŠ Ø­Ø§Ù„Ø© ÙˆØ¬ÙˆØ¯ Ø´Ù‡Ø§Ø¯Ø© TOEFL Ø£Ùˆ IELTS Ø§Ùˆ Ø´Ù‡Ø§Ø¯Ø© Pearson Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ù„Ù…Ø³ØªÙˆÙ‰ B2).',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø·Ø¨', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '5520 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ø¹Ù…Ø§Ù„', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
    ],
    whyTheWay: [
      'ØªÙ…Ø«ÙŠÙ„ Ù…Ø¨Ø§Ø´Ø± ÙˆØ±Ø³Ù…ÙŠ Ù„Ø£Ø±Ù‚Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©.',
      'Ø¯Ø¹Ù… Ù…ØµÙ…Ù… Ø®ØµÙŠØµÙ‹Ø§ Ù„ØªÙ„Ø¨ÙŠØ© Ø§Ø­ØªÙŠØ§Ø¬Ø§ØªÙƒ Ù…Ù† Ø£ÙˆÙ„ Ø®Ø·ÙˆØ© Ø­ØªÙ‰ Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ù‚Ø¹Ø¯Ùƒ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠ ÙÙŠ Ø¬Ø§Ù…Ø¹Ø© Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©.',
      'Ø´ÙØ§ÙÙŠØ© ÙƒØ§Ù…Ù„Ø© ÙÙŠ Ø¬Ù…ÙŠØ¹ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø¨Ø¯ÙˆÙ† Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ© Ø£Ùˆ Ù…ÙØ§Ø¬Ø¢Øª.',
      'Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…Ù‡Ù†ÙŠØ© Ø¹Ù„Ù‰ ÙŠØ¯ Ø®Ø¨Ø±Ø§Ø¡ Ø¨ØªÙƒØ§Ù„ÙŠÙ Ù…Ù†Ø§Ø³Ø¨Ø©.',
      'ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…Ø±ÙŠØ­Ø© ÙˆÙ…Ø¯Ø±ÙˆØ³Ø© Ù…Ø¹ Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ø³ØªÙ…Ø±Ø© Ù…Ù† ÙØ±ÙŠÙ‚ Ù…ØªØ®ØµØµ ÙÙŠ Ø´Ø¤ÙˆÙ† Ø§Ù„Ø·Ù„Ø§Ø¨.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ Ù„Ø¯Ù‰ ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø© Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø© ÙÙ‚Ø·.',
      'Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙˆØ§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ ÙÙŠ 10 Ø£ÙŠØ§Ù….',
      'Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ù…ÙˆØ§ÙÙ‚Ø© ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙÙŠ ØºØ¶ÙˆÙ† 7 Ø£ÙŠØ§Ù….',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ù…Ù† Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ©.',
      'ØªØ¯Ø±ÙŠØ¨ Ø´Ø§Ù…Ù„ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‚Ø§Ø¨Ù„Ø© Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆÙÙ‚ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'Ø¥Ø±Ø³Ø§Ù„ ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø¯ÙØ¹ Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ù…Ù† Ø§Ù„Ø³Ø¯Ø§Ø¯ Ù„ØªØ³Ù‡ÙŠÙ„ Ø¨Ø¯Ø¡ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„ØªØ£Ø´ÙŠØ±Ø© Ø¨Ø³Ø±Ø¹Ø© ÙˆØ³Ù„Ø§Ø³Ø© ÙÙŠ Ø­Ø§Ù„Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… Ø¹Ù„Ù‰ ØªØ£Ø´ÙŠØ±Ø© Ø·Ø§Ù„Ø¨.',
    ],
    nameEn: 'Georgian American University (GAU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Georgian American University strives to always be at the forefront of educational institutions in delivering theoretical and practical knowledge by providing a comprehensive and distinguished educational experience for every student that combines academic quality with professional preparation.',
      'The university is committed to supporting its students at every step of their academic journey, working closely with them to help them discover and develop their abilities, preparing them for a successful career path full of rewarding opportunities in the future.',
    ],
    specialtiesEn: ['Human Medicine', 'Business Administration'],
    advantagesEn: [
      'International accreditation and recognition: the university is accredited by the World Health Organization (WHO) and the National Medical Commission (NMC), in addition to accreditation from the Georgian Ministry of Education, making its degree recognized in many countries worldwide.',
      'Quality education based on American standards, with a rigorous academic system ensuring global recognition of its degrees.',
      'A modern educational environment with advanced facilities, equipped laboratories, and modern teaching methods combining theoretical and practical aspects.',
      'The university has a qualified teaching staff composed of elite professors and experts with prestigious academic degrees and international experience.',
      'Continuous academic and personal support, with the university providing academic, psychological, and social support alongside training and professional programs to prepare students for the job market.',
      'Strategic location and safe environment, with the university situated in an easily accessible location that enhances the educational and living experience.',
      'Competitive tuition fees compared to other American-standard universities, with high-quality education at relatively reasonable costs.',
    ],
    admissionRequirementsEn: [
      'Copy of the student\'s passport.',
      'Personal photo.',
      'Email address.',
      'Copy of the high school certificate.',
      'A birth certificate and copies of both parents\' passports are required if the student is under 18 years old.',
      'An introductory video of the student, no less than 80 seconds and no more than 120 seconds, showing the passport and discussing the reason for choosing Georgia and the chosen major.',
      'English language proficiency test (not required if the student has a TOEFL, IELTS, or Pearson B2 certificate).',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s',
        rows: [
          { program: 'Medicine', duration: '6 years', fee: '$5,520/year' },
          { program: 'Business Administration', duration: '4 years', fee: '$4,000/year' },
        ],
      },
    ],
    whyTheWayEn: [
      'Direct and official representation of the finest accredited universities.',
      'Support designed specifically to meet your needs from the first step until you reach your seat at a Georgian university.',
      'Complete transparency in all costs with no hidden fees or surprises.',
      'Professional academic consultations by experts at affordable costs.',
      'A comfortable and well-planned educational experience with continuous follow-up from a specialized student affairs team.',
    ],
    registrationStepsEn: [
      'Document translation and notarization and submission to the university within just 72 hours.',
      'Conducting university exams and receiving preliminary acceptance within 10 days.',
      'Obtaining Ministry of Education approval within 7 days.',
      'Issuing the final ministerial decision within 5 days of university approval.',
      'Comprehensive training for students on the personal interview according to the university-approved format.',
      'Sending the payment invoice within 5 days of payment to facilitate starting visa procedures quickly and smoothly if applying for a student visa.',
    ],
  },
  {
    id: 'tsu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙØ§Ù† Ø¬Ø§ÙØ§Ø®ÙŠØ´ÙÙŠÙ„ÙŠ ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©',
    imageUrl: tsuPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: '1 Ilia Chavchavadze Avenue, Tbilisi 0179, Georgia',
    website: 'https://www.tsu.ge/en',
    description: [
      'ØªØ£Ø³Ø³Øª Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙØ§Ù† Ø¬Ø§ÙØ§Ø®ÙŠØ´ÙÙŠÙ„ÙŠ ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ø¹Ø§Ù… 1918 Ù„ØªÙƒÙˆÙ† Ø£ÙˆÙ„ Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ùˆ Ù‡ÙŠ Ù…Ø¤Ø³Ø³Ø© Ø¨Ø­Ø«ÙŠØ© Ø±Ø§Ø¦Ø¯Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØªØ¶Ù… Ø­ÙˆØ§Ù„ÙŠ 22,000 Ø·Ø§Ù„Ø¨ Ù…ÙˆØ²Ø¹ÙŠÙ† Ø¹Ù„Ù‰ Ø³Ø¨Ø¹ ÙƒÙ„ÙŠØ§Øª ÙƒÙ…Ø§ ØªÙ‚Ø¯Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø±Ø§Ù…Ø¬ ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø© ÙˆØ¨ÙŠØ¦Ø© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª ØªØ¹Ø²Ø² Ø§Ù„ØªÙ…ÙŠØ² Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ùˆ Ø§Ù„Ø§Ø¨ØªÙƒØ§Ø± ÙˆØ§Ù„Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø¨Ø­Ø«.',
    ],
    specialties: ['Ø§Ù„Ø·Ø¨', 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', 'Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯', 'Ø§Ù„ÙƒÙŠÙ…ÙŠØ§Ø¡'],
    advantages: [
      'Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ©',
      'Ù…ÙˆÙ‚Ø¹Ù‡Ø§ Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ',
      'ÙØ±Øµ Ø§Ù„ØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ø¯ÙˆÙ„ÙŠ',
      'Ø¨ÙŠØ¦Ø© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª',
      'ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ù…Ø¹Ù‚ÙˆÙ„Ø©',
      'ØªØ³Ù‡ÙŠÙ„Ø§Øª Ø§Ù„Ù‚Ø¨ÙˆÙ„ ÙˆØ§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª',
      'Ø§Ù„ÙØ±Øµ Ø§Ù„Ù…Ù‡Ù†ÙŠØ© Ø§Ù„Ù…Ø³ØªÙ‚Ø¨Ù„ÙŠØ©',
    ],
    admissionRequirements: [
      'Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨: Ø³Ø§Ø±ÙŠ Ø§Ù„Ù…ÙØ¹ÙˆÙ„.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©: Ø­Ø¯ÙŠØ«Ø© ÙˆÙˆØ§Ø¶Ø­Ø©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ: Ù„Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø±Ø³Ù…ÙŠ ÙˆØ§Ø³ØªÙ„Ø§Ù… Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ©: Ù…ØµØ¯Ù‚Ø© ÙˆÙ…Ø¹ØªÙ…Ø¯Ø©.',
      'Ø¥Ø«Ø¨Ø§Øª Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©: ÙŠØ·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ø¬ØªÙŠØ§Ø² Ø§Ø®ØªØ¨Ø§Ø± Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø¨Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ùˆ ÙŠØ¹ÙÙ‰ Ø§Ù„Ø·Ø§Ù„Ø¨ Ù…Ù† Ù‡Ø°Ø§ Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø± ÙÙŠ Ø­Ø§Ù„ ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ù„ØºØ© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ù…Ø«Ù„ TOEFL Ø£Ùˆ IELTS Ø£Ùˆ Ø´Ù‡Ø§Ø¯Ø© Pearson Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø¨Ù…Ø³ØªÙˆÙ‰ B2.',
      'Ù„Ù…Ù† Ù‡Ù… Ø¯ÙˆÙ† 18 Ø¹Ø§Ù… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ± Ø¬ÙˆØ§Ø²Ø§Øª Ø³ÙØ± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†.',
    ],
    programSections: [
      {
        title: 'Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø·Ø¨ Ø§Ù„Ø§Ø³Ù†Ø§Ù†', duration: 'Ø®Ù…Ø³ Ø³Ù†ÙˆØ§Øª', fee: '8000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„Ø·Ø¨', duration: 'Ø³Øª Ø³Ù†ÙˆØ§Øª', fee: '8000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„ÙƒÙŠÙ…ÙŠØ§Ø¡', duration: 'Ø§Ø±Ø¨Ø¹ Ø³Ù†ÙˆØ§Øª', fee: '3000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯', duration: 'Ø§Ø±Ø¨Ø¹ Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: 'Ø§Ø±Ø¨Ø¹ Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø±' },
        ],
      },
    ],
    whyTheWay: [
      'ÙƒÙ„ Ø®Ø·ÙˆØ© ØªØªÙ… Ø¨ÙˆØ¶ÙˆØ­ ÙˆÙ…ØµØ¯Ø§Ù‚ÙŠØ© ÙˆØ¨Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© Ø¨Ø¯ÙˆÙ† Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ©.',
      'Ø£Ø³Ø¹Ø§Ø± Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ù…ÙƒÙ†Ø© Ø¨Ø¬ÙˆØ¯Ø© Ø¹Ø§Ù„ÙŠØ©.',
      'Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…ØªØ®ØµØµØ© Ù†Ø³Ø§Ø¹Ø¯Ùƒ ÙÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ®ØµØµ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.',
      'ØªØ¬Ù‡ÙŠØ² Ø¬Ù…ÙŠØ¹ Ø£ÙˆØ±Ø§Ù‚Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¨Ø³Ù‡ÙˆÙ„Ø© ÙˆØ³Ø±Ø¹Ø©.',
      'ÙØ±ÙŠÙ‚ Ø¯Ø¹Ù… Ù…ØªÙ…ÙŠØ² ÙŠÙƒÙˆÙ† Ù…Ø¹Ùƒ Ù…Ù†Ø° Ù„Ø­Ø¸Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… ÙˆØ­ØªÙ‰ Ø§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø± ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø± ÙÙŠ ÙƒÙ„ Ø§Ù„Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ©.',
      'Ù†ÙˆÙØ± Ù„Ùƒ Ø§Ø®ØªÙŠØ§Ø±Ø§Øª Ø³ÙƒÙ†ÙŠØ© Ø¢Ù…Ù†Ø© ÙˆÙ…Ø¬Ù‡Ø²Ø© Ø¨ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª Ø¬Ø¯ÙŠØ¯ Ø£Ùˆ Ù…Ù‚ÙŠÙ… Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚: Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø© Ù…Ù† Ø§Ù„ØªØ¹Ø§Ù‚Ø¯ ÙŠØªÙ… ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ: Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ Ù„Ù„Ø·Ø§Ù„Ø¨.',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ: Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ.',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ: Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØµØ¯Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ.',
      'Ø¥ØµØ¯Ø§Ø± ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø±Ø³ÙˆÙ…: Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯ Ø§Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© ÙˆØªØµØ¯Ø± Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø®Ø§ØµØ© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø°ÙŠÙ† ÙŠØ­ØªØ§Ø¬ÙˆÙ† Ù„ØªØ£Ø´ÙŠØ±Ø© Ø¯Ø±Ø§Ø³ÙŠØ©.',
    ],
    faq: [
      {
        q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙØ§Ù† Ø¬Ø§ÙØ§Ø®ÙŠØ´ÙÙŠÙ„ÙŠ ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ù…Ø¹ØªÙ…Ø¯Ø©ØŸ',
        a: 'ØªØ£Ø³Ø³Øª Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙØ§Ù† Ø¬Ø§ÙØ§Ø®Ø´ÙÙŠÙ„ÙŠ ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ø¹Ø§Ù… 1918 ÙˆÙ‡ÙŠ Ù…Ø¹ØªÙ…Ø¯Ø© Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠ Ù„Ø£Ø·Ø¨Ø§Ø¡ Ø§Ù„Ø·Ø¨ (ECFMG) ÙˆØ§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø·Ø¨ÙŠ Ø§Ù„ÙˆØ·Ù†ÙŠ (NMC) ÙˆØ§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø·Ø¨ÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ (WFME) ÙˆØ§Ù„Ø¬Ù…Ø¹ÙŠØ© Ø§Ù„Ø·Ø¨ÙŠØ© Ù„Ø£Ø·Ø¨Ø§Ø¡ Ø§Ù„Ø·Ø¨ (FAIMER) Ù…Ù…Ø§ ÙŠØ¬Ø¹Ù„Ù‡Ø§ Ù…Ø¤Ø³Ø³Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø·Ø¨ÙŠØ© Ø±Ø§Ø¦Ø¯Ø© ÙˆÙ…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¹Ø§Ù„Ù…ÙŠØ§.',
      },
      { q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø§Øª Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠØ§ØŸ', a: 'Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ù…Ù† Ø§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø£Ø¹Ù„Ù‰ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ù…ØµØ± ÙˆÙ„Ù‡Ø§ Ø§Ø¹ØªØ±Ø§Ù Ø¨ÙƒØ§ÙØ© Ø¯ÙˆÙ„ Ø§Ù„Ø¹Ø§Ù„Ù….' },
    ],
    nameEn: 'Ivane Javakhishvili Tbilisi State University (TSU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Ivane Javakhishvili Tbilisi State University was founded in 1918 as the first university in the Caucasus region. It is a leading research institution in Georgia with approximately 22,000 students across seven faculties. The university offers diverse educational programs and a multicultural environment that promotes academic excellence, innovation, and global engagement in education and research.',
    ],
    specialtiesEn: ['Medicine', 'Dentistry', 'Computer Science', 'Economics', 'Chemistry'],
    advantagesEn: [
      'Quality education and study programs.',
      'Strategic location.',
      'International exchange opportunities.',
      'Multicultural environment.',
      'Reasonable tuition costs.',
      'Streamlined admission and procedures.',
      'Future career opportunities.',
    ],
    admissionRequirementsEn: [
      'Student passport: valid and current.',
      'Personal photo: recent and clear.',
      'Email address: for official communication and receiving updates.',
      'High school certificate: authenticated and certified.',
      'English proficiency proof: the student is required to pass the university\'s English proficiency test; exemption is granted if the student provides a recognized language certificate such as TOEFL, IELTS, or a Pearson B2 certificate.',
      'For those under 18: birth certificate and copies of parents\' passports.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs',
        rows: [
          { program: 'Dentistry', duration: '5 years', fee: '$8,000' },
          { program: 'Medicine', duration: '6 years', fee: '$8,000' },
          { program: 'Chemistry', duration: '4 years', fee: '$3,000' },
          { program: 'Economics', duration: '4 years', fee: '$4,000' },
          { program: 'Computer Science', duration: '4 years', fee: '$4,000' },
        ],
      },
    ],
    whyTheWayEn: [
      'Every step is done with clarity, credibility, and full transparency with no hidden fees.',
      'Affordable prices for the best possible services with high quality.',
      'Specialized academic consultations to help you choose the right major.',
      'Preparation of all your academic documents easily and quickly.',
      'An outstanding support team with you from the moment of application until you settle in Georgia.',
      'Continuous personal support at all academic stages.',
      'We provide safe and fully-equipped housing options whether you are new or already residing in Georgia.',
    ],
    registrationStepsEn: [
      'Document translation and notarization: within 72 hours of contracting, documents are translated, notarized, and submitted to the university.',
      'Preliminary acceptance letter issued: within 5 business days, the preliminary acceptance letter is issued.',
      'Ministerial acceptance issued: within 7 business days, ministerial acceptance is obtained.',
      'Ministerial decision issued: within 5 business days, the ministerial decision is issued.',
      'Fee invoice issued: within 5 business days after paying university fees, the invoice is issued especially for students needing a study visa.',
    ],
    faqEn: [
      { q: 'Is Ivane Javakhishvili Tbilisi State University accredited?', a: 'Ivane Javakhishvili Tbilisi State University was founded in 1918 and is accredited by the European Council for Medical Education (ECFMG), National Medical Commission (NMC), World Federation for Medical Education (WFME), and FAIMER, making it a leading and internationally recognized medical educational institution.' },
      { q: 'Are Georgian universities internationally recognized?', a: 'They are recognized by the Supreme Council of Universities in Egypt and have recognition in countries worldwide.' },
    ],
  },
  {
    id: 'gau-aviation',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø·ÙŠØ±Ø§Ù† Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©',
    imageUrl: ssuPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: '16 Ketevan Tsamebuli Ave, Tbilisi, Georgia',
    website: 'https://ssu.edu.ge',
    description: [
      'ØªØ£Ø³Ø³Øª Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø·ÙŠØ±Ø§Ù† Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© Ø¹Ø§Ù… 1992 Ø¶Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© ÙˆØ£ØµØ¨Ø­Øª Ù…Ø¤Ø³Ø³Ø© Ù…Ø³ØªÙ‚Ù„Ø© ÙÙŠ Ø¹Ø§Ù… 2005 ÙˆÙ‡ÙŠ Ø¬Ø§Ù…Ø¹Ø© Ù…Ø¹ØªÙ…Ø¯Ø© Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØªØ¹Ø¯ Ù…Ù† Ø§Ù„ÙˆØ¬Ù‡Ø§Øª Ø§Ù„Ù…Ù…ÙŠØ²Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ù…Ø­Ù„ÙŠÙŠÙ† ÙˆØ§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ø§Ù„Ø±Ø§ØºØ¨ÙŠÙ† ÙÙŠ Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø·ÙŠØ±Ø§Ù†.',
      'ØªØªÙ…ÙŠØ² Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨ØªÙˆÙÙŠØ± ØªØ¯Ø±ÙŠØ¨ Ø¹Ù…Ù„ÙŠ Ù…ØªÙ‚Ø¯Ù… Ø¹Ù„Ù‰ Ø·Ø§Ø¦Ø±Ø§Øª ÙØ¹Ù„ÙŠØ© Ù…Ø«Ù„: Cessna-152ØŒ Piper SenecaØŒ A-22ØŒ Boeing 737-200.',
    ],
    specialties: [
      'Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø·ÙŠØ±Ø§Ù†',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø·ÙŠØ±Ø§Ù†',
      'ØµÙŠØ§Ù†Ø© Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª',
      'ØªØµÙ…ÙŠÙ… ÙˆØªØµÙ†ÙŠØ¹ Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª',
      'Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ§Øª Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª',
    ],
    advantages: [
      'Ø¨Ø±Ø§Ù…Ø¬ Ù…ØªØ®ØµØµØ©: ØªÙˆÙØ± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…Ø³Ø§Ø±Ø§Øª Ø¯Ø±Ø§Ø³ÙŠØ© Ø¯Ù‚ÙŠÙ‚Ø© ÙˆÙ…ØªØ¹Ù…Ù‚Ø© ÙÙŠ Ù…Ø®ØªÙ„Ù Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„Ø·ÙŠØ±Ø§Ù† ÙˆØ§Ù„Ù‡Ù†Ø¯Ø³Ø©.',
      'Ù…Ø¹Ø¯Ø§Øª ÙˆÙ…Ø®ØªØ¨Ø±Ø§Øª Ø­Ø¯ÙŠØ«Ø©: ØªØ­ØªÙˆÙŠ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¹Ù„Ù‰ Ù…Ø®ØªØ¨Ø±Ø§Øª Ù…ØªØ·ÙˆØ±Ø© ÙˆÙ…Ø­Ø§ÙƒÙŠØ§Øª Ø·ÙŠØ±Ø§Ù† ØªØ³Ù…Ø­ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø¨Ø§Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø¹Ù…Ù„ÙŠ Ø¹Ù„Ù‰ Ø£Ø­Ø¯Ø« Ø§Ù„ØªÙ‚Ù†ÙŠØ§Øª.',
      'Ø´Ø±Ø§ÙƒØ§Øª Ø¯ÙˆÙ„ÙŠØ©: ØªØ´Ø§Ø±Ùƒ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø¥ÙŠØ±Ø§Ø³Ù…ÙˆØ³ Ù…ÙˆÙ†Ø¯ÙˆØ³ Ù…Ù…Ø§ ÙŠØªÙŠØ­ Ù„Ù„Ø·Ù„Ø§Ø¨ ÙØ±Øµ Ø§Ù„ØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ø¹ Ø¬Ø§Ù…Ø¹Ø§Øª Ø£ÙˆØ±ÙˆØ¨ÙŠØ© Ù…Ø±Ù…ÙˆÙ‚Ø©.',
      'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¯ÙˆÙ„ÙŠ: ØªØ­Ø¸Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø§Ø¹ØªØ±Ø§Ù Ø¯ÙˆÙ„ÙŠ Ø®Ø§ØµØ§ Ù…Ù† Ø§Ù„Ø¯ÙˆÙ„ Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠØ© ÙˆØ§Ù„ÙˆÙ„Ø§ÙŠØ§Øª Ø§Ù„Ù…ØªØ­Ø¯Ø© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©.',
      'ØªØ¹Ù„ÙŠÙ… Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©: ØªÙ‚Ø¯Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø±Ø§Ù…Ø¬ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù„ØªØ³Ù‡ÙŠÙ„ Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† ÙˆØ§Ù†Ø¯Ù…Ø§Ø¬Ù‡Ù… ÙÙŠ Ø§Ù„Ù…Ø¬ØªÙ…Ø¹ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ.',
      'ØªÙƒÙ„ÙØ© Ø¯Ø±Ø§Ø³Ø© Ù…Ø¹Ù‚ÙˆÙ„Ø©: ØªØ¹Ø¯ ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠÙ‡Ø§ Ù…Ù†Ø§Ø³Ø¨Ø© Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠØ© Ø§Ù„Ø£Ø®Ø±Ù‰.',
      'Ù…Ø·Ø§Ø± Ø®Ø§Øµ: ØªÙ…ØªÙ„Ùƒ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…Ø·Ø§Ø±Ø§ Ø®Ø§ØµØ§ ÙÙŠ Ù…Ø¯ÙŠÙ†Ø© ØªÙŠÙ„Ø§ÙÙŠ Ù…Ù…Ø§ ÙŠÙˆÙØ± ÙØ±ØµØ§ ÙØ±ÙŠØ¯Ø© Ù„Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø¹Ù…Ù„ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ø·ÙŠØ±Ø§Ù†.',
      'ÙØ±Øµ ØªØ¯Ø±ÙŠØ¨ Ø¹Ù…Ù„ÙŠ: ØªÙˆÙØ± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨ÙŠØ¦Ø© ØªØªÙŠØ­ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§ÙƒØªØ³Ø§Ø¨ Ø®Ø¨Ø±Ø§Øª Ø¹Ù…Ù„ÙŠØ© Ù…ÙŠØ¯Ø§Ù†ÙŠØ© ÙÙŠ Ù…Ø¬Ø§Ù„ Ø§Ù„Ø·ÙŠØ±Ø§Ù† Ù‚Ø¨Ù„ Ø§Ù„ØªØ®Ø±Ø¬.',
      'Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¯Ø§Ø¹Ù…Ø©: ØªÙ‡ØªÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨ØªÙˆÙÙŠØ± Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ù„Ù…Ø³Ø§Ø¹Ø¯ØªÙ‡Ù… Ø¹Ù„Ù‰ Ø§Ù„ØªØ£Ù‚Ù„Ù… ÙˆØ§Ù„Ù†Ø¬Ø§Ø­ ÙÙŠ Ø¯Ø±Ø§Ø³ØªÙ‡Ù….',
    ],
    admissionRequirements: [
      'Ø¬ÙˆØ§Ø² Ø§Ù„Ø³ÙØ±.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'Ø¥Ø°Ø§ ÙƒÙ†Øª ØªØ­Øª Ø³Ù† 18 Ø¹Ø§Ù… ÙŠÙ…ÙƒÙ†Ùƒ ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ± Ø¬ÙˆØ§Ø²Ø§Øª Ø³ÙØ± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†.',
      'Ø¥Ø«Ø¨Ø§Øª Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©: ÙŠØ·Ù„Ø¨ Ù…Ù† Ø§Ù„Ù…ØªÙ‚Ø¯Ù…ÙŠÙ† Ø§Ø¬ØªÙŠØ§Ø² Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¥Ù„Ø§ Ø¥Ø°Ø§ ÙƒØ§Ù†ÙˆØ§ ÙŠØ­Ù…Ù„ÙˆÙ† Ø´Ù‡Ø§Ø¯Ø© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ù…Ø«Ù„ TOEFL Ø£Ùˆ IELTS Ø£Ùˆ Ø´Ù‡Ø§Ø¯Ø© B2 Ù…Ù† Pearson ÙÙŠØ¹ÙÙ‰ Ù…Ù† Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø¹Ù…Ù„ÙŠØ§Øª Ø·ÙŠØ±Ø§Ù† Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '13,500 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø³ØªØºÙ„Ø§Ù„ Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ù„Ù„Ø·Ø§Ø¦Ø±Ø§Øª', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù†Ù‚Ù„ Ø§Ù„Ø¬ÙˆÙŠ', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [
          { program: 'Ø§Ø³ØªØºÙ„Ø§Ù„ Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„ÙÙ†ÙŠ', duration: 'Ø³Ù†ØªØ§Ù†', fee: '4000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø·ÙŠØ±Ø§Ù†', duration: 'Ø³Ù†ØªØ§Ù†', fee: '4000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ù…Ù‡Ù†ÙŠØ©',
        rows: [
          { program: 'ØµÙŠØ§Ù†Ø© Ø®Ø· ØªÙˆØ±Ø¨ÙŠÙ†Ø§Øª Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª (A1)', duration: '8 Ø§Ø´Ù‡Ø±', fee: '4000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØªØµÙ…ÙŠÙ… Ø§Ù„Ù…Ø·Ø§Ø±Ø§Øª ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª', duration: 'Ø³Ù†ØªØ§Ù†', fee: '6000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØµÙŠØ§Ù†Ø© Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª (B1.3)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '8000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØµÙŠØ§Ù†Ø© Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª Ø§Ù„Ø®ÙÙŠÙØ© (B3)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '6000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØµÙŠØ§Ù†Ø© Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª (B2)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '8000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØµÙŠØ§Ù†Ø© Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª (B1.1)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '8000 ÙŠÙˆØ±Ùˆ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø³ØªØºÙ„Ø§Ù„ Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª (CPL-A)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '42000 ÙŠÙˆØ±Ùˆ' },
          { program: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø·ÙŠØ§Ø± Ø§Ù„Ø®Ø§Øµ (PPL)', duration: 'Ø³Ù†Ø©', fee: '11000 ÙŠÙˆØ±Ùˆ' },
        ],
      },
    ],
    whyTheWay: [
      'Ø´ÙØ§ÙÙŠØ© ÙƒØ§Ù…Ù„Ø© Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ© Ù„Ø£Ù†Ù†Ø§ Ù†Ø¤Ù…Ù† Ø¨Ø£Ù‡Ù…ÙŠØ© Ø§Ù„ÙˆØ¶ÙˆØ­ Ù…Ø¹ Ø¹Ù…Ù„Ø§Ø¦Ù†Ø§ ÙÙŠ ÙƒÙ„ Ø®Ø·ÙˆØ©.',
      'Ø®Ø¯Ù…Ø§Øª Ù…ØªÙ…ÙŠØ²Ø© Ø¨Ø£ÙØ¶Ù„ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ù…Ù…ÙƒÙ†Ø©.',
      'Ù…Ù…Ø«Ù„ Ø®Ø§Øµ ÙŠØ¯Ø¹Ù…Ùƒ Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ø¥Ù†Ù‡Ø§Ø¡ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ù‚Ø¨ÙˆÙ„Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ø¨ÙƒÙ„ ÙŠØ³Ø±.',
      'Ù…Ø³Ø§Ø¹Ø¯ØªÙƒ ÙÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ®ØµØµ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨ ÙˆØªØ¬Ù‡ÙŠØ² Ù…Ù„ÙØ§Øª Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø¨ÙØ¶Ù„ Ø®Ø¨Ø±ØªÙ†Ø§ Ø§Ù„ÙˆØ§Ø³Ø¹Ø©.',
      'Ø¯Ø¹Ù… Ù…Ø³ØªÙ…Ø± Ø·ÙˆØ§Ù„ Ù…Ø±Ø§Ø­Ù„ Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… ÙˆØ­ØªÙ‰ Ø§Ø³ØªÙ‚Ø±Ø§Ø±Ùƒ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'ØªÙˆÙÙŠØ± Ø³ÙƒÙ† Ù…Ø¬Ù‡Ø² ÙŠÙ„Ø¨ÙŠ Ø¬Ù…ÙŠØ¹ Ø§Ø­ØªÙŠØ§Ø¬Ø§ØªÙƒ Ø®Ù„Ø§Ù„ ÙØªØ±Ø© Ø¯Ø±Ø§Ø³ØªÙƒ.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø©.',
      'ÙŠØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ Ø®Ù„Ø§Ù„ 5 Ø§ÙŠØ§Ù….',
      'Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ù…Ù† Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù….',
      'Ø¥ØµØ¯Ø§Ø± Ø£Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù….',
      'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø®Ù„Ø§Ù„ 5 Ø§ÙŠØ§Ù… Ø¨Ø¹Ø¯ Ø§Ù„Ø¯ÙØ¹ ÙˆØ°Ù„Ùƒ ÙÙŠ Ø­Ø§Ù„Ø© Ø§Ø­ØªÙŠØ§Ø¬ Ø§Ù„Ø·Ø§Ù„Ø¨ Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„ÙŠ ØªØ§Ø´ÙŠØ±Ø© Ø¯Ø±Ø§Ø³ÙŠØ©.',
    ],
    faq: [
      { q: 'Ù‡Ù„ ÙŠÙˆØ¬Ø¯ Ù„Ø¯Ù‰ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø·ÙŠØ±Ø§Ù†ØŸ', a: 'Ù†Ø¹Ù… ØªÙ‚Ø¯Ù… Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù„Ù„Ø·ÙŠØ±Ø§Ù† Ø¨Ø±Ø§Ù…Ø¬ Ù…ØªØ®ØµØµØ© ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„Ø·ÙŠØ±Ø§Ù† ÙˆØ§Ù„Ù‡Ù†Ø¯Ø³Ø©.' },
      { q: 'ÙƒÙ… ØªÙƒÙ„ÙØ© Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ØªØ®ØªÙ„Ù ØªÙƒÙ„ÙØ© Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø­Ø³Ø¨ Ø§Ù„ØªØ®ØµØµ ÙˆØ§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙˆØªØªØ±Ø§ÙˆØ­ Ø¹Ø§Ø¯Ø© Ø¨ÙŠÙ† 3000 Ùˆ8000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§ ÙˆÙ‚Ø¯ ØªØµÙ„ Ø¥Ù„Ù‰ 13,500 Ø¯ÙˆÙ„Ø§Ø± ÙÙŠ ØªØ®ØµØµØ§Øª Ù…Ø«Ù„ Ø§Ù„Ø·Ø¨.' },
    ],
    nameEn: 'Georgian Aviation University (GAU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Georgian Aviation University was founded in 1992 within the Georgian Technical University and became an independent institution in 2005. It is accredited by the Georgian Ministry of Education and is a distinguished destination for local and international students wishing to study aviation.',
      'The university is distinguished by providing advanced practical training on actual aircraft such as: Cessna-152, Piper Seneca, A-22, and Boeing 737-200.',
    ],
    specialtiesEn: [
      'Aviation Engineering',
      'Aviation Management',
      'Aircraft Maintenance',
      'Aircraft Design and Manufacturing',
      'Aircraft Electronics (Avionics)',
    ],
    advantagesEn: [
      'Specialized programs: the university offers precise and in-depth study tracks in various fields of aviation and engineering.',
      'Modern equipment and laboratories: the university contains advanced laboratories and flight simulators allowing students hands-on training with the latest technologies.',
      'International partnerships: the university participates in the Erasmus Mundus program, providing students with academic exchange opportunities with prestigious European universities.',
      'International accreditation: the university enjoys international recognition, especially from European countries and the United States.',
      'English-language instruction: the university offers programs in English to facilitate study for international students and their integration into the academic community.',
      'Reasonable tuition costs: tuition fees are affordable compared to other European universities.',
      'Private airport: the university owns a private airport in the city of Telavi, providing unique opportunities for practical flight training.',
      'Practical training opportunities: the university provides an environment that allows students to gain practical field experience in aviation before graduation.',
      'Supportive educational environment: the university is dedicated to providing full support for international students to help them adapt and succeed in their studies.',
    ],
    admissionRequirementsEn: [
      'Passport.',
      'High school certificate.',
      'Personal photo.',
      'Email address.',
      'If you are under 18, you can submit your birth certificate and copies of parents\' passports.',
      'English proficiency proof: applicants are required to pass the university\'s English test unless they hold a recognized certificate such as TOEFL, IELTS, or a Pearson B2 certificate.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s',
        rows: [
          { program: 'Aircraft Flight Operations', duration: '4 years', fee: '€13,500/year' },
          { program: 'Aircraft Technical Exploitation', duration: '4 years', fee: '€4,000/year' },
          { program: 'Air Transport Management', duration: '4 years', fee: '€4,000/year' },
        ],
      },
      {
        title: 'Master\'s',
        rows: [
          { program: 'Aircraft Technical Exploitation', duration: '2 years', fee: '€4,000/year' },
          { program: 'Aviation Management', duration: '2 years', fee: '€4,000/year' },
        ],
      },
      {
        title: 'Professional Programs',
        rows: [
          { program: 'Aircraft Turbine Line Maintenance (A1)', duration: '8 months', fee: '€4,000/year' },
          { program: 'Airport Design and Operations', duration: '2 years', fee: '€6,000/year' },
          { program: 'Aircraft Maintenance (B1.3)', duration: '2 years', fee: '€8,000/year' },
          { program: 'Light Aircraft Maintenance (B3)', duration: '2 years', fee: '€6,000/year' },
          { program: 'Aircraft Maintenance (B2)', duration: '2 years', fee: '€8,000/year' },
          { program: 'Aircraft Maintenance (B1.1)', duration: '2 years', fee: '€8,000/year' },
          { program: 'Aircraft Exploitation (CPL-A)', duration: '2 years', fee: '€42,000' },
          { program: 'Private Pilot Training Program (PPL)', duration: '1 year', fee: '€11,000' },
        ],
      },
    ],
    whyTheWayEn: [
      'Complete transparency with no hidden fees because we believe in the importance of clarity with our clients at every step.',
      'Outstanding services at the best possible costs.',
      'A dedicated representative to support you directly in completing your academic admission smoothly.',
      'Helping you choose the right major and prepare admission files thanks to our extensive experience.',
      'Continuous support throughout the application stages and until you settle in Georgia.',
      'Providing furnished accommodation that meets all your needs during your study period.',
    ],
    registrationStepsEn: [
      'Document translation and notarization within 72 hours.',
      'Preliminary acceptance letter issued within 5 days.',
      'Ministry acceptance received within 7 days.',
      'Ministry order issued within 5 days.',
      'Invoice sent within 5 days after payment if the student needs a study visa.',
    ],
    faqEn: [
      { q: 'Does Georgia have an aviation program?', a: 'Yes, Georgian Aviation University offers specialized programs in various fields of aviation and engineering.' },
      { q: 'How much does university study cost in Georgia?', a: 'The cost of studying in Georgia varies by major and university, typically ranging from $3,000 to $8,000 per year, and can reach up to $13,500 for specialties like medicine.' },
    ],
  },
  {
    id: 'ibsu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (IBSU)',
    imageUrl: ibsuPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: '2, David Agmashenebeli Alley 13 km, 0131, Georgia',
    description: [
      'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (IBSU) Ø£ÙˆÙ„ Ù…Ø¤Ø³Ø³Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© ØªÙ‚Ø¯Ù… Ø¨Ø±Ø§Ù…Ø¬Ù‡Ø§ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø­ÙŠØ« Ø¨Ø¯Ø£Øª Ø±Ø­Ù„ØªÙ‡Ø§ Ø§Ù„Ù…ØªÙ…ÙŠØ²Ø© ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø¨Ø­Ø« Ø§Ù„Ø¹Ù„Ù…ÙŠ Ù…Ù†Ø° Ø¹Ø§Ù… 1995ØŒ ÙˆÙ‡ÙŠ Ø§Ù„ÙŠÙˆÙ… Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø±Ø§Ø¦Ø¯Ø© Ø§Ù„ØªÙŠ ØªÙˆÙØ± Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª Ù„ØªÙ„Ø¨ÙŠ Ø£Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ©.',
      'ÙˆØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ IBSU Ø¹Ù„Ù‰ Ø£Ø³Ø§Ù„ÙŠØ¨ ØªØ¯Ø±ÙŠØ³ Ø­Ø¯ÙŠØ«Ø© ÙˆØªÙ‚Ù†ÙŠØ§Øª ØªØ¹Ù„ÙŠÙ… Ù…ØªÙ‚Ø¯Ù…Ø© Ø¨Ù‡Ø¯Ù ØªØ·ÙˆÙŠØ± Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„Ø·Ù„Ø§Ø¨ Ø¨Ù…Ø§ ÙŠØªÙ…Ø§Ø´Ù‰ Ù…Ø¹ Ù…ØªØ·Ù„Ø¨Ø§Øª Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ù…Ø­Ù„ÙŠ ÙˆØ§Ù„Ø¯ÙˆÙ„ÙŠ.',
      'ÙƒÙ…Ø§ ÙŠØ¯Ø±Ø³ ÙÙŠ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù†Ø®Ø¨Ø© Ù…Ù† Ø§Ù„Ø£Ø³Ø§ØªØ°Ø© Ø§Ù„Ù…Ø­Ù„ÙŠÙŠÙ† ÙˆØ§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ù…Ù…Ø§ ÙŠØ¹Ø²Ø² Ù…Ù† ÙØ±Øµ ØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ø·Ù„Ø§Ø¨ ÙˆØ£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„ØªØ¯Ø±ÙŠØ³ÙŠØ© Ø¯ÙˆÙ„ÙŠÙ‹ Ù„Ø¶Ù…Ø§Ù† Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ø§Ù„Ù…ÙŠØ© Ø­Ù‚ÙŠÙ‚ÙŠØ©.',
    ],
    specialties: ['Ø§Ù„Ø·Ø¨', 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø©', 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', 'Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø§Ù†Ø³Ø§Ù†ÙŠØ©', 'Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„ØªØ±Ø¨ÙˆÙŠØ©'],
    advantages: [
      'ÙŠØªÙ… ØªØ¯Ø±ÙŠØ³ ÙƒÙ„ Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù…Ù…Ø§ ÙŠØ³Ù‡Ù„ Ø¹Ù„Ù‰ Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ù…Ù† Ø§Ù„Ø¹Ø±Ø¨ Ø§Ù„Ø§Ù†Ø¯Ù…Ø§Ø¬ØŒ ÙƒÙ…Ø§ ÙŠÙ…Ù†Ø­Ù‡Ù… Ø£ÙØ¶Ù„ÙŠØ© ÙÙŠ Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ.',
      'Ø§Ø¹ØªØ±Ø§Ù Ø¯ÙˆÙ„ÙŠ Ø¨Ø´Ù‡Ø§Ø¯ØªÙ‡Ø§.',
      'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù‚ÙˆÙŠ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'ØªØ³ØªÙ‚Ø¨Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø·Ù„Ø§Ø¨ Ù…Ù† Ø£ÙƒØ«Ø± Ù…Ù† 20 Ø¯ÙˆÙ„Ø© Ù…Ù…Ø§ ÙŠØ®Ù„Ù‚ Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª.',
      'Ø£ÙƒØ«Ø± Ù…Ù† 24 Ø¨Ø±Ù†Ø§Ù…Ø¬ ÙÙŠ Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ ÙˆØ§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ± ÙˆØ§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡ ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª Ù…Ø·Ù„ÙˆØ¨Ø© Ø¹Ø§Ù„ÙŠÙ…Ø§Ù‹.',
      'Ø§Ù„ØªØ¹Ù„Ù… Ø¹Ù„Ù‰ ÙŠØ¯ Ù†Ø®Ø¨Ø© Ø£Ø³Ø§ØªØ°Ø© Ù…Ø­Ù„ÙŠÙˆÙ† ÙˆØ¯ÙˆÙ„ÙŠÙˆÙ† Ù„Ø¶Ù…Ø§Ù† ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ù…ÙŠÙ‚Ø© ÙˆØ­Ø¯ÙŠØ«Ø©.',
      'ØªÙ‚Ù†ÙŠØ§Øª ØªØ¯Ø±ÙŠØ³ Ù…ØªÙ‚Ø¯Ù…Ø©.',
      'ÙØ±Øµ ØªØ¨Ø§Ø¯Ù„ Ø¯ÙˆÙ„ÙŠ Ù…Ø¹ Ø¬Ø§Ù…Ø¹Ø§Øª Ø´Ø±ÙŠÙƒØ© Ø­ÙˆÙ„ Ø§Ù„Ø¹Ø§Ù„Ù….',
      'ØªÙ‡ØªÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨ØªØ£Ù‡ÙŠÙ„ Ø·Ù„Ø§Ø¨Ù‡Ø§ Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ù…Ù† Ø®Ù„Ø§Ù„ ÙˆØ±Ø´ Ø¹Ù…Ù„ ÙˆØªØ¯Ø±ÙŠØ¨Ø§Øª Ø¹Ù…Ù„ÙŠØ© ÙˆØ®Ø¯Ù…Ø§Øª ØªÙˆØ¬ÙŠÙ‡ Ù…Ù‡Ù†ÙŠØ©.',
    ],
    admissionRequirements: [
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ©.',
      'ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø´Ù‡Ø§Ø¯Ø© Ù…ÙŠÙ„Ø§Ø¯ Ø§Ù„Ø·Ø§Ù„Ø¨ ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ù… ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ø¨ ÙÙŠ Ø­Ø§Ù„Ø© ÙƒØ§Ù† Ø¹Ù…Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£Ù‚Ù„ Ù…Ù† 18 Ø¹Ø§Ù….',
      'Ù…Ù‚Ø§Ø¨Ù„Ø© Ø´Ø®ØµÙŠØ© Ù„Ù„Ø·Ø§Ù„Ø¨ Ù„Ù„ØªØ­Ø¯Ø« Ø¹Ù† Ø£Ø³Ø¨Ø§Ø¨ Ø§Ø®ØªÙŠØ§Ø±Ù‡ Ù„Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆÙ„Ù…Ø§Ø°Ø§ Ø§Ø®ØªØ§Ø± Ù‡Ø°Ø§ Ø§Ù„ØªØ®ØµØµ.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø§Ù„Ø·Ø¨', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„ØªØ³ÙˆÙŠÙ‚', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù…Ø­Ø§Ø³Ø¨Ø©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¬Ø±Ø§ÙÙŠÙƒ', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø³ÙŠØ§Ø­Ø©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø¯Ø±Ø§Ø³Ø§Øª Ø§Ù„Ø§Ù…Ø±ÙŠÙƒÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø¨ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø§Ù†Ø¬Ù„ÙŠØ²ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„Ù… Ù†ÙØ³', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [
          { program: 'Ø§Ù„ØªØ³ÙˆÙŠÙ‚', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù…Ø§Ù„ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø´Ø¤ÙˆÙ† Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ…', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡',
        rows: [
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ø¯Ø±Ø§Ø³Ø§Øª Ø§Ù„Ø§Ù…Ø±ÙŠÙƒÙŠØ©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„ØªØ±Ø¨ÙŠØ©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ù…Ø²Ø¯ÙˆØ¬ Ù„Ù„Ø¯Ø±Ø§Ø³Ø§Øª Ø§Ù„Ø¹Ù„ÙŠØ§',
        rows: [{ program: 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' }],
      },
    ],
    whyTheWay: [
      'ØªÙ…Ø«ÙŠÙ„ Ø±Ø³Ù…ÙŠ Ù…Ø¨Ø§Ø´Ø± Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø®ØµØµ Ù„Ùƒ ÙÙŠ ÙƒÙ„ Ø®Ø·ÙˆØ©.',
      'Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© Ø¨Ø£Ø³Ø¹Ø§Ø± ØªÙ†Ø§ÙØ³ÙŠØ© Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ©.',
      'Ø¥Ø±Ø´Ø§Ø¯ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ù† Ø®Ø¨Ø±Ø§Ø¡ Ø¨ØªÙƒØ§Ù„ÙŠÙ Ù…Ø¹Ù‚ÙˆÙ„Ø©.',
      'ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø®Ø§Ù„ÙŠØ© Ù…Ù† Ø§Ù„ØªÙˆØªØ± ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø¯Ù‚ÙŠÙ‚Ø© Ù…Ù† Ù…Ø³ØªØ´Ø§Ø±ÙŠÙ†Ø§ Ø§Ù„Ù…ØªØ®ØµØµÙŠÙ†.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ Ù…Ù† ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ 72 Ø³Ø§Ø¹Ø©.',
      'Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙˆØ§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ ÙÙŠ 10 Ø£ÙŠØ§Ù….',
      'Ø§Ø³ØªÙ„Ø§Ù… Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„ÙˆØ²Ø§Ø±Ø© ÙÙŠ 7 Ø§ÙŠØ§Ù….',
      'Ø¥ØµØ¯Ø§Ø± Ø£Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ ÙÙŠ 5 Ø§ÙŠØ§Ù….',
      'ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø·Ù„Ø§Ø¨ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‚Ø§Ø¨Ù„Ø© Ø§Ù„Ø´Ø®ØµÙŠØ© Ø¨Ù†ÙØ³ Ø§Ù„Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©.',
      'Ø¥Ø±Ø³Ø§Ù„ ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø¯ÙØ¹ Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ù…Ù† Ø¯ÙØ¹ Ø§Ù„Ø±Ø³ÙˆÙ… Ù„Ø¨Ø¯Ø¡ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„ÙÙŠØ²Ø§ Ø¨Ø³Ù„Ø§Ø³Ø© ÙÙŠ Ø­Ø§Ù„ Ø·Ù„Ø¨ ØªØ£Ø´ÙŠØ±Ø© Ø·Ø§Ù„Ø¨.',
    ],
    faq: [
      { q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ø¬ÙŠØ¯Ø©ØŸ', a: 'Ù†Ø¹Ù…ØŒ ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø±Ù…ÙˆÙ‚Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø®ØµÙˆØµØ§Ù‹ ÙÙŠ Ù…Ø¬Ø§Ù„ Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.' },
      { q: 'Ù…Ø§ Ù‡Ùˆ ØªØµÙ†ÙŠÙ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ØªØµÙ†Ù Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© ÙƒØ®Ø§Ù…Ø³ Ø£ÙØ¶Ù„ Ø¬Ø§Ù…Ø¹Ø§Øª Ø¬ÙˆØ±Ø¬ÙŠØ§ØŒ ØªØ­ØªÙ„ Ø§Ù„Ù…Ø±ØªØ¨Ø© 6646 Ø¹Ø§Ù„Ù…ÙŠØ§Ù‹ Ù…Ù…Ø§ ÙŠØ¸Ù‡Ø± Ù…ÙƒØ§Ù†ØªÙ‡Ø§ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ø§Ù„Ù…Ø±Ù…ÙˆÙ‚Ø©.' },
      { q: 'Ù‡Ù„ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ØµØ¹Ø¨Ø©ØŸ', a: 'ØªØ¹ØªØ¨Ø± Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† ÙˆØ§Ù„Ø¹Ø±Ø¨ ÙˆÙ„ÙŠØ³Øª ØµØ¹Ø¨Ø© Ø¨Ø´Ø±Ø· Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… ÙˆØ§Ù„Ø§Ø¬ØªÙ‡Ø§Ø¯ØŒ Ø­ÙŠØ« ØªÙ‚Ø¯Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª: Ù…Ù†Ø§Ù‡Ø¬ Ø­Ø¯ÙŠØ«Ø© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©ØŒ Ø¨ÙŠØ¦Ø© Ø¯Ø§Ø¹Ù…Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø£Ø¬Ø§Ù†Ø¨ØŒ Ù…Ø³ØªÙˆÙ‰ Ù…ØªÙˆØ³Ø· Ù…Ù† Ø§Ù„Ù…ØªØ·Ù„Ø¨Ø§Øª Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…Ø¹ ÙˆØ¬ÙˆØ¯ Ø¯Ø¹Ù… Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ø³ØªÙ…Ø±.' },
    ],
    nameEn: 'International Black Sea University (IBSU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'International Black Sea University (IBSU) is the first educational institution to offer its programs entirely in English in Georgia. It began its distinguished journey in education and scientific research in 1995 and is today one of the leading universities providing a multicultural educational environment meeting the highest academic standards.',
      'Studies at IBSU are based on modern teaching methods and advanced educational techniques aimed at developing students\' skills in line with local and international job market requirements.',
      'The university is staffed by elite local and international professors, enhancing opportunities for student and faculty international exchanges to ensure a truly global educational experience.',
    ],
    specialtiesEn: ['Medicine', 'Engineering', 'Business Administration', 'Computer Science', 'Humanities', 'Educational Sciences'],
    advantagesEn: [
      'All academic programs are taught in English, making it easy for international and Arab students to integrate, while giving them an advantage in the global job market.',
      'International recognition of its degrees.',
      'Strong academic accreditation from the Georgian Ministry of Education.',
      'The university welcomes students from more than 20 countries, creating a multicultural educational environment.',
      'More than 24 programs at bachelor\'s, master\'s, and doctoral levels in globally demanded fields.',
      'Learning from elite local and international professors to ensure a deep and modern educational experience.',
      'Advanced teaching techniques.',
      'International exchange opportunities with partner universities worldwide.',
      'The university focuses on preparing students for the job market through workshops, practical training, and career guidance services.',
    ],
    admissionRequirementsEn: [
      'Copy of the student\'s passport.',
      'Personal photo.',
      'Email address.',
      'Copy of the high school certificate.',
      'A birth certificate and copies of both parents\' passports are required if the student is under 18 years old.',
      'A personal interview where the student discusses their reasons for choosing to study in Georgia and why they chose their major.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s',
        rows: [
          { program: 'Medicine', duration: '6 years', fee: '$4,500/year' },
          { program: 'Business Administration', duration: '3 years', fee: '$4,500/year' },
          { program: 'Marketing', duration: '3 years', fee: '$4,500/year' },
          { program: 'Finance', duration: '3 years', fee: '$4,500/year' },
          { program: 'Accounting', duration: '3 years', fee: '$4,500/year' },
          { program: 'Graphic Design', duration: '4 years', fee: '$4,500/year' },
          { program: 'Tourism', duration: '4 years', fee: '$4,500/year' },
          { program: 'Economics', duration: '4 years', fee: '$4,500/year' },
          { program: 'Computer Science', duration: '4 years', fee: '$4,500/year' },
          { program: 'Architecture', duration: '4 years', fee: '$4,500/year' },
          { program: 'American Studies', duration: '4 years', fee: '$4,500/year' },
          { program: 'International Relations', duration: '4 years', fee: '$4,500/year' },
          { program: 'English Literature', duration: '4 years', fee: '$4,500/year' },
          { program: 'Psychology', duration: '4 years', fee: '$4,500/year' },
        ],
      },
      {
        title: 'Master\'s',
        rows: [
          { program: 'Marketing', duration: '2 years', fee: '$4,500/year' },
          { program: 'Finance', duration: '2 years', fee: '$4,500/year' },
          { program: 'Business Administration', duration: '2 years', fee: '$4,500/year' },
          { program: 'Computer Science', duration: '2 years', fee: '$4,500/year' },
          { program: 'American Foreign Affairs', duration: '2 years', fee: '$4,500/year' },
          { program: 'International Relations', duration: '2 years', fee: '$4,500/year' },
          { program: 'Education Management', duration: '2 years', fee: '$4,500/year' },
        ],
      },
      {
        title: 'Doctorate',
        rows: [
          { program: 'Business Administration', duration: '3 years', fee: '$4,500/year' },
          { program: 'Computer Science', duration: '3 years', fee: '$4,500/year' },
          { program: 'American Studies', duration: '3 years', fee: '$4,500/year' },
          { program: 'Educational Sciences', duration: '3 years', fee: '$4,500/year' },
        ],
      },
      {
        title: 'Dual Graduate Program',
        rows: [{ program: 'Management and Computer Science', duration: '2 years', fee: '$4,500/year' }],
      },
    ],
    whyTheWayEn: [
      'Direct official representation of the best accredited universities.',
      'Personalized support dedicated to you at every step.',
      'Full transparency with competitive prices and no hidden fees.',
      'Academic guidance from experts at reasonable costs.',
      'A stress-free educational experience with precise follow-up from our specialized advisors.',
    ],
    registrationStepsEn: [
      'Document translation and notarization by a notary and submission to the university within 72 hours.',
      'Conducting university exams and obtaining preliminary acceptance within 10 days.',
      'Receiving Ministry approval within 7 days.',
      'Issuing the final Ministry order within 5 days.',
      'Training students for the personal interview in the required format.',
      'Sending the payment invoice within 5 days of paying fees to start visa procedures smoothly if requesting a student visa.',
    ],
    faqEn: [
      { q: 'Is the International Black Sea University good?', a: 'Yes, the International Black Sea University is one of the prestigious universities in Georgia, especially in the field of English-language education.' },
      { q: 'What is the ranking of the International Black Sea University in Georgia?', a: 'The International Black Sea University is ranked as the 5th best university in Georgia, holding the 6,646th position globally, demonstrating its prestigious international standing.' },
      { q: 'Is studying in Georgia difficult?', a: 'Studying in Georgia is suitable for international and Arab students and is not difficult as long as students are committed and diligent. Universities offer: modern curricula in English, a supportive environment for foreign students, moderate academic requirements with continuous academic support.' },
    ],
  },
  {
    id: 'tsmu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©',
    imageUrl: tsmuPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: '33 Vazha Pshavela Ave, Tbilisi, Georgia',
    website: 'https://tsmu.edu/ts',
    description: [
      'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ø§Ù„ØªÙŠ ØªØ£Ø³Ø³Øª Ø¹Ø§Ù… 1918 Ù…Ù† Ø£Ø¹Ø±Ù‚ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø·Ø¨ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ£ÙˆØ±ÙˆØ¨Ø§ Ø§Ù„Ø´Ø±Ù‚ÙŠØ© ÙˆÙƒØ§Ù†Øª ØªØ¹Ø±Ù Ø³Ø§Ø¨Ù‚Ø§ Ø¨Ø§Ø³Ù… Ø¬Ø§Ù…Ø¹Ø© ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ù‚Ø¨Ù„ Ø¥Ø¹Ø§Ø¯Ø© ØªØ³Ù…ÙŠØªÙ‡Ø§ Ø¹Ø§Ù… 1992 Ùˆ ÙŠØªØ®Ø±Ø¬ Ù…Ù†Ù‡Ø§ Ø£ÙƒØ«Ø± Ù…Ù† 40 Ø£Ù„Ù Ø·Ø§Ù„Ø¨.',
      'ÙˆÙ‡ÙŠ Ø±Ø§Ø¦Ø¯Ø© ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø·Ø¨ÙŠ Ø­ÙŠØ« ØªÙˆÙØ± ÙØµÙˆÙ„Ø§ Ø¯Ø±Ø§Ø³ÙŠØ© Ø­Ø¯ÙŠØ«Ø© ÙˆÙ…Ø®ØªØ¨Ø±Ø§Øª Ù…ØªÙ‚Ø¯Ù…Ø© ÙƒÙ…Ø§ ØªØ­ØªÙ„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù…Ø±ØªØ¨Ø© Ø§Ù„Ø±Ø§Ø¨Ø¹Ø© Ø¨ÙŠÙ† 55 Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ© ÙˆØªØ³ØªØ¶ÙŠÙ 7500 Ø·Ø§Ù„Ø¨ Ø¬Ø§Ù…Ø¹ÙŠ Ùˆ3000 Ø·Ø§Ù„Ø¨ Ø¯Ø±Ø§Ø³Ø§Øª Ø¹Ù„ÙŠØ§ Ù…Ù†Ù‡Ù… 25% Ø·Ù„Ø§Ø¨ Ø¯ÙˆÙ„ÙŠÙˆÙ†.',
    ],
    specialties: [
      'Ø§Ù„Ø·Ø¨',
      'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†',
      'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠ',
      'Ø§Ù„ØµÙŠØ¯Ù„Ø©',
      'Ø§Ù„ØªÙ…Ø±ÙŠØ¶',
      'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ£Ù‡ÙŠÙ„',
      'Ø§Ù„ØµØ­Ø© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±Ø©',
    ],
    advantages: [
      'Ø§Ù„Ø§Ø¹ØªØ±Ø§Ù Ø§Ù„Ø¯ÙˆÙ„ÙŠ: Ø´Ù‡Ø§Ø¯Ø§Øª Ø¹Ø§Ù„Ù…ÙŠØ©.',
      'Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ…: Ø¨Ø±Ø§Ù…Ø¬ Ù…Ù…ØªØ§Ø²Ø©.',
      'ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ù…Ø¹Ù‚ÙˆÙ„Ø©: Ø£Ø³Ø¹Ø§Ø± Ù…Ù†Ø®ÙØ¶Ø©.',
      'Ø¨ÙŠØ¦Ø© Ø¯Ø±Ø§Ø³ÙŠØ© Ø¢Ù…Ù†Ø©: Ø£Ù…Ø§Ù† ÙˆØ±Ø¹Ø§ÙŠØ©.',
      'Ù…ÙˆÙ‚Ø¹ Ù…ØªÙ…ÙŠØ²: Ù…Ø¯ÙŠÙ†Ø© Ø¬Ø§Ø°Ø¨Ø©.',
      'ÙØ±Øµ ØªØ·ÙˆÙŠØ± Ù…Ù‡Ù†ÙŠ: Ø¨Ø­ÙˆØ« Ù…Ø³ØªÙ…Ø±Ø©.',
      'ØªÙˆÙØ± ÙØ±Øµ Ø§Ù„Ø¹Ù…Ù„: Ø¥Ù‚Ø§Ù…Ø© ÙˆØ¹Ù…Ù„.',
      'ØªÙ†ÙˆØ¹ Ø«Ù‚Ø§ÙÙŠ: Ø·Ù„Ø§Ø¨ Ø¹Ø§Ù„Ù…ÙŠÙˆÙ†.',
    ],
    admissionRequirements: [
      'Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨: Ø³Ø§Ø±ÙŠ Ø§Ù„Ù…ÙØ¹ÙˆÙ„.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©: Ø­Ø¯ÙŠØ«Ø© ÙˆÙˆØ§Ø¶Ø­Ø©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ: Ù„Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø±Ø³Ù…ÙŠ ÙˆØ§Ø³ØªÙ„Ø§Ù… Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ©: Ù…ØµØ¯Ù‚Ø© ÙˆÙ…Ø¹ØªÙ…Ø¯Ø©.',
      'Ø¥Ø«Ø¨Ø§Øª Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©: ÙŠØ·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø·Ø§Ù„Ø¨ Ø§Ø¬ØªÙŠØ§Ø² Ø§Ø®ØªØ¨Ø§Ø± Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø¨Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ùˆ ÙŠØ¹ÙÙ‰ Ø§Ù„Ø·Ø§Ù„Ø¨ Ù…Ù† Ù‡Ø°Ø§ Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø± ÙÙŠ Ø­Ø§Ù„ ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ù„ØºØ© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ù…Ø«Ù„ TOEFL Ø£Ùˆ IELTS Ø£Ùˆ Ø´Ù‡Ø§Ø¯Ø© Pearson Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø¨Ù…Ø³ØªÙˆÙ‰ B2.',
      'Ù„Ù…Ù† Ù‡Ù… Ø¯ÙˆÙ† 18 Ø¹Ø§Ù… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ± Ø¬ÙˆØ§Ø²Ø§Øª Ø³ÙØ± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†.',
    ],
    programSections: [
      {
        title: 'Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø§Ù„Ø·Ø¨', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '8000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', duration: '5 Ø³Ù†ÙˆØ§Øª', fee: '7000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠ', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '13000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„ØµÙŠØ¯Ù„Ø©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„ØªÙ…Ø±ÙŠØ¶', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3000 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ£Ù‡ÙŠÙ„', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„ØµØ­Ø© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±Ø©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø±' },
        ],
      },
    ],
    whyTheWay: [
      'ÙƒÙ„ Ø®Ø·ÙˆØ© ØªØªÙ… Ø¨ÙˆØ¶ÙˆØ­ ÙˆÙ…ØµØ¯Ø§Ù‚ÙŠØ© ÙˆØ¨Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© Ø¨Ø¯ÙˆÙ† Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ©.',
      'Ø£Ø³Ø¹Ø§Ø± Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ù…ÙƒÙ†Ø© Ø¨Ø¬ÙˆØ¯Ø© Ø¹Ø§Ù„ÙŠØ©.',
      'Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…ØªØ®ØµØµØ© Ù†Ø³Ø§Ø¹Ø¯Ùƒ ÙÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ®ØµØµ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.',
      'ØªØ¬Ù‡ÙŠØ² Ø¬Ù…ÙŠØ¹ Ø£ÙˆØ±Ø§Ù‚Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¨Ø³Ù‡ÙˆÙ„Ø© ÙˆØ³Ø±Ø¹Ø©.',
      'ÙØ±ÙŠÙ‚ Ø¯Ø¹Ù… Ù…ØªÙ…ÙŠØ² ÙŠÙƒÙˆÙ† Ù…Ø¹Ùƒ Ù…Ù†Ø° Ù„Ø­Ø¸Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… ÙˆØ­ØªÙ‰ Ø§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø± ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø± ÙÙŠ ÙƒÙ„ Ø§Ù„Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ©.',
      'Ù†ÙˆÙØ± Ù„Ùƒ Ø§Ø®ØªÙŠØ§Ø±Ø§Øª Ø³ÙƒÙ†ÙŠØ© Ø¢Ù…Ù†Ø© ÙˆÙ…Ø¬Ù‡Ø²Ø© Ø¨ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª Ø¬Ø¯ÙŠØ¯ Ø£Ùˆ Ù…Ù‚ÙŠÙ… Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚: Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø© Ù…Ù† Ø§Ù„ØªØ¹Ø§Ù‚Ø¯ ÙŠØªÙ… ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ: Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ Ù„Ù„Ø·Ø§Ù„Ø¨.',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ: Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ.',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ: Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØµØ¯Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ.',
      'Ø¥ØµØ¯Ø§Ø± ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø±Ø³ÙˆÙ…: Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯ Ø§Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© ÙˆØªØµØ¯Ø± Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø®Ø§ØµØ© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø°ÙŠÙ† ÙŠØ­ØªØ§Ø¬ÙˆÙ† Ù„ØªØ£Ø´ÙŠØ±Ø© Ø¯Ø±Ø§Ø³ÙŠØ©.',
    ],
    faq: [
      { q: 'Ù‡Ù„ Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø·Ø¨ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ ÙÙŠ Ù…ØµØ±ØŸ', a: 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ù…Ù† Ø§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø£Ø¹Ù„Ù‰ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ù…ØµØ± ÙˆÙƒØ§ÙØ© Ø¯ÙˆÙ„ Ø§Ù„Ø¹Ø§Ù„Ù… ÙˆØªÙ‚Ø¯Ù… Ø¨Ø±Ø§Ù…Ø¬ Ø¯Ø±Ø§Ø³ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ†.' },
      { q: 'Ù…Ø§ Ù‡Ùˆ ØªØ±ØªÙŠØ¨ Ø¬Ø§Ù…Ø¹Ø© ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø·Ø¨ÙŠØ© Ø¹Ø§Ù„Ù…ÙŠØ§ØŸ', a: 'ÙŠØ¨Ù„Øº ØªØ±ØªÙŠØ¨ Ø¬Ø§Ù…Ø¹Ø© ØªØ¨Ù„ÙŠØ³ÙŠ Ø§Ù„Ø·Ø¨ÙŠØ© (TSMU) Ø¹Ø§Ù„Ù…ÙŠØ§ 5193.' },
    ],
    nameEn: 'Tbilisi State Medical University (TSMU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Tbilisi State Medical University, founded in 1918, is one of the oldest medical universities in Georgia and Eastern Europe. It was formerly known as Tbilisi State University before being renamed in 1992, with over 40,000 graduates.',
      'It is a leader in medical education, offering modern classrooms and advanced laboratories. The university ranks 4th among 55 Georgian universities and hosts 7,500 undergraduate and 3,000 postgraduate students, 25% of whom are international.',
    ],
    specialtiesEn: ['Medicine', 'Dentistry', 'American MD Program', 'Pharmacy', 'Nursing', 'Physical Therapy & Rehabilitation', 'Public Health & Management'],
    advantagesEn: [
      'International recognition: globally accepted degrees.',
      'Quality education: excellent programs.',
      'Reasonable tuition costs: affordable prices.',
      'Safe study environment: security and care.',
      'Prime location: attractive city.',
      'Professional development opportunities: ongoing research.',
      'Work opportunities: residency and employment.',
      'Cultural diversity: international students.',
    ],
    admissionRequirementsEn: [
      'Student passport: must be valid.',
      'Personal photo: recent and clear.',
      'Email address: for official communication and updates.',
      'High school certificate: certified and accredited.',
      'English proficiency proof: student must pass the university\'s English test, exempted if holding TOEFL, IELTS, or accredited Pearson B2 certificate.',
      'For those under 18: birth certificate and copies of parents\' passports.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs',
        rows: [
          { program: 'Medicine (MD)', duration: '6 years', fee: '$8,000' },
          { program: 'Dentistry', duration: '5 years', fee: '$7,000' },
          { program: 'American MD Program', duration: '6 years', fee: '$13,000' },
          { program: 'Pharmacy', duration: '4 years', fee: '$3,500' },
          { program: 'Nursing', duration: '4 years', fee: '$3,000' },
          { program: 'Physical Therapy & Rehabilitation', duration: '4 years', fee: '$3,500' },
          { program: 'Public Health & Management', duration: '4 years', fee: '$4,000' },
        ],
      },
    ],
    whyTheWayEn: [
      'Every step is handled with clarity, honesty, and full transparency — no hidden fees.',
      'Affordable prices for the best possible services with high quality.',
      'Specialized academic consultations to help you choose the right major.',
      'We prepare all your academic documents easily and quickly.',
      'A distinguished support team with you from application to settling in Georgia.',
      'Continuous personal support at every academic stage.',
      'We provide safe, fully equipped housing options whether you are new or already in Georgia.',
    ],
    registrationStepsEn: [
      'Document translation and notarization: within 72 hours of contracting, documents are translated, notarized, and submitted to the university.',
      'Preliminary acceptance: within 5 working days, the preliminary acceptance letter is issued.',
      'Ministry approval: within 7 working days, the ministry approval is obtained.',
      'Ministry order: within 5 working days, the ministry order is issued.',
      'Fee invoice: within 5 working days after paying university fees, the invoice is issued for students who need a study visa.',
    ],
    faqEn: [
      { q: 'Is medical study in Georgia recognized in Egypt?', a: 'The university is recognized by the Supreme Council of Universities in Egypt and worldwide, offering diverse programs in English for international students.' },
      { q: 'What is TSMU\'s world ranking?', a: 'Tbilisi State Medical University (TSMU) is ranked 5193 globally.' },
    ],
  },
  {
    id: 'gtu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ØªÙ‚Ù†ÙŠØ© (GTU)',
    imageUrl: gtuPhotoUrl,
    description: [
      'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ØªÙ‚Ù†ÙŠØ© (Georgian Technical University) Ø¥Ø­Ø¯Ù‰ Ø£ÙƒØ¨Ø± ÙˆØ£Ø¨Ø±Ø² Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø­ÙŠØ« ØªÙ„Ø¹Ø¨ Ø¯ÙˆØ±Ø§ Ù…Ø­ÙˆØ±ÙŠØ§ ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¹Ø§Ù„ÙŠ ÙˆØ§Ù„Ø¨Ø­Ø« Ø§Ù„Ø¹Ù„Ù…ÙŠ Ùˆ ØªØ±ÙƒØ² Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¹Ù„Ù‰ ØªÙˆÙÙŠØ± Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø© Ø¨Ù…Ø¹Ø§ÙŠÙŠØ± Ø¯ÙˆÙ„ÙŠØ©.',
      'ÙˆØªØªÙ…ØªØ¹ Ø¨Ø´Ø±Ø§ÙƒØ§Øª Ø¯ÙˆÙ„ÙŠØ© ÙˆØ§Ø³Ø¹Ø© Ù…Ø¹ Ù…Ø¤Ø³Ø³Ø§Øª Ø¨Ø­Ø«ÙŠØ© Ù…Ø±Ù…ÙˆÙ‚Ø© Ù…Ø«Ù„ CERN ÙˆJINR ÙƒÙ…Ø§ ØªØ¶Ù… Ù…Ø¯Ø±Ø³Ø© Ø§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ø¨Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ù…ØµÙ…Ù… Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ Ø¬ÙŠÙˆØ±Ø¬ÙŠØªÙˆ Ø¬ÙŠÙˆØ¬ÙŠØ§Ø±Ùˆ Ù…Ù…Ø§ ÙŠØ¹Ø²Ø² Ù…Ù† Ø·Ø§Ø¨Ø¹Ù‡Ø§ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ.',
    ],
    specialties: [
      'Ø§Ù„ØªØµÙ…ÙŠÙ…',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ø­ÙŠÙˆÙŠØ©',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…ÙŠÙƒØ§Ù†ÙŠÙƒÙŠØ©',
      'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„',
      'Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…ÙŠØ§Ù‡',
      'Ø²Ø±Ø§Ø¹Ø© Ø§Ù„ÙƒØ±ÙˆÙ… ÙˆØ¹Ù„Ù… Ø§Ù„ØªØ®Ù…ÙŠØ±',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø²Ø±Ø§Ø¹ÙŠØ©',
      'ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù†ÙˆÙˆÙŠØ©',
    ],
    advantages: [
      'Ø¬ÙˆØ¯Ø© ØªØ¹Ù„ÙŠÙ… Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠØ§ ØªÙ‚Ø¯Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø±Ø§Ù…Ø¬ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ù…Ø³ØªÙˆÙ‰ ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª Ù…Ø«Ù„ Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ùˆ ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø¨Ø¥Ø´Ø±Ø§Ù ÙƒØ§Ø¯Ø± ØªØ¯Ø±ÙŠØ³ÙŠ Ù…Ø¤Ù‡Ù„ ÙˆØ®Ø¨Ø±Ø© Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù‚ÙˆÙŠØ©.',
      'ØªØ®ØµØµØ§Øª Ù…ØªØ¹Ø¯Ø¯Ø© ØªÙ„Ø¨ÙŠ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø§Ù‡ØªÙ…Ø§Ù…Ø§Øª.',
      'ØªÙƒØ§Ù„ÙŠÙ Ø¯Ø±Ø§Ø³ÙŠØ© ÙˆÙ…Ø¹ÙŠØ´ÙŠØ© Ù…Ù†Ø§Ø³Ø¨Ø© Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø¯ÙˆÙ„ Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠØ©.',
      'Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¯Ø§Ø¹Ù…Ø© Ù…Ù† Ø®Ù„Ø§Ù„ Ù…Ø±Ø§ÙƒØ² Ø¥Ø±Ø´Ø§Ø¯ ÙˆØªÙˆØ¬ÙŠÙ‡ Ù…Ø³ØªÙ…Ø±Ø©.',
      'Ø³Ù‡ÙˆÙ„Ø© Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'Ø®ÙŠØ§Ø±Ø§Øª Ø³ÙƒÙ† Ù…ØªÙ†ÙˆØ¹Ø©.',
      'ÙØ±Øµ Ø¹Ù…Ù„ Ù…Ø³ØªÙ‚Ø¨Ù„ÙŠØ© Ù‚ÙˆÙŠØ© Ø¨ÙØ¶Ù„ Ø§Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø¹Ù…Ù„ÙŠ ÙˆØ§Ù„ØªØ±ÙƒÙŠØ² Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ÙŠØ©.',
      'Ø¯Ù…Ø¬ Ø§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ ÙÙŠ Ø§Ù„ØªØ¹Ù„ÙŠÙ….',
      'Ù…Ø³ØªÙˆÙ‰ Ø£Ù…Ø§Ù† Ù…Ø±ØªÙØ¹.',
      'Ø¬Ù…Ø§Ù„ Ø§Ù„Ø·Ø¨ÙŠØ¹Ø© ÙˆØ§Ù„Ø±Ø§Ø­Ø© Ø§Ù„Ù†ÙØ³ÙŠØ©.',
    ],
    admissionRequirements: [
      'Ø§Ù…ØªÙ„Ø§Ùƒ Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø³Ø§Ø±ÙŠ Ø§Ù„Ù…ÙØ¹ÙˆÙ„.',
      'Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø§Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'ØµÙˆØ±Ù‡ Ø´Ø®ØµÙŠØ©.',
      'Ø¥Ø°Ø§ ÙƒÙ†Øª ØªØ­Øª Ø³Ù† 18 Ø¹Ø§Ù… ÙŠÙ…ÙƒÙ†Ùƒ ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ± Ø¬ÙˆØ§Ø²Ø§Øª Ø³ÙØ± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†.',
      'ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ø¥Ø¬Ø§Ø¯Ø© Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù…Ø³ØªÙˆÙ‰ B2.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ (Ø¨Ø§Ù„Ø¬ÙŠÙ„ Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠ)',
        rows: [
          { program: 'Ø§Ù„ØªØµÙ…ÙŠÙ…', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ø­ÙŠÙˆÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù‡Ù†Ø¯Ø³Ø© Ø·Ø¨ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù‡Ù†Ø¯Ø³Ø© Ù…Ø¯Ù†ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù…Ø§Ø±Ø©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ± (Ø¨Ø§Ù„Ø¬ÙŠÙ„ Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠ)',
        rows: [
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªØ§Ù†', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ø¯Ø§Ø±Ø© Ø§Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†Ø©', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù‡Ù†Ø¯Ø³Ø© Ø·Ø¨ÙŠØ© Ø­ÙŠÙˆÙŠØ©', duration: 'Ø³Ù†ØªØ§Ù†', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø§Ù„ØªØµÙ…ÙŠÙ…', duration: 'Ø³Ù†ØªØ§Ù†', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…ÙŠØ§Ù‡', duration: 'Ø³Ù†ØªØ§Ù†', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù†ÙˆÙˆÙŠØ©', duration: 'Ø³Ù†ØªØ§Ù†', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø²Ø±Ø§Ø¹Ø© Ø§Ù„ÙƒØ±ÙˆÙ…', duration: 'Ø³Ù†ØªØ§Ù†', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡ (Ø¨Ø§Ù„Ø¬ÙŠÙ„ Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠ)',
        rows: [{ program: 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ø­ÙŠÙˆÙŠØ©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '12,500 GEL Ø³Ù†ÙˆÙŠØ§Ù‹' }],
      },
    ],
    whyTheWay: [
      'ØªÙ…Ø«ÙŠÙ„ Ø±Ø³Ù…ÙŠ Ù…Ø¨Ø§Ø´Ø±: Ù†Ø­Ù† Ù…Ù…Ø«Ù„ÙˆÙ† Ø±Ø³Ù…ÙŠÙˆÙ† Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ù…Ù…Ø§ ÙŠØ¶Ù…Ù† Ù„Ùƒ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ù‚Ø¨ÙˆÙ„ Ø¯Ù‚ÙŠÙ‚Ø© ÙˆØ³Ø±ÙŠØ¹Ø© ÙˆÙ…ÙˆØ«ÙˆÙ‚Ø© Ø¯ÙˆÙ† Ø£ÙŠ ØªØ¹Ù‚ÙŠØ¯Ø§Øª Ø£Ùˆ ÙˆØ³Ø·Ø§Ø¡.',
      'Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© Ù„Ø§ Ø±Ø³ÙˆÙ… Ù…Ø®ÙÙŠØ©.',
      'Ø£Ø³Ø¹Ø§Ø± Ù„Ø§ ØªÙ‚Ø¨Ù„ Ø§Ù„Ù…Ù†Ø§ÙØ³Ø©.',
      'Ø·Ø§Ù‚Ù… Ù…Ù† Ø§Ù„Ù…Ø³ØªØ´Ø§Ø±ÙŠÙ† Ø§Ù„Ø®Ø¨Ø±Ø§Ø¡.',
      'ØªØ¬Ø±Ø¨Ø© Ø®Ø§Ù„ÙŠØ© Ù…Ù† Ø§Ù„ØªÙˆØªØ±.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø±.',
    ],
    registrationSteps: [
      '72 Ø³Ø§Ø¹Ø© Ù…Ù† ØªÙˆÙ‚ÙŠØ¹ Ø§Ù„ØªØ¹Ø§Ù‚Ø¯ ÙŠØªÙ… ØªØ±Ø¬Ù…Ø© Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ ÙˆØªÙˆØ«ÙŠÙ‚Ù‡Ø§ Ù…Ù† Ù‚Ø¨Ù„ ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ Ø«Ù… ØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      '5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ØªØµØ¯Ø± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ.',
      '7 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ.',
      'Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙŠØµØ¯Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ.',
      'Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ØªØµØ¯Ø± Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯ Ø§Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© ÙˆØ°Ù„Ùƒ ÙÙŠ Ø­Ø§Ù„ Ø§Ø­ØªÙŠØ§Ø¬ Ø§Ù„Ø·Ø§Ù„Ø¨ Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªØ£Ø´ÙŠØ±Ø© Ø¯Ø±Ø§Ø³ÙŠØ©.',
    ],
    faq: [
      { q: 'Ù…Ø§ Ù‡ÙŠ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©ØŸ', a: 'ØªØ¹Ø¯ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© Ø£ÙƒØ¨Ø± Ù…Ø¤Ø³Ø³Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© ØªÙ‚Ù†ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆÙ‚Ø¯ ØªØ£Ø³Ø³Øª Ø¹Ø§Ù… 1928 ÙÙŠ Ø§Ù„Ø¹Ø§ØµÙ…Ø© ØªØ¨Ù„ÙŠØ³ÙŠ ÙƒÙ…Ø¹Ù‡Ø¯ Ø¨ÙˆÙ„ÙŠØªÙƒÙ†ÙŠÙƒ Ù…Ø³ØªÙ‚Ù„.' },
      { q: 'Ù‡Ù„ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ ÙÙŠ Ù…ØµØ±ØŸ', a: 'Ø§Ù„Ù…Ø¬Ù„Ø³ Ø§Ù„Ø£Ø¹Ù„Ù‰ Ù„Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…ØµØ±ÙŠØ© Ø§Ø¹ØªÙ…Ø¯ Ø¹Ø¯Ø© Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù„ØªÙ‚Ø¯ÙŠÙ… Ø¨Ø±Ø§Ù…Ø¬ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø±Ø§ØºØ¨ÙŠÙ† ÙÙŠ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ù‡Ù†Ø§Ùƒ.' },
      { q: 'Ù‡Ù„ ÙŠÙ†ØµØ­ Ø¨Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'Ø¬ÙˆØ±Ø¬ÙŠØ§ ØªØ¬Ø°Ø¨ Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ù…ØµØ±ÙŠÙŠÙ† Ø¨ØªÙƒØ§Ù„ÙŠÙ Ø¯Ø±Ø§Ø³ÙŠØ© Ù…Ù†Ø®ÙØ¶Ø© ÙˆØ¨Ø±Ø§Ù…Ø¬ ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø¬ÙˆØ¯Ø© Ù…Ù†Ø§ÙØ³Ø© Ù„Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠØ©.' },
    ],
    nameEn: 'Georgian Technical University (GTU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Georgian Technical University (GTU) is one of the largest and most prominent academic institutions in Georgia, playing a central role in higher education and scientific research with a focus on providing an advanced educational environment with international standards.',
      'It enjoys extensive international partnerships with prestigious research institutions such as CERN and JINR, and includes the International Design School under the patronage of world-renowned designer Giorgetto Giugiaro.',
    ],
    specialtiesEn: ['Design', 'Biomedical Engineering', 'Mechanical Engineering', 'Computer Science', 'Business Administration', 'Water Engineering', 'Viticulture & Enology', 'Agricultural Engineering', 'Nuclear Engineering IT'],
    advantagesEn: [
      'Internationally recognized quality education with high-level programs in engineering, IT, and management.',
      'Multiple specializations to suit all interests.',
      'Affordable tuition and living costs compared to many European countries.',
      'Supportive educational environment with continuous guidance centers.',
      'Easy access to Georgia.',
      'Diverse housing options.',
      'Strong future career opportunities through practical training.',
      'Integration of technology in education.',
      'High level of safety.',
      'Beautiful nature and psychological comfort.',
    ],
    admissionRequirementsEn: [
      'Valid passport.',
      'High school certificate.',
      'Email address.',
      'Personal photo.',
      'If under 18: birth certificate and copies of parents\' passports.',
      'English proficiency certificate at B2 level.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs (in Georgian Lari)',
        rows: [
          { program: 'Design', duration: '4 years', fee: '12,500 GEL/year' },
          { program: 'Biomedical Engineering', duration: '4 years', fee: '12,500 GEL/year' },
          { program: 'Medical Engineering', duration: '4 years', fee: '12,500 GEL/year' },
          { program: 'Computer Science', duration: '4 years', fee: '12,500 GEL/year' },
          { program: 'Civil Engineering', duration: '4 years', fee: '12,500 GEL/year' },
          { program: 'Architecture', duration: '4 years', fee: '12,500 GEL/year' },
          { program: 'Business Administration', duration: '3 years', fee: '12,500 GEL/year' },
        ],
      },
      {
        title: 'Master\'s Programs (in Georgian Lari)',
        rows: [
          { program: 'Business Administration', duration: '2 years', fee: '12,500 GEL/year' },
          { program: 'Business Administration', duration: '1 year', fee: '12,500 GEL/year' },
          { program: 'Biomedical Engineering', duration: '2 years', fee: '12,500 GEL/year' },
          { program: 'Design', duration: '2 years', fee: '12,500 GEL/year' },
          { program: 'Water Engineering', duration: '2 years', fee: '12,500 GEL/year' },
          { program: 'Nuclear Engineering IT', duration: '2 years', fee: '12,500 GEL/year' },
          { program: 'Viticulture', duration: '2 years', fee: '12,500 GEL/year' },
        ],
      },
      {
        title: 'Doctoral Programs (in Georgian Lari)',
        rows: [{ program: 'Biomedical Engineering', duration: '3 years', fee: '12,500 GEL/year' }],
      },
    ],
    whyTheWayEn: [
      'Official direct representation of Georgian Technical University ensuring accurate, fast, and reliable admission procedures.',
      'Full transparency — no hidden fees.',
      'Unbeatable prices.',
      'Team of expert consultants.',
      'Stress-free experience.',
      'Continuous personal support.',
    ],
    registrationStepsEn: [
      'Within 72 hours of signing, documents are translated, notarized, and submitted to the university.',
      'Within 5 working days, the preliminary acceptance letter is issued.',
      'Within 7 working days, the ministry approval is issued.',
      'Within 5 working days, the final ministry order is issued.',
      'Within 5 working days after paying fees, the invoice is issued for students needing a study visa.',
    ],
    faqEn: [
      { q: 'What is Georgian Technical University?', a: 'GTU is the largest technical educational institution in Georgia, founded in 1928 in Tbilisi as an independent polytechnic institute.' },
      { q: 'Is studying in Georgia recognized in Egypt?', a: 'The Egyptian Supreme Council of Universities has accredited several Georgian universities for recognized programs.' },
      { q: 'Is studying in Georgia recommended?', a: 'Georgia attracts students with low tuition costs and high-quality programs competitive with European universities.' },
    ],
  },
  {
    id: 'cu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² (CU)',
    imageUrl: cuPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: 'Paata Saakadze street 1 Tbilisi, 0102, Georgia',
    website: 'https://cu.edu.ge/en',
    description: [
      'ØªØ¹ØªØ¨Ø± Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Caucasus University (CU) Ù…Ù† Ø£Ù‡Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø®Ø§ØµØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ§Ù„ØªÙŠ ØªÙˆÙØ± Ù„Ùƒ Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø© ØªØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙˆØ§Ù„Ø§Ø¨ØªÙƒØ§Ø± ÙˆØªÙ‚Ø¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ø§Ù„Ø¹Ø§ØµÙ…Ø© ØªØ¨Ù„ÙŠØ³ÙŠ.',
      'Ø­ÙŠØ« ØªØ³ØªÙ‚Ø·Ø¨ Ø·Ù„Ø§Ø¨ Ù…Ù† Ù…Ø®ØªÙ„Ù Ø§Ù„Ø¬Ù†Ø³ÙŠØ§Øª Ø¨ÙØ¶Ù„ ØªÙ†ÙˆØ¹ ØªØ®ØµØµØ§ØªÙ‡Ø§ ÙˆØ¬ÙˆØ¯Ø© Ø¨Ø±Ø§Ù…Ø¬Ù‡Ø§ ÙˆØªØªÙ…ÙŠØ² Ø¨Ù…Ø±Ø§ÙÙ‚ Ø­Ø¯ÙŠØ«Ø© ÙˆÙ‡ÙŠØ¦Ø© ØªØ¯Ø±ÙŠØ³ Ø¯ÙˆÙ„ÙŠØ© ÙˆØ§Ø®ØªÙŠØ§Ø±Ø§Øª Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù…Ø«Ø§Ù„ÙŠÙ‹Ø§ Ù„Ù„Ø±Ø§ØºØ¨ÙŠÙ† ÙÙŠ ØªØ¹Ù„ÙŠÙ… Ø¹Ø§Ù„ÙŠ Ø¨Ù…Ø³ØªÙˆÙ‰ Ø¹Ø§Ù„Ù…ÙŠ ÙÙŠ Ù‚Ù„Ø¨ Ø£ÙˆØ±ÙˆØ¨Ø§ Ø§Ù„Ø´Ø±Ù‚ÙŠØ©.',
    ],
    specialties: [
      'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ',
      'Ø§Ù„ØªØ³ÙˆÙŠÙ‚',
      'Ø¥Ø¯Ø§Ø±Ø© ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',
      'Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠØ©',
      'Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©',
      'Ø¹Ù„Ù… Ø§Ù„Ù†ÙØ³',
      'Ø§Ù„Ø£Ù…Ù† Ø§Ù„Ø³ÙŠØ¨Ø±Ø§Ù†ÙŠ',
      'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³Ø¨ ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„',
    ],
    advantages: [
      'Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø§Ù„Ù…ØªÙ†ÙˆØ¹Ø© ÙˆØ§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© ÙˆØ§Ù„ØªÙŠ ÙŠØªÙ… ØªØ¯Ø±Ø³Ù‡Ø§ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.',
      'ØªØ­Ø¸Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø§Ø¹ØªØ±Ø§Ù Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ´Ù‡Ø§Ø¯Ø§ØªÙ‡Ø§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠÙ‹Ø§.',
      'Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø­Ø¯ÙŠØ«Ø© ÙˆÙ…ØªØ·ÙˆØ±Ø© Ù…Ù† Ø§Ù„Ù…Ø®ØªØ¨Ø±Ø§Øª ÙˆØ§Ù„Ù…ÙƒØªØ¨Ø§Øª Ø§Ù„Ø±Ù‚Ù…ÙŠØ© Ø§Ù„Ù…Ø±Ø§ÙƒØ² Ø§Ù„Ø¨Ø­Ø«ÙŠØ© ÙˆØ§Ù„Ø£Ù†Ø¸Ù…Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©.',
      'ØªÙ…ØªÙ„Ùƒ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙƒØ§Ø¯Ø± Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ø°Ùˆ Ø®Ø¨Ø±Ø© Ø¯ÙˆÙ„ÙŠØ© Ù…Ù† Ù…Ø®ØªÙ„Ù Ø§Ù„Ø¬Ù†Ø³ÙŠØ§Øª.',
      'ØªÙˆÙØ± Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø±Ø§Ù…Ø¬ Ù„Ù„ØªØ¨Ø§Ø¯Ù„ Ø§Ù„Ø¯ÙˆÙ„ÙŠ ÙˆÙØ±Øµ ØªØ¯Ø±ÙŠØ¨ Ø¹Ù…Ù„ÙŠ Ø¨Ø§Ù„ØªØ¹Ø§ÙˆÙ† Ù…Ø¹ Ø¬Ø§Ù…Ø¹Ø§Øª ÙˆØ´Ø±ÙƒØ§Øª Ø¹Ø§Ù„Ù…ÙŠØ©.',
      'ÙŠÙˆØ¬Ø¯ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø·Ù„Ø§Ø¨ÙŠØ© Ù…Ù† Ø§Ù„Ø£Ù†Ø¯ÙŠØ© Ø§Ù„Ø·Ù„Ø§Ø¨ÙŠØ© ÙˆØ§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª Ø§Ù„Ø«Ù‚Ø§ÙÙŠØ© ÙˆØ§Ù„Ù…Ø³Ø§Ø¨Ù‚Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ©.',
    ],
    admissionRequirements: [
      'Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø§Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø§Ø°Ø§ ÙƒØ§Ù† Ø¹Ù…Ø±Ùƒ Ø§Ù‚Ù„ Ù…Ù† 18 Ø³Ù†Ø© ÙÙŠÙ…ÙƒÙ†Ùƒ ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø§Ø¨ Ø§Ùˆ Ø§Ù„Ø§Ù….',
      'ÙŠØªÙ… Ø¹Ù…Ù„ ÙÙŠØ¯ÙŠÙˆ ØªØ¹Ø±ÙŠÙÙŠ Ù„Ùƒ ÙÙŠ Ø­ÙˆØ§Ù„ÙŠ 80 Ø«Ø§Ù†ÙŠØ© ÙˆÙ„Ø§ ÙŠØ²ÙŠØ¯ Ø¹Ù† 120 Ø«Ø§Ù†ÙŠØ© ÙˆÙŠØ¬Ø¨ Ø§Ù† ØªØ¸Ù‡Ø± Ø¬ÙˆØ§Ø² Ø³ÙØ±Ùƒ Ø¨Ù‡.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªØ§Ù†', fee: '5500 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³Ø¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5500 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³Ø¨ ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5500 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„Ø£Ù…Ù† Ø§Ù„Ø³ÙŠØ¨Ø±Ø§Ù†ÙŠ', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¹Ù„Ù… Ø§Ù„Ù†ÙØ³', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…Ø¹Ù…Ø§Ø±ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¬Ø±Ø§ÙÙŠÙƒ', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¯Ø±Ø¬Ø© Ù…Ø´ØªØ±ÙƒØ© ÙÙŠ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¶ÙŠØ§ÙØ© (Ø§Ù„ÙˆÙ„Ø§ÙŠØ§Øª Ø§Ù„Ù…ØªØ­Ø¯Ø© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©)', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '7500 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ù…Ø§Ø¬Ø³ØªÙŠØ± Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ù…Ø´ØªØ±Ùƒ (ÙØ±Ù†Ø³Ø§)', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '10,800 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø¯Ø±Ø¬Ø© Ù…Ø´ØªØ±ÙƒØ© ÙÙŠ Ø§Ù„Ø£Ù…Ù† Ø§Ù„Ø³ÙŠØ¨Ø±Ø§Ù†ÙŠ (Ø§Ù„ÙˆÙ„Ø§ÙŠØ§Øª Ø§Ù„Ù…ØªØ­Ø¯Ø© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©)', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '10,800 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ù…Ø´ØªØ±Ùƒ ÙÙŠ Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³Ø¨ (Ø§Ù„ÙˆÙ„Ø§ÙŠØ§Øª Ø§Ù„Ù…ØªØ­Ø¯Ø© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©)', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '10,800 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªØ§Ù†', fee: '5800 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ù…Ø§Ø¬Ø³ØªÙŠØ± Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ØºØ±ÙˆÙ†ÙˆØ¨Ù„', duration: '2.5 Ø³Ù†Ø©', fee: '18000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', duration: 'Ø³Ù†ØªØ§Ù†', fee: '5800 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¯Ø±Ø¬Ø© Ù…Ø´ØªØ±ÙƒØ© ÙÙŠ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ§Øª Ø§Ù„Ø±Ù‚Ù…ÙŠØ© (Ø£Ù„Ù…Ø§Ù†ÙŠØ§)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '7800 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø¯Ø±Ø¬Ø© Ù…Ø´ØªØ±ÙƒØ© ÙÙŠ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ§Øª Ø§Ù„Ø±Ù‚Ù…ÙŠØ© (Ø§Ù„ÙˆÙ„Ø§ÙŠØ§Øª Ø§Ù„Ù…ØªØ­Ø¯Ø© Ø§Ù„Ø£Ù…Ø±ÙŠÙƒÙŠØ©)', duration: 'Ø³Ù†ØªØ§Ù†', fee: '18000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
        ],
      },
      {
        title: 'Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡',
        rows: [
          { program: 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„ØªØ³ÙˆÙŠÙ‚', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„Ø§Ù‚ØªØµØ§Ø¯', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
          { program: 'Ø§Ù„Ø·Ø¨', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '6000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ' },
        ],
      },
    ],
    whyTheWay: [
      'Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© ÙÙŠ ÙƒÙ„ Ø®Ø·ÙˆØ© Ø¨Ù„Ø§ Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ© Ø£Ùˆ Ù…ÙØ§Ø¬Ø¢Øª.',
      'Ø®Ø¯Ù…Ø§Øª ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø¬ÙˆØ¯Ø© Ø¨Ø£Ø³Ø¹Ø§Ø± Ù…Ù†Ø§Ø³Ø¨Ø©.',
      'Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø§Ø­ØªØ±Ø§ÙÙŠØ© ØªØ³Ø§Ø¹Ø¯Ùƒ ÙÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ®ØµØµ Ø§Ù„Ø£ÙØ¶Ù„ Ù„Ùƒ.',
      'ØªØ¬Ù‡ÙŠØ² Ø£ÙˆØ±Ø§Ù‚Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¨Ø¯Ù‚Ø© ÙˆØ³Ø±Ø¹Ø© Ù„Ø¶Ù…Ø§Ù† Ù‚Ø¨ÙˆÙ„Ùƒ Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ.',
      'ÙØ±ÙŠÙ‚ Ø¯Ø¹Ù… Ù…ØªÙƒØ§Ù…Ù„ Ù…Ø¹Ùƒ Ù…Ù† Ø£ÙˆÙ„ Ø§Ø³ØªØ´Ø§Ø±Ø© Ø­ØªÙ‰ Ø§Ø³ØªÙ‚Ø±Ø§Ø±Ùƒ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø± Ø®Ù„Ø§Ù„ Ø±Ø­Ù„ØªÙƒ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„.',
      'ØªÙˆÙÙŠØ± Ù…Ø³Ø§ÙƒÙ† Ø¢Ù…Ù†Ø© ÙˆÙ…Ø±ÙŠØ­Ø© Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª Ø·Ø§Ù„Ø¨Ù‹Ø§ Ø¬Ø¯ÙŠØ¯Ù‹Ø§ Ø£Ùˆ Ù…Ù‚ÙŠÙ…Ù‹Ø§ Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
    ],
    registrationSteps: [
      'Ø¥Ù†Ø¬Ø§Ø² ØªØ±Ø¬Ù…Ø© Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© ÙˆØªÙˆØ«ÙŠÙ‚Ù‡Ø§ Ù…Ù† Ù‚Ù„ ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ø§Ù„ÙŠ Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ ØºØ¶ÙˆÙ† 72 Ø³Ø§Ø¹Ø©.',
      'Ø¥ØµØ¯Ø§Ø± Ø®Ø·Ø§Ø¨ Ù‚Ø¨ÙˆÙ„ Ù…Ø¨Ø¯Ø¦ÙŠ Ù„Ù„Ø·Ø§Ù„Ø¨ ÙÙŠ ØºØ¶ÙˆÙ† 48 Ø³Ø§Ø¹Ø©.',
      'Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ Ø§Ù„Ø±Ø³Ù…ÙŠ ÙÙŠ Ø®Ù„Ø§Ù„ 7 Ø§ÙŠØ§Ù….',
      'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ ÙÙŠ Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù….',
      'Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯ Ø§Ù„Ø±Ø³ÙˆÙ… ÙŠØªÙ… Ø§ØµØ¯Ø§Ø± ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ© Ø®Ù„Ø§Ù„ 5 Ø§ÙŠØ§Ù… ÙˆÙ‡ÙŠ Ø¶Ø±ÙˆØ±ÙŠØ© Ø¬Ø¯Ø§ Ø¹Ù†Ø¯ Ø­ØµÙˆÙ„ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø¹Ù„Ù‰ Ø§Ù„ØªØ§Ø´ÙŠØ±Ø©.',
    ],
    faq: [
      { q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ù…Ø¹ØªÙ…Ø¯Ø©ØŸ', a: 'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Caucasus International University CIU ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø¬Ø§Ù…Ø¹Ø© Ù…Ø¹ØªÙ…Ø¯Ø© Ø±Ø³Ù…ÙŠÙ‹Ø§ Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø¹Ù„ÙˆÙ… ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆÙ…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø¯ÙˆÙ„Ø©ØŒ ÙƒÙ…Ø§ Ø£Ù† Ø¨Ø¹Ø¶ Ø¨Ø±Ø§Ù…Ø¬Ù‡Ø§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠÙ‹Ø§ ÙˆØ®Ø§ØµØ© ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„Ø·Ø¨ ÙˆØ·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†.' },
      { q: 'Ù…Ø§ Ù‡ÙŠ Ø§Ù„Ù…Ø²Ø§ÙŠØ§ Ø§Ù„ØªÙŠ ØªØ¬Ø¹Ù„ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ¬Ù‡Ø© Ù…ÙØ¶Ù„Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ†ØŸ', a: 'ØªØ¹Ø¯ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ¬Ù‡Ø© Ù…ÙØ¶Ù„Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ø¨Ø³Ø¨Ø¨: ØªÙƒØ§Ù„ÙŠÙ ØªØ¹Ù„ÙŠÙ… ÙˆØ¥Ù‚Ø§Ù…Ø© Ù…Ù†Ø®ÙØ¶Ø© Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø¯ÙˆÙ„ Ø£Ø®Ø±Ù‰ØŒ Ø¬ÙˆØ¯Ø© ØªØ¹Ù„ÙŠÙ… Ø¹Ø§Ù„ÙŠØ© ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø¬Ø§Ù…Ø¹Ø§Øª Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠØ§Ù‹ØŒ Ø³Ù‡ÙˆÙ„Ø© Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„ØªØ£Ø´ÙŠØ±Ø© ÙˆØ§Ù„Ø¥Ù‚Ø§Ù…Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ØŒ Ø¨ÙŠØ¦Ø© Ø¢Ù…Ù†Ø© ÙˆÙ…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª ÙˆØªØ±Ø­ÙŠØ¨ Ø¨Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø£Ø¬Ø§Ù†Ø¨ØŒ ÙØ±Øµ ØªØ¹Ù„Ù… Ù„ØºØ§Øª Ù…ØªØ¹Ø¯Ø¯Ø© Ù…Ø«Ù„ Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙˆØ§Ù„Ø±ÙˆØ³ÙŠØ© ÙˆØ§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©ØŒ ØªÙˆÙØ± Ø¨Ø±Ø§Ù…Ø¬ Ø¯Ø±Ø§Ø³ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø© ÙˆØ¹Ù…Ù„ÙŠØ© Ù…Ø¹ ÙØ±Øµ ØªØ¯Ø±ÙŠØ¨ ÙˆØ´Ø±Ø§ÙƒØ§Øª Ø¯ÙˆÙ„ÙŠØ©.' },
    ],
    nameEn: 'Caucasus University (CU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Caucasus University (CU) is one of the most important private universities in Georgia, providing an advanced educational environment that combines academics and innovation, located in the capital Tbilisi.',
      'It attracts students from various nationalities thanks to its diverse specializations, quality programs, modern facilities, international teaching staff, and English-taught programs — ideal for those seeking world-class education in Eastern Europe.',
    ],
    specialtiesEn: ['Human Medicine', 'Marketing', 'IT Management', 'Economics', 'Architecture', 'International Relations', 'Psychology', 'Cybersecurity', 'Computer Science & AI', 'Business Administration'],
    advantagesEn: [
      'Diverse international programs taught in English.',
      'Recognized by Georgia\'s Ministry of Education with internationally accredited degrees.',
      'Modern educational environment with laboratories, digital libraries, research centers, and advanced learning systems.',
      'International academic staff with experience from various nationalities.',
      'International exchange programs and practical training in partnership with global universities and companies.',
      'Numerous student services including clubs, cultural events, and academic competitions.',
    ],
    admissionRequirementsEn: [
      'Student passport.',
      'High school certificate.',
      'Email address.',
      'Personal photo.',
      'If under 18: birth certificate and copy of parent\'s passport.',
      'Introductory video (80-120 seconds) showing your passport.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs',
        rows: [
          { program: 'Business Administration', duration: '2 years', fee: '$5,500' },
          { program: 'Computer Science', duration: '4 years', fee: '$5,500' },
          { program: 'Computer Science & AI', duration: '4 years', fee: '$5,500' },
          { program: 'Cybersecurity', duration: '4 years', fee: '$5,000' },
          { program: 'Psychology', duration: '4 years', fee: '$5,000' },
          { program: 'International Relations', duration: '4 years', fee: '$5,000' },
          { program: 'Architecture', duration: '4 years', fee: '$5,000' },
          { program: 'Graphic Design', duration: '3 years', fee: '$5,000' },
          { program: 'Economics', duration: '4 years', fee: '$5,000' },
          { program: 'Joint Degree in Hospitality Management (USA)', duration: '3 years', fee: '$7,500' },
          { program: 'Joint MBA Program (France)', duration: '4 years', fee: '$10,800' },
          { program: 'Joint Cybersecurity Degree (USA)', duration: '3 years', fee: '$10,800' },
          { program: 'Joint Computer Science Program (USA)', duration: '3 years', fee: '$10,800' },
        ],
      },
      {
        title: 'Master\'s Programs',
        rows: [
          { program: 'Business Administration', duration: '2 years', fee: '$5,800' },
          { program: 'MBA Grenoble', duration: '2.5 years', fee: '$18,000' },
          { program: 'IT Management', duration: '2 years', fee: '$5,800' },
          { program: 'Joint Digital Logistics Management (Germany)', duration: '2 years', fee: '$7,800' },
          { program: 'Joint Digital Logistics Management (USA)', duration: '2 years', fee: '$18,000' },
        ],
      },
      {
        title: 'Doctoral Programs',
        rows: [
          { program: 'Management', duration: '3 years', fee: '$5,000' },
          { program: 'Marketing', duration: '3 years', fee: '$5,000' },
          { program: 'Economics', duration: '3 years', fee: '$5,000' },
          { program: 'Medicine', duration: '6 years', fee: '$6,000' },
        ],
      },
    ],
    whyTheWayEn: [
      'Full transparency in every step with no hidden fees or surprises.',
      'High-quality educational services at affordable prices.',
      'Professional academic consultations to help you choose the best major.',
      'Accurate and fast preparation of your academic documents to ensure university acceptance.',
      'A comprehensive support team with you from first consultation to settling in Georgia.',
      'Continuous personal support throughout your entire study journey.',
      'Safe and comfortable housing options whether you are a new or existing student in Georgia.',
    ],
    registrationStepsEn: [
      'Document translation, notarization, and submission to the university within 72 hours.',
      'Preliminary acceptance letter issued within 48 hours.',
      'Official ministry approval within 7 days.',
      'Final ministry order within 5 days.',
      'After paying fees, the tuition invoice is issued within 5 days — essential for students obtaining a visa.',
    ],
    faqEn: [
      { q: 'Is Caucasus University accredited?', a: 'Caucasus University is officially accredited by Georgia\'s Ministry of Education and Science with internationally recognized degrees, especially in medicine and dentistry.' },
      { q: 'What makes Georgia a preferred destination for international students?', a: 'Georgia is preferred due to: low education and living costs, high-quality internationally accredited universities, easy visa and residency procedures, safe and multicultural environment, multilingual learning opportunities (English, Russian, Georgian), and diverse practical programs with international partnerships.' },
    ],
  },
  {
    id: 'seu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ÙˆØ·Ù†ÙŠØ© (SEU)',
    imageUrl: seuPhotoUrl,
    description: [
      'ØªØ³Ø¹Ù‰ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ÙˆØ·Ù†ÙŠØ© Georgian National University (SEU) Ø¥Ù„Ù‰ ØªÙ‚Ø¯ÙŠÙ… Ø¨ÙŠØ¦Ø© Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…Ø±Ù…ÙˆÙ‚Ø© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠÙ‹Ø§ Ù…Ù† Ø®Ù„Ø§Ù„ Ø§Ù„ØªØ±ÙƒØ² Ø¹Ù„Ù‰ ØªØ·ÙˆÙŠØ± Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„Ø·Ù„Ø§Ø¨ ÙˆØ§Ù„ÙˆØµÙˆÙ„ Ø¨Ù‡Ù… Ø§Ù„ÙŠ Ø§Ø¹Ù„Ù‰ Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ù†Ø¬Ø§Ø­ØŒ ÙƒÙ…Ø§ Ø§Ù†Ù‡Ø§ ØªÙ…ØªÙ„Ùƒ Ù…ÙˆÙ‚Ø¹ Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ ÙÙŠ Ù‚Ù„Ø¨ Ø§Ù„Ø¹Ø§ØµÙ…Ø© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© ØªØ¨Ù„ÙŠØ³ÙŠ.',
      'Ø­ÙŠØ« ØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¹Ù„Ù‰ Ù…Ù†Ø§Ù‡Ø¬ ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…Ø¨ØªÙƒØ±Ø© ÙˆÙ…Ø±Ù†Ø© ØªØªÙ…Ø§Ø´Ù‰ Ù…Ø¹ Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¹Ø§Ù„ÙŠ Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠ ÙˆØªØ¹Ù…Ù„ Ø¹Ù„Ù‰ Ø¥Ø¹Ø¯Ø§Ø¯ Ø®Ø±ÙŠØ¬ÙŠÙ† Ù…Ø¤Ù‡Ù„ÙŠÙ† ØªØ£Ù‡ÙŠÙ„ Ø¹Ø§Ù„ÙŠ Ù„Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ.',
    ],
    specialties: [
      'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ',
      'Ø·Ø¨ Ø§Ù„Ø§Ø³Ù†Ø§Ù†',
      'Ø§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø§Ù„ÙŠØ© (FinTech)',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ (MBA)',
      'ÙƒÙ„ÙŠØ© Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨ Ø£Ùˆ Ø§Ù„Ù‡Ù†Ø¯Ø³Ø©',
      'ÙƒÙ„ÙŠØ© Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„ØµØ­ÙŠØ© Ø£Ùˆ Ø§Ù„ØªÙ…Ø±ÙŠØ¶',
      'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø£Ùˆ ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª',
      'ÙƒÙ„ÙŠØ© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙˆØ§Ù„Ø§Ù‚ØªØµØ§Ø¯',
    ],
    advantages: [
      'ØªØ¹Ù„ÙŠÙ… Ø¹Ø§Ù„ÙŠ Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆÙ…Ø¹ØªØ±Ù Ø¨Ù‡ Ø¯ÙˆÙ„ÙŠÙ‹Ù‹Ø§.',
      'Ù…Ù†Ø§Ù‡Ø¬ ØªØ¯Ø±Ø³ÙŠØ© Ø­Ø¯ÙŠØ«Ø© ØªØªØ¶Ù…Ù† Ø§Ù„Ù…Ø±Ù†Ø© ÙˆÙ…ÙˆØ§ÙƒØ¨Ø© Ø§Ù„ØªØ·ÙˆØ±.',
      'Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¯Ø§Ø¹Ù…Ø© ÙˆÙ…ÙˆØ§ÙƒØ¨Ø© Ù„Ø§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ù† Ø®Ù„Ø§Ù„ Ø§Ù„ØªÙ…Ø«ÙŠÙ„ Ø§Ù„Ø±Ø³Ù…ÙŠ Ù„Ø´Ø±ÙƒØ© The Way Ø¨ÙŠØ§Ø¨ØªØ§Ù‹ Ø¹Ù†Ùƒ.',
      'Ø¨Ø±Ø§Ù…Ø¬ ØªØ¨Ø§Ø¯Ù„ Ø·Ù„Ø§Ø¨ÙŠ Ù…Ø¹ Ø¬Ø§Ù…Ø¹Ø§Øª Ø¯ÙˆÙ„ÙŠØ© Ù…Ø®ØªÙ„ÙØ©.',
      'Ø¨Ø±Ø§Ù…Ø¬ Ø¯Ø±Ø§Ø³ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.',
    ],
    admissionRequirements: [
      'Ø§Ø¬ØªÙŠØ§Ø² Ù…Ù‚Ø§Ø¨Ù„Ø© Ø¹Ø¨Ø± Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª.',
      'Ø§Ø®ØªØ¨Ø§Ø± ØªØ­Ø¯ÙŠØ¯ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙˆØªØ¹ÙÙ‰ ÙÙŠ Ø­Ø§Ù„ ÙˆØ¬ÙˆØ¯ Ø´Ù‡Ø§Ø¯Ø© ØªØ«Ø¨Øª Ù…Ø³Ø¤Ø§Ùƒ Ø§Ù„Ù„ØºÙˆÙŠ.',
      'Ø¬ÙˆØ§Ø² Ø§Ù„Ø³ÙØ±.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'Ù„Ù…Ù† Ù‡Ù… Ø¯ÙˆÙ† 18 Ø¹Ø§Ù… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ± Ø¬ÙˆØ§Ø²Ø§Øª Ø³ÙØ± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†.',
    ],
    programSections: [
      {
        title: 'Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø§Ù„Ø·Ø¨', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '5500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
          { program: 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', duration: '5 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
          { program: 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© Ù„Ù„Ø£Ø¹Ù…Ø§Ù„', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙˆØ§Ù„ØªÙ‚Ù†ÙŠØ§Øª Ø§Ù„Ø±Ù‚Ù…ÙŠØ©', duration: '3 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
          { program: 'Ø§Ù„ØªÙ…Ø±ÙŠØ¶', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
          { program: 'Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ ÙˆØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3900 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ø§' },
        ],
      },
      {
        title: 'Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: 'Ø¹Ø§Ù…ÙŠÙ†', fee: '7700 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', duration: 'Ø¹Ø§Ù…', fee: '3900 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: 'Ø¹Ø§Ù…ÙŠÙ†', fee: '7700 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø§Ù„ÙŠØ©', duration: 'Ø¹Ø§Ù…ÙŠÙ†', fee: '7700 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ ÙˆØ¹Ù„ÙˆÙ… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª', duration: 'Ø¹Ø§Ù…ÙŠÙ†', fee: '7900 Ø¯ÙˆÙ„Ø§Ø±' },
        ],
      },
      {
        title: 'Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡',
        rows: [
          { program: 'Ø§Ù„Ø·Ø¨', duration: '6 Ø§Ø¹ÙˆØ§Ù…', fee: '5900 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ù‹Ø§' },
          { program: 'Ø¯ÙƒØªÙˆØ±Ø§Ù‡ ÙÙŠ Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', duration: '5 Ø§Ø¹ÙˆØ§Ù…', fee: '4900 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠÙ‹Ù‹Ø§' },
        ],
      },
    ],
    whyTheWay: [
      'ÙƒÙ„ Ø®Ø·ÙˆØ© ØªØªÙ… Ø¨ÙˆØ¶ÙˆØ­ ÙˆÙ…ØµØ¯Ø§Ù‚ÙŠØ© ÙˆØ¨Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© Ø¨Ø¯ÙˆÙ† Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ©.',
      'Ø£Ø³Ø¹Ø§Ø± Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ù…ÙƒÙ†Ø© Ø¨Ø¬ÙˆØ¯Ø© Ø¹Ø§Ù„ÙŠØ©.',
      'Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…ØªØ®ØµØµØ© Ù†Ø³Ø§Ø¹Ø¯Ùƒ ÙÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ®ØµØµ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨.',
      'ØªØ¬Ù‡ÙŠØ² Ø¬Ù…ÙŠØ¹ Ø£ÙˆØ±Ø§Ù‚Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø¨Ø³Ù‡ÙˆÙ„Ø© ÙˆØ³Ø±Ø¹Ø©.',
      'ÙØ±ÙŠÙ‚ Ø¯Ø¹Ù… Ù…ØªÙ…ÙŠØ² ÙŠÙƒÙˆÙ† Ù…Ø¹Ùƒ Ù…Ù†Ø° Ù„Ø­Ø¸Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… ÙˆØ­ØªÙ‰ Ø§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø± ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ù…Ø³ØªÙ…Ø± ÙÙŠ ÙƒÙ„ Ø§Ù„Ù…Ø±Ø§Ø­Ù„ Ø¯Ø±Ø§Ø³ÙŠØ©.',
      'Ù†ÙˆÙØ± Ù„Ùƒ Ø§Ø®ØªÙŠØ§Ø±Ø§Øª Ø³ÙƒÙ†ÙŠØ© Ø¢Ù…Ù†Ø© ÙˆÙ…Ø¬Ù‡Ø²Ø© Ø¨ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª Ø¬Ø¯ÙŠØ¯ Ø£Ùˆ Ù…Ù‚ÙŠÙ… Ø¨Ø§Ù„ÙØ¹Ù„ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
    ],
    registrationSteps: [
      'Ø§Ù„ØªØ¹Ø§Ù‚Ø¯ ÙŠØªÙ… ØªØ±Ø¬Ù…Ø© Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª ÙˆØªÙˆØ«ÙŠÙ‚Ù‡Ø§ Ø±Ø³Ù…ÙŠÙ‹Ø§ Ø®Ù„Ø§Ù„ Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø© Ù…Ù† Ù‚Ø¨Ù„ ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'Ø§ØµØ¯Ø§Ø± Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦Ù‰ Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø®Ù„Ø§Ù„ 48 Ø³Ø§Ø¹Ø©.',
      'Ø§ØµØ¯Ø§Ø± Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© Ø®Ù„Ø§Ù„ 7 Ø³Ø§Ø¹Ø§Øª.',
      'Ù‚Ø±Ø§Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ø±Ø³Ù…ÙŠ Ø¨Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø¹Ù„Ù‰ Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ø§Ù„Ø¨ Ø®Ù„Ø§Ù„ 5 Ø§ÙŠØ§Ù… Ù…Ù† Ø§Ù„Ø¹Ù…Ù„.',
      'Ø§ØµØ¯Ø§Ø± ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø¯ÙØ¹ ÙÙŠ Ø­Ø§Ù„Ø© Ø±ØºØ¨ Ø§Ù„Ø·Ø§Ù„Ø¨ ÙÙŠ Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªØ§Ø´ÙŠØ±Ø© Ø¯Ø±Ø§Ø³ÙŠØ© Ø®Ù„Ø§Ù„ 5 Ø§ÙŠØ§Ù… Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯Ø± Ø§Ù„Ø±Ø³ÙˆÙ….',
    ],
    faq: [
      { q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ÙˆØ·Ù†ÙŠØ© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ØŸ', a: 'Ù†Ø¹Ù…ØŒ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ÙˆØ·Ù†ÙŠØ© Georgian National University (SEU) Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø±Ø³Ù…ÙŠÙ‹Ø§ Ù…Ù† ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØªØ­Ø¸Ù‰ Ø¨Ø´Ù‡Ø§Ø¯Ø§ØªÙ‡Ø§ Ø¨Ø§Ù„Ø§Ø¹ØªØ±Ø§Ù ÙÙŠ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø¯ÙˆÙ„ØŒ ÙƒÙ…Ø§ Ø£Ù†Ù‡Ø§ Ù…Ø¯Ø±Ø¬Ø© Ø¶Ù…Ù† Ù‚ÙˆØ§Ø¦Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø¨Ø¹Ø¶ Ø§Ù„Ø¯ÙˆÙ„ Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„Ø£Ø¬Ù†Ø¨ÙŠØ©.' },
      { q: 'Ù…Ø§ Ù‡ÙŠ Ø£ÙØ¶Ù„ Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ØªØ­ØªÙˆÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ù…ÙŠØ²Ø© Ù…Ø«Ù„: Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ÙˆØ·Ù†ÙŠØ© (SEU)ØŒ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (CIU)ØŒ Ø¬Ø§Ù…Ø¹Ø© Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ØªÙ‚Ù†ÙŠØ© (GTU)ØŒ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø³ÙˆØ¯ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (IBSU) Ø§Ù„ØªÙŠ ØªØ¹ØªØ¨Ø± Ù…Ù† Ø£ÙØ¶Ù„ ÙˆØ£Ø¹Ø±Ù‚ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù„Ù…Ø§ ØªØªÙ…ØªØ¹ Ø¨Ù‡ Ù…Ù† Ø³Ù…Ø¹Ø© Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù‚ÙˆÙŠØ© ÙˆØ¨Ø±Ø§Ù…Ø¬ Ø¯Ø±Ø§Ø³ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø©.' },
      { q: 'Ù‡Ù„ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ†ØŸ', a: 'Ù†Ø¹Ù…ØŒ Ø¬ÙˆØ±Ø¬ÙŠØ§ ØªØ¹Ø¯ ÙˆØ¬Ù‡Ø© Ù…Ø«Ø§Ù„ÙŠØ© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ø¨ÙØ¶Ù„ Ø¬Ø§Ù…Ø¹Ø§ØªÙ‡Ø§ Ø§Ù„Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¹Ø§Ù„Ù…ÙŠÙ‹Ø§ ÙˆØ§Ù†Ø®ÙØ§Ø¶ ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ù…Ø¹ÙŠØ´Ø© ÙˆØ§Ù„Ø¯Ø±Ø§Ø³Ø© Ù…Ù‚Ø§Ø±Ù†Ø© Ø¨Ø¯ÙˆÙ„ Ø£ÙˆØ±ÙˆØ¨Ø§ØŒ Ø¥Ø¶Ø§ÙØ© Ø¥Ù„Ù‰ ØªÙˆÙØ± Ø¨Ø±Ø§Ù…Ø¬ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙˆØªÙ†ÙˆØ¹ Ø«Ù‚Ø§ÙÙŠ ÙŠØ¬Ø¹Ù„ Ø§Ù„Ø¨ÙŠØ¦Ø© Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ© Ù…Ø±ÙŠØ­Ø© ÙˆØ¢Ù…Ù†Ø©.' },
      { q: 'Ù‡Ù„ ÙŠÙ…ÙƒÙ† Ø§Ù„Ø¹Ù…Ù„ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ÙŠØ³Ù…Ø­ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø¨Ø§Ù„Ø¹Ù…Ù„ Ø¨Ø¯ÙˆØ§Ù… Ø¬Ø²Ø¦ÙŠ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙˆÙ„ÙƒÙ† ÙŠÙØ¶Ù„ Ø§Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ù†ÙˆØ¹ Ø§Ù„ØªØ£Ø´ÙŠØ±Ø© ÙˆØ´Ø±ÙˆØ· Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©ØŒ ÙƒÙ…Ø§ ÙŠÙ†ØµØ­ Ø¨ØªÙ†Ø¸ÙŠÙ… Ø§Ù„ÙˆÙ‚Øª Ø¬ÙŠØ¯Ù‹Ø§ Ø¨ÙŠÙ† Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙˆØ§Ù„Ø¹Ù…Ù„.' },
    ],
    nameEn: 'Georgian National University (SEU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Georgian National University (SEU) strives to provide a prestigious, internationally recognized academic environment by focusing on developing students\' skills and guiding them to the highest levels of success. It is strategically located in the heart of the Georgian capital, Tbilisi.',
      'The university relies on innovative and flexible curricula aligned with European higher education standards, preparing highly qualified graduates for the global job market.',
    ],
    specialtiesEn: ['Human Medicine', 'Dentistry', 'Financial Technology (FinTech)', 'Business Administration (MBA)', 'Computer Science & Engineering', 'Health Sciences & Nursing', 'Business Administration & IT', 'Business Administration & Economics'],
    advantagesEn: [
      'High-quality education with international recognition.',
      'Modern, flexible curricula that keep pace with developments.',
      'Supportive learning environment aligned with job market needs.',
      'Personal support through The Way\'s official representation on your behalf.',
      'Student exchange programs with various international universities.',
      'Diverse study programs taught in English.',
    ],
    admissionRequirementsEn: [
      'Pass an online interview.',
      'English language proficiency test (waived if you have a certificate proving your language level).',
      'Passport.',
      'High school certificate.',
      'Personal photo.',
      'Email address.',
      'If under 18: birth certificate and copies of parents\' passports.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs',
        rows: [
          { program: 'Medicine', duration: '6 years', fee: '$5,500/year' },
          { program: 'Dentistry', duration: '5 years', fee: '$5,000/year' },
          { program: 'Business Administration', duration: '3 years', fee: '$3,500/year' },
          { program: 'International Business Management', duration: '3 years', fee: '$3,500/year' },
          { program: 'Business Administration & Digital Technologies', duration: '3 years', fee: '$3,500/year' },
          { program: 'Nursing', duration: '4 years', fee: '$3,500/year' },
          { program: 'Artificial Intelligence & Information Technology', duration: '4 years', fee: '$3,900/year' },
        ],
      },
      {
        title: 'Master\'s Programs',
        rows: [
          { program: 'Business Administration', duration: '2 years', fee: '$7,700' },
          { program: 'Executive Business Administration', duration: '1 year', fee: '$3,900' },
          { program: 'Business Analytics', duration: '2 years', fee: '$7,700' },
          { program: 'Financial Technology', duration: '2 years', fee: '$7,700' },
          { program: 'Artificial Intelligence & Data Science', duration: '2 years', fee: '$7,900' },
        ],
      },
      {
        title: 'Doctoral Programs',
        rows: [
          { program: 'Medicine', duration: '6 years', fee: '$5,900/year' },
          { program: 'Dentistry', duration: '5 years', fee: '$4,900/year' },
        ],
      },
    ],
    whyTheWayEn: [
      'Full transparency in every step with no hidden fees.',
      'Affordable prices for the best possible services with high quality.',
      'Specialized academic consultations to help you choose the right major.',
      'Easy and fast preparation of all your academic documents.',
      'An outstanding support team with you from application to settling in Georgia.',
      'Continuous personal support throughout all academic stages.',
      'Safe and fully equipped housing options whether you are new or already residing in Georgia.',
    ],
    registrationStepsEn: [
      'Document translation, notarization, and submission to the university within 72 hours.',
      'Preliminary acceptance letter issued within 48 hours.',
      'Ministry approval within 7 hours.',
      'Official ministry order for student registration within 5 working days.',
      'Tuition invoice issued within 5 days after fee payment if the student needs a study visa.',
    ],
    faqEn: [
      { q: 'Is Georgian National University accredited?', a: 'Yes, Georgian National University (SEU) is officially accredited by Georgia\'s Ministry of Education and its degrees are recognized in many countries. It is also listed among accredited universities in several Arab and international countries.' },
      { q: 'What is the best university in Georgia?', a: 'Georgia has many distinguished universities such as: Georgian National University (SEU), Caucasus International University (CIU), Georgian Technical University (GTU), and International Black Sea University (IBSU), which are among the best and most established universities in Georgia with strong academic reputations and diverse study programs.' },
      { q: 'Is studying in Georgia suitable for international students?', a: 'Yes, Georgia is an ideal destination for international students thanks to its internationally recognized universities, low cost of living and tuition compared to European countries, English-taught programs, and cultural diversity that makes the learning environment comfortable and safe.' },
      { q: 'Can students work while studying in Georgia?', a: 'International students in Georgia are allowed to work part-time while studying, but it is advisable to verify your visa type and university conditions. It is also recommended to manage your time well between studies and work.' },
    ],
  },
  {
    id: 'ciu',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (CIU)',
    imageUrl: ciuPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: '1 Paata Saakadze St, Tbilisi, Georgia',
    website: 'https://ciu.edu.ge',
    description: [
      'Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© (Caucasus International University (CIU Ù…Ù† Ø§ÙƒØ¨Ø± Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¹Ø§Ù„ÙŠ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø­ÙŠØ« ØªÙ‚ÙˆÙ… Ø¹Ù„Ù‰ Ù‚ÙŠÙ… ÙˆØ·Ù†ÙŠØ© Ø±Ø§Ø³Ø®Ø© ÙˆØ±ÙˆØ­ Ø§Ù„ØªØºÙŠÙŠØ± ÙˆØ§Ù„ØªØ·ÙˆÙŠØ± Ø§Ù„Ù…Ø³ØªÙ…Ø± ÙˆØ§Ù„ØªÙŠ ØªÙ‚Ø¹ ÙÙŠ Ø§Ù„Ø¹Ø§ØµÙ…Ø© ØªØ¨Ù„ÙŠØ³ÙŠ.',
      'ØªÙ‡Ø¯Ù Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¥Ù„Ù‰ Ø¥Ø¹Ø¯Ø§Ø¯ ÙƒÙˆØ§Ø¯Ø± Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙˆÙ…Ù‡Ù†ÙŠØ© Ø¹Ù„Ù‰ Ø¯Ø±Ø¬Ø© Ø¹Ø§Ù„ÙŠØ© Ù…Ù† Ø§Ù„ÙƒÙØ§Ø¡Ø© ÙˆÙ‚Ø§Ø¯Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø§Ù†Ø¯Ù…Ø§Ø¬ Ø§Ù„ÙØ¹Ø§Ù„ ÙÙŠ Ø§Ù„Ø£Ø³ÙˆØ§Ù‚ Ø§Ù„Ù…Ø­Ù„ÙŠØ© ÙˆØ§Ù„Ø¯ÙˆÙ„ÙŠØ©ØŒ ÙƒÙ…Ø§ ØªÙˆÙ„ÙŠ CIU Ø£Ù‡Ù…ÙŠØ© ÙƒØ¨Ø±Ù‰ Ù„Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ….',
      'ØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ù…Ø³ÙŠØ±ØªÙ‡Ø§ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ù„Ù‰ Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ø¹Ù„Ù…ÙŠ ÙˆØ§Ù„Ø§Ø¨ØªÙƒØ§Ø± ÙˆØ¥Ø¯Ø§Ø±Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø´ÙØ§ÙÙŠØ© ÙˆØ§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ¨ÙØ¶Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù†Ù‡Ø¬ Ø£ØµØ¨Ø­Øª Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ù…Ø¤Ù‡Ù„Ø© Ø¨ÙƒÙ„ Ø¬Ø¯Ø§Ø±Ø© Ù„Ù„Ù…Ù†Ø§ÙØ³Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªÙˆÙŠÙŠÙ† Ø§Ù„ÙˆØ·Ù†ÙŠ ÙˆØ§Ù„Ø¹Ø§Ù„Ù…ÙŠ.',
    ],
    specialties: ['Ø§Ù„Ø·Ø¨', 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', 'ÙƒÙ„ÙŠØ© Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', 'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø©', 'ÙƒÙ„ÙŠØ© Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø³ÙŠØ§Ø³ÙŠØ© Ø£Ùˆ Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©'],
    advantages: [
      'Ø¨Ø±Ø§Ù…Ø¬ Ø¯Ø±Ø§Ø³ÙŠØ© Ù…ØªØ¹Ø¯Ø¯Ø© Ø§Ù„Ù„ØºØ§Øª Ø­ÙŠØ« ÙŠØªÙ… Ø¯Ø±Ø§Ø³Ø© Ø¨Ø«Ù„Ø§Ø« Ù„ØºØ§Øª Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© ÙˆØ§Ù„Ø±ÙˆØ³ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.',
      'ØªØ´ØªÙ‡Ø± CIU Ø¨Ù‚ÙˆØ© Ø§Ù„ØªØ®ØµØµØ§Øª Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ù…ØªÙ…ÙŠØ²Ø© Ø³ÙˆØ§Ø¡ Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ Ø£Ùˆ Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù† Ø£Ùˆ Ø§Ù„ØµÙŠØ¯Ù„Ø© ØªØ¯Ø±Ø³ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.',
      'ØªÙˆÙØ± Ù„Ùƒ Ø§Ù„ÙƒØ«ÙŠØ± Ù…Ù† Ø§Ù„ØªØ¯Ø±ÙŠØ¨Ø§Øª Ø§Ù„Ø¹Ù…Ù„ÙŠØ© ÙÙŠ Ø§Ù„Ù…Ø®ØªØ¨Ø±Ø§Øª Ø§Ù„Ù…Ø¬Ù‡Ø²Ø© Ø¨Ø£Ø­Ø¯Ø« Ø§Ù„ØªÙ‚Ù†ÙŠØ§Øª Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© Ø§Ù„Ø­Ø¯ÙŠØ«Ø©.',
      'ØªØ¶Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù…ÙƒØªØ¨Ø© Ø­Ø¯ÙŠØ«Ø© ÙˆØ§Ø³ØªÙˆØ¯ÙŠÙˆÙ‡Ø§Øª ØªÙ„ÙØ²ÙŠÙˆÙ†ÙŠØ© ÙˆØ¥Ø°Ø§Ø¹ÙŠØ© ÙˆÙ…Ø±ÙƒØ² ÙˆØ³Ø§Ø¦Ø· Ù…ØªØ¹Ø¯Ø¯Ø©.',
      'ØªØ­ØªÙˆÙŠ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¹Ù„Ù‰ Ù…Ø®ØªØ¨Ø±Ø§Øª Ø¨Ø­Ø«ÙŠØ© Ù…ØªØ®ØµØµØ© ÙÙŠ Ø§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø¹ØµØ¨ÙŠØ© ÙˆØ§Ù„ÙƒÙŠÙ…ÙŠØ§Ø¡ Ø§Ù„Ø­ÙŠÙˆÙŠØ© ÙˆØ§Ù„ØªØ´Ø±ÙŠØ­ ÙˆØ¹ÙŠØ§Ø¯Ø§Øª ØªØ¯Ø±ÙŠØ¨ÙŠØ© Ù„Ø·Ù„Ø¨Ø© Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†.',
      'ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ù…Ø±Ø§ÙƒØ² ØªØ¯Ø±ÙŠØ¨ ÙˆÙ…Ø­Ø§ÙƒØ§Ø© ÙˆØ§Ù‚Ø¹ÙŠØ© ÙˆÙ…Ø®ØªØ¨Ø±Ø§Øª Ù„Ù„Ù†Ù…Ø°Ø¬Ø© Ø§Ù„Ø¬ÙŠÙˆØ³ÙŠØ§Ø³ÙŠØ© ÙˆØºØ±Ù Ù„Ø­Ù„ Ø§Ù„Ù†Ø²Ø§Ø¹Ø§Øª ÙˆØ§Ù„ØªØ·ÙˆÙŠØ± Ø§Ù„Ù…Ù‡Ù†ÙŠ.',
      'ÙŠÙˆØ¬Ø¯ Ø¨Ù‡Ø§ Ù…Ø±Ø§ÙÙ‚ Ø¨Ø­Ø«ÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø© ÙÙŠ Ù…Ø¬Ø§Ù„ ØµÙ†Ø§Ø¹Ø© Ø§Ù„Ù†Ø¨ÙŠØ° ÙˆØ²Ø±Ø§Ø¹Ø© Ø§Ù„Ø¹Ù†Ø¨.',
      'Ø¨Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø© Ù…Ø¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠØ© ØªØ¹Ø¯ Ø±Ø³ÙˆÙ… Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ CIU Ù…Ø¹Ù‚ÙˆÙ„Ø©.',
      'ØªØ­Ø¸Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø§Ø¹ØªØ±Ø§Ù ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø¯ÙˆÙ„ÙŠ Ù…Ù† Ø¹Ø¯Ø© Ù‡ÙŠØ¦Ø§Øª ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…Ù…Ø§ ÙŠØ³Ù‡Ù„ Ø¹Ù„Ù‰ Ø®Ø±ÙŠØ¬ÙŠÙ‡Ø§ Ø§Ù„Ø¹Ù…Ù„ ÙÙŠ Ø§Ù„Ø®Ø§Ø±Ø¬ Ø£Ùˆ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¯Ø±Ø§Ø³Ø§Øª Ø§Ù„Ø¹Ù„ÙŠØ§ ÙÙŠ Ø¬Ø§Ù…Ø¹Ø§Øª Ø¹Ø§Ù„Ù…ÙŠØ©.',
    ],
    admissionRequirements: [
      'Ù„Ù„Ø£ÙˆØ±Ø§Ù‚ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©: Ø¬ÙˆØ§Ø² Ø§Ù„Ø³ÙØ±.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ©.',
      'Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.',
      'Ø¥Ø°Ø§ ÙƒÙ†Øª ØªØ­Øª Ø³Ù† 18 Ø¹Ø§Ù… ÙŠÙ…ÙƒÙ†Ùƒ ØªÙ‚Ø¯ÙŠÙ… Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ù…ÙŠÙ„Ø§Ø¯ ÙˆØµÙˆØ± Ø¬ÙˆØ§Ø²Ø§Øª Ø³ÙØ± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '6,000 Ø¯ÙˆÙ„Ø§Ø± Ø£Ù…Ø±ÙŠÙƒÙŠ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†', duration: '5 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø£Ù…Ø±ÙŠÙƒÙŠ Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3,500 Ø¯ÙˆÙ„Ø§Ø± Ø£Ù…Ø±ÙŠÙƒÙŠ Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [{ program: 'Ø¯Ø±Ø§Ø³Ø§Øª Ø§Ù„Ø³ÙŠØ§Ø³Ø© ÙˆØ§Ù„Ø£Ù…Ù† Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '3000 Ø¯ÙˆÙ„Ø§Ø± Ø§Ù…Ø±ÙŠÙƒÙŠ Ø³Ù†ÙˆÙŠØ§Ù‹' }],
      },
    ],
    whyTheWay: [
      'Ø§Ù†Ø¹Ø¯Ø§Ù… Ø§Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø®ÙÙŠØ© Ù„Ø§Ù†Ù†Ø§ Ù†Ø¤Ù…Ù† Ø¨Ø§Ù„Ø´ÙØ§ÙÙŠØ© Ø§Ù„ØªØ§Ù…Ø© ÙÙŠ ÙƒÙ„ Ø®Ø·ÙˆØ© Ù†Ù‚ÙˆÙ… Ø¨Ù‡Ø§ Ù„Ø¹Ù…Ù„Ø§Ø¦Ù†Ø§.',
      'Ø®Ø¯Ù…Ø§Øª Ø§Ø³ØªØ«Ù†Ø§Ø¦ÙŠØ© Ø¨Ø£ÙØ¶Ù„ ØªÙƒÙ„ÙØ© Ù…Ù…ÙƒÙ†Ø©.',
      'Ù…Ù…Ø«Ù„ ÙŠØ³Ø§Ø¹Ø¯Ùƒ Ù…Ø¨Ø§Ø´Ø±Ø© ÙÙŠ Ø¥ØªÙ…Ø§Ù… Ù‚Ø¨ÙˆÙ„Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ.',
      'Ù†Ø³Ø§Ø¹Ø¯Ùƒ ÙÙŠ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØªØ®ØµØµ ÙˆØªØ¬Ù‡ÙŠØ² Ø§Ù„Ù…Ù„ÙØ§Øª ÙˆØ§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ Ø¨ÙØ¶Ù„ Ø®Ø¨Ø±ØªÙ†Ø§ Ø§Ù„ÙƒØ¨ÙŠØ±Ø©.',
      'Ø¯Ø¹Ù… Ù…Ø³ØªÙ…Ø± ÙˆÙ…Ø¹Ùƒ ÙÙŠ ÙƒÙ„ Ù…Ø±Ø­Ù„Ø© Ù…Ù† Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… ÙˆØ­ØªÙ‰ Ø§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø± Ø¨Ø§Ù„Ø®Ø§Ø±Ø¬.',
      'ØªÙˆÙÙŠØ± Ø§Ù…Ø§ÙƒÙ† Ù„Ù„Ø³ÙƒÙ† ØªØªÙˆÙØ± Ø¨Ù‡Ø§ Ø¬Ù…ÙŠØ¹ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ø®Ù„Ø§Ù„ ÙØªØ±Ø© Ø§Ù‚Ø§Ù…ØªÙƒ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© ÙˆØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø©.',
      'Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø®Ù„Ø§Ù„ 10 Ø£ÙŠØ§Ù….',
      'Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ù…Ù† Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù….',
      'Ø¥ØµØ¯Ø§Ø± Ø£Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù….',
      'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø®Ù„Ø§Ù„ 48 Ø³Ø§Ø¹Ø© Ø¨Ø¹Ø¯ Ø§Ù„Ø¯ÙØ¹.',
    ],
    faq: [
      { q: 'Ù‡Ù„ ÙŠÙ…ÙƒÙ† Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø¨Ø¯ÙˆÙ† Ø´Ù‡Ø§Ø¯Ø© Ù„ØºØ© Ù…Ø«Ù„ IELTS Ø£Ùˆ TOEFLØŸ', a: 'Ù†Ø¹Ù…ØŒ Ù‡Ù†Ø§Ùƒ Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù…Ø«Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© CIU Ù„Ø§ ØªØ´ØªØ±Ø· ÙˆØ¬ÙˆØ¯ Ø´Ù‡Ø§Ø¯Ø© Ù„ØºØ© Ø¯ÙˆÙ„ÙŠØ© IELTS Ø£Ùˆ TOEFL Ù„Ù„Ù‚Ø¨ÙˆÙ„ ÙˆØ®Ø§ØµØ© Ø¥Ø°Ø§ ÙƒÙ†Øª ØªØ±ÙŠØ¯ Ø§Ù„Ø¯Ø±Ø³Ø© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø­ÙŠØ« ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø¬ØªÙŠØ§Ø² Ù…Ù‚Ø§Ø¨Ù„Ø© ØªØ­Ø¯ÙŠØ¯ Ù…Ø³ØªÙˆÙ‰ Ø£Ùˆ ØªÙ‚Ø¯ÙŠÙ… Ù…Ø§ ÙŠØ«Ø¨Øª Ø¯Ø±Ø§Ø³ØªÙƒ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.' },
      { q: 'Ù‡Ù„ Ø§Ù„Ø´Ù‡Ø§Ø¯Ø© Ù…Ù† Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© CIU Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠÙ‹Ø§ØŸ', a: 'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ ÙÙŠ ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©ØŒ ÙƒÙ…Ø§ Ø£Ù†Ù‡Ø§ Ù…Ø³Ø¬Ù„Ø© ÙÙŠ Ù‚ÙˆØ§Ø¹Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø¯ÙˆÙ„ÙŠØ© Ù…Ø«Ù„ WHO FAIMER ÙˆØ¹Ø¶Ùˆ ÙÙŠ Ø¹Ø¯Ø¯ Ù…Ù† Ø§Ù„Ø§ØªØ­Ø§Ø¯Ø§Øª Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ø§Ù„Ø£ÙˆØ±ÙˆØ¨ÙŠØ© Ù…Ø§ ÙŠØ³Ù‡Ù„ Ù…Ø¹Ø§Ø¯Ù„Ø© Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª ÙˆØ§Ù„Ø¹Ù…Ù„ ÙÙŠ Ø¹Ø¯Ø© Ø¯ÙˆÙ„ Ø¨Ø¹Ø¯ Ø§Ù„ØªØ®Ø±Ø¬.' },
      { q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù‚ÙˆÙ‚Ø§Ø² Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© CIU Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø·Ø¨ ÙˆØ·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†ØŸ', a: 'ØªØ¹ØªØ¨Ø± Ø¬Ø§Ù…Ø¹Ø© CIU Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø±Ø§Ø¦Ø¯Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙÙŠ ØªØ¯Ø±ÙŠØ³ Ø§Ù„ØªØ®ØµØµØ§Øª Ø§Ù„Ø·Ø¨ÙŠØ© Ø­ÙŠØ« ØªÙˆÙØ± Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø­Ø¯ÙŠØ«Ø© ØªØ´Ù…Ù„: Ù…Ø®ØªØ¨Ø±Ø§Øª Ù…ØªÙ‚Ø¯Ù…Ø©ØŒ ØºØ±Ù ØªØ´Ø±ÙŠØ­ØŒ Ù…Ø±Ø§ÙƒØ² Ø¨Ø­Ø« Ø¹Ù„Ù…ÙŠ ØªØ¯Ø¹Ù… Ø§Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø¹Ù…Ù„ÙŠ Ù…Ù…Ø§ ÙŠØ¬Ø¹Ù„Ù‡Ø§ ÙˆØ¬Ù‡Ø© Ù…Ø«Ø§Ù„ÙŠØ© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø±Ø§ØºØ¨ÙŠÙ† ÙÙŠ Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø·Ø¨ ÙˆØ·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù†.' },
    ],
    nameEn: 'Caucasus International University (CIU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Caucasus International University (CIU) is one of the largest higher education institutions in Georgia, built on strong national values and a spirit of continuous change and development, located in the capital Tbilisi.',
      'The university aims to prepare highly competent academic and professional graduates capable of effective integration into local and international markets. CIU places great importance on education quality.',
      'The university relies on scientific research, innovation, and educational management built on transparency and quality standards. Thanks to this approach, CIU has become fully qualified to compete at both national and international levels.',
    ],
    specialtiesEn: ['Medicine', 'Dentistry', 'Computer Science', 'Engineering', 'Political Science & International Relations'],
    advantagesEn: [
      'Multilingual study programs taught in Georgian, Russian, and English.',
      'CIU is renowned for its distinguished medical specializations — medicine, dentistry, and pharmacy — taught in English.',
      'Extensive practical training in laboratories equipped with the latest modern technologies.',
      'The university has a modern library, TV and radio studios, and a multimedia center.',
      'Specialized research labs in neuroscience, biochemistry, anatomy, and training clinics for dental students.',
      'Simulation training centers, geopolitical modeling labs, conflict resolution rooms, and professional development facilities.',
      'Advanced research facilities in wine production and grape cultivation.',
      'Compared to European universities, CIU\'s tuition fees are very reasonable.',
      'The university holds international accreditation from several educational bodies, making it easy for graduates to work abroad or pursue postgraduate studies at international universities.',
    ],
    admissionRequirementsEn: [
      'Passport.',
      'High school certificate.',
      'Personal photo.',
      'Email address.',
      'If under 18: birth certificate and copies of parents\' passports.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs',
        rows: [
          { program: 'Human Medicine', duration: '6 years', fee: '$6,000/year' },
          { program: 'Dentistry', duration: '5 years', fee: '$5,000/year' },
          { program: 'Information Technology', duration: '4 years', fee: '$3,500/year' },
        ],
      },
      {
        title: 'Master\'s Programs',
        rows: [{ program: 'Global Politics & Security Studies', duration: '2 years', fee: '$3,000/year' }],
      },
    ],
    whyTheWayEn: [
      'No hidden fees — we believe in full transparency in every step we take for our clients.',
      'Exceptional services at the best possible cost.',
      'A dedicated representative who helps you directly with your academic admission.',
      'We help you choose your major, prepare your documents, and secure university admission with our extensive expertise.',
      'Continuous support with you at every stage from application to settling abroad.',
      'Fully equipped housing options with everything you need during your stay in Georgia.',
    ],
    registrationStepsEn: [
      'Document translation and notarization within 72 hours.',
      'University entrance exams within 10 days.',
      'Ministry acceptance within 7 days.',
      'Ministry order issued within 5 days.',
      'Invoice sent within 48 hours after payment.',
    ],
    faqEn: [
      { q: 'Can I study in Georgia without an IELTS or TOEFL certificate?', a: 'Yes, many universities in Georgia such as CIU do not require an international language certificate (IELTS or TOEFL) for admission, especially if you want to study in English. You can pass a placement interview or provide proof of previous English-language education.' },
      { q: 'Is the CIU degree internationally recognized?', a: 'Caucasus International University is recognized by Georgia\'s Ministry of Education and registered in international databases such as WHO FAIMER. It is a member of several European academic unions, making it easy to validate degrees and work in multiple countries after graduation.' },
      { q: 'Is CIU suitable for studying medicine and dentistry?', a: 'CIU is considered one of the leading universities in Georgia for teaching medical specializations. It provides a modern educational environment including advanced labs, anatomy rooms, and research centers supporting practical training, making it an ideal destination for students wishing to study medicine and dentistry.' },
    ],
  },
  {
    id: 'ilia',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© (ISU)',
    imageUrl: iliaPhotoUrl,
    city: 'ØªØ¨Ù„ÙŠØ³ÙŠ',
    address: 'N, 32 Ilia Chavchavadze Avenue, Tbilisi, Georgia',
    website: 'https://iliauni.edu.ge/en',
    description: [
      'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© ÙˆØ§Ø­Ø¯Ø© Ù…Ù† Ø£Ø¨Ø±Ø² Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ§Ù„ØªÙŠ ØªØ£Ø³Ø³Øª ÙÙŠ Ø¹Ø§Ù… 2006 Ù†ØªÙŠØ¬Ø© Ø¯Ù…Ø¬ Ø³Øª Ù…Ø¤Ø³Ø³Ø§Øª Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…Ø±Ù…ÙˆÙ‚Ø© ÙˆØ§Ø®ØªØ§Ø±Øª Ù…Ù† ØªÙ‚Ø¹ Ø§Ù„Ø¹Ø§ØµÙ…Ø© ØªØ¨Ù„ÙŠØ³ÙŠ Ù…Ù‚Ø±Ø§Ù‹ Ù„Ù‡Ø§ØŒ ÙˆØªÙˆÙØ± Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© ØªÙØ§Ø¹Ù„ÙŠØ© ØªØ´Ø¬Ø¹ Ø¹Ù„Ù‰ Ø§Ù„ØªØ¹Ù„Ù… Ø§Ù„ØªØ¹Ø§ÙˆÙ†ÙŠ ÙˆØªØ·ÙˆÙŠØ± Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙˆØ§Ù„Ø´Ø®ØµÙŠØ© Ù„Ø£ÙƒØ«Ø± Ù…Ù† 30,000 Ø·Ø§Ù„Ø¨.',
      'ÙˆØªØ¹Ø±Ù Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø¨ÙƒÙˆÙ†Ù‡Ø§ Ù…Ø¤Ø³Ø³Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙˆØ¨Ø­Ø«ÙŠØ© Ø´Ø§Ù…Ù„Ø© ØªØ±ÙƒØ² Ø¹Ù„Ù‰ Ø§Ù„ØªÙ‚Ø¯Ù… Ø§Ù„Ø¹Ù„Ù…ÙŠ ÙˆÙ†Ù‚Ù„ Ø§Ù„Ù…Ø¹Ø±ÙØ© Ø¨Ù…Ø§ ÙŠØ®Ø¯Ù… Ø§Ù„ØªÙ†Ù…ÙŠØ© Ø§Ù„Ù…Ø¬ØªÙ…Ø¹ÙŠØ©ØŒ ÙˆØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© ÙÙŠ Ø±Ø¤ÙŠØªÙ‡Ø§ Ø¹Ù„Ù‰ Ø«Ù„Ø§Ø« Ø±ÙƒØ§Ø¦Ø² Ø£Ø³Ø§Ø³ÙŠØ© ÙˆÙ‡ÙŠ ØªØªÙ…Ø«Ù„ ÙÙŠ (Ø¯Ù…Ø¬ Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ù…Ø¹ Ø§Ù„Ø¨Ø­Ø«ØŒ Ø§Ù„ØªÙˆØ§Ø²Ù† Ø¨ÙŠÙ† Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù…ØªØ®ØµØµ ÙˆØ§Ù„Ù„ÙŠØ¨Ø±Ø§Ù„ÙŠØŒ ÙˆØ§Ù„Ø±Ø¨Ø· Ø¨ÙŠÙ† Ø§Ù„Ø¨Ø¹Ø¯ Ø§Ù„Ù…Ø­Ù„ÙŠ ÙˆØ§Ù„Ø¹Ø§Ù„Ù…ÙŠ).',
    ],
    specialties: [
      'Ø§Ù„Ø·Ø¨',
      'Ø§Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø¹Ù…Ø§Ù„',
      'Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø­Ø§Ø³ÙˆØ¨',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…Ø¯Ù†ÙŠØ©',
      'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨',
      'Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© ÙˆØ§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©',
    ],
    advantages: [
      'ØªØ­Ø¸Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø§Ø¹ØªØ±Ø§Ù Ø¯ÙˆÙ„ÙŠ ÙˆØªØ­ØªÙ„ Ø§Ù„Ù…Ø±ØªØ¨Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰ Ø¨ÙŠÙ† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©.',
      'ØªØµÙ†Ù Ø¶Ù…Ù† Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª ÙÙŠ Ø§Ù„Ù…Ù†Ø·Ù‚Ø© Ù…Ù† Ø­ÙŠØ« Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ø¨Ø­Ø« Ø§Ù„Ø¹Ù„Ù…ÙŠ.',
      'ØªÙ†ÙˆØ¹ Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙˆØ§Ù„ØªØ®ØµØµØ§Øª ÙÙŠ Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ ÙˆØ§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±.',
      'ØªÙˆÙØ± Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø¨ÙŠØ¦Ø© Ù…Ø±ÙŠØ­Ø© ÙˆØ¢Ù…Ù†Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ†.',
      'ØªØªÙ…ØªØ¹ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø¹Ù„Ø§Ù‚Ø§Øª ØªØ¹Ø§ÙˆÙ† Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ø¹ Ø¬Ø§Ù…Ø¹Ø§Øª ÙˆÙ…Ø¤Ø³Ø³Ø§Øª Ø¨Ø­Ø«ÙŠØ© ÙÙŠ Ø£ÙˆØ±ÙˆØ¨Ø§ ÙˆØ£Ù…Ø±ÙŠÙƒØ§ ÙˆØ¢Ø³ÙŠØ§ØŒ ÙƒÙ…Ø§ ØªÙˆÙØ± Ø¨Ø±Ø§Ù…Ø¬ ØªØ¨Ø§Ø¯Ù„ Ø·Ù„Ø§Ø¨ÙŠ ÙˆÙØ±Øµ Ù„Ù„ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠ.',
      'ØªÙ‡ØªÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¨Ø§Ù„Ø¨Ø­Ø« Ø§Ù„Ø¹Ù„Ù…ÙŠ ÙˆØªÙˆÙØ± Ø¨ÙŠØ¦Ø© ØªØ´Ø¬Ø¹ Ø¹Ù„Ù‰ Ø§Ù„Ø§Ø¨ØªÙƒØ§Ø± ÙˆØ§Ù„ØªÙÙƒÙŠØ± Ø§Ù„Ù†Ù‚Ø¯ÙŠ Ù„ØªÙ…Ù†Ø­ Ø§Ù„Ø·Ù„Ø§Ø¨ ÙØ±ØµØ© ØªØ·ÙˆÙŠØ± Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„Ø¹Ù„Ù…ÙŠØ© ÙˆØ§Ù„Ù…Ù‡Ù†ÙŠØ©.',
    ],
    admissionRequirements: [
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø³Ø§Ø±ÙŠ Ø§Ù„Ù…ÙØ¹ÙˆÙ„.',
      'Ù†Ø³Ø®Ø© Ù…Ù† Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø© Ø£Ùˆ Ø¯Ø¨Ù„ÙˆÙ… Ø¯Ø±Ø¬Ø© Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ù„Ù„Ù…ØªÙ‚Ø¯Ù…ÙŠÙ† Ù„Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¯Ø±Ø¬Ø© Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø§Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ø·Ø§Ù„Ø¨.',
      'ÙÙŠ Ø­Ø§Ù„ ÙƒØ§Ù† Ø¹Ù…Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£Ù‚Ù„ Ù…Ù† 18 Ø¹Ø§Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„ØªØ§Ù„ÙŠØ© Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª (Ø´Ù‡Ø§Ø¯Ø© Ù…ÙŠÙ„Ø§Ø¯ Ø§Ù„Ø·Ø§Ù„Ø¨ØŒ ØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ù…ØŒ ØµÙˆØ±Ø© Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ø¨).',
      'Ø¥ÙŠØµØ§Ù„ Ø¯ÙØ¹ Ø±Ø³ÙˆÙ… Ø§Ù„Ø·Ù„Ø¨.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ© Ù„Ù„Ø·Ø§Ù„Ø¨.',
      'Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© (Ù„Ø§ ÙŠØ·Ù„Ø¨ ÙÙŠ Ø­Ø§Ù„ ÙˆØ¬ÙˆØ¯ Ø´Ù‡Ø§Ø¯Ø© ØªÙˆÙÙ„ TOEFL Ø£Ùˆ Ø¢ÙŠÙ„ØªØ³ IELTS Ø£Ùˆ Ø¥Ø°Ø§ ÙƒØ§Ù† Ø§Ù„Ø·Ø§Ù„Ø¨ Ø®Ø±ÙŠØ¬ Ù…Ø¯Ø±Ø³Ø© Ø£Ù…Ø±ÙŠÙƒÙŠØ© (IG)).',
      'Ø§Ø®ØªØ¨Ø§Ø± Ø¨Ø³ÙŠØ· ÙÙŠ Ø§Ù„ÙƒÙŠÙ…ÙŠØ§Ø¡ ÙˆØ§Ù„Ø£Ø­ÙŠØ§Ø¡.',
      'Ù…Ù‚Ø§Ø¨Ù„Ø© Ø´Ø®ØµÙŠØ© Ø¹Ø¨Ø± Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª.',
    ],
    programSections: [
      {
        title: 'Ø§Ù„Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³',
        rows: [
          { program: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ø·Ø¨ Ø¨Ø´Ø±ÙŠ', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '6200 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ø§Ø¯Ø§Ø±Ø© Ø§Ø¹Ù…Ø§Ù„', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„ÙƒÙ‡Ø±Ø¨Ø§Ø¦ÙŠØ© ÙˆØ§Ù„Ø§Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '5000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ù‡Ù†Ø¯Ø³Ø© Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¨ÙƒØ§Ù„ÙˆØ±ÙŠÙˆØ³ Ø§Ù„Ù‡Ù†Ø¯Ø³Ø© Ø§Ù„Ù…Ø¯Ù†ÙŠØ©', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
      {
        title: 'Ø§Ù„Ù…Ø§Ø¬Ø³ØªÙŠØ±',
        rows: [
          { program: 'Ù…Ø§Ø¬Ø³ØªÙŠØ± ÙÙŠ Ø¹Ù„Ù… Ø§Ù„ÙˆØ±Ø§Ø«Ø© Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '3200 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù…Ø§Ø¬Ø³ØªÙŠØ± ÙÙŠ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '4000 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ù…Ø§Ø¬Ø³ØªÙŠØ± ÙÙŠ Ø§Ù„ØµØ­Ø© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆØ§Ù„Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„ØµØ­ÙŠØ©', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '3200 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„ØºÙ„Ø§Ù Ø§Ù„Ø¬ÙˆÙŠ ÙˆØ§Ù„ÙØ¶Ø§Ø¡ Ø§Ù„Ù‚Ø±ÙŠØ¨', duration: 'Ø³Ù†ØªÙŠÙ†', fee: '3200 Ø¯ÙˆÙ„Ø§Ø± Ø³Ù†ÙˆÙŠØ§Ù‹' },
        ],
      },
    ],
    whyTheWay: [
      'Ø§Ù„ØªÙ…Ø«ÙŠÙ„ Ø§Ù„Ø±Ø³Ù…ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª.',
      'ØªÙ‚Ø¯ÙŠÙ… Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ Ø®ØµÙŠØµÙ‹Ø§ Ù„Ùƒ.',
      'Ø§Ù„Ø´ÙØ§ÙÙŠØ© Ø§Ù„ØªØ§Ù…Ø© ÙÙ„Ø§ ØªÙˆØ¬Ø¯ Ù„Ø¯ÙŠÙ†Ø§ Ø£ÙŠ Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ©ØŒ ÙˆÙƒÙ„ Ø®Ø¯Ù…Ø§ØªÙ†Ø§ ØªÙ‚Ø¯Ù… Ø¨ÙƒÙ„ ÙˆØ¶ÙˆØ­ ÙˆÙ…ØµØ¯Ø§Ù‚ÙŠØ©.',
      'Ù†ØªÙ…ÙŠØ² Ø¨Ø£Ø³Ø¹Ø§Ø± Ù„Ø§ ØªÙ‚Ø¨Ù„ Ø§Ù„Ù…Ù†Ø§ÙØ³Ø© ÙˆØ¥Ø±Ø´Ø§Ø¯Ø§Øª ÙŠÙ‚Ø¯Ù…Ù‡Ø§ Ø®Ø¨Ø±Ø§Ø¤Ù†Ø§ Ø¨Ø£Ø³Ø¹Ø§Ø± Ù…Ø¹Ù‚ÙˆÙ„Ø© Ù„Ø¶Ù…Ø§Ù† ØªØ¬Ø±Ø¨Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø³Ù„Ø³Ø© ÙˆØ®Ø§Ù„ÙŠØ© Ù…Ù† Ø§Ù„ØªÙˆØªØ±.',
      'Ù…Ø³ØªØ´Ø§Ø±ÙˆÙ†Ø§ Ø§Ù„Ø®Ø¨Ø±Ø§Ø¡ Ù…Ù„ØªØ²Ù…ÙˆÙ† Ø¨Ù…Ø±Ø§ÙÙ‚ØªÙƒ Ø®Ø·ÙˆØ© Ø¨Ø®Ø·ÙˆØ© ÙÙŠ ÙƒÙ„ Ù…Ø±Ø­Ù„Ø© Ù…Ù† Ø±Ø­Ù„ØªÙƒ Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù„Ù†ÙƒÙˆÙ† Ø´Ø±ÙƒØ§Ø¡ Ø­Ù‚ÙŠÙ‚ÙŠÙŠÙ† ÙÙŠ Ø¨Ù†Ø§Ø¡ Ù…Ø³ØªÙ‚Ø¨Ù„Ùƒ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ.',
    ],
    registrationSteps: [
      'ØªØ±Ø¬Ù…Ø© Ø¬Ù…ÙŠØ¹ Ø§ÙˆØ±Ø§Ù‚Ùƒ Ø§Ù„Ø±Ø³Ù…ÙŠØ© ÙˆØªÙˆØ«ÙŠÙ‚Ù‡Ø§ Ù…Ù† ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø© ÙÙ‚Ø· Ù…Ù† ØªÙˆÙ‚ÙŠØ¹ Ø§Ù„Ø¹Ù‚Ø¯.',
      'ØªÙ†Ø³ÙŠÙ‚ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© Ø§Ù„Ù„Ø§Ø²Ù…Ø© ÙˆØ§Ø³ØªØ®Ø±Ø§Ø¬ Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ Ø®Ù„Ø§Ù„ 10 Ø£ÙŠØ§Ù….',
      'Ø§Ø³ØªÙ„Ø§Ù… Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù… Ù…Ù† Ø§Ù„Ù‚Ø¨ÙˆÙ„.',
      'Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø£Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ Ù„ØªØ³ØªØ¹Ø¯ Ø¨Ø´ÙƒÙ„ Ø±Ø³Ù…ÙŠ Ù„Ù„Ø§Ù„ØªØ­Ø§Ù‚ Ø¨Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'ÙÙŠ Ø­Ø§Ù„ Ø§Ù„Ø­Ø§Ø¬Ø© Ø¥Ù„Ù‰ ØªØ£Ø´ÙŠØ±Ø© Ø·Ø§Ù„Ø¨ Ù†Ù‚ÙˆÙ… Ø¨Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„ ÙÙ‚Ø· Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯ Ø±Ø³ÙˆÙ… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù„ØªØ¨Ø¯Ø£ Ø¨Ø¹Ø¯Ù‡Ø§ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„ØªØ£Ø´ÙŠØ±Ø© Ø¨Ø³Ù„Ø§Ø³Ø©.',
    ],
    faq: [
      { q: 'Ù‡Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¹Ø§Ù„Ù…ÙŠØ§Ù‹ØŸ', a: 'Ù†Ø¹Ù…ØŒ ØªØ­Ø¸Ù‰ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø¨Ø§Ø¹ØªØ±Ø§Ù Ø¯ÙˆÙ„ÙŠ ÙˆØªØ­ØªÙ„ Ø§Ù„Ù…Ø±ØªØ¨Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰ Ø¨ÙŠÙ† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© ÙˆÙÙ‚ ØªØµÙ†ÙŠÙØ§Øª Times Higher Education (THE) ÙˆScimago RankingsØŒ ÙˆØªØ¶Ù… Ø§Ù„Ø¹Ø¯ÙŠØ¯ Ù…Ù† Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ø¯Ø±Ø§Ø³ÙŠØ© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ø¹Ø§Ù„Ù…ÙŠÙ‹Ø§.' },
      { q: 'Ù…Ø§ Ù‡Ùˆ ØªØµÙ†ÙŠÙ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©ØŸ', a: 'ØªÙ‚Ø¯Ù…Øª Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ø¨Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆØ­Ù‚Ù‚Øª Ø§Ù„Ù…Ø±ØªØ¨Ø© 601 Ø¶Ù…Ù† Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© Ø­Ø³Ø¨ Ø£Ù‡Ù… Ø§Ù„ØªØµÙ†ÙŠÙØ§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© Ø¹Ù„Ù‰ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¹Ø§Ù„Ù….' },
      { q: 'Ù‡Ù„ ÙŠÙ†ØµØ­ Ø¨Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ÙŠÙ†ØµØ­ Ø¨Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¹Ø±Ø¨ ÙˆØ§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ø§Ù„Ø°ÙŠÙ† ÙŠØ¨Ø­Ø«ÙˆÙ† Ø¹Ù† ØªØ¹Ù„ÙŠÙ… Ø¹Ø§Ù„ÙŠ Ø§Ù„Ø¬ÙˆØ¯Ø© Ø¨ØªÙƒØ§Ù„ÙŠÙ Ù…Ø¹Ù‚ÙˆÙ„Ø©ØŒ Ø­ÙŠØ« ØªÙ…ØªØ§Ø² Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ© Ù…Ø«Ù„ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ø¨Ø¨Ø±Ø§Ù…Ø¬ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠÙ‹Ø§ØŒ ÙƒÙ…Ø§ ØªÙˆÙØ± Ø¨ÙŠØ¦Ø© Ø¢Ù…Ù†Ø© ÙˆÙ…ØªÙ†ÙˆØ¹Ø© Ø«Ù‚Ø§ÙÙŠØ§ Ù„ØªØµØ¨Ø­ Ø®ÙŠØ§Ø± Ù…Ù…ØªØ§Ø² Ù„Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ©.' },
      { q: 'Ù…Ø§ Ù‡ÙŠ Ù„ØºØ© Ø§Ù„ØªØ¯Ø±ÙŠØ³ ÙÙŠ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ØªØ¹ØªÙ…Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø¥ÙŠÙ„ÙŠØ§ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ø¹Ù„Ù‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© ÙƒÙ„ØºØ© ØªØ¯Ø±ÙŠØ³ Ø£Ø³Ø§Ø³ÙŠØ© ÙÙŠ Ø¨Ø±Ø§Ù…Ø¬Ù‡Ø§ ÙˆØ®ØµÙˆØµÙ‹Ø§ Ø§Ù„Ø¨Ø±Ø§Ù…Ø¬ Ø§Ù„Ù…ÙˆØ¬Ù‡Ø© Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ù…Ù…Ø§ ÙŠØ³Ù‡Ù„ Ø¹Ù„Ù‰ Ø§Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø£Ø¬Ø§Ù†Ø¨ Ù…ØªØ§Ø¨Ø¹Ø© Ø¯Ø±Ø§Ø³ØªÙ‡Ù… Ø¯ÙˆÙ† Ø§Ù„Ø­Ø§Ø¬Ø© Ù„ØªØ¹Ù„Ù… Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠØ©.' },
    ],
    nameEn: 'Ilia State University (ISU)',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Ilia State University is one of the most prominent universities in Georgia, established in 2006 through the merger of six distinguished academic institutions. Located in the capital Tbilisi, it provides an interactive learning environment that encourages collaborative learning and development of academic and personal skills for over 30,000 students.',
      'Ilia State University is known as a comprehensive educational and research institution focused on scientific advancement and knowledge transfer for community development. The university\'s vision rests on three pillars: integrating education with research, balancing specialized and liberal education, and connecting local and global dimensions.',
    ],
    specialtiesEn: ['Medicine', 'Business Administration', 'Computer Engineering', 'Civil Engineering', 'Computer Science', 'Electrical & Electronic Engineering'],
    advantagesEn: [
      'Internationally recognized, ranking first among Georgian universities.',
      'Ranked among the best universities in the region for education quality and scientific research.',
      'Diverse academic programs and specializations at bachelor\'s and master\'s levels.',
      'Ilia State University provides a comfortable and safe environment for international students.',
      'Academic collaboration with universities and research institutions in Europe, America, and Asia, with student exchange programs and international training opportunities.',
      'Strong emphasis on scientific research with an environment that encourages innovation and critical thinking, giving students the opportunity to develop scientific and professional skills.',
    ],
    admissionRequirementsEn: [
      'Valid student passport.',
      'Copy of high school certificate or bachelor\'s degree diploma for master\'s applicants.',
      'Student\'s email address.',
      'If under 18: additional documents required (birth certificate, copy of mother\'s passport, copy of father\'s passport).',
      'Application fee payment receipt.',
      'Personal photo.',
      'English language test (waived with TOEFL, IELTS, or if the student graduated from an American school (IG)).',
      'Simple chemistry and biology test.',
      'Online personal interview.',
    ],
    programSectionsEn: [
      {
        title: 'Bachelor\'s Programs',
        rows: [
          { program: 'Human Medicine', duration: '6 years', fee: '$6,200/year' },
          { program: 'Business Administration', duration: '4 years', fee: '$3,500/year' },
          { program: 'Electrical & Electronic Engineering', duration: '4 years', fee: '$4,000/year' },
          { program: 'Computer Engineering', duration: '4 years', fee: '$5,000/year' },
          { program: 'Computer Science', duration: '4 years', fee: '$4,500/year' },
          { program: 'Civil Engineering', duration: '4 years', fee: '$4,000/year' },
        ],
      },
      {
        title: 'Master\'s Programs',
        rows: [
          { program: 'Applied Genetics', duration: '2 years', fee: '$3,200/year' },
          { program: 'Business Administration', duration: '2 years', fee: '$4,000/year' },
          { program: 'Public Health & Health Policy', duration: '2 years', fee: '$3,200/year' },
          { program: 'Atmospheric & Near-Space Sciences', duration: '2 years', fee: '$3,200/year' },
        ],
      },
    ],
    whyTheWayEn: [
      'Direct official representation for the best universities.',
      'Personalized support tailored to you.',
      'Full transparency with no hidden fees — all our services are offered with clarity and credibility.',
      'Unbeatable prices and expert guidance at reasonable rates for a smooth, stress-free educational experience.',
      'Our expert consultants are committed to accompanying you step by step through every stage of your educational journey, as true partners in building your academic future.',
    ],
    registrationStepsEn: [
      'Translation of all official documents, notarization, and submission directly to the accredited university within 72 hours of signing the contract.',
      'Coordination of required university exams and issuance of preliminary acceptance letter within 10 days.',
      'Receipt of official ministry approval within 7 days of acceptance.',
      'Issuance of the final ministry order within 5 working days to officially prepare for university enrollment.',
      'If a student visa is needed, the official invoice is sent within 5 working days after university fee payment to begin the visa process smoothly.',
    ],
    faqEn: [
      { q: 'Is Ilia State University internationally recognized?', a: 'Yes, Ilia State University holds international recognition and ranks first among Georgian universities according to Times Higher Education (THE) and Scimago Rankings, with many internationally accredited study programs.' },
      { q: 'What is Ilia State University\'s ranking?', a: 'Ilia State University has achieved rank 601 among the world\'s best universities according to the most important global university rankings.' },
      { q: 'Is studying in Georgia recommended?', a: 'Studying in Georgia is recommended for Arab and international students seeking high-quality education at reasonable costs. Georgian universities like Ilia State University offer internationally recognized academic programs and provide a safe, culturally diverse environment, making it an excellent choice for university education.' },
      { q: 'What is the language of instruction at Ilia State University?', a: 'Ilia State University uses English as the primary language of instruction, especially in programs designed for international students, making it easy for foreign students to continue their studies without needing to learn Georgian.' },
    ],
  },
  {
    id: 'alte',
    name: 'Ø¬Ø§Ù…Ø¹Ø© Ø£Ù„ØªÙŠ',
    imageUrl: altePhotoUrl,
    description: [
      'ØªØ¹Ø¯ Ø¬Ø§Ù…Ø¹Ø© Ø£Ù„ØªÙŠ Ù…Ø¤Ø³Ø³Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…Ø¹ØªÙ…Ø¯Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ø­ÙŠØ« ØªØªÙ…ØªØ¹ Ø¨Ø®Ø¨Ø±Ø© ØªÙ…ØªØ¯ Ù„Ø£ÙƒØ«Ø± Ù…Ù† 23 Ø¹Ø§Ù…Ø§ ÙÙŠ Ù‚Ø·Ø§Ø¹ Ø§Ù„ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¬ÙˆØ±Ø¬ÙŠ Ùˆ ØªØ¶Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ù†Ø­Ùˆ 2500 Ø·Ø§Ù„Ø¨ Ù…Ù† 45 Ø¯ÙˆÙ„Ø© Ù…Ø®ØªÙ„ÙØ© Ù…ÙˆØ²Ø¹ÙŠÙ† Ø¹Ù„Ù‰ Ø£Ø±Ø¨Ø¹ ÙƒÙ„ÙŠØ§Øª Ø±Ø¦ÙŠØ³ÙŠØ© Ù…Ø«Ù„ ÙƒÙ„ÙŠØ© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙˆÙƒÙ„ÙŠØ© Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ùˆ ÙƒÙ„ÙŠØ© Ø§Ù„Ø­Ù‚ÙˆÙ‚ ÙˆØ§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ© ÙˆÙƒÙ„ÙŠØ© ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª.',
      'ÙƒÙ…Ø§ ØªØ¹Ø²Ø² Ø¬Ø§Ù…Ø¹Ø© Ø£Ù„ØªÙŠ Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¯ÙŠÙ†Ø§Ù…ÙŠÙƒÙŠØ© ÙˆØ°Ù„Ùƒ Ù…Ù† Ø®Ù„Ø§Ù„ Ø£Ø³Ø§Ù„ÙŠØ¨ ØªØ¯Ø±ÙŠØ³ Ø­Ø¯ÙŠØ«Ø© ÙˆØªÙ‚Ù†ÙŠØ§Øª Ù…ØªØ·ÙˆØ±Ø© Ù…Ù…Ø§ ÙŠØªÙŠØ­ Ù„Ù„Ø·Ù„Ø¨Ø© ØªØ¬Ø§ÙˆØ² Ø­Ø¯ÙˆØ¯ Ø¥Ù…ÙƒØ§Ù†Ø§ØªÙ‡Ù… ÙˆÙ…Ù† Ø®Ù„Ø§Ù„ Ø§Ù„Ø¨Ø­Ø« Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ÙŠ ÙˆØ§Ù„Ø§Ø¨ØªÙƒØ§Ø± ÙˆØ§Ù„ØªØ¹Ø§ÙˆÙ† Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ ØªØ³Ø¹Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© Ø¥Ù„Ù‰ ØªØ¹Ø²ÙŠØ² Ø§Ù„ØªÙØ§Ù‡Ù… Ø¨ÙŠÙ† Ø§Ù„Ø«Ù‚Ø§ÙØ§Øª ÙˆÙ‚ÙŠØ§Ø¯Ø© Ø§Ù„ØªØºÙŠÙŠØ± Ø§Ù„Ù…Ø¬ØªÙ…Ø¹ÙŠ Ø§Ù„Ø¥ÙŠØ¬Ø§Ø¨ÙŠ.',
    ],
    specialties: ['ÙƒÙ„ÙŠØ© Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„', 'ÙƒÙ„ÙŠØ© Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠØ©', 'ÙƒÙ„ÙŠØ© Ø§Ù„Ø­Ù‚ÙˆÙ‚ ÙˆØ§Ù„Ø¹Ù„ÙˆÙ… Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ©', 'ÙƒÙ„ÙŠØ© ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª'],
    advantages: [
      'Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø¬ÙˆØ¯Ø© Ø¨Ø¨Ø±Ø§Ù…Ø¬ Ù…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠØ§ ÙˆØ¨Ù†ÙŠØ© ØªØ­ØªÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø© ØªØ´Ù…Ù„ Ù…Ø®ØªØ¨Ø±Ø§Øª Ø­Ø¯ÙŠØ«Ø© ÙˆÙ‚Ø§Ø¹Ø§Øª ØªØ¯Ø±ÙŠØ³ Ù…Ø¬Ù‡Ø²Ø© Ø¨Ø£Ø­Ø¯Ø« Ø§Ù„ÙˆØ³Ø§Ø¦Ù„ Ø§Ù„ØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ©.',
      'Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø§Ù„Ø¯ÙˆÙ„ÙŠÙŠÙ† Ù…Ø¹ Ø®Ø¯Ù…Ø§Øª Ø¯Ø¹Ù… Ù„ØºÙˆÙŠ ÙˆØ£ÙƒØ§Ø¯ÙŠÙ…ÙŠ ØªØ³Ø§Ø¹Ø¯Ù‡Ù… Ø¹Ù„Ù‰ Ø§Ù„ØªÙƒÙŠÙ ÙˆØ§Ù„Ù†Ø¬Ø§Ø­ ÙÙŠ Ø­ÙŠØ§ØªÙ‡Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ©.',
      'ØªÙƒØ§Ù„ÙŠÙ Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ù„Ø¯Ø±Ø§Ø³Ø© ÙˆØ§Ù„Ù…Ø¹ÙŠØ´Ø©.',
      'Ù…ÙˆÙ‚Ø¹ Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ ÙˆØ³Ù‡ÙˆÙ„Ø© Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ ØªØ¨Ù„ÙŠØ³ÙŠ.',
      'Ø¨ÙŠØ¦Ø© Ø«Ù‚Ø§ÙÙŠØ© ØºÙ†ÙŠØ© ÙÙŠ ØªØ¨Ù„ÙŠØ³ÙŠ.',
      'Ø£Ù†Ø´Ø·Ø© ØªØ±ÙÙŠÙ‡ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø©.',
      'Ù…Ø³ØªÙˆÙ‰ Ø£Ù…Ø§Ù† Ø¹Ø§Ù„ÙŠ.',
      'ØªØ®ØµØµØ§Øª ÙˆØ¨Ø±Ø§Ù…Ø¬ Ù…ØªÙ†ÙˆØ¹Ø© ÙÙŠ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙˆØ§Ù„Ø·Ø¨ ÙˆØ§Ù„Ù‚Ø§Ù†ÙˆÙ† ÙˆØªÙƒÙ†ÙˆÙ„ÙˆØ¬ÙŠØ§ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª.',
      'Ø³Ù‡ÙˆÙ„Ø© Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ù‚Ø¨ÙˆÙ„.',
    ],
    admissionRequirements: [
      'Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø·Ø§Ù„Ø¨ ÙŠÙƒÙˆÙ† Ø³Ø§Ø±ÙŠ Ø§Ù„Ù…ÙØ¹ÙˆÙ„.',
      'ØµÙˆØ±Ø© Ø´Ø®ØµÙŠØ© Ø­Ø¯ÙŠØ«Ø©.',
      'Ø´Ù‡Ø§Ø¯Ø© Ø§Ù„Ø«Ø§Ù†ÙˆÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø©.',
      'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø§Ù„Ø´Ø®ØµÙŠ Ù„Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø±Ø³Ù…ÙŠ.',
      'ÙÙŠ Ø­Ø§Ù„ ÙƒØ§Ù† Ø¹Ù…Ø± Ø§Ù„Ø·Ø§Ù„Ø¨ Ø£Ù‚Ù„ Ù…Ù† 18 Ø¹Ø§Ù…Ø§ ÙŠØ¬Ø¨ ØªÙ‚Ø¯ÙŠÙ…: Ø´Ù‡Ø§Ø¯Ø© Ù…ÙŠÙ„Ø§Ø¯ Ø§Ù„Ø·Ø§Ù„Ø¨ØŒ ØµÙˆØ±Ø© Ù…Ù† Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ù…ØŒ ØµÙˆØ±Ø© Ù…Ù† Ø¬ÙˆØ§Ø² Ø³ÙØ± Ø§Ù„Ø£Ø¨.',
      'ÙŠØ·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø·Ø§Ù„Ø¨ ØªÙ‚Ø¯ÙŠÙ… ÙÙŠØ¯ÙŠÙˆ ØªØ¹Ø±ÙŠÙÙŠ Ù‚ØµÙŠØ± ØªØªØ±Ø§ÙˆØ­ Ù…Ø¯ØªÙ‡ Ø¨ÙŠÙ† 80 Ø¥Ù„Ù‰ 120 Ø«Ø§Ù†ÙŠØ© (Ø¥Ø¸Ù‡Ø§Ø± Ø¬ÙˆØ§Ø² Ø§Ù„Ø³ÙØ± Ø¯Ø§Ø®Ù„ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ ÙˆØ§Ù„ØªØ­Ø¯Ø« Ø¹Ù† Ø³Ø¨Ø¨ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ø¯Ø±Ø§Ø³Ø© ÙˆØ§Ù„ØªØ®ØµØµ).',
    ],
    programSections: [
      {
        title: 'Ø§Ù„ØªØ®ØµØµØ§Øª ÙˆØ§Ù„Ø±Ø³ÙˆÙ… Ø§Ù„Ø³Ù†ÙˆÙŠØ©',
        rows: [
          { program: 'Ø§Ù„Ø·Ø¨ Ø§Ù„Ø¨Ø´Ø±ÙŠ Medicine', duration: '6 Ø³Ù†ÙˆØ§Øª', fee: '5500 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø·Ø¨ Ø§Ù„Ø£Ø³Ù†Ø§Ù† Dentistry', duration: '5 Ø³Ù†ÙˆØ§Øª', fee: '4500 Ø¯ÙˆÙ„Ø§Ø±' },
          { program: 'Ø¹Ù„ÙˆÙ… Ø§Ù„Ø­Ø§Ø³ÙˆØ¨ Computer Science', duration: '4 Ø³Ù†ÙˆØ§Øª', fee: '3500 Ø¯ÙˆÙ„Ø§Ø±' },
        ],
      },
    ],
    whyTheWay: [
      'ØªÙ…Ø«ÙŠÙ„ Ø±Ø³Ù…ÙŠ ÙˆÙ…Ø¨Ø§Ø´Ø± Ù„Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
      'Ø¯Ø¹Ù… Ø´Ø®ØµÙŠ ÙˆÙ…Ø®ØµØµ Ù„ÙƒÙ„ Ø·Ø§Ù„Ø¨ Ø­Ø³Ø¨ Ø§Ø­ØªÙŠØ§Ø¬Ø§ØªÙ‡ Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙˆØ§Ù„Ù…Ø¹ÙŠØ´ÙŠØ©.',
      'Ø´ÙØ§ÙÙŠØ© ØªØ§Ù…Ø© Ø¯ÙˆÙ† Ø£ÙŠ Ø±Ø³ÙˆÙ… Ø®ÙÙŠØ©.',
      'Ø£Ø³Ø¹Ø§Ø± ØªÙ†Ø§ÙØ³ÙŠØ© ÙˆØ¥Ø±Ø´Ø§Ø¯ Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠ Ù…Ù† Ø®Ø¨Ø±Ø§Ø¡.',
      'Ù…Ø±Ø§ÙÙ‚Ø© Ù…Ø³ØªÙ…Ø±Ø© Ù…Ù† Ù…Ø³ØªØ´Ø§Ø±ÙŠÙ†Ø§ Ø§Ù„Ù…ØªØ®ØµØµÙŠÙ† ÙÙŠ ÙƒÙ„ Ø®Ø·ÙˆØ© Ù…Ù† Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… ÙˆØ­ØªÙ‰ Ø§Ù„Ø§Ø³ØªÙ‚Ø±Ø§Ø± ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§.',
    ],
    registrationSteps: [
      'Ø®Ù„Ø§Ù„ 72 Ø³Ø§Ø¹Ø© Ù…Ù† Ø§Ù„ØªØ¹Ø§Ù‚Ø¯: Ù†Ù‚ÙˆÙ… Ø¨ØªØ±Ø¬Ù…Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£ÙˆØ±Ø§Ù‚ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© ÙˆØªÙˆØ«ÙŠÙ‚Ù‡Ø§ Ù…Ù† Ù‚Ø¨Ù„ ÙƒØ§ØªØ¨ Ø§Ù„Ø¹Ø¯Ù„ ÙˆØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'Ø®Ù„Ø§Ù„ 4 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„: ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø®Ø·Ø§Ø¨ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ Ù…Ù† Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.',
      'Ø®Ù„Ø§Ù„ 7 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„: Ù†Ø­ØµÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„ÙˆØ²Ø§Ø±ÙŠØ© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ù„Ø·Ø§Ù„Ø¨.',
      'Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„: ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø£Ù…Ø± Ø§Ù„ÙˆØ²Ø§Ø±ÙŠ Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„ØªØ³Ø¬ÙŠÙ„.',
      'Ø®Ù„Ø§Ù„ 5 Ø£ÙŠØ§Ù… Ø¹Ù…Ù„: ÙŠØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ© Ø¨Ø¹Ø¯ Ø³Ø¯Ø§Ø¯ Ø§Ù„Ø±Ø³ÙˆÙ… ÙˆØ°Ù„Ùƒ ÙÙŠ Ø­Ø§Ù„ ÙƒØ§Ù† Ø§Ù„Ø·Ø§Ù„Ø¨ Ø¨Ø­Ø§Ø¬Ø© Ø¥Ù„Ù‰ ØªØ£Ø´ÙŠØ±Ø© Ø¯Ø±Ø§Ø³ÙŠØ©.',
    ],
    faq: [
      { q: 'Ù…Ø§ Ù‡Ùˆ ØªØµÙ†ÙŠÙ Ø¬Ø§Ù…Ø¹Ø© Ø£Ù„ØªÙŠ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'Ø¬Ø§Ù…Ø¹Ø© Ø£Ù„ØªÙŠ ØªØ£Ø³Ø³Øª Ø¹Ø§Ù… 2002 ÙÙŠ ØªØ¨Ù„ÙŠØ³ÙŠ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ ÙˆÙ…Ø¹ØªØ±Ù Ø¨Ù‡Ø§ Ø¯ÙˆÙ„ÙŠØ§ ÙˆØªØ­ØªÙ„ Ù…Ø±Ø§ÙƒØ² Ù…ØªÙ‚Ø¯Ù…Ø© ÙÙŠ Ø§Ù„ØªØµÙ†ÙŠÙØ§Øª Ø§Ù„ÙˆØ·Ù†ÙŠØ© ÙˆØ§Ù„Ø¹Ø§Ù„Ù…ÙŠØ©.' },
      { q: 'Ù‡Ù„ ÙŠÙ…ÙƒÙ† Ù„Ù„Ø·Ø§Ù„Ø¨ Ø§Ù„Ø¹Ù…Ù„ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ØŸ', a: 'ÙŠÙ…Ù†Ø­ Ù‚Ø§Ù†ÙˆÙ† Ø§Ù„Ø¹Ù…Ù„ ÙÙŠ Ø¬ÙˆØ±Ø¬ÙŠØ§ Ø§Ù„ÙØ±ØµØ© Ù„Ù„Ø·Ù„Ø§Ø¨ ÙˆØ§Ù„Ø£Ø¬Ø§Ù†Ø¨ Ù„Ù„Ø¹Ù…Ù„ Ù‚Ø§Ù†ÙˆÙ†ÙŠØ§ Ø¶Ù…Ù† Ø¥Ø·Ø§Ø± Ø§Ù„Ø£Ù†Ø¸Ù…Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© ÙÙŠ Ø§Ù„Ø¨Ù„Ø§Ø¯.' },
    ],
    nameEn: 'Alte University',
    cityEn: 'Tbilisi',
    descriptionEn: [
      'Alte University is a fully accredited educational institution with over 23 years of experience in Georgia\'s education sector. The university has approximately 2,500 students from 45 different countries, distributed across four main faculties: Business Administration, International Medicine, Law & Social Sciences, and Information Technology.',
      'Alte University fosters a dynamic learning environment through modern teaching methods and advanced technologies, enabling students to push beyond their limits. Through applied research, innovation, and global collaboration, the university strives to enhance cross-cultural understanding and drive positive social change.',
    ],
    specialtiesEn: ['Business Administration', 'International Medicine', 'Law & Social Sciences', 'Information Technology'],
    advantagesEn: [
      'High-quality educational environment with internationally recognized programs and advanced infrastructure including modern labs and classrooms equipped with the latest technology.',
      'Full support for international students with linguistic and academic support services to help them adapt and succeed in university life.',
      'Affordable tuition and living costs.',
      'Strategic location with easy access to Tbilisi.',
      'Rich cultural environment in Tbilisi.',
      'Diverse recreational activities.',
      'High level of safety.',
      'Diverse programs in business administration, medicine, law, and information technology.',
      'Easy admission procedures.',
    ],
    admissionRequirementsEn: [
      'Valid student passport.',
      'Recent personal photo.',
      'High school certificate.',
      'Personal email address for official communication.',
      'If under 18: birth certificate, copy of mother\'s passport, copy of father\'s passport.',
      'Introductory video (80-120 seconds) showing your passport and explaining why you chose to study and your specialization.',
    ],
    programSectionsEn: [
      {
        title: 'Programs & Annual Fees',
        rows: [
          { program: 'Human Medicine', duration: '6 years', fee: '$5,500' },
          { program: 'Dentistry', duration: '5 years', fee: '$4,500' },
          { program: 'Computer Science', duration: '4 years', fee: '$3,500' },
        ],
      },
    ],
    whyTheWayEn: [
      'Direct official representation for the best accredited universities in Georgia.',
      'Personalized support tailored to each student\'s academic and living needs.',
      'Full transparency with no hidden fees.',
      'Competitive prices and expert academic guidance.',
      'Continuous accompaniment from our specialized consultants at every step from application to settling in Georgia.',
    ],
    registrationStepsEn: [
      'Within 72 hours of signing: we translate all required documents, notarize them, and submit them directly to the university.',
      'Within 4 working days: the preliminary acceptance letter is issued by the university.',
      'Within 7 working days: we obtain the official ministry approval for the student.',
      'Within 5 working days: the ministry registration order is issued.',
      'Within 5 working days: the university invoice is issued after fee payment if the student needs a study visa.',
    ],
    faqEn: [
      { q: 'What is Alte University\'s ranking in Georgia?', a: 'Alte University was established in 2002 in Tbilisi, Georgia. It is internationally recognized and holds advanced positions in national and global rankings.' },
      { q: 'Can students work in Georgia?', a: 'Georgia\'s labor law grants students and foreigners the opportunity to work legally within the framework of the country\'s approved regulations.' },
    ],
  },
];

const decodeMojibake = (value: string) => {
  if (!value) return value;
  if (!/[ØÙÃÂâ]/.test(value)) return value;
  try {
    const cp1252ToByte: Record<number, number> = {
      0x20ac: 0x80,
      0x201a: 0x82,
      0x0192: 0x83,
      0x201e: 0x84,
      0x2026: 0x85,
      0x2020: 0x86,
      0x2021: 0x87,
      0x02c6: 0x88,
      0x2030: 0x89,
      0x0160: 0x8a,
      0x2039: 0x8b,
      0x0152: 0x8c,
      0x017d: 0x8e,
      0x2018: 0x91,
      0x2019: 0x92,
      0x201c: 0x93,
      0x201d: 0x94,
      0x2022: 0x95,
      0x2013: 0x96,
      0x2014: 0x97,
      0x02dc: 0x98,
      0x2122: 0x99,
      0x0161: 0x9a,
      0x203a: 0x9b,
      0x0153: 0x9c,
      0x017e: 0x9e,
      0x0178: 0x9f,
    };

    const bytes: number[] = [];
    for (const ch of value) {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp <= 0xff) bytes.push(cp);
      else bytes.push(cp1252ToByte[cp] ?? 0x3f);
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    return value;
  }
};

const decodeMaybe = (value?: string) => (value ? decodeMojibake(value) : value);

const decodeList = (value?: string[]) => (value ? value.map(decodeMojibake) : value);

const decodeProgramSections = (value?: ProgramSection[]) => {
  if (!value) return value;
  return value.map((s) => ({
    title: decodeMojibake(s.title),
    rows: s.rows.map((r) => ({
      program: decodeMojibake(r.program),
      duration: decodeMaybe(r.duration),
      fee: decodeMaybe(r.fee),
    })),
  }));
};

const decodeFaq = (value?: { q: string; a: string }[]) => {
  if (!value) return value;
  return value.map((f) => ({ q: decodeMojibake(f.q), a: decodeMojibake(f.a) }));
};

const decodedUniversities: University[] = rawUniversities.map((u) => ({
  ...u,
  name: decodeMojibake(u.name),
  nameEn: u.nameEn,
  city: decodeMaybe(u.city),
  cityEn: u.cityEn,
  address: decodeMaybe(u.address),
  website: decodeMaybe(u.website),
  description: decodeList(u.description) ?? [],
  descriptionEn: u.descriptionEn,
  specialties: decodeList(u.specialties),
  specialtiesEn: u.specialtiesEn,
  advantages: decodeList(u.advantages),
  advantagesEn: u.advantagesEn,
  admissionRequirements: decodeList(u.admissionRequirements),
  admissionRequirementsEn: u.admissionRequirementsEn,
  programSections: decodeProgramSections(u.programSections),
  programSectionsEn: u.programSectionsEn,
  whyTheWay: decodeList(u.whyTheWay),
  whyTheWayEn: u.whyTheWayEn,
  registrationSteps: decodeList(u.registrationSteps),
  registrationStepsEn: u.registrationStepsEn,
  faq: decodeFaq(u.faq),
  faqEn: u.faqEn,
}));

const getHomePathForRole = (role: string) => {
  if (role === 'student') return '/dashboard';
  if (role === 'sales') return '/sales';
  if (role === 'ops') return '/ops';
  if (role === 'staff') return '/staff';
  if (role === 'agency_staff') return '/agency-staff';
  if (role === 'agency') return '/agencies';
  if (role === 'customer_support') return '/support';
  if (role === 'ceo') return '/admin';
  return '/';
};

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        {icon ? (
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            {icon}
          </div>
        ) : null}
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm text-gray-600 leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ProgramTable({ section }: { section: ProgramSection }) {
  const { language } = useAppStore();
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{section.title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {language === 'ar' ? 'البرنامج' : 'Program'}
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {language === 'ar' ? 'المدة' : 'Duration'}
              </th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {language === 'ar' ? 'الرسوم' : 'Fee'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {section.rows.map((r) => (
              <tr key={`${section.title}-${r.program}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.program}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.duration ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{r.fee ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UniversitiesPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const { lang: language, isRTL, dir, fontFamily } = useI18n();
  
  const universities = useMemo(() => {
    const en = language === 'en';
    return decodedUniversities.map(u => ({
      ...u,
      name: en && u.nameEn ? u.nameEn : u.name,
      city: en && u.cityEn ? u.cityEn : u.city,
      description: en && u.descriptionEn ? u.descriptionEn : u.description,
      specialties: en && u.specialtiesEn ? u.specialtiesEn : u.specialties,
      advantages: en && u.advantagesEn ? u.advantagesEn : u.advantages,
      admissionRequirements: en && u.admissionRequirementsEn ? u.admissionRequirementsEn : u.admissionRequirements,
      programSections: en && u.programSectionsEn ? u.programSectionsEn : u.programSections,
      whyTheWay: en && u.whyTheWayEn ? u.whyTheWayEn : u.whyTheWay,
      registrationSteps: en && u.registrationStepsEn ? u.registrationStepsEn : u.registrationSteps,
      faq: en && u.faqEn ? u.faqEn : u.faq,
    }));
  }, [language]);

  const active = useMemo(() => (id ? universities.find(u => u.id === id) ?? null : null), [id, universities]);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return universities;
    const qLower = q.toLowerCase();
    return universities.filter((u) => {
      const hay = [
        u.name,
        u.city ?? '',
        ...(u.specialties ?? []),
      ].join(' ').toLowerCase();
      return hay.includes(qLower);
    });
  }, [query, universities]);

  const backHref = user ? getHomePathForRole(user.role) : '/';

  return (
    <div className="min-h-screen bg-[#FAFAF9]" dir={dir} style={{ fontFamily }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoUrl} alt="The Way" className="h-9 w-auto object-contain" />
            </Link>
            <div className="hidden sm:block border-l border-gray-200 pl-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {language === 'ar' ? 'الجامعات' : 'Universities'}
              </p>
              <p className="text-xs text-gray-400">
                {language === 'ar' ? 'اختر الجامعة المناسبة لك' : 'Choose the right university for you'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link
              to={backHref}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRTL ? 'رجوع' : 'Back'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8" id="universities-top">
        <AnimatePresence mode="wait">
          {!id ? (
            <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* Page header + search */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      {language === 'ar' ? 'دليل الجامعات' : 'University Guide'}
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {language === 'ar' ? 'جميع الجامعات' : 'All Universities'}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-xl">
                      {language === 'ar'
                        ? 'ابحث بالاسم أو المدينة أو التخصص، ثم افتح صفحة الجامعة لرؤية التخصصات والرسوم وشروط القبول.'
                        : 'Search by name, city or specialty, then open the university page to see specialties, fees and admission requirements.'}
                    </p>
                  </div>
                  <div className="w-full sm:max-w-xs">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={language === 'ar' ? 'ابحث عن جامعة أو تخصص...' : 'Search universities...'}
                        className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none bg-white"
                      />
                      {query ? (
                        <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* University grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((u) => (
                  <Link
                    key={u.id}
                    to={`/universities/${u.id}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    {u.imageUrl ? (
                      <div className="relative overflow-hidden h-44">
                        <img src={u.imageUrl} alt={language === 'ar' ? u.name : (u.nameEn || u.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {u.city ? (
                          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-gray-700">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            {u.city}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h2 className="font-bold text-gray-900 leading-snug text-[15px]">{u.name}</h2>
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 text-amber-600">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                      </div>
                      {!u.imageUrl && u.city ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {u.city}
                        </div>
                      ) : null}
                      {u.specialties && u.specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {u.specialties.slice(0, 3).map((s) => (
                            <span key={`${u.id}-${s}`} className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                              {s}
                            </span>
                          ))}
                          {u.specialties.length > 3 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400 border border-gray-200">
                              +{u.specialties.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{language === 'ar' ? 'اضغط لعرض التفاصيل' : 'View details'}</span>
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                          {language === 'ar' ? 'عرض' : 'View'}
                          <ChevronLeft className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : active ? (
            <motion.div key={active.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* University hero card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {active.imageUrl ? (
                  <div className="relative h-52 sm:h-64">
                    <img src={active.imageUrl} alt={language === 'ar' ? active.name : (active.nameEn || active.name)} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{active.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {active.city ? (
                            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-white">
                              <MapPin className="w-3.5 h-3.5" />
                              {active.city}
                            </span>
                          ) : null}
                          {active.website ? (
                            <a
                              href={active.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              {language === 'ar' ? 'الموقع الرسمي' : 'Official Website'}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {!active.imageUrl ? (
                      <>
                        <h1 className="text-2xl font-bold text-gray-900">{active.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {active.city ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              {active.city}
                            </span>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                    {active.address ? (
                      <p className="text-xs text-gray-500 mt-1">{active.address}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/universities"
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                    >
                      {isRTL ? <ChevronLeft className="w-4 h-4 rotate-180" /> : <ChevronLeft className="w-4 h-4" />}
                      {isRTL ? 'كل الجامعات' : 'All Universities'}
                    </Link>
                    <Link
                      to="/"
                      className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors inline-flex items-center gap-2"
                    >
                      {language === 'ar' ? 'التقديم الآن' : 'Apply Now'}
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 space-y-5">
                  <SectionCard title={language === 'ar' ? "نبذة عن الجامعة" : "About University"} icon={<GraduationCap className="w-4 h-4" />}>
                    <div className="space-y-3">
                      {active.description.map((p) => (
                        <p key={p} className="text-sm text-gray-600 leading-relaxed">{p}</p>
                      ))}
                    </div>
                  </SectionCard>

                  {active.programSections && active.programSections.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "البرامج الدراسية والرسوم" : "Programs & Fees"} icon={<Globe className="w-4 h-4" />}>
                      <div className="space-y-4">
                        {active.programSections.map((s) => (
                          <ProgramTable key={`${active.id}-${s.title}`} section={s} />
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}

                  {active.faq && active.faq.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "الأسئلة الشائعة" : "FAQ"} icon={<CheckCircle2 className="w-4 h-4" />}>
                      <div className="space-y-3">
                        {active.faq.map((f) => (
                          <div key={`${active.id}-${f.q}`} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-1">{f.q}</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{f.a}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}
                </div>

                <div className="lg:col-span-4 space-y-5">
                  {active.specialties && active.specialties.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "التخصصات" : "Specialties"} icon={<GraduationCap className="w-4 h-4" />}>
                      <div className="flex flex-wrap gap-2">
                        {active.specialties.map((s) => (
                          <span key={`${active.id}-spec-${s}`} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}

                  {active.advantages && active.advantages.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "مميزات الدراسة" : "Study Advantages"} icon={<CheckCircle2 className="w-4 h-4" />}>
                      <BulletList items={active.advantages} />
                    </SectionCard>
                  ) : null}

                  {active.admissionRequirements && active.admissionRequirements.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "شروط القبول" : "Admission Requirements"} icon={<CheckCircle2 className="w-4 h-4" />}>
                      <BulletList items={active.admissionRequirements} />
                    </SectionCard>
                  ) : null}

                  {active.whyTheWay && active.whyTheWay.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "لماذا تختار The Way؟" : "Why Choose The Way?"} icon={<Globe className="w-4 h-4" />}>
                      <BulletList items={active.whyTheWay} />
                    </SectionCard>
                  ) : null}

                  {active.registrationSteps && active.registrationSteps.length > 0 ? (
                    <SectionCard title={language === 'ar' ? "خطوات التسجيل" : "Registration Steps"} icon={<Globe className="w-4 h-4" />}>
                      <ol className="space-y-2.5">
                        {active.registrationSteps.map((s, i) => (
                          <li key={s} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-sm text-gray-600 leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </SectionCard>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="missing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <p className="text-base font-semibold text-gray-900">
                  {language === 'ar' ? 'هذه الجامعة غير موجودة.' : 'This university does not exist.'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {language === 'ar' ? 'الرجاء الرجوع إلى صفحة جميع الجامعات.' : 'Please return to the All Universities page.'}
                </p>
                <div className="mt-6">
                  <Link
                    to="/universities"
                    className="inline-flex items-center gap-2 bg-amber-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-amber-700 transition-colors"
                  >
                    العودة لجميع الجامعات
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

