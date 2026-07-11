import React, { useState } from 'react';
import { Star, PartyPopper, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore, type Application } from '../../store/appStore';

/**
 * 1–5★ service rating, offered to the student once their residency is done
 * (PRD §3). One-time — after submitting we show a thank-you state.
 */
export const RatingPrompt: React.FC<{ application: Application }> = ({ application }) => {
  const { studentRateService } = useAppStore();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const residencyDone = application.pipeline?.status === 'closed'
    || Boolean(application.pipeline?.stages?.visa_residency?.completedAt);
  if (!residencyDone) return null;

  if (application.rating) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-bold text-emerald-800">Thank you for your feedback!</p>
        <div className="mt-1 flex items-center justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`h-4 w-4 ${i <= application.rating!.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          ))}
        </div>
      </div>
    );
  }

  const submit = () => {
    if (stars < 1) { toast.error('Please pick a star rating first'); return; }
    setSaving(true);
    try {
      studentRateService(application.id, stars, comment);
      toast.success('Thank you — your rating means a lot to us!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save rating');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-[#0A1628] to-[#12294a] p-5 sm:p-6 text-center">
      <PartyPopper className="mx-auto mb-2 h-8 w-8 text-amber-400" />
      <h3 className="text-lg font-black text-white">Congratulations — your journey is complete!</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-300">
        Your visa & residency are ready. How was your experience with The Way?
      </p>
      <div className="mt-4 flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(i)}
            className="p-1 transition-transform hover:scale-125"
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
          >
            <Star className={`h-8 w-8 transition-colors ${i <= (hover || stars) ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us about your experience (optional)"
        rows={2}
        className="mt-4 w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      />
      <div className="mt-3">
        <button
          onClick={submit}
          disabled={saving || stars < 1}
          className="rounded-xl bg-amber-400 px-8 py-3 text-sm font-black uppercase tracking-wider text-[#0A1628] hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          Submit rating
        </button>
      </div>
    </div>
  );
};

export default RatingPrompt;
