'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Sun, Moon, ChevronRight, ChevronLeft, Volume2, VolumeX,
  SkipForward, RotateCcw, Vibrate, Wind, Flame, Target, CloudRain, Leaf,
  Check, ArrowUp, ArrowDown, Sparkles, Plus, Minus, X,
  Waves, AlertTriangle, TrendingUp, BarChart3, Home, Music, Tag, History,
  MessageCircle, Send, ShieldAlert, Compass, Mic,
} from 'lucide-react';

/* =========================================================================
   PERSISTENCE — small localStorage-backed shim standing in for the
   sandbox-only `window.storage` API this component was originally written
   against, so saved reflections/study logs survive a real browser reload.
   ========================================================================= */
const storage = {
  async get(key) {
    if (typeof window === 'undefined') return { value: null };
    try {
      return { value: window.localStorage.getItem(key) };
    } catch (e) {
      return { value: null };
    }
  },
  async set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable — safe to ignore */ }
  },
};

/* =========================================================================
   DATA
   ========================================================================= */

const TRACKS = [
  { id: 't1', title: 'Pavane pour une infante défunte', composer: 'Maurice Ravel', freq: 196, tone: 'sine', category: 'Calm' },
  { id: 't2', title: 'Rêverie', composer: 'Claude Debussy', freq: 220, tone: 'sine', category: 'Calm' },
  { id: 't3', title: 'Des pas sur la neige', composer: 'Claude Debussy', freq: 174, tone: 'triangle', category: 'Sleep' },
  { id: 't4', title: 'Sicilienne', composer: 'Gabriel Fauré', freq: 246, tone: 'sine', category: 'Calm' },
  { id: 't5', title: 'Berceuse, Op. 16', composer: 'Gabriel Fauré', freq: 261, tone: 'triangle', category: 'Sleep' },
  { id: 't6', title: 'Arabeske in C Major', composer: 'Robert Schumann', freq: 233, tone: 'sine', category: 'Focus' },
  { id: 't7', title: 'The Sixth Station', composer: 'Joe Hisaishi', freq: 207, tone: 'triangle', category: 'Focus' },
  { id: 't8', title: 'Ashitaka and San', composer: 'Joe Hisaishi', freq: 185, tone: 'sine', category: 'Recharge' },
  { id: 't9', title: 'Carrying You (instrumental)', composer: 'Joe Hisaishi', freq: 220, tone: 'triangle', category: 'Recharge' },
  { id: 'n1', title: 'Rain', composer: 'Nature sounds', category: 'Nature', noise: 'rain' },
  { id: 'n2', title: 'Ocean', composer: 'Nature sounds', category: 'Nature', noise: 'ocean' },
  { id: 'n3', title: 'Forest', composer: 'Nature sounds', category: 'Nature', noise: 'forest' },
];
const MUSIC_CATEGORIES = ['Focus', 'Calm', 'Recharge', 'Sleep', 'Nature'];

const MOOD_CATEGORIES = [
  { id: 'anxious', label: 'Anxious / Overwhelmed', icon: Wind },
  { id: 'stressed', label: 'Stressed / Tense', icon: Flame },
  { id: 'focus', label: 'Difficulty Focusing', icon: Target },
  { id: 'sad', label: 'Sad / Low Energy', icon: CloudRain },
  { id: 'restless', label: 'Restless', icon: Waves },
  { id: 'frustrated', label: 'Frustrated', icon: AlertTriangle },
  { id: 'calm', label: 'Calm', icon: Leaf },
  { id: 'motivated', label: 'Motivated', icon: TrendingUp },
];

const TENSION_AREAS = [
  { id: 'neck', label: 'Neck' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'jaw', label: 'Jaw' },
  { id: 'chest', label: 'Chest' },
  { id: 'stomach', label: 'Stomach' },
  { id: 'head', label: 'Head' },
  { id: 'hands', label: 'Hands' },
  { id: 'racing', label: 'Racing thoughts' },
  { id: 'lowenergy', label: 'Low energy' },
  { id: 'focus', label: 'Difficulty focusing' },
];

const NEEDS = [
  { id: 'calmMind', label: 'Calm my mind', icon: Wind },
  { id: 'release', label: 'Release physical tension', icon: Flame },
  { id: 'improveFocus', label: 'Improve focus', icon: Target },
  { id: 'recharge', label: 'Recharge', icon: TrendingUp },
  { id: 'sleep', label: 'Prepare for sleep', icon: Moon },
];

/* -------- mood quiz -------- */

const FEELING_TO_CATEGORY = {
  calm: 'calm',
  stressed: 'stressed',
  overwhelmed: 'anxious',
  tired: 'sad',
  unfocused: 'focus',
  energized: 'motivated',
};

const MOOD_QUIZ = [
  {
    id: 'feeling',
    question: 'How are you feeling right now?',
    options: [
      { id: 'calm', label: 'Calm' },
      { id: 'stressed', label: 'Stressed' },
      { id: 'overwhelmed', label: 'Overwhelmed' },
      { id: 'tired', label: 'Tired' },
      { id: 'unfocused', label: 'Unfocused' },
      { id: 'energized', label: 'Energized' },
    ],
  },
  {
    id: 'energy',
    question: "What's your energy like?",
    options: [
      { id: 'energyLow', label: 'Low' },
      { id: 'energySteady', label: 'Steady' },
      { id: 'energyHigh', label: 'High' },
    ],
  },
  {
    id: 'stress',
    question: 'How stressed do you feel?',
    options: [
      { id: 'stressLow', label: 'Barely any' },
      { id: 'stressMed', label: 'Some' },
      { id: 'stressHigh', label: 'A lot' },
    ],
  },
  {
    id: 'focus',
    question: "How's your focus?",
    options: [
      { id: 'focusSharp', label: 'Sharp' },
      { id: 'focusOkay', label: 'Okay' },
      { id: 'focusScattered', label: 'Scattered' },
    ],
  },
  {
    id: 'need',
    question: 'What do you need most right now?',
    options: NEEDS.map(n => ({ id: n.id, label: n.label })),
  },
];

const MOOD_QUIZ_ANSWER_ICONS = {
  calm: Leaf, stressed: Flame, overwhelmed: Wind, tired: CloudRain, unfocused: Target, energized: TrendingUp,
  calmMind: Wind, release: Flame, improveFocus: Target, recharge: TrendingUp, sleep: Moon,
};

/* =========================================================================
   LUMINOUS GUIDE — approved Alexander Technique / body-awareness knowledge base
   All AI-guided content is grounded in this data; nothing here is invented
   at runtime, and any live AI text must stay within it (see askGuide()).
   ========================================================================= */

const AT_CONCEPTS = {
  awareness: {
    name: 'Awareness',
    short: 'Noticing what your body is doing right now, without judging it or trying to fix it yet.',
  },
  inhibition: {
    name: 'Inhibition',
    short: 'Pausing before you react — noticing what changed without rushing to fix or judge it.',
  },
  direction: {
    name: 'Direction',
    short: 'Sending a quiet mental message to lengthen and release, rather than physically forcing a position.',
  },
  meansWhereby: {
    name: 'Means-Whereby',
    short: 'Trusting the small steps of the process, rather than fixing on the end result ("end-gaining").',
  },
};

// Every exercise walks the same five stages. Adding a new exercise later is
// just adding one more entry here — no component changes required.
const AT_STAGES = ['notice', 'investigate', 'explore', 'compare', 'transfer'];

const AT_STAGE_META = {
  notice: { label: 'Notice', concept: 'awareness' },
  investigate: { label: 'Investigate', concept: 'awareness' },
  explore: { label: 'Explore', concept: 'direction' },
  compare: { label: 'Compare', concept: 'inhibition' },
  transfer: { label: 'Transfer', concept: 'meansWhereby' },
};

// Body regions the diagram can highlight. Keep this list in sync with
// BodyAwarenessDiagram's drawing code below.
const BODY_REGIONS = ['head', 'neck', 'shoulders', 'spine', 'pelvis', 'hands', 'feet'];

// Simple, dependency-free keyword spotting so the diagram can highlight
// whichever body part is actually being discussed in a given moment.
const REGION_KEYWORDS = {
  head: ['head'],
  neck: ['neck'],
  shoulders: ['shoulder'],
  spine: ['spine', 'back'],
  pelvis: ['pelvis', 'hip'],
  hands: ['hand', 'arm', 'wrist'],
  feet: ['feet', 'foot', 'leg', 'knee'],
};

function detectRegions(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return Object.entries(REGION_KEYWORDS)
    .filter(([, keywords]) => keywords.some(k => lower.includes(k)))
    .map(([id]) => id);
}

// The AT / body-awareness exercise library. Start with 4; add more by
// appending another { id, name, blurb, stages } entry.
const AT_EXERCISES = [
  {
    id: 'primaryDirections',
    name: 'Primary Directions',
    blurb: 'The classic neck–head–back directions, one at a time.',
    stages: {
      notice: {
        prompt: "Notice how you're sitting or standing right now, without changing anything.",
        questions: ['What do you notice?', "Where does it feel like you're holding effort?"],
        regions: ['head', 'neck', 'shoulders', 'spine'],
      },
      investigate: {
        prompt: 'Bring your attention to your neck. See if there is any gripping there that you hadn\'t noticed before.',
        questions: ['What do you notice about your neck?', 'Does one side feel different from the other?'],
        regions: ['neck'],
      },
      explore: {
        prompt: 'Silently think the words "let my neck be free, to let my head go forward and up, to let my back lengthen and widen."',
        questions: ['What did you notice as you thought that?'],
        regions: ['neck', 'head', 'spine', 'shoulders'],
      },
      compare: {
        prompt: 'Notice your neck, head, and back again.',
        questions: ['What changed, if anything?', 'Can you notice that without trying to fix it?'],
        regions: ['neck', 'head', 'spine'],
      },
      transfer: {
        prompt: 'See if you can carry this same quiet direction into your next movement — standing up, or reaching for something.',
        questions: ['What would it be like to carry this with you?'],
        regions: ['spine'],
      },
    },
  },
  {
    id: 'lyingDown',
    name: 'Lying Down Awareness',
    blurb: 'A gentle body scan in semi-supine — the classic Alexander resting position.',
    stages: {
      notice: {
        prompt: "Lie on your back with your knees bent and feet flat, a support under your head if you have one. Once you're settled, notice how your back meets the floor.",
        questions: ['What do you notice about how your back touches the floor?', 'Is one side different from the other?'],
        regions: ['spine', 'pelvis'],
      },
      investigate: {
        prompt: 'Bring your attention to your neck and the back of your head.',
        questions: ['What do you notice there?', 'Does your head feel heavy, or held?'],
        regions: ['neck', 'head'],
      },
      explore: {
        prompt: "Without lifting or adjusting anything, silently think \"let my neck be free\" and let your head rest fully.",
        questions: ['What do you notice as you think that?'],
        regions: ['neck', 'head'],
      },
      compare: {
        prompt: 'Notice your back against the floor once more.',
        questions: ["What's different now, if anything?", 'Can you notice that without trying to fix it?'],
        regions: ['spine', 'pelvis'],
      },
      transfer: {
        prompt: 'As you get up — rolling to one side first — see if you can keep a little of this ease with you.',
        questions: ['What might it feel like to carry this into sitting?'],
        regions: ['spine'],
      },
    },
  },
  {
    id: 'sitToStand',
    name: 'Sitting → Standing',
    blurb: 'Notice your habitual pattern of standing up, and explore a freer one.',
    stages: {
      notice: {
        prompt: "Sit toward the front edge of a chair, feet flat on the floor. Before moving, just notice how you're about to stand up.",
        questions: ['What do you notice about how you usually stand up?'],
        regions: ['pelvis', 'feet'],
      },
      investigate: {
        prompt: 'Notice where your weight is right now — more on your feet, or more on the chair?',
        questions: ['Where does your weight feel like it is?', 'What happens in your neck as you think about standing?'],
        regions: ['pelvis', 'feet', 'neck'],
      },
      explore: {
        prompt: 'Before you move, silently think "let my neck be free." Then let your weight shift forward over your feet, and allow yourself to rise — no rushing.',
        questions: ['What did you notice about that way of moving?'],
        regions: ['neck', 'pelvis', 'feet'],
      },
      compare: {
        prompt: 'Notice how that felt compared to how you normally stand up.',
        questions: ['What was different, if anything?', 'Can you notice that without deciding if it was better or worse?'],
        regions: ['spine', 'pelvis'],
      },
      transfer: {
        prompt: 'Next time you stand up today, see if you can pause for just a moment first.',
        questions: ['What would it be like to pause like that during your day?'],
        regions: ['spine'],
      },
    },
  },
  {
    id: 'studyAwareness',
    name: 'Studying Awareness',
    blurb: 'Notice how your body holds itself while reading or working at a desk.',
    stages: {
      notice: {
        prompt: 'Sit as you normally would to study or work. After a moment, notice your shoulders.',
        questions: ['What do you notice about your shoulders right now?'],
        regions: ['shoulders'],
      },
      investigate: {
        prompt: "Notice your hands and how you're holding whatever you're working with — a pen, a keyboard, a phone.",
        questions: ['What do you notice about your hands?', 'Is there more effort there than the task needs?'],
        regions: ['hands'],
      },
      explore: {
        prompt: 'Let your shoulders widen slightly, and let your hands hold only as much as they need to.',
        questions: ['What did you notice as you did that?'],
        regions: ['shoulders', 'hands'],
      },
      compare: {
        prompt: 'Notice your shoulders and hands again.',
        questions: ["What's different, if anything?", 'Can you notice that without judging it as better or worse?'],
        regions: ['shoulders', 'hands'],
      },
      transfer: {
        prompt: 'As you go back to studying, see if you can check in with your shoulders and hands every so often.',
        questions: ['What would it be like to check in like that while you study?'],
        regions: ['shoulders', 'hands'],
      },
    },
  },
];

const GUIDE_LEVELS = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'detailed', label: 'Detailed' },
];

/* -------- living landscape mood check-in -------- */

const EMOTION_DIMENSIONS = [
  { id: 'weight', left: 'Light', right: 'Heavy' },
  { id: 'pace', left: 'Slow', right: 'Fast' },
  { id: 'brightness', left: 'Dark', right: 'Bright' },
  { id: 'order', left: 'Chaotic', right: 'Organized' },
  { id: 'connection', left: 'Lonely', right: 'Connected' },
];

const NEUTRAL_LANDSCAPE = { weight: 50, pace: 50, brightness: 50, order: 50, connection: 50 };

function lerp(a, b, f) { return a + (b - a) * f; }

// Reference points used to translate the five sliders back into the mood
// categories the recommendation engine already understands.
const MOOD_ARCHETYPES = {
  anxious: { weight: 60, pace: 80, brightness: 45, order: 15, connection: 35 },
  stressed: { weight: 75, pace: 60, brightness: 35, order: 20, connection: 45 },
  focus: { weight: 55, pace: 55, brightness: 50, order: 30, connection: 50 },
  sad: { weight: 65, pace: 25, brightness: 20, order: 50, connection: 15 },
  restless: { weight: 45, pace: 75, brightness: 55, order: 25, connection: 50 },
  frustrated: { weight: 70, pace: 65, brightness: 30, order: 10, connection: 40 },
  motivated: { weight: 25, pace: 65, brightness: 80, order: 65, connection: 65 },
  calm: { weight: 30, pace: 30, brightness: 70, order: 80, connection: 70 },
};

function nearestMoodCategory(values) {
  const untouched = Object.keys(NEUTRAL_LANDSCAPE).every(k => values[k] === NEUTRAL_LANDSCAPE[k]);
  if (untouched) return 'calm'; // nothing adjusted yet — leave it as free choice
  let best = 'calm';
  let bestDist = Infinity;
  Object.entries(MOOD_ARCHETYPES).forEach(([id, arc]) => {
    const dist = Object.keys(arc).reduce((sum, k) => sum + (arc[k] - values[k]) ** 2, 0);
    if (dist < bestDist) { bestDist = dist; best = id; }
  });
  return best;
}

// A rough single "wellbeing" score (0-100) from a landscape, used only for stats trends
// on older saved entries that still have landscape data.
function wellbeingScore(values) {
  return Math.round(((100 - values.weight) + values.brightness + values.order + values.connection) / 4);
}

// Approximate wellbeing score per mood category, for entries saved via the quiz.
const MOOD_CATEGORY_SCORE = {
  calm: 85, motivated: 78, focus: 55, restless: 45, unfocused: 50,
  stressed: 35, frustrated: 30, anxious: 30, sad: 25,
};

function computeStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  const dayMs = 86400000;
  const days = Array.from(new Set(entries.map(e => {
    const d = new Date(e.date); d.setHours(0, 0, 0, 0); return d.getTime();
  }))).sort((a, b) => b - a);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (today.getTime() - days[0] > dayMs) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === dayMs) streak++;
    else break;
  }
  return streak;
}

function mostCommon(arr) {
  if (!arr || arr.length === 0) return null;
  const counts = {};
  arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/* =========================================================================
   THEME HELPERS
   ========================================================================= */

// Exact brand kit values — used directly (inline styles) wherever precise
// brand color matters, so nothing drifts from the approved palette.
const BRAND = {
  sageFog: '#DDE6DB',
  mistBlue: '#CFE8F3',
  sageGreen: '#D8EADB',
  warmIvory: '#F8F6F3',
  deepIndigo: '#1B1C23',
  softGray: '#6F7075',
  lightGray: '#A6A8AD',
  paleGray: '#E7E8EB',
  surface: '#F2F3F5',
  darkSurface: '#1F2026',
};
const MOOD_DOT_COLORS = {
  calm: BRAND.sageGreen, stressed: '#E7C9B8', overwhelmed: '#E3C6D6',
  tired: BRAND.lightGray, unfocused: '#EEE0B8', energized: BRAND.mistBlue,
};

function useTheme() {
  const [isDark, setIsDark] = useState(false);
  const t = {
    bgColor: isDark ? BRAND.deepIndigo : BRAND.warmIvory, // applied via inline style at the root only
    text: isDark ? 'text-zinc-400' : 'text-zinc-500',
    textSoft: isDark ? 'text-zinc-500' : 'text-zinc-400',
    heading: isDark ? 'text-zinc-100 font-light' : 'text-zinc-900 font-light',
    card: isDark ? 'bg-white/5 backdrop-blur-xl shadow-xl shadow-black/20' : 'bg-white/65 backdrop-blur-xl shadow-xl shadow-zinc-900/5',
    cardAlt: isDark ? 'bg-white/5 backdrop-blur-md' : 'bg-white/50 backdrop-blur-md',
    ring: isDark ? 'ring-zinc-800' : 'ring-zinc-100',
    purple: isDark ? 'bg-sky-500/10 text-sky-200' : 'bg-sky-100 text-sky-700',
    blue: isDark ? 'bg-sky-500/10 text-sky-200' : 'bg-sky-100 text-sky-700',
    green: isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-100 text-emerald-700',
    button: isDark ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black',
    buttonGhost: isDark ? 'bg-white/5 backdrop-blur-md text-zinc-300 hover:bg-white/10 shadow-sm' : 'bg-white/45 backdrop-blur-md text-zinc-600 hover:bg-white/70 shadow-sm',
    input: isDark ? 'bg-white/5 backdrop-blur-md text-zinc-200 placeholder-zinc-600 shadow-sm' : 'bg-white/50 backdrop-blur-md text-zinc-700 placeholder-zinc-400 shadow-sm',
  };
  return { isDark, setIsDark, t };
}

// Loads the brand's Display (Cormorant Garamond) and UI (Satoshi) fonts once,
// with graceful fallback to Inter/serif if the network request fails.
function useBrandFonts() {
  useEffect(() => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&display=swap',
      'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap',
    ];
    const created = links.map(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => created.forEach(l => l.remove());
  }, []);
}

/* -------- ambient background: slow drifting brand-color light -------- */
function AmbientField({ isDark }) {
  const blobs = isDark
    ? [
        { top: '-12%', left: '-14%', size: 560, color: 'rgba(207,232,243,0.10)', anim: 'driftA 26s ease-in-out infinite' },
        { top: '18%', right: '-16%', size: 520, color: 'rgba(216,234,219,0.10)', anim: 'driftB 32s ease-in-out infinite' },
        { bottom: '-16%', left: '18%', size: 500, color: 'rgba(221,230,219,0.10)', anim: 'driftC 30s ease-in-out infinite' },
      ]
    : [
        { top: '-12%', left: '-14%', size: 560, color: 'rgba(207,232,243,0.55)', anim: 'driftA 26s ease-in-out infinite' },
        { top: '18%', right: '-16%', size: 520, color: 'rgba(216,234,219,0.55)', anim: 'driftB 32s ease-in-out infinite' },
        { bottom: '-16%', left: '18%', size: 500, color: 'rgba(248,236,224,0.5)', anim: 'driftC 30s ease-in-out infinite' },
      ];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            top: b.top, left: b.left, right: b.right, bottom: b.bottom,
            width: b.size, height: b.size,
            background: `radial-gradient(circle, ${b.color}, transparent 70%)`,
            animation: b.anim,
          }}
        />
      ))}
    </div>
  );
}

/* -------- the Luminous mark: soft layered bloom, used wherever the logo appears -------- */
function LuminousMark({ size = 140 }) {
  const petals = [
    { color: BRAND.mistBlue, opacity: 0.75, scale: 1, rotate: 0 },
    { color: BRAND.sageGreen, opacity: 0.7, scale: 0.86, rotate: 40 },
    { color: BRAND.sageFog, opacity: 0.8, scale: 0.7, rotate: 80 },
    { color: '#FFFFFF', opacity: 0.9, scale: 0.42, rotate: 0 },
  ];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {petals.map((p, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full blur-md"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${p.color}, transparent 72%)`,
            opacity: p.opacity,
            transform: `scale(${p.scale}) rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.95), transparent 55%)` }}
      />
    </div>
  );
}

/* =========================================================================
   SMALL SHARED PIECES
   ========================================================================= */

function Logo({ t }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`inline-block w-2 h-2 rounded-full ${t.isDark ? '' : ''} bg-gradient-to-br from-sky-300 via-blue-300 to-green-300`} />
      <span className={`text-xl font-light tracking-wide ${t.heading}`} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: '0.02em' }}>
        Luminous
      </span>
    </div>
  );
}

function ThemeToggle({ isDark, setIsDark, t }) {
  return (
    <button
      onClick={() => setIsDark(d => !d)}
      aria-label="Toggle dark mode"
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${t.buttonGhost}`}
    >
      {isDark ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
    </button>
  );
}

function ProgressDots({ step, t }) {
  const steps = ['Check-in', 'Session', 'Reflect'];
  if (step < 0) return null;
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step ? 'w-6 bg-sky-300' : i < step ? 'w-1.5 bg-green-300' : `w-1.5 ${t.isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`
            }`}
          />
        </div>
      ))}
    </div>
  );
}

function NavBar({ active, onHome, onReset, onFocus, onStats, isDark, setIsDark, t }) {
  const items = [
    { id: 'home', label: 'Home', icon: Home, action: onHome },
    { id: 'reset', label: 'Reset', icon: Leaf, action: onReset },
    { id: 'focus', label: 'Focus', icon: Target, action: onFocus },
    { id: 'stats', label: 'Stats', icon: BarChart3, action: onStats },
  ];
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center pb-6 px-5 pointer-events-none">
      <div className={`flex items-center gap-1 px-2 py-2 rounded-full pointer-events-auto ${t.card}`}>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300"
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-200/70 via-blue-200/60 to-green-200/60" />
              )}
              <Icon size={15} strokeWidth={1.7} className={`relative ${isActive ? t.heading : t.textSoft}`} />
            </button>
          );
        })}
        <span className="w-px h-5 mx-1 bg-current opacity-10" />
        <ThemeToggle isDark={isDark} setIsDark={setIsDark} t={t} />
      </div>
    </div>
  );
}

// Minimal outline face, level 0-4 (low -> great)
function FaceIcon({ level, size = 30, active, t }) {
  const mouths = [
    'M9 16c1.2-1.8 6.8-1.8 8 0',
    'M9 15h8',
    'M9 14.7c1.2 1 6.8 1 8 0',
    'M8.5 14.3c1.5 2.4 7.5 2.4 9 0',
    'M8 13.6c1.8 3.2 8.2 3.2 10 0',
  ];
  const color = active ? '#A78BFA' : (t.isDark ? '#6B6B76' : '#B8B8C2');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.3" />
      <circle cx="9" cy="9.7" r="0.9" fill={color} stroke="none" />
      <circle cx="15" cy="9.7" r="0.9" fill={color} stroke="none" />
      <path d={mouths[level]} />
    </svg>
  );
}

function MoodPicker({ value, onChange, t }) {
  const labels = ['Low', 'Meh', 'Okay', 'Good', 'Great'];
  return (
    <div className="flex justify-center gap-3 sm:gap-5">
      {labels.map((label, i) => (
        <button
          key={label}
          onClick={() => onChange(i)}
          className="flex flex-col items-center gap-2 group"
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${value === i ? (t.isDark ? 'bg-sky-950/40' : 'bg-sky-50') : ''}`}>
            <FaceIcon level={i} active={value === i} t={t} />
          </div>
          <span className={`text-[11px] transition-colors ${value === i ? 'text-sky-400' : t.textSoft}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* -------- mood quiz: short, calm, single-question-at-a-time -------- */
function MoodQuiz({ answers, setAnswer, t }) {
  const answeredCount = MOOD_QUIZ.filter(q => answers[q.id]).length;
  const [step, setStep] = useState(Math.min(answeredCount, MOOD_QUIZ.length - 1));
  const done = answeredCount >= MOOD_QUIZ.length;

  function choose(qId, optId) {
    setAnswer(qId, optId);
    if (step < MOOD_QUIZ.length - 1) {
      setTimeout(() => setStep(s => Math.min(s + 1, MOOD_QUIZ.length - 1)), 260);
    }
  }

  if (done) {
    const category = MOOD_CATEGORIES.find(c => c.id === FEELING_TO_CATEGORY[answers.feeling]);
    const Icon = category ? category.icon : Leaf;
    return (
      <div key="quiz-done" className="flex flex-col items-center text-center gap-3 py-6" style={{ animation: 'screenIn 550ms cubic-bezier(0.16,1,0.3,1)' }}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.purple}`}>
          <Icon size={18} strokeWidth={1.7} />
        </div>
        <p className={`text-sm ${t.heading}`}>Thanks — it sounds like you're feeling {category ? category.label.split(' / ')[0].toLowerCase() : 'ready for a reset'}.</p>
        <p className={`text-xs max-w-xs ${t.textSoft}`}>We'll use this to recommend a session next.</p>
        <button onClick={() => setStep(0)} className={`text-[11px] ${t.textSoft} hover:opacity-70 transition mt-1`}>
          Retake the quiz
        </button>
      </div>
    );
  }

  const q = MOOD_QUIZ[step];
  const fallbackDots = [BRAND.sageGreen, BRAND.mistBlue, BRAND.sageFog, BRAND.lightGray];

  return (
    <div>
      <p className={`text-center text-xs tabular-nums tracking-wide mb-6 ${t.textSoft}`}>
        {String(step + 1).padStart(2, '0')} / {String(MOOD_QUIZ.length).padStart(2, '0')}
      </p>

      <div key={q.id} style={{ animation: 'screenIn 550ms cubic-bezier(0.16,1,0.3,1)' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl text-center mb-6 ${t.heading}`}>{q.question}</p>
        <div className="flex flex-col gap-1">
          {q.options.map((opt, idx) => {
            const active = answers[q.id] === opt.id;
            const dotColor = MOOD_DOT_COLORS[opt.id] || fallbackDots[idx % fallbackDots.length];
            return (
              <button
                key={opt.id}
                onClick={() => choose(q.id, opt.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all duration-300 ${
                  active ? t.cardAlt : 'hover:bg-white/25'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                  <span className={t.heading}>{opt.label}</span>
                </span>
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-300"
                  style={{
                    boxShadow: `inset 0 0 0 1.5px ${active ? BRAND.deepIndigo : BRAND.lightGray}`,
                    backgroundColor: active ? BRAND.deepIndigo : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          className={`flex items-center gap-1 text-[11px] mt-5 ${t.textSoft} hover:opacity-70 transition`}
        >
          <ChevronLeft size={12} /> Back
        </button>
      )}
    </div>
  );
}

function Shell({ children, t }) {
  return (
    <div className="relative z-10 min-h-screen w-full flex items-center justify-center px-5 py-10 pb-28">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

/* =========================================================================
   WEB AUDIO — gentle synthesized tone as a stand-in for licensed audio
   ========================================================================= */

function useAmbientAudio() {
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  const mainGainRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [volume, setVolume] = useState(0.4);

  const ensureCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const stop = useCallback(() => {
    if (nodesRef.current) {
      try {
        nodesRef.current.forEach(n => { n.stop && n.stop(); n.disconnect && n.disconnect(); });
      } catch (e) {}
      nodesRef.current = null;
    }
    mainGainRef.current = null;
    setPlayingId(null);
  }, []);

  const fadeOut = useCallback((ms = 2500) => {
    const ctx = ctxRef.current;
    const gain = mainGainRef.current;
    if (!ctx || !gain) { stop(); return; }
    try {
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + ms / 1000);
    } catch (e) {}
    setTimeout(() => stop(), ms);
  }, [stop]);

  const makeNoiseBuffer = (ctx) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  };

  const play = useCallback((track) => {
    if (!track) { stop(); return; } // "No music"
    const ctx = ensureCtx();
    stop();
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.25;
    gain.connect(ctx.destination);
    mainGainRef.current = gain;

    if (track.noise) {
      const noise = ctx.createBufferSource();
      noise.buffer = makeNoiseBuffer(ctx);
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      if (track.noise === 'rain') { filter.type = 'highpass'; filter.frequency.value = 1200; }
      else if (track.noise === 'ocean') { filter.type = 'lowpass'; filter.frequency.value = 500; }
      else { filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 0.6; }
      noise.connect(filter);
      filter.connect(gain);
      const extra = [];
      if (track.noise === 'ocean') {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.15;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = volume * 0.15;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        extra.push(lfo, lfoGain);
      }
      noise.start();
      nodesRef.current = [noise, filter, gain, ...extra];
      setPlayingId(track.id);
      return;
    }

    const osc1 = ctx.createOscillator();
    osc1.type = track.tone;
    osc1.frequency.value = track.freq;
    const osc2 = ctx.createOscillator();
    osc2.type = track.tone;
    osc2.frequency.value = track.freq * 1.5;
    const gain2 = ctx.createGain();
    gain2.gain.value = 0.35;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = volume * 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc1.connect(gain);
    osc2.connect(gain2);
    gain2.connect(gain);
    osc1.start(); osc2.start(); lfo.start();

    nodesRef.current = [osc1, osc2, lfo, gain, gain2, lfoGain];
    setPlayingId(track.id);
  }, [volume, stop]);

  useEffect(() => {
    if (mainGainRef.current) mainGainRef.current.gain.value = volume * 0.25;
  }, [volume]);

  useEffect(() => () => stop(), [stop]);

  return { play, stop, fadeOut, playingId, volume, setVolume };
}

/* =========================================================================
   SCREEN 1 — INTRO
   ========================================================================= */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function IntroScreen({ onBegin, onFocus, onStats, onQuickReset, t, isDark, setIsDark, historyCount, streak, lastMood, todayCount }) {
  return (
    <Shell t={t}>
      <NavBar active="home" onHome={() => {}} onReset={onBegin} onFocus={onFocus} onStats={onStats} isDark={isDark} setIsDark={setIsDark} t={t} />

      <div className="flex flex-col items-center text-center gap-6" style={{ animation: 'screenIn 700ms cubic-bezier(0.16,1,0.3,1)' }}>
        <LuminousMark size={72} />
        <div>
          <h1 className={`text-2xl font-light mb-1 ${t.heading}`} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{greeting()}</h1>
          <p className={`text-sm ${t.textSoft}`}>Take a moment for yourself.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onBegin}
            className={`flex-1 px-6 py-3.5 rounded-full text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${t.button}`}
          >
            Begin a Reset <ChevronRight size={15} strokeWidth={1.8} />
          </button>
          <button
            onClick={onFocus}
            className={`flex-1 px-6 py-3.5 rounded-full text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${t.buttonGhost}`}
          >
            Focus Session <ChevronRight size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <div className={`rounded-2xl p-4 ${t.card}`}>
          <p className={`text-lg font-light ${t.heading}`}>{todayCount}</p>
          <p className={`text-[11px] mt-0.5 ${t.textSoft}`}>Today's sessions</p>
        </div>
        <div className={`rounded-2xl p-4 ${t.card}`}>
          <p className={`text-lg font-light ${t.heading}`}>{streak} day{streak === 1 ? '' : 's'}</p>
          <p className={`text-[11px] mt-0.5 ${t.textSoft}`}>Current streak</p>
        </div>
        <div className={`rounded-2xl p-4 ${t.card}`}>
          <p className={`text-lg font-light ${t.heading}`}>{lastMood || '—'}</p>
          <p className={`text-[11px] mt-0.5 ${t.textSoft}`}>Last mood</p>
        </div>
        <button onClick={onQuickReset} className={`rounded-2xl p-4 text-left transition hover:-translate-y-0.5 ${t.card}`}>
          <p className={`text-lg font-light ${t.heading}`}>Guide</p>
          <p className={`text-[11px] mt-0.5 ${t.textSoft}`}>Skip check-in →</p>
        </button>
      </div>

      {historyCount > 0 && (
        <p className={`text-xs text-center mt-6 ${t.textSoft}`}>{historyCount} past reflection{historyCount === 1 ? '' : 's'} saved on this device</p>
      )}
    </Shell>
  );
}

/* =========================================================================
   SCREEN 2 — PRE-SESSION CHECK-IN
   ========================================================================= */

function PreMoodScreen({ quizAnswers, setQuizAnswer, tensionAreas, toggleTensionArea, journal, setJournal, onContinue, onBack, nav, t }) {
  const quizComplete = MOOD_QUIZ.every(q => quizAnswers[q.id]);
  return (
    <Shell t={t}>
      {nav && <NavBar active="reset" {...nav} t={t} />}
      <ProgressDots step={0} t={t} />
      <div className={`mt-8 rounded-3xl p-8 ${t.card}`}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light text-center mb-1 ${t.heading}`}>How are you, right now?</h2>
        <p className={`text-xs text-center mb-6 ${t.textSoft}`}>A few quick questions — there's no wrong answer.</p>

        <MoodQuiz answers={quizAnswers} setAnswer={setQuizAnswer} t={t} />

        <div className="mt-8">
          <p className={`text-xs text-center mb-3 ${t.textSoft}`}>Any tension in your body right now?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TENSION_AREAS.map(area => {
              const active = tensionAreas.includes(area.id);
              return (
                <button
                  key={area.id}
                  onClick={() => toggleTensionArea(area.id)}
                  className={`px-3.5 py-2 rounded-full text-xs transition-all duration-300 ${
                    active ? 'bg-green-100/80 text-green-700 shadow-sm' : t.buttonGhost
                  }`}
                >
                  {area.label}
                </button>
              );
            })}
          </div>
          <p className={`text-[11px] text-center mt-2.5 ${t.textSoft}`}>Select as many as apply — we'll fold these into your recommendation.</p>
        </div>

        <div className="mt-8">
          <p className={`text-xs text-center mb-3 ${t.textSoft}`}>Brain Dump</p>
          <textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="Write whatever is on your mind, if you'd like…"
            rows={4}
            className={`w-full rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-200 transition ${t.input}`}
          />
          <p className={`text-[11px] mt-2.5 leading-relaxed ${t.textSoft}`}>
            Nothing written here is saved. This is a private space to empty your head before your session.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button onClick={onBack} className={`flex items-center gap-1 text-sm ${t.textSoft} hover:opacity-70 transition`}>
          <ChevronLeft size={15} /> Back
        </button>
        <button
          disabled={!quizComplete}
          onClick={onContinue}
          className={`px-7 py-3 rounded-full text-sm transition-all duration-300 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${t.button}`}
        >
          Continue <ChevronRight size={15} strokeWidth={1.8} />
        </button>
      </div>
    </Shell>
  );
}

/* =========================================================================
   GUIDED EXERCISE PLAYER
   ========================================================================= */

function lerpColor(a, b, f) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* -------- circular countdown ring, framing every diagram -------- */
function ProgressRing({ fraction, size = 176, strokeW = 5, t }) {
  const r = (size - strokeW) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.isDark ? '#26252E' : '#F1EEF7'} strokeWidth={strokeW} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth={strokeW} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - fraction)}
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#86EFAC" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* -------- one reusable body diagram, driven by a list of active regions -------- */
function BodyAwarenessDiagram({ activeRegions = [], t }) {
  const lineColor = t.isDark ? '#4B4A56' : '#D8D5E3';
  const accent = '#A78BFA';
  const on = (region) => activeRegions.includes(region);
  const stroke = (region) => (on(region) ? accent : lineColor);
  const width = (region) => (on(region) ? '2.6' : '2');

  return (
    <svg viewBox="0 0 120 168" className="relative w-40 h-56">
      {/* head */}
      <circle cx="60" cy="20" r="13" fill="none" stroke={stroke('head')} strokeWidth={width('head')} />
      {/* neck */}
      <line x1="60" y1="33" x2="60" y2="44" stroke={stroke('neck')} strokeWidth={width('neck')} strokeLinecap="round" />
      {/* shoulders */}
      <path d="M34,50 Q60,44 86,50" fill="none" stroke={stroke('shoulders')} strokeWidth={width('shoulders')} strokeLinecap="round" />
      {/* spine */}
      <line x1="60" y1="47" x2="60" y2="96" stroke={stroke('spine')} strokeWidth={width('spine')} strokeLinecap="round" />
      {/* arms + hands */}
      <line x1="36" y1="52" x2="26" y2="86" stroke={stroke('hands')} strokeWidth={width('hands')} strokeLinecap="round" />
      <line x1="84" y1="52" x2="94" y2="86" stroke={stroke('hands')} strokeWidth={width('hands')} strokeLinecap="round" />
      <circle cx="25" cy="90" r="3.4" fill="none" stroke={stroke('hands')} strokeWidth={width('hands')} />
      <circle cx="95" cy="90" r="3.4" fill="none" stroke={stroke('hands')} strokeWidth={width('hands')} />
      {/* pelvis */}
      <line x1="40" y1="96" x2="80" y2="96" stroke={stroke('pelvis')} strokeWidth={width('pelvis')} strokeLinecap="round" />
      {/* legs + feet */}
      <line x1="48" y1="96" x2="42" y2="148" stroke={stroke('feet')} strokeWidth={width('feet')} strokeLinecap="round" />
      <line x1="72" y1="96" x2="78" y2="148" stroke={stroke('feet')} strokeWidth={width('feet')} strokeLinecap="round" />
      <ellipse cx="36" cy="152" rx="8" ry="3.4" fill="none" stroke={stroke('feet')} strokeWidth={width('feet')} />
      <ellipse cx="84" cy="152" rx="8" ry="3.4" fill="none" stroke={stroke('feet')} strokeWidth={width('feet')} />
    </svg>
  );
}

function speak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 0.8;
    window.speechSynthesis.speak(u);
  } catch (e) { /* speech unavailable — safe to ignore */ }
}

function vibrate(pattern) {
  try {
    if (navigator && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch (e) { /* haptics unavailable — safe to ignore */ }
}

/* =========================================================================
   BACKGROUND MUSIC — reused by the Luminous Guide (optional, quiet)
   ========================================================================= */

function MusicPlayer({ audio, fadeOutEnabled, setFadeOutEnabled, t }) {
  const [selected, setSelected] = useState(null); // null = "No music"
  const isPlaying = selected && audio.playingId === selected.id;

  return (
    <div className={`rounded-2xl p-5 ${t.card}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs uppercase tracking-wider flex items-center gap-1.5 ${t.textSoft}`}>
          <Music size={12} strokeWidth={1.8} /> Background music
        </p>
        <button
          disabled={!selected}
          onClick={() => (isPlaying ? audio.stop() : audio.play(selected))}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed ${t.buttonGhost}`}
        >
          {isPlaying ? <Pause size={14} strokeWidth={1.8} /> : <Play size={14} strokeWidth={1.8} />}
        </button>
      </div>

      <select
        value={selected ? selected.id : ''}
        onChange={(e) => {
          if (!e.target.value) { setSelected(null); audio.stop(); return; }
          const track = TRACKS.find(tr => tr.id === e.target.value);
          setSelected(track);
          if (audio.playingId) audio.play(track);
        }}
        className={`w-full rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none ${t.input}`}
      >
        <option value="">No music</option>
        {MUSIC_CATEGORIES.map(cat => (
          <optgroup key={cat} label={cat}>
            {TRACKS.filter(tr => tr.category === cat).map(track => (
              <option key={track.id} value={track.id}>
                {track.title}{track.composer !== 'Nature sounds' ? ` — ${track.composer}` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className={`text-[11px] mb-4 ${t.textSoft}`}>
        {selected ? (selected.noise ? 'A gentle looping nature sound.' : 'A soft ambient tone inspired by this piece.') : 'Practice in silence.'}
      </p>

      <div className="flex items-center gap-3 mb-3">
        {audio.volume === 0 ? <VolumeX size={15} className={t.textSoft} /> : <Volume2 size={15} className={t.textSoft} />}
        <input
          type="range"
          min="0" max="1" step="0.01"
          value={audio.volume}
          onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
          className="w-full accent-sky-300"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={fadeOutEnabled}
          onChange={(e) => setFadeOutEnabled(e.target.checked)}
          className="accent-sky-300"
        />
        <span className={`text-[11px] ${t.textSoft}`}>Fade out at the end of the session</span>
      </label>
    </div>
  );
}

/* =========================================================================
   LUMINOUS GUIDE — AI-guided Alexander Technique / body-awareness lessons
   Every exercise walks: Notice -> Investigate -> Explore -> Compare -> Transfer.
   ========================================================================= */

// Calls the live model only for open-ended responses (typed or spoken).
// The reply is strictly grounded in the approved content for the current
// exercise + stage — the model is instructed not to introduce new techniques,
// never to call anything "wrong," and never to assert what the person feels.
//
// NOTE: this calls api.anthropic.com directly from the browser with no API
// key configured. There is no backend in this static deployment to hold a
// key safely, so this request will fail (missing auth / CORS) and the
// caller's catch block below shows a graceful fallback message instead.
async function askGuide(userText, exercise, stageId, levelId) {
  const stage = exercise.stages[stageId];
  const meta = AT_STAGE_META[stageId];
  const concept = AT_CONCEPTS[meta.concept];
  const system = `You are the Luminous Guide, a calm virtual Alexander Technique / body-awareness companion inside a wellness app.
You are guiding ONLY this exercise and this stage right now — do not introduce other exercises or techniques.

Exercise: "${exercise.name}"
Stage: ${meta.label} (relates to ${concept.name} — ${concept.short})
Approved prompt for this stage: ${stage.prompt}
Approved questions you can draw from: ${stage.questions.join(' / ')}
Guidance level: ${levelId}

Rules:
- Stay strictly grounded in the approved content above. Do not invent new techniques, stretches, or instructions.
- Keep your reply to 2-3 short, warm sentences. No headers, no lists.
- Never tell the person their posture, or anything about their body, is "wrong."
- Never assume or assert what the person is feeling — ask, don't tell.
- If they describe pain, dizziness, or injury, gently tell them to stop and that this app is not a substitute for a qualified Alexander Technique teacher or doctor.
- If they sound confused, simplify using everyday language, not technical terms.
- Never diagnose or give medical advice.
- Do not end with a question — the app already shows buttons for what happens next.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system,
      messages: [{ role: 'user', content: userText }],
    }),
  });
  const data = await res.json();
  const textBlock = (data.content || []).find(b => b.type === 'text');
  return textBlock ? textBlock.text.trim() : "Thank you for sharing that — continue whenever you're ready.";
}

// Minimal wrapper around the browser's SpeechRecognition API. Falls back
// gracefully — `supported` is false on browsers without it, and the caller
// already has a text input as the primary path either way.
function useSpeechToText() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const start = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, []);

  const stop = useCallback(() => {
    if (recRef.current) { try { recRef.current.stop(); } catch (e) {} }
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

function GuideLevelPicker({ level, setLevel, t }) {
  return (
    <div className="flex justify-center gap-2">
      {GUIDE_LEVELS.map(l => (
        <button
          key={l.id}
          onClick={() => setLevel(l.id)}
          className={`px-3.5 py-2 rounded-full text-xs transition-all duration-300 ${
            level === l.id ? 'bg-sky-100/80 text-sky-700 shadow-sm' : t.buttonGhost
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function ConceptBadge({ conceptId, t }) {
  const concept = AT_CONCEPTS[conceptId];
  if (!concept) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] ${t.purple}`}>
      <Compass size={11} strokeWidth={1.8} />
      {concept.name}
    </div>
  );
}

function AwarenessLibrary({ moodCategory, savedEntries, level, setLevel, audio, fadeOutEnabled, setFadeOutEnabled, onSelect, onExit, nav, t }) {
  const category = MOOD_CATEGORIES.find(c => c.id === moodCategory);
  const lastEntry = savedEntries && savedEntries[0];
  const lastTension = lastEntry && lastEntry.tensionAreas && lastEntry.tensionAreas[0];
  const lastTensionLabel = lastTension ? (TENSION_AREAS.find(a => a.id === lastTension) || {}).label : null;

  let opening = "Let's take this gently and see how your body is doing today.";
  if (category && category.id !== 'calm') {
    opening = `You mentioned feeling ${category.label.split(' / ')[0].toLowerCase()} today — we'll go slowly.`;
  }

  return (
    <Shell t={t}>
      {nav && <NavBar active="reset" {...nav} t={t} />}
      <div className="flex flex-col items-center text-center gap-3 mb-6">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${t.purple}`}>
          <Compass size={18} strokeWidth={1.7} />
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light ${t.heading}`}>Luminous Guide</h2>
        <p className={`text-xs max-w-xs ${t.textSoft}`}>{opening}</p>
        {lastTensionLabel && (
          <p className={`text-[11px] ${t.textSoft}`}>Last time you mentioned tension in your {lastTensionLabel.toLowerCase()} — we'll keep an eye on that.</p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mb-6">
        {AT_EXERCISES.map(ex => (
          <button
            key={ex.id}
            onClick={() => onSelect(ex.id)}
            className={`text-left rounded-2xl p-4 transition hover:-translate-y-0.5 ${t.card}`}
          >
            <p className={`text-sm ${t.heading}`}>{ex.name}</p>
            <p className={`text-xs mt-0.5 ${t.textSoft}`}>{ex.blurb}</p>
          </button>
        ))}
      </div>

      <div className={`rounded-3xl p-6 mb-4 ${t.card}`}>
        <p className={`text-xs text-center mb-3 ${t.textSoft}`}>How much guidance would you like?</p>
        <GuideLevelPicker level={level} setLevel={setLevel} t={t} />
      </div>

      <MusicPlayer audio={audio} fadeOutEnabled={fadeOutEnabled} setFadeOutEnabled={setFadeOutEnabled} t={t} />

      <div className={`rounded-2xl p-4 mt-4 mb-6 flex gap-2.5 ${t.cardAlt}`}>
        <ShieldAlert size={14} className={`flex-shrink-0 mt-0.5 ${t.textSoft}`} strokeWidth={1.7} />
        <p className={`text-[11px] leading-relaxed ${t.textSoft}`}>
          This is an educational wellness tool, guided one step at a time — it isn't a substitute for a qualified,
          hands-on Alexander Technique teacher. If anything feels painful, stop and rest.
        </p>
      </div>

      <button onClick={onExit} className={`flex items-center gap-1 text-sm ${t.textSoft} hover:opacity-70 transition`}>
        <ChevronLeft size={15} /> Back
      </button>
    </Shell>
  );
}

function AwarenessStage({ exercise, stageId, stageIndex, level, onNextStage, onExit, t }) {
  const stage = exercise.stages[stageId];
  const meta = AT_STAGE_META[stageId];
  const [responseText, setResponseText] = useState('');
  const [guideReply, setGuideReply] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const stt = useSpeechToText();

  useEffect(() => {
    setResponseText('');
    setGuideReply(null);
    if (voiceOn) speak(stage.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id, stageId]);

  async function send() {
    if (!responseText.trim() || thinking) return;
    setThinking(true);
    try {
      const reply = await askGuide(responseText.trim(), exercise, stageId, level);
      setGuideReply(reply);
      if (voiceOn) speak(reply);
    } catch (e) {
      setGuideReply("I couldn't reach your guide just now — take your time, and continue whenever you're ready.");
    }
    setThinking(false);
  }

  function toggleMic() {
    if (stt.listening) { stt.stop(); return; }
    stt.start((text) => setResponseText(text));
  }

  const detected = detectRegions(guideReply);
  const activeRegions = detected.length > 0 ? detected : stage.regions;
  const question = stage.questions[0];

  return (
    <div style={{ animation: 'screenIn 650ms cubic-bezier(0.16,1,0.3,1)' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onExit} className={`text-sm flex items-center gap-1 ${t.textSoft} hover:opacity-70 transition`}>
          <ChevronLeft size={15} />
        </button>
        <span className={`text-xs tabular-nums tracking-wide ${t.textSoft}`}>
          {String(stageIndex + 1).padStart(2, '0')} / {String(AT_STAGES.length).padStart(2, '0')}
        </span>
      </div>
      <p className={`text-center text-[11px] uppercase tracking-[0.3em] mb-1 ${t.textSoft}`}>{meta.label}</p>
      <p className={`text-center text-[11px] mb-7 ${t.textSoft}`}>{exercise.name}</p>

      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative flex items-center justify-center py-2">
          <div
            className="absolute rounded-full blur-2xl opacity-50"
            style={{ width: 190, height: 190, background: `radial-gradient(circle, ${BRAND.mistBlue}, transparent 70%)`, animation: 'orbPulse 5s ease-in-out infinite' }}
          />
          <BodyAwarenessDiagram activeRegions={activeRegions} t={t} />
        </div>

        <p className={`text-sm max-w-xs ${t.text}`}>{stage.prompt}</p>

        {!guideReply && (
          <>
            <p className={`text-sm ${t.heading}`}>{question}</p>
            <div className="w-full max-w-xs flex items-center gap-2">
              {stt.supported && (
                <button
                  onClick={toggleMic}
                  title={stt.listening ? 'Stop listening' : 'Speak your answer'}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                    stt.listening ? 'bg-sky-100/80 text-sky-700 shadow-sm' : t.buttonGhost
                  }`}
                >
                  <Mic size={14} strokeWidth={1.8} />
                </button>
              )}
              <input
                type="text"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                placeholder={stt.listening ? 'Listening…' : 'Speak or type what you notice…'}
                className={`flex-1 rounded-full px-3.5 py-2 text-xs focus:outline-none ${t.input}`}
              />
              <button onClick={send} disabled={thinking} className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition ${t.buttonGhost}`}>
                <Send size={12} strokeWidth={1.8} />
              </button>
            </div>
            {thinking && <p className={`text-xs ${t.textSoft}`}>Your guide is listening…</p>}
            <button onClick={onNextStage} className={`text-[11px] ${t.textSoft} hover:opacity-70 transition`}>
              Skip — continue without answering
            </button>
          </>
        )}

        {guideReply && (
          <>
            <div className={`flex items-start gap-2 rounded-2xl p-4 max-w-xs text-left ${t.cardAlt}`}>
              <MessageCircle size={14} className={`flex-shrink-0 mt-0.5 ${t.textSoft}`} strokeWidth={1.7} />
              <p className={`text-sm ${t.text}`}>{guideReply}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {setGuideReply(null); setResponseText('');}} className={`px-4 py-2.5 rounded-full text-xs transition ${t.buttonGhost}`}>
                Say more
              </button>
              <button onClick={onNextStage} className={`px-4 py-2.5 rounded-full text-xs transition ${t.button}`}>
                Continue
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setVoiceOn(v => !v)}
          className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full transition ${
            voiceOn ? 'bg-sky-100/70 text-sky-700 shadow-sm' : t.buttonGhost
          }`}
        >
          {voiceOn ? <Volume2 size={12} /> : <VolumeX size={12} />} Voice
        </button>
      </div>
    </div>
  );
}

function LuminousGuideComplete({ exercise, onAnother, onContinue, t }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-8" style={{ animation: 'screenIn 650ms cubic-bezier(0.16,1,0.3,1)' }}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${t.purple}`}>
        <Compass size={20} strokeWidth={1.7} />
      </div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light ${t.heading}`}>Well done.</h2>
      <p className={`text-sm max-w-xs ${t.text}`}>
        You moved through {exercise ? exercise.name.toLowerCase() : 'this exercise'} from noticing all the way to transfer —
        carrying a little more awareness with you. Trusting this process, rather than chasing a "correct" result, is the whole practice.
      </p>
      <div className="flex gap-2">
        <button onClick={onAnother} className={`px-5 py-3 rounded-full text-sm transition ${t.buttonGhost}`}>Try another exercise</button>
        <button onClick={onContinue} className={`px-6 py-3 rounded-full text-sm transition ${t.button}`}>Continue to reflection</button>
      </div>
    </div>
  );
}

function LuminousGuideFlow({ moodCategory, savedEntries, onFinish, onExit, onExerciseComplete, nav, t }) {
  const [phase, setPhase] = useState('library'); // library | stage | complete
  const [exerciseId, setExerciseId] = useState(null);
  const [level, setLevel] = useState('balanced');
  const [stageIndex, setStageIndex] = useState(0);
  const [fadeOutEnabled, setFadeOutEnabled] = useState(true);
  const audio = useAmbientAudio();

  const exercise = AT_EXERCISES.find(e => e.id === exerciseId);

  function endMusic() {
    if (fadeOutEnabled && audio.playingId) audio.fadeOut();
    else audio.stop();
  }
  function selectExercise(id) {
    setExerciseId(id);
    setStageIndex(0);
    setPhase('stage');
  }
  function nextStage() {
    if (stageIndex + 1 >= AT_STAGES.length) {
      if (onExerciseComplete) onExerciseComplete(exerciseId);
      setPhase('complete');
      return;
    }
    setStageIndex(i => i + 1);
  }
  function anotherExercise() {
    setExerciseId(null);
    setStageIndex(0);
    setPhase('library');
  }
  function exitAll() {
    endMusic();
    onExit();
  }
  function finishToReflection() {
    endMusic();
    onFinish();
  }

  let content;
  if (phase === 'library') {
    content = (
      <AwarenessLibrary
        moodCategory={moodCategory} savedEntries={savedEntries}
        level={level} setLevel={setLevel}
        audio={audio} fadeOutEnabled={fadeOutEnabled} setFadeOutEnabled={setFadeOutEnabled}
        onSelect={selectExercise}
        onExit={exitAll}
        nav={nav}
        t={t}
      />
    );
  } else if (phase === 'stage') {
    content = (
      <Shell t={t}>
        <AwarenessStage
          key={exerciseId + '-' + stageIndex}
          exercise={exercise}
          stageId={AT_STAGES[stageIndex]}
          stageIndex={stageIndex}
          level={level}
          onNextStage={nextStage}
          onExit={exitAll}
          t={t}
        />
      </Shell>
    );
  } else {
    content = (
      <Shell t={t}>
        <LuminousGuideComplete exercise={exercise} onAnother={anotherExercise} onContinue={finishToReflection} t={t} />
      </Shell>
    );
  }

  return <div key={phase + '-' + exerciseId} className="luminous-screen">{content}</div>;
}

/* =========================================================================
   SCREEN 4 — POST-SESSION REFLECTION
   ========================================================================= */

const REFLECTION_PROMPTS = ['What helped?', 'What are you feeling now?', 'What do you need next?'];
const REFLECTION_TAGS = ['School', 'Stress', 'Sleep', 'Focus', 'Personal', 'Other'];

function PostMoodScreen({ preMoodCategory, mood, setMood, reflection, setReflection, tags, toggleTag, onSave, onRestart, onStartStudy, saved, nav, t }) {
  const preCategory = MOOD_CATEGORIES.find(c => c.id === preMoodCategory);
  const PreIcon = preCategory ? preCategory.icon : Leaf;
  return (
    <Shell t={t}>
      {nav && <NavBar active="reset" {...nav} t={t} />}
      <ProgressDots step={2} t={t} />
      <div className={`mt-8 rounded-3xl p-8 ${t.card}`}>
        <p className={`text-xs uppercase tracking-wider text-center mb-2 ${t.textSoft}`}>Reflection</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light text-center mb-1 ${t.heading}`}>How do you feel now?</h2>
        <p className={`text-xs text-center mb-5 ${t.textSoft}`}>Rate how you're feeling after your session.</p>

        {preCategory && (
          <div className="flex justify-center mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs ${t.purple}`}>
              <PreIcon size={13} strokeWidth={1.7} />
              You began feeling {preCategory.label.split(' / ')[0].toLowerCase()}
            </div>
          </div>
        )}

        <MoodPicker value={mood} onChange={setMood} t={t} />

        <div className="mt-8">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {REFLECTION_PROMPTS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setReflection(r => (r ? `${r}\n\n${p} ` : `${p} `))}
                className={`text-[11px] px-2.5 py-1 rounded-full transition ${t.buttonGhost}`}
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Any reflections from your session? These notes are saved on this device."
            rows={4}
            className={`w-full rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200 transition ${t.input}`}
          />
          <p className={`text-[11px] mt-2.5 ${t.textSoft}`}>
            {saved ? 'Saved to this device.' : 'This reflection is saved locally, only on this device.'}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {REFLECTION_TAGS.map(tag => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full transition ${
                    active ? 'bg-sky-100/80 text-sky-700 shadow-sm' : t.buttonGhost
                  }`}
                >
                  <Tag size={10} strokeWidth={1.8} /> {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-6">
        <button onClick={onRestart} className={`px-6 py-3 rounded-full text-sm transition ${t.buttonGhost}`}>
          New session
        </button>
        <button
          disabled={mood === null}
          onClick={onSave}
          className={`px-7 py-3 rounded-full text-sm transition disabled:opacity-30 disabled:cursor-not-allowed ${t.button}`}
        >
          {saved ? 'Saved' : 'Save & finish'}
        </button>
      </div>

      <button
        onClick={onStartStudy}
        className={`w-full flex items-center justify-center gap-2 mt-4 py-3.5 rounded-full text-sm transition ${t.buttonGhost}`}
      >
        Ready to focus? Start a study session <ChevronRight size={14} strokeWidth={1.8} />
      </button>
    </Shell>
  );
}

/* =========================================================================
   STATS / PROGRESS
   ========================================================================= */

function StatCard({ label, value, t }) {
  return (
    <div className={`rounded-2xl p-4 ${t.card}`}>
      <p className={`text-lg font-light ${t.heading}`}>{value}</p>
      <p className={`text-[11px] mt-0.5 ${t.textSoft}`}>{label}</p>
    </div>
  );
}

function entryPreCategory(entry) {
  if (entry.preMoodCategory) return entry.preMoodCategory;
  if (entry.preLandscape) return nearestMoodCategory(entry.preLandscape);
  return null;
}
function entryPreScore(entry) {
  const cat = entryPreCategory(entry);
  if (cat && MOOD_CATEGORY_SCORE[cat] !== undefined) return MOOD_CATEGORY_SCORE[cat];
  if (entry.preLandscape) return wellbeingScore(entry.preLandscape);
  return null;
}
function entryPostFaceLevel(entry) {
  if (typeof entry.postMood === 'number') return entry.postMood;
  if (entry.postLandscape) return Math.round(wellbeingScore(entry.postLandscape) / 25);
  return null;
}
function entryPostScore(entry) {
  const level = entryPostFaceLevel(entry);
  if (level !== null) return level * 25;
  return null;
}

function StatsScreen({ savedEntries, nav, isDark, setIsDark, t }) {
  const [studyLog, setStudyLog] = useState([]);
  const [exerciseCounts, setExerciseCounts] = useState({});
  const [showAllReflections, setShowAllReflections] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const studyRes = await storage.get('luminous_study_log').catch(() => null);
        if (studyRes && studyRes.value) setStudyLog(JSON.parse(studyRes.value));
      } catch (e) {}
      try {
        const countRes = await storage.get('luminous_exercise_counts').catch(() => null);
        if (countRes && countRes.value) setExerciseCounts(JSON.parse(countRes.value));
      } catch (e) {}
    })();
  }, []);

  const totalSessions = savedEntries.length;
  const totalStudyMinutes = studyLog.reduce((sum, s) => sum + s.studyMin * (s.rounds || 1), 0);
  const totalPomodoros = studyLog.reduce((sum, s) => sum + (s.rounds || 1), 0);
  const moodList = savedEntries.map(entryPreCategory).filter(Boolean);
  const mostCommonMoodId = mostCommon(moodList);
  const mostCommonMood = MOOD_CATEGORIES.find(c => c.id === mostCommonMoodId);
  const exerciseEntries = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1]);
  const mostUsedExercise = exerciseEntries.length > 0 ? AT_EXERCISES.find(e => e.id === exerciseEntries[0][0]) : null;
  const preScores = savedEntries.map(entryPreScore).filter(s => s !== null);
  const postScores = savedEntries.map(entryPostScore).filter(s => s !== null);
  const avgBefore = preScores.length ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length) : null;
  const avgAfter = postScores.length ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length) : null;
  const streak = computeStreak(savedEntries);
  const latest = savedEntries[0];
  const latestPreCategory = latest ? MOOD_CATEGORIES.find(c => c.id === entryPreCategory(latest)) : null;
  const latestPostLevel = latest ? entryPostFaceLevel(latest) : null;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekCounts = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(today.getTime() - (6 - i) * 86400000);
    const count = [...savedEntries, ...studyLog].filter(e => new Date(e.date).toDateString() === day.toDateString()).length;
    return { label: day.toLocaleDateString(undefined, { weekday: 'narrow' }), count };
  });
  const maxWeekCount = Math.max(1, ...weekCounts.map(w => w.count));

  return (
    <Shell t={t}>
      {nav && <NavBar active="stats" {...nav} t={t} />}

      <div className="mb-6 text-center">
        <p className={`text-xs uppercase tracking-wider mb-2 ${t.textSoft}`}>Stats</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light ${t.heading}`}>Your patterns over time</h2>
      </div>

      {latest && (latestPreCategory || latestPostLevel !== null) && (
        <div className={`rounded-3xl p-6 mb-5 ${t.card}`}>
          <p className={`text-xs uppercase tracking-wider mb-4 text-center ${t.textSoft}`}>Before → Session → After</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs ${t.purple}`}>
              {latestPreCategory && (() => { const Icon = latestPreCategory.icon; return <Icon size={12} strokeWidth={1.7} />; })()}
              {latestPreCategory ? latestPreCategory.label.split(' / ')[0] : 'Before'}
            </div>
            <Sparkles size={14} className="text-sky-300 flex-shrink-0" />
            <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs ${t.green}`}>
              {latestPostLevel !== null && <FaceIcon level={latestPostLevel} active size={14} t={t} />}
              {latestPostLevel !== null ? ['Low', 'Meh', 'Okay', 'Good', 'Great'][latestPostLevel] : 'After'}
            </div>
          </div>
          <p className={`text-[11px] text-center mt-3 ${t.textSoft}`}>Your most recent session</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard label="Total sessions" value={totalSessions} t={t} />
        <StatCard label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} t={t} />
        <StatCard label="Study time" value={`${totalStudyMinutes}m`} t={t} />
        <StatCard label="Pomodoros" value={totalPomodoros} t={t} />
      </div>

      <div className={`rounded-3xl p-6 mb-5 ${t.card}`}>
        <p className={`text-xs uppercase tracking-wider mb-4 ${t.textSoft}`}>Weekly activity</p>
        <div className="flex items-end justify-between gap-2 h-20">
          {weekCounts.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md transition-all duration-700"
                style={{ background: `linear-gradient(to top, ${BRAND.mistBlue}, ${BRAND.sageGreen})`, height: `${Math.max(6, (w.count / maxWeekCount) * 100)}%` }}
              />
              <span className={`text-[10px] ${t.textSoft}`}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl p-6 mb-5 ${t.card}`}>
        <p className={`text-xs uppercase tracking-wider mb-3 ${t.textSoft}`}>Patterns</p>
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between"><span className={t.textSoft}>Most common mood</span><span className={t.heading}>{mostCommonMood ? mostCommonMood.label : '—'}</span></div>
          <div className="flex justify-between"><span className={t.textSoft}>Most-used exercise</span><span className={t.heading}>{mostUsedExercise ? mostUsedExercise.name : '—'}</span></div>
          <div className="flex justify-between"><span className={t.textSoft}>Avg. mood before</span><span className={t.heading}>{avgBefore !== null ? `${avgBefore}/100` : '—'}</span></div>
          <div className="flex justify-between"><span className={t.textSoft}>Avg. mood after</span><span className={t.heading}>{avgAfter !== null ? `${avgAfter}/100` : '—'}</span></div>
        </div>
      </div>

      <div className={`rounded-3xl p-6 ${t.card}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs uppercase tracking-wider flex items-center gap-1.5 ${t.textSoft}`}><History size={12} strokeWidth={1.8} /> Reflection history</p>
          {savedEntries.length > 3 && (
            <button onClick={() => setShowAllReflections(s => !s)} className={`text-[11px] ${t.textSoft} hover:opacity-70 transition`}>
              {showAllReflections ? 'Show less' : 'View all'}
            </button>
          )}
        </div>
        {savedEntries.length === 0 ? (
          <p className={`text-xs ${t.textSoft}`}>No reflections saved yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(showAllReflections ? savedEntries : savedEntries.slice(0, 3)).map((e, i) => (
              <div key={i} className={`rounded-xl p-3 ${t.cardAlt}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] ${t.textSoft}`}>{new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  {e.tags && e.tags.length > 0 && <span className={`text-[10px] ${t.textSoft}`}>{e.tags.join(' · ')}</span>}
                </div>
                {e.reflection && <p className={`text-xs ${t.heading}`}>{e.reflection}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

/* =========================================================================
   STUDY / POMODORO
   ========================================================================= */

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function Stepper({ label, value, onChange, step = 5, min = 0, max = 180, t }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${t.heading}`}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${t.buttonGhost}`}
        >
          <Minus size={13} strokeWidth={1.8} />
        </button>
        <span className={`text-base w-14 text-center tabular-nums ${t.heading}`}>{value}<span className={`text-xs ${t.textSoft}`}> min</span></span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${t.buttonGhost}`}
        >
          <Plus size={13} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

const POMODORO_PRESETS = [
  { name: 'Quick Focus', study: 15, brk: 5 },
  { name: 'Classic Pomodoro', study: 25, brk: 5 },
  { name: 'Deep Focus', study: 50, brk: 10 },
];

function PomodoroSetup({ studyMin, setStudyMin, breakMin, setBreakMin, onContinue, onExit, nav, t }) {
  const matchedPreset = POMODORO_PRESETS.find(p => p.study === studyMin && p.brk === breakMin);
  return (
    <Shell t={t}>
      {nav && <NavBar active="focus" {...nav} t={t} />}
      <div className="flex flex-col items-center text-center gap-2 mb-8">
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light ${t.heading}`}>Set up your study session</h2>
        <p className={`text-xs max-w-xs ${t.textSoft}`}>Choose how long you'll study, and how long you'll rest after.</p>
      </div>

      <div className={`rounded-3xl p-7 ${t.card}`}>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {POMODORO_PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => { setStudyMin(p.study); setBreakMin(p.brk); }}
              className={`text-[11px] px-3 py-1.5 rounded-full transition ${
                matchedPreset && matchedPreset.name === p.name ? 'bg-sky-100/80 text-sky-700 shadow-sm' : t.buttonGhost
              }`}
            >
              {p.name} · {p.study}/{p.brk}
            </button>
          ))}
          <button
            onClick={() => { setStudyMin(20); setBreakMin(5); }}
            className={`text-[11px] px-3 py-1.5 rounded-full transition ${
              !matchedPreset ? 'bg-sky-100/80 text-sky-700 shadow-sm' : t.buttonGhost
            }`}
          >
            Custom
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <Stepper label="Study time" value={studyMin} onChange={setStudyMin} step={5} min={5} max={120} t={t} />
          <Stepper label="Break time" value={breakMin} onChange={setBreakMin} step={5} min={0} max={30} t={t} />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button onClick={onExit} className={`flex items-center gap-1 text-sm ${t.textSoft} hover:opacity-70 transition`}>
          <ChevronLeft size={15} /> Back
        </button>
        <button onClick={onContinue} className={`px-7 py-3 rounded-full text-sm transition flex items-center gap-2 ${t.button}`}>
          Continue <ChevronRight size={15} strokeWidth={1.8} />
        </button>
      </div>
    </Shell>
  );
}

function PrepScreen({ secondsLeft, goal, setGoal, onReady, t }) {
  return (
    <Shell t={t}>
      <div className="flex flex-col items-center text-center gap-1 mb-6">
        <p className={`text-xs uppercase tracking-wider ${t.textSoft}`}>Before you begin</p>
        <p className={`text-4xl font-light tabular-nums mt-2 ${t.heading}`}>{fmt(secondsLeft)}</p>
      </div>

      <div className={`rounded-3xl p-7 ${t.card}`}>
        <ul className="flex flex-col gap-3 mb-6">
          {[
            'Put your phone and other distractions away.',
            'Get a drink of water nearby.',
            'Write down what you hope to accomplish.',
          ].map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${t.purple}`}>
                <span className="text-[11px]">{i + 1}</span>
              </span>
              <span className={`text-sm ${t.text}`}>{line}</span>
            </li>
          ))}
        </ul>

        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What do you hope to accomplish this session?"
          rows={3}
          className={`w-full rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-200 transition ${t.input}`}
        />
      </div>

      <div className="flex justify-center mt-6">
        <button onClick={onReady} className={`px-8 py-3.5 rounded-full text-sm transition flex items-center gap-2 ${t.button}`}>
          I'm ready — start now <ChevronRight size={15} strokeWidth={1.8} />
        </button>
      </div>
    </Shell>
  );
}

function FocusTimer({ label, secondsLeft, totalSeconds, paused, onPauseToggle, onEndEarly, t }) {
  const fraction = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  return (
    <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center px-6">
      <p className={`text-xs uppercase tracking-[0.2em] mb-6 ${t.textSoft}`}>{label}</p>
      <p
        className={`font-extralight tabular-nums leading-none ${t.heading}`}
        style={{ fontSize: 'clamp(4.5rem, 18vw, 8.5rem)', letterSpacing: '-0.02em' }}
      >
        {fmt(secondsLeft)}
      </p>
      <div className={`w-40 h-1 rounded-full overflow-hidden mt-8 ${t.isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
        <div className="h-full transition-all duration-700" style={{ width: `${(1 - fraction) * 100}%`, background: `linear-gradient(to right, ${BRAND.mistBlue}, ${BRAND.sageFog}, ${BRAND.sageGreen})` }} />
      </div>

      <div className="flex items-center gap-4 mt-10 opacity-40 hover:opacity-100 transition-opacity duration-300">
        <button onClick={onPauseToggle} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${t.buttonGhost}`}>
          {paused ? <Play size={15} strokeWidth={1.6} /> : <Pause size={15} strokeWidth={1.6} />}
        </button>
        <button onClick={onEndEarly} className={`text-xs ${t.textSoft} hover:opacity-70 transition`}>End early</button>
      </div>
    </div>
  );
}

function StudyReflectScreen({ studyMin, rounds, goal, mood, setMood, focusRating, setFocusRating, onFinish, saved, t }) {
  return (
    <Shell t={t}>
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <LuminousMark size={56} />
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light ${t.heading}`}>
          Well done — you focused for {studyMin * rounds} minute{studyMin * rounds === 1 ? '' : 's'}
          {rounds > 1 ? ` across ${rounds} rounds` : ''}.
        </h2>
        {goal && <p className={`text-xs max-w-xs ${t.textSoft}`}>Your goal was: "{goal}"</p>}
      </div>

      <div className={`rounded-3xl p-8 ${t.card}`}>
        <h3 className={`text-sm font-light text-center mb-5 ${t.heading}`}>How do you feel now?</h3>
        <MoodPicker value={mood} onChange={setMood} t={t} />

        <div className="mt-8">
          <div className="flex justify-between items-baseline mb-1.5">
            <p className={`text-xs ${t.textSoft}`}>How focused were you?</p>
            <span className={`text-xs tabular-nums ${t.heading}`}>{focusRating} / 10</span>
          </div>
          <input
            type="range" min="1" max="10"
            value={focusRating}
            onChange={(e) => setFocusRating(parseInt(e.target.value, 10))}
            className="w-full accent-sky-300"
          />
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          disabled={mood === null}
          onClick={onFinish}
          className={`px-8 py-3.5 rounded-full text-sm transition disabled:opacity-30 disabled:cursor-not-allowed ${t.button}`}
        >
          {saved ? 'Saved — finish' : 'Finish'}
        </button>
      </div>
    </Shell>
  );
}

function RoundCheckScreen({ roundsCompleted, onAnother, onDone, t }) {
  return (
    <Shell t={t}>
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${t.card}`} style={{ boxShadow: `inset 0 0 0 1.5px ${BRAND.sageFog}` }}>
          <span className={`text-lg font-light ${t.heading}`}>{roundsCompleted}</span>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} className={`text-xl font-light ${t.heading}`}>
          {roundsCompleted === 1 ? 'One round complete.' : `${roundsCompleted} rounds complete.`}
        </h2>
        <p className={`text-xs max-w-xs ${t.textSoft}`}>Ready for another round, or would you like to stop here?</p>
        <div className="flex gap-3 mt-2">
          <button onClick={onDone} className={`px-6 py-3 rounded-full text-sm transition ${t.buttonGhost}`}>
            I'm done
          </button>
          <button onClick={onAnother} className={`px-6 py-3 rounded-full text-sm transition ${t.button}`}>
            Another round
          </button>
        </div>
      </div>
    </Shell>
  );
}

function PomodoroFlow({ t, onExit, nav }) {
  const [stage, setStage] = useState('setup'); // setup | prep | study | break | roundCheck | reflect
  const [studyMin, setStudyMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [goal, setGoal] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [paused, setPaused] = useState(false);
  const [mood, setMood] = useState(null);
  const [focusRating, setFocusRating] = useState(7);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [saved, setSaved] = useState(false);

  const durationFor = (s) => (s === 'prep' ? 300 : s === 'study' ? studyMin * 60 : s === 'break' ? breakMin * 60 : 0);

  function goToStage(next) {
    setPaused(false);
    setSecondsLeft(durationFor(next));
    setStage(next);
  }

  function finishRound() {
    setRoundsCompleted(r => r + 1);
    setStage('roundCheck');
  }

  useEffect(() => {
    if (!['prep', 'study', 'break'].includes(stage) || paused) return;
    const iv = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setTimeout(() => {
            if (stage === 'prep') goToStage('study');
            else if (stage === 'study') (breakMin > 0 ? goToStage('break') : finishRound());
            else if (stage === 'break') finishRound();
          }, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, paused, breakMin]);

  async function handleFinish() {
    const entry = {
      date: new Date().toISOString(),
      studyMin, breakMin, rounds: Math.max(1, roundsCompleted),
      goal: goal.trim(), mood, focusRating,
    };
    setSaved(true);
    try {
      const res = await storage.get('luminous_study_log').catch(() => null);
      const list = res && res.value ? JSON.parse(res.value) : [];
      const updated = [entry, ...list].slice(0, 30);
      await storage.set('luminous_study_log', JSON.stringify(updated));
    } catch (e) {
      // storage unavailable — the session still happened
    }
    onExit();
  }

  let content;
  if (stage === 'setup') {
    content = (
      <PomodoroSetup
        studyMin={studyMin} setStudyMin={setStudyMin}
        breakMin={breakMin} setBreakMin={setBreakMin}
        onContinue={() => goToStage('prep')}
        onExit={onExit}
        nav={nav}
        t={t}
      />
    );
  } else if (stage === 'prep') {
    content = <PrepScreen secondsLeft={secondsLeft} goal={goal} setGoal={setGoal} onReady={() => goToStage('study')} t={t} />;
  } else if (stage === 'study') {
    content = (
      <FocusTimer
        label="Study" secondsLeft={secondsLeft} totalSeconds={studyMin * 60}
        paused={paused} onPauseToggle={() => setPaused(p => !p)}
        onEndEarly={() => (breakMin > 0 ? goToStage('break') : finishRound())}
        t={t}
      />
    );
  } else if (stage === 'break') {
    content = (
      <FocusTimer
        label="Break" secondsLeft={secondsLeft} totalSeconds={breakMin * 60}
        paused={paused} onPauseToggle={() => setPaused(p => !p)}
        onEndEarly={finishRound}
        t={t}
      />
    );
  } else if (stage === 'roundCheck') {
    content = (
      <RoundCheckScreen
        roundsCompleted={roundsCompleted}
        onAnother={() => goToStage('study')}
        onDone={() => setStage('reflect')}
        t={t}
      />
    );
  } else {
    content = (
      <StudyReflectScreen
        studyMin={studyMin} rounds={Math.max(1, roundsCompleted)} goal={goal}
        mood={mood} setMood={setMood}
        focusRating={focusRating} setFocusRating={setFocusRating}
        onFinish={handleFinish} saved={saved} t={t}
      />
    );
  }

  return <div key={stage} className="luminous-screen">{content}</div>;
}

/* -------- opening / splash screen -------- */
function SplashScreen({ onBegin, t }) {
  return (
    <div className="relative z-10 min-h-screen w-full flex flex-col items-center justify-center px-6 text-center">
      <div className="relative w-56 h-56 sm:w-72 sm:h-72 mb-10 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-70"
          style={{ background: `conic-gradient(from 0deg, ${BRAND.mistBlue}, ${BRAND.sageGreen}, ${BRAND.sageFog}, ${BRAND.mistBlue})`, animation: 'orbSpin 18s linear infinite' }}
        />
        <div
          className="absolute inset-8 rounded-full blur-xl opacity-80"
          style={{ background: `conic-gradient(from 90deg, ${BRAND.sageGreen}, ${BRAND.sageFog}, ${BRAND.mistBlue}, ${BRAND.sageGreen})`, animation: 'orbSpin 24s linear infinite reverse' }}
        />
        <div style={{ animation: 'orbPulse 6s ease-in-out infinite' }}>
          <LuminousMark size={140} />
        </div>
      </div>
      <p className={`text-3xl sm:text-5xl mb-3 tracking-[0.25em] ${t.heading}`} style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>LUMINOUS</p>
      <p className={`text-lg sm:text-2xl mb-8 ${t.textSoft}`}>Find a little space to breathe.</p>
      <div className="w-8 h-px mb-8" style={{ backgroundColor: BRAND.lightGray, opacity: 0.6 }} />
      <p className={`text-base sm:text-xl leading-relaxed mb-12 ${t.textSoft}`}>A moment for you.<br />A lifetime of clarity.</p>
      <button
        onClick={onBegin}
        className={`px-9 sm:px-12 py-3.5 sm:py-4.5 rounded-full text-sm sm:text-lg tracking-wide transition-all duration-300 ${t.button}`}
      >
        Begin
      </button>
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */

export default function LuminousApp() {
  const { isDark, setIsDark, t } = useTheme();
  t.isDark = isDark;
  useBrandFonts();

  const [screen, setScreen] = useState('splash'); // splash | intro | preMood | guide | postMood | pomodoro | stats
  const [quizAnswers, setQuizAnswers] = useState({}); // { feeling, energy, stress, focus, need }
  const [postMood, setPostMood] = useState(null); // 0-4 face level, after session
  const [tensionAreas, setTensionAreas] = useState([]);
  const [journal, setJournal] = useState('');
  const [reflection, setReflection] = useState('');
  const [tags, setTags] = useState([]);
  const [savedEntries, setSavedEntries] = useState([]);
  const [justSaved, setJustSaved] = useState(false);

  const moodCategory = FEELING_TO_CATEGORY[quizAnswers.feeling] || 'calm';
  const need = quizAnswers.need || null;

  function setQuizAnswer(qId, optId) {
    setQuizAnswers(prev => ({ ...prev, [qId]: optId }));
  }
  function toggleTensionArea(id) {
    setTensionAreas(list => (list.includes(id) ? list.filter(a => a !== id) : [...list, id]));
  }
  function toggleTag(tag) {
    setTags(list => (list.includes(tag) ? list.filter(x => x !== tag) : [...list, tag]));
  }

  // Tracks which AT exercises get practiced most, for the Stats page.
  async function trackExerciseComplete(exerciseId) {
    try {
      const res = await storage.get('luminous_exercise_counts').catch(() => null);
      const counts = res && res.value ? JSON.parse(res.value) : {};
      counts[exerciseId] = (counts[exerciseId] || 0) + 1;
      await storage.set('luminous_exercise_counts', JSON.stringify(counts));
    } catch (e) {
      // storage unavailable — no big deal, stats simply won't reflect this one
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get('luminous_reflections');
        if (res && res.value) setSavedEntries(JSON.parse(res.value));
      } catch (e) {
        // no entries saved yet — safe to ignore
      }
    })();
  }, []);

  function resetAll() {
    setQuizAnswers({});
    setPostMood(null);
    setTensionAreas([]);
    setJournal('');
    setReflection('');
    setTags([]);
    setJustSaved(false);
    setScreen('intro');
  }

  async function handleSave() {
    const entry = {
      date: new Date().toISOString(),
      preMoodCategory: moodCategory,
      quizAnswers,
      tensionAreas,
      need,
      postMood,
      reflection: reflection.trim(),
      tags,
    };
    const updated = [entry, ...savedEntries].slice(0, 30);
    setSavedEntries(updated);
    setJustSaved(true);
    try {
      await storage.set('luminous_reflections', JSON.stringify(updated));
    } catch (e) {
      // storage unavailable — entry still reflected in this session's state
    }
  }

  // shared navigation used by the top NavBar across most screens
  const nav = {
    onHome: () => setScreen('intro'),
    onReset: () => setScreen('preMood'),
    onFocus: () => setScreen('pomodoro'),
    onStats: () => setScreen('stats'),
    isDark, setIsDark,
  };

  const todayCount = savedEntries.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length;
  const streak = computeStreak(savedEntries);
  const lastMoodId = savedEntries.length > 0 ? entryPreCategory(savedEntries[0]) : null;
  const lastMood = lastMoodId ? (MOOD_CATEGORIES.find(c => c.id === lastMoodId) || {}).label : null;

  return (
    <div style={{ fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif", backgroundColor: t.bgColor }} className="relative min-h-screen transition-colors duration-700">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes screenIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.045); } }
        @keyframes driftA { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(34px,26px) scale(1.08); } }
        @keyframes driftB { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-28px,30px) scale(1.06); } }
        @keyframes driftC { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(24px,-24px) scale(1.05); } }
        .luminous-screen { animation: screenIn 750ms cubic-bezier(0.16,1,0.3,1); }
        .luminous-screen * { transition-timing-function: cubic-bezier(0.16,1,0.3,1); }
      `}</style>

      <AmbientField isDark={isDark} />

      <div key={screen} className="luminous-screen relative">
        {screen === 'splash' && (
          <SplashScreen onBegin={() => setScreen('intro')} t={t} />
        )}

        {screen === 'intro' && (
          <IntroScreen
            onBegin={() => setScreen('preMood')}
            onFocus={() => setScreen('pomodoro')}
            onStats={() => setScreen('stats')}
            onQuickReset={() => setScreen('guide')}
            t={t} isDark={isDark} setIsDark={setIsDark}
            historyCount={savedEntries.length}
            streak={streak}
            lastMood={lastMood}
            todayCount={todayCount}
          />
        )}

        {screen === 'preMood' && (
          <PreMoodScreen
            quizAnswers={quizAnswers} setQuizAnswer={setQuizAnswer}
            tensionAreas={tensionAreas} toggleTensionArea={toggleTensionArea}
            journal={journal} setJournal={setJournal}
            onContinue={() => setScreen('guide')}
            onBack={() => setScreen('intro')}
            nav={nav}
            t={t}
          />
        )}

        {screen === 'guide' && (
          <LuminousGuideFlow
            moodCategory={moodCategory}
            savedEntries={savedEntries}
            onFinish={() => setScreen('postMood')}
            onExit={() => setScreen('intro')}
            onExerciseComplete={trackExerciseComplete}
            nav={nav}
            t={t}
          />
        )}

        {screen === 'postMood' && (
          <PostMoodScreen
            preMoodCategory={moodCategory}
            mood={postMood} setMood={setPostMood}
            reflection={reflection} setReflection={setReflection}
            tags={tags} toggleTag={toggleTag}
            onSave={handleSave}
            onRestart={resetAll}
            onStartStudy={() => setScreen('pomodoro')}
            saved={justSaved}
            nav={nav}
            t={t}
          />
        )}

        {screen === 'pomodoro' && (
          <PomodoroFlow t={t} onExit={resetAll} nav={nav} />
        )}

        {screen === 'stats' && (
          <StatsScreen savedEntries={savedEntries} nav={nav} isDark={isDark} setIsDark={setIsDark} t={t} />
        )}
      </div>
    </div>
  );
}
