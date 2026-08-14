// ─────────────────────────────────────────────────────────────────────────────
// The case, told as a journey.
//
// The pipeline knows about stages, SLA windows and points. None of that means
// anything to a student. This turns the same case into what they actually want
// to know: where am I, what is happening, is anyone waiting on me, and what
// comes next.
//
// Only the model lives here, not the pixels. The phone and the portal look
// nothing alike, but they must never disagree about what a case is doing, so
// they share this and draw it themselves.
// ─────────────────────────────────────────────────────────────────────────────

import {
  PIPELINE_STAGES, PIPELINE_ORDER, getStageMeta, PARTIAL_CLOSE_AFTER,
  type ApplicationPipeline, type PipelineStageId,
} from './pipeline';

/**
 * What each stage means to the student.
 *
 * Written as the thing being done rather than the artefact produced: a student
 * reads "we are translating your documents", not "Translated Documents". The
 * staff labels in pipeline.ts stay as they are, because staff work to them.
 */
interface StudentCopy {
  /** Heading, in the present tense. */
  title: string;
  /** One or two sentences: what is happening and why it matters. */
  blurb: string;
  /** Roughly how long this normally takes, in the student's words. */
  typical?: string;
}

const COPY: Record<PipelineStageId, StudentCopy> = {
  payment_1: {
    title: 'Your first payment',
    blurb: 'Everything starts here. As soon as this reaches us, your advisor begins on your documents and your university application.',
  },
  translated_documents: {
    title: 'Translating your documents',
    blurb: 'We translate and notarise your certificates so Georgian universities and the ministry will accept them.',
    typical: 'usually 2-3 days',
  },
  university_approval: {
    title: 'Your university decision',
    blurb: 'Your file is with the university. They review it and issue your acceptance letter.',
    typical: 'a few days to a few weeks, depending on the university',
  },
  recognition_letter: {
    title: 'Recognising your studies',
    blurb: 'The ministry formally recognises the school you came from. This has to happen before your place can be confirmed.',
    typical: 'usually around 9 days',
  },
  ministry_order: {
    title: 'Your ministry order',
    blurb: 'The government issues the order that confirms your place. This is the document that makes your admission official.',
    typical: 'usually around 18 days',
  },
  payment_2: {
    title: 'Continue to your visa and arrival',
    blurb: 'Your admission is complete. This second payment covers your visa, your residency permit, and everything waiting for you in Georgia - starting with someone meeting you at the airport.',
  },
  visa_documents: {
    title: 'Preparing your visa file',
    blurb: 'We gather and check every document the embassy needs, so nothing comes back rejected.',
  },
  visa_residency: {
    title: 'Your visa and residency',
    blurb: 'The last step. Once your visa and residency permit are issued, you are ready to travel - and your member card activates.',
  },
};

export type StepState = 'done' | 'current' | 'upcoming';

export interface JourneyStep {
  stage: PipelineStageId;
  /** 1-based, for "step 3 of 8". */
  number: number;
  state: StepState;
  title: string;
  blurb: string;
  typical?: string;
  /** The staff-facing name, for staff views. */
  staffLabel: string;
  /** True when this step is a payment: it waits on the student. */
  isPayment: boolean;
  /** What paying unlocks, on payment steps. */
  unlocks?: string[];
  completedAt?: string;
  /** True for the step where a student may choose to stop. */
  isStopPoint: boolean;
}

export interface Journey {
  steps: JourneyStep[];
  total: number;
  doneCount: number;
  /** 0-100, for a progress bar. */
  percent: number;
  current: JourneyStep | null;
  /**
   * Who the case is waiting on. 'you' means the student has something to do -
   * the only state that should ever nag them.
   */
  waitingOn: 'you' | 'us' | 'nobody';
  /** One line for the top of the screen. */
  headline: string;
  detail: string;
  /** Closed at the ministry order on one payment, and continuable. */
  partial: boolean;
  finished: boolean;
  cancelled: boolean;
}

/** Where the student may stop if they paid only the first instalment. */
export const STOP_POINT: PipelineStageId = PARTIAL_CLOSE_AFTER;

export function buildJourney(pipeline: ApplicationPipeline | undefined | null): Journey {
  const total = PIPELINE_ORDER.length;

  if (!pipeline) {
    return {
      steps: [], total, doneCount: 0, percent: 0, current: null,
      waitingOn: 'us',
      headline: 'Your journey has not started yet',
      detail: 'As soon as your application is approved, every step appears here and you can follow it the whole way.',
      partial: false, finished: false, cancelled: false,
    };
  }

  const cancelled = pipeline.status === 'cancelled';
  const partial = Boolean(pipeline.partial);
  // A finished case is one that ran all the way to the visa; a partial close is
  // complete for what was paid but is not the end of the journey.
  const finished = pipeline.status === 'closed' && !partial;
  const currentIdx = pipeline.current === 'done' ? total : PIPELINE_ORDER.indexOf(pipeline.current);

  const steps: JourneyStep[] = PIPELINE_STAGES.map((s, i) => {
    const track = pipeline.stages[s.id] ?? {};
    const isDone = Boolean(track.completedAt) || (finished) || i < currentIdx;
    const state: StepState =
      isDone ? 'done'
      : (pipeline.status === 'processing' && pipeline.current === s.id) ? 'current'
      : 'upcoming';
    const copy = COPY[s.id];
    return {
      stage: s.id,
      number: i + 1,
      state,
      title: copy.title,
      blurb: copy.blurb,
      typical: copy.typical,
      staffLabel: s.label,
      isPayment: s.awaitsStudent,
      unlocks: s.unlocks,
      completedAt: track.completedAt,
      isStopPoint: s.id === STOP_POINT,
    };
  });

  const doneCount = steps.filter(s => s.state === 'done').length;
  const current = steps.find(s => s.state === 'current') ?? null;

  const waitingOn: Journey['waitingOn'] =
    cancelled || finished ? 'nobody'
    : partial ? 'you'
    : current?.isPayment ? 'you'
    : 'us';

  const headline =
    cancelled ? 'This application was stopped'
    : finished ? 'You did it — your journey is complete'
    : partial ? 'Everything you paid for is done'
    : current?.isPayment ? current.title
    : current ? current.title
    : 'Getting your case ready';

  const detail =
    cancelled ? 'Speak to your advisor if you would like to start again.'
    : finished ? 'Your visa and residency are issued and your member card is active. Welcome to Georgia.'
    : partial ? 'Your admission is confirmed up to the ministry order. When you are ready to continue to your visa and arrival, the second payment picks up exactly where you left off — nothing is repeated.'
    : current ? current.blurb
    : 'Your advisor is setting things up.';

  return {
    steps, total, doneCount,
    percent: Math.round((doneCount / total) * 100),
    current, waitingOn, headline, detail,
    partial, finished, cancelled,
  };
}

/** The student-facing title for a stage, for use outside a full journey. */
export const studentTitleOf = (stage: PipelineStageId): string =>
  COPY[stage]?.title ?? getStageMeta(stage).label;
