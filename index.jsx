import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, Users, QrCode, Sparkles, Bell, Settings as SettingsIcon, BarChart3,
  Plus, Send, Download, Copy, ChevronRight, ArrowRight, Check, AlertCircle,
  Mail, Building2, TrendingUp, Trash2, MessageSquare, Menu, X, ArrowUpRight,
  CheckCircle2, Clock, Zap, Shield, FileText, ChevronDown, LogOut
} from 'lucide-react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, getCurrentUid } from './src/firebase';

/* -------------------------------------------------------------------------- */
/*  Fonts + global styles                                                     */
/* -------------------------------------------------------------------------- */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800;9..144,900&family=Inter:wght@300;400;500;600;700&display=swap');

    :root {
      --paper: #F4EFE6;
      --paper-2: #EAE3D4;
      --ink: #0E1B14;
      --ink-2: #1F3128;
      --honey: #D4923A;
      --honey-2: #B97A28;
      --coral: #D4543B;
      --olive: #6B7A55;
      --mute: #6B675F;
    }

    .font-display { font-family: 'Fraunces', Georgia, serif; font-feature-settings: "ss01","ss02","ss03"; }
    .font-body { font-family: 'Inter', system-ui, sans-serif; }

    .bg-paper { background-color: var(--paper); }
    .bg-paper-2 { background-color: var(--paper-2); }
    .bg-ink { background-color: var(--ink); }
    .bg-ink-2 { background-color: var(--ink-2); }
    .bg-honey { background-color: var(--honey); }
    .bg-coral { background-color: var(--coral); }
    .bg-olive { background-color: var(--olive); }

    .text-paper { color: var(--paper); }
    .text-ink { color: var(--ink); }
    .text-ink-2 { color: var(--ink-2); }
    .text-honey { color: var(--honey); }
    .text-coral { color: var(--coral); }
    .text-mute { color: var(--mute); }
    .text-olive { color: var(--olive); }

    .border-ink { border-color: var(--ink); }
    .border-paper-2 { border-color: var(--paper-2); }
    .border-honey { border-color: var(--honey); }

    .ring-ink { --tw-ring-color: var(--ink); }

    /* Subtle paper grain */
    .grain {
      background-image: radial-gradient(rgba(14,27,20,0.035) 1px, transparent 1px);
      background-size: 3px 3px;
    }

    /* Animated reveal */
    @keyframes rise {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .rise { animation: rise 0.7s cubic-bezier(.2,.7,.2,1) both; }

    @keyframes shimmer {
      0%, 100% { transform: rotate(-2deg) scale(1); }
      50% { transform: rotate(2deg) scale(1.05); }
    }
    .star-float { animation: shimmer 4s ease-in-out infinite; }

    /* Hide scrollbars in horizontal scrollers */
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { scrollbar-width: none; }

    /* Custom marker for ordered list */
    .ol-fancy { counter-reset: step; }
    .ol-fancy > li { counter-increment: step; }
    .ol-fancy > li::before {
      content: counter(step, decimal-leading-zero);
      font-family: 'Fraunces', serif;
      font-weight: 500;
      font-style: italic;
      font-size: 0.78em;
      color: var(--honey);
      margin-right: 0.5em;
    }

    body { background: var(--paper); }
  `}</style>
);

/* -------------------------------------------------------------------------- */
/*  Sample data                                                               */
/* -------------------------------------------------------------------------- */

const SAMPLE_BUSINESS = {
  name: 'Bright & Co. Dental',
  industry: 'Dental Clinic',
  reviewLink: 'https://g.page/r/CdExampleReviewLink/review',
  email: 'hello@brightandco.example',
  phone: '0207 123 4567',
  staff: 'Dr Chen',
  plan: 'Professional',
};

const days = (n) => Date.now() - n * 86400000;

const SAMPLE_CUSTOMERS = [
  { id: 'c1', name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '07700 900123', service: 'Dental hygiene appointment', requestSent: true, requestSentAt: days(1), reviewLeft: true, createdAt: days(2) },
  { id: 'c2', name: 'James O\u2019Connor', email: 'j.oconnor@example.com', phone: '07700 900456', service: 'Crown fitting', requestSent: true, requestSentAt: days(2), reviewLeft: false, createdAt: days(3) },
  { id: 'c3', name: 'Priya Patel', email: 'p.patel@example.com', phone: '07700 900789', service: 'Teeth whitening', requestSent: false, reviewLeft: false, createdAt: days(1) },
  { id: 'c4', name: 'Tom Bradshaw', email: 't.bradshaw@example.com', phone: '07700 900234', service: 'Six-month check-up', requestSent: true, requestSentAt: days(5), reviewLeft: true, createdAt: days(6) },
  { id: 'c5', name: 'Margaret Hill', email: 'm.hill@example.com', phone: '07700 900567', service: 'Filling', requestSent: true, requestSentAt: days(3), reviewLeft: true, createdAt: days(4) },
  { id: 'c6', name: 'Daniel Yusuf', email: 'd.yusuf@example.com', phone: '07700 900890', service: 'Consultation', requestSent: false, reviewLeft: false, createdAt: days(0) },
];

const SAMPLE_REVIEWS = [
  { id: 'r1', reviewerName: 'Sarah Mitchell', rating: 5, text: 'The whole team was so welcoming. Dr Chen explained everything clearly and the hygienist was incredibly gentle. Honestly the best dental experience I have had in years.', createdAt: days(1), reply: '' },
  { id: 'r2', reviewerName: 'Tom Bradshaw', rating: 5, text: 'Friendly, professional, and on time. Could not ask for more from a check-up.', createdAt: days(5), reply: '' },
  { id: 'r3', reviewerName: 'Margaret Hill', rating: 2, text: 'Waited 40 minutes past my appointment time. The treatment itself was fine but I felt like my time was not valued.', createdAt: days(3), reply: '' },
];

/* -------------------------------------------------------------------------- */
/*  Persistence helpers                                                       */
/* -------------------------------------------------------------------------- */

async function loadKey(key, fallback) {
  const uid = getCurrentUid();
  if (!uid) return fallback;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'data', key));
    if (snap.exists()) {
      const d = snap.data();
      return d.items !== undefined ? d.items : d;
    }
  } catch (e) { console.error('loadKey', key, e); }
  return fallback;
}
async function saveKey(key, val) {
  const uid = getCurrentUid();
  if (!uid) return;
  try {
    const payload = Array.isArray(val) ? { items: val } : val;
    await setDoc(doc(db, 'users', uid, 'data', key), payload);
  } catch (e) { console.error('saveKey', key, e); }
}

/* -------------------------------------------------------------------------- */
/*  AI reply generator (template-based, deterministic)                        */
/* -------------------------------------------------------------------------- */

function generateReply({ reviewText, rating, tone, businessName, reviewerName, staff }) {
  const r = parseInt(rating, 10) || 5;
  const name = (reviewerName || '').split(' ')[0] || 'there';
  const biz = businessName || 'our team';

  const openersPositive = {
    professional: [
      `Thank you for taking the time to share your feedback, ${name}.`,
      `We sincerely appreciate you leaving us such a generous review, ${name}.`,
      `Reviews like yours genuinely make our week, ${name} — thank you.`,
    ],
    friendly: [
      `Wow, ${name} — what a lovely review. Thank you so much!`,
      `${name}, this absolutely made our day. Thank you for taking the time.`,
      `Thank you, ${name} — reading this put a smile on the whole team.`,
    ],
    warm: [
      `Honestly, ${name}, thank you. We don't take reviews like this lightly.`,
      `${name}, thank you. It means a great deal to hear this.`,
      `We're so grateful you took a moment to write this, ${name}.`,
    ],
  };

  const middlesPositive = [
    `It is genuinely encouraging to hear that ${staff || 'our team'} made you feel looked after — that is exactly what we strive for every day.`,
    `Knowing that the experience felt easy and unhurried is the highest compliment we can receive.`,
    `We invest a lot in making every visit feel personal, so it really matters to read words like yours.`,
  ];

  const closersPositive = [
    `We look forward to seeing you again at ${biz}.`,
    `Thanks again — we're here whenever you need us.`,
    `Wishing you the very best, and thank you again from everyone at ${biz}.`,
  ];

  const openersMid = {
    professional: [
      `Thank you for taking the time to leave your honest feedback, ${name}.`,
      `We appreciate you sharing your experience with us, ${name}.`,
    ],
    friendly: [
      `Thanks for the honest feedback, ${name} — we really do read every word.`,
      `${name}, thank you for letting us know how the visit went.`,
    ],
    warm: [
      `${name}, thank you for being honest with us. Feedback like yours is how we improve.`,
    ],
  };

  const middlesMid = [
    `It sounds like there are areas where we did not meet the standard we set for ourselves, and that is something we take seriously.`,
    `We're glad parts of your visit went well, but it's clear there is room for us to do better.`,
  ];

  const openersNegative = {
    professional: [
      `Thank you for raising this with us, ${name}, and we are very sorry to read about your experience.`,
      `${name}, we are genuinely sorry that your visit did not meet the standard we work hard to maintain.`,
    ],
    friendly: [
      `${name}, thank you for telling us — and we are really sorry this is how the visit ended.`,
    ],
    warm: [
      `${name}, this is not the experience we ever want anyone to have at ${biz}, and we are truly sorry.`,
    ],
  };

  const middlesNegative = [
    `What you describe is not the standard we hold ourselves to, and we would very much like the chance to look into it properly.`,
    `We take feedback like this seriously — please could you reach out directly so we can understand exactly what happened and put it right.`,
  ];

  const closersNeg = [
    `You can reach our practice manager directly on the email below — we would really like to make this right.`,
    `Please do get in touch with us directly so we can understand more and respond properly.`,
  ];

  // Try to incorporate a phrase from the review text
  const hint = (reviewText || '').toLowerCase();
  let contextLine = '';
  if (r >= 4) {
    if (hint.includes('friendly') || hint.includes('welcoming')) contextLine = ' Hearing that the team felt welcoming is exactly what we hope for.';
    else if (hint.includes('clean')) contextLine = ' We take real pride in keeping the practice spotless, so thank you for noticing.';
    else if (hint.includes('quick') || hint.includes('on time')) contextLine = ' Respecting your time matters to us, and we are glad it showed.';
    else if (hint.includes('explain')) contextLine = ' Taking the time to explain things properly is something we genuinely care about.';
  } else {
    if (hint.includes('wait')) contextLine = ' Long waits are not acceptable to us either, and we are reviewing how we can do better.';
    else if (hint.includes('rude') || hint.includes('unfriendly')) contextLine = ' How a visit feels matters as much as the treatment, and we will be addressing this with the team.';
    else if (hint.includes('price') || hint.includes('expensive') || hint.includes('cost')) contextLine = ' We always want to be clear about cost up front, so we will revisit how we communicate that.';
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const t = tone || 'professional';

  if (r >= 4) {
    return [pick(openersPositive[t] || openersPositive.professional), pick(middlesPositive) + contextLine, pick(closersPositive)].join('\n\n');
  }
  if (r === 3) {
    return [pick(openersMid[t] || openersMid.professional), pick(middlesMid) + contextLine, pick(closersNeg)].join('\n\n');
  }
  return [pick(openersNegative[t] || openersNegative.professional), pick(middlesNegative) + contextLine, pick(closersNeg)].join('\n\n');
}

/* -------------------------------------------------------------------------- */
/*  Tiny atoms                                                                */
/* -------------------------------------------------------------------------- */

const StarRow = ({ rating, size = 14 }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} strokeWidth={1.5}
        className={i <= rating ? 'fill-current text-honey' : 'text-mute opacity-30'} />
    ))}
  </span>
);

const Btn = ({ children, onClick, variant = 'primary', className = '', icon: Icon, type = 'button', disabled }) => {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-medium tracking-tight transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-ink text-paper hover:bg-ink-2 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-paper border border-ink text-ink hover:bg-ink hover:text-paper',
    honey: 'bg-honey text-ink hover:bg-honey/90 hover:-translate-y-0.5',
    ghost: 'text-ink hover:bg-paper-2',
    danger: 'bg-coral text-paper hover:bg-coral/90',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-paper border border-ink/10 rounded-3xl ${className}`}>{children}</div>
);

/* -------------------------------------------------------------------------- */
/*  LANDING PAGE                                                              */
/* -------------------------------------------------------------------------- */

function Landing({ onEnter }) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="bg-paper text-ink min-h-screen font-body">
      {/* NAV */}
      <nav className="sticky top-0 z-30 bg-paper/80 backdrop-blur border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
              <Star size={16} className="text-honey fill-honey" />
            </div>
            <span className="font-display text-2xl font-medium tracking-tight">Northstar</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="hover:text-honey transition">How it works</a>
            <a href="#features" className="hover:text-honey transition">Features</a>
            <a href="#pricing" className="hover:text-honey transition">Pricing</a>
            <a href="#faq" className="hover:text-honey transition">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onEnter} className="hidden sm:inline text-sm hover:text-honey transition">Sign in</button>
            <Btn onClick={onEnter} icon={ArrowRight}>Open the app</Btn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden grain">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 rise">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-2 border border-ink/10 text-xs tracking-wide uppercase mb-8">
              <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse" />
              Reputation infrastructure for local business
            </div>

            <h1 className="font-display font-light leading-[0.92] tracking-tight text-[3.4rem] sm:text-[4.5rem] lg:text-[6rem]">
              Five stars
              <br />
              <span className="italic font-normal">don't fall</span>
              <br />
              from <span className="text-honey">trees.</span>
            </h1>

            <p className="mt-8 text-lg lg:text-xl text-mute max-w-xl leading-relaxed">
              Northstar is the quiet engine behind clinics, salons, restaurants and trades that take their name seriously. Ask every customer. Reply to every review. Watch your stars climb.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Btn onClick={onEnter} variant="primary" icon={ArrowRight} className="!px-7 !py-4 text-base">Open the app</Btn>
              <a href="#how" className="text-sm flex items-center gap-2 hover:text-honey transition">
                See how it works <ChevronRight size={14} />
              </a>
            </div>

            <div className="mt-12 flex items-center gap-6 text-xs text-mute">
              <div className="flex items-center gap-1.5"><Check size={14} className="text-olive" /> No card required</div>
              <div className="flex items-center gap-1.5"><Check size={14} className="text-olive" /> Set up in 8 minutes</div>
              <div className="flex items-center gap-1.5"><Check size={14} className="text-olive" /> Cancel any time</div>
            </div>
          </div>

          {/* Visual: layered review cards */}
          <div className="lg:col-span-5 relative h-[460px] hidden lg:block">
            <div className="absolute top-4 left-8 w-72 bg-paper rounded-2xl p-5 shadow-lg border border-ink/10 rotate-[-4deg] rise" style={{animationDelay: '0.1s'}}>
              <StarRow rating={5} size={16} />
              <p className="font-display text-lg leading-snug mt-3">"Honestly the best dental visit I've had in years. The whole team was so welcoming."</p>
              <div className="mt-4 text-xs text-mute">— Sarah M., 2 days ago</div>
            </div>

            <div className="absolute top-44 right-0 w-64 bg-ink text-paper rounded-2xl p-5 shadow-xl rotate-[3deg] rise" style={{animationDelay: '0.25s'}}>
              <div className="text-xs uppercase tracking-wider text-honey mb-2">AI reply drafted</div>
              <p className="font-display italic text-base leading-snug">"Thank you so much, Sarah — knowing the team made you feel looked after is exactly..."</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-paper/10">warm</span>
                <span className="text-xs px-2 py-1 rounded-full bg-paper/10">3.2s</span>
              </div>
            </div>

            <div className="absolute bottom-6 left-12 w-56 bg-honey rounded-2xl p-5 shadow-lg rotate-[-2deg] rise" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink/70">This month</div>
                  <div className="font-display text-4xl font-medium mt-1">+47</div>
                  <div className="text-xs text-ink/70 mt-1">new five-star reviews</div>
                </div>
                <TrendingUp size={32} strokeWidth={1.5} />
              </div>
            </div>

            <div className="absolute bottom-32 right-8 w-32 h-32 bg-paper rounded-2xl p-3 shadow-lg rotate-[6deg] rise" style={{animationDelay: '0.55s'}}>
              <div className="w-full h-full bg-ink rounded-xl flex items-center justify-center relative">
                <QrCode size={64} className="text-paper" strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-ink/10 bg-paper-2">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid sm:grid-cols-3 gap-10">
          {[
            ['77%', 'of customers will leave a review — but only if you ask'],
            ['4.7→4.9', 'average star lift in the first 90 days'],
            ['1 in 3', 'local searches becomes a customer that day'],
          ].map(([n, t], i) => (
            <div key={i} className={i < 2 ? 'sm:border-r sm:border-ink/10 sm:pr-10' : ''}>
              <div className="font-display text-5xl lg:text-6xl font-medium tracking-tight">{n}</div>
              <div className="mt-2 text-sm text-mute leading-relaxed">{t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
        <div className="max-w-2xl mb-16">
          <div className="text-xs uppercase tracking-widest text-honey mb-4">The mechanism</div>
          <h2 className="font-display text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
            Built on one stubborn idea: <span className="italic">just ask.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Add the customer', body: 'A name, a phone or email, a service. That is it. Bulk-upload from CSV when you are ready.', icon: Users },
            { n: '02', title: 'Send the ask', body: 'Branded message, polite, perfectly timed. They tap once, your Google review page opens.', icon: Send },
            { n: '03', title: 'Reply with a draft', body: 'Every review gets an AI-drafted response in your voice. Edit, copy, post. Two minutes a week.', icon: Sparkles },
          ].map((s, i) => (
            <div key={i} className="bg-paper border border-ink/10 rounded-3xl p-8 hover:border-honey transition group">
              <div className="flex items-start justify-between mb-12">
                <div className="font-display italic text-honey text-xl">{s.n}</div>
                <s.icon size={20} className="text-mute group-hover:text-honey transition" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-2xl font-medium leading-tight">{s.title}</h3>
              <p className="mt-4 text-mute leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-ink text-paper">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <div className="lg:col-span-5">
              <div className="text-xs uppercase tracking-widest text-honey mb-4">Inside the app</div>
              <h2 className="font-display text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
                Everything to manage your name, <span className="italic">nothing you won't use.</span>
              </h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-paper/70 text-lg leading-relaxed">
                We didn't build for the demo. Each feature earns its place by saving a real hour for the practice manager, the salon owner, the head chef who just wants the reviews to stop being a knot in their week.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-paper/10 border border-paper/10 rounded-3xl overflow-hidden">
            {[
              { i: Users, t: 'Customer ledger', d: 'A clean, searchable record of who you served, when, and whether you remembered to ask.' },
              { i: Send, t: 'Review requests', d: 'Email today, SMS on the higher plan. Branded, polite, sent at the right moment.' },
              { i: QrCode, t: 'QR code generator', d: 'Print it on the reception desk, the table card, the invoice footer. It just works.' },
              { i: Sparkles, t: 'AI reply drafts', d: 'Three tones: professional, friendly, warm. Edit and post — never start from blank again.' },
              { i: Bell, t: 'Low-rating alerts', d: 'A 1, 2 or 3-star review pings you immediately. Respond inside 24 hours, every time.' },
              { i: BarChart3, t: 'Monthly report', d: 'Stars climbing, requests sent, reviews collected, response time. One page, end of month.' },
            ].map((f, i) => (
              <div key={i} className="bg-ink p-8 hover:bg-ink-2 transition">
                <f.i size={22} className="text-honey mb-6" strokeWidth={1.5} />
                <h3 className="font-display text-2xl font-medium">{f.t}</h3>
                <p className="mt-3 text-paper/60 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10 py-32 text-center">
        <div className="text-honey mb-8">
          <StarRow rating={5} size={22} />
        </div>
        <blockquote className="font-display text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight">
          "We went from <span className="italic">forgetting to ask</span> to a system that runs itself. Forty-three new five-star reviews in the first quarter — and a Google ranking that finally matches the work we do."
        </blockquote>
        <div className="mt-10 text-sm text-mute">
          <div className="font-medium text-ink">Lena Hoffmann</div>
          <div>Owner, The Glass House Salon · Bristol</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-paper-2 border-y border-ink/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-honey mb-4">Pricing</div>
            <h2 className="font-display text-5xl lg:text-6xl font-light tracking-tight">
              Pay for the <span className="italic">stars</span>, not the software.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '49', tagline: 'For the solo practice', features: ['Dashboard + customer ledger', '100 email review requests / month', 'QR code generator', 'AI reply generator', 'Email support'], cta: 'Start free', highlight: false },
              { name: 'Professional', price: '99', tagline: 'For most growing businesses', features: ['Everything in Starter', '300 email + 50 SMS / month', 'Branded request page', 'Low-rating alerts', 'Follow-up reminders', 'Monthly report'], cta: 'Start free', highlight: true },
              { name: 'Practice', price: '199', tagline: 'For multi-chair, multi-location', features: ['Everything in Professional', '1,000 email + 200 SMS / month', 'Done-for-you setup', 'Priority support', 'Multi-location dashboard', 'White-label option'], cta: 'Talk to us', highlight: false },
            ].map((p, i) => (
              <div key={i} className={`relative rounded-3xl p-8 ${p.highlight ? 'bg-ink text-paper -lg:translate-y-3' : 'bg-paper border border-ink/10'}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-8 bg-honey text-ink text-xs uppercase tracking-widest px-3 py-1 rounded-full font-medium">
                    Most picked
                  </div>
                )}
                <div className="text-xs uppercase tracking-widest mb-1 opacity-70">{p.name}</div>
                <div className={`text-sm mb-6 ${p.highlight ? 'text-paper/60' : 'text-mute'}`}>{p.tagline}</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="font-display text-6xl font-medium">£{p.price}</span>
                  <span className="text-sm opacity-60">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${p.highlight ? 'text-honey' : 'text-olive'}`} />
                      <span className={p.highlight ? 'text-paper/90' : ''}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Btn onClick={onEnter} variant={p.highlight ? 'honey' : 'secondary'} className="w-full">{p.cta}</Btn>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center text-sm text-mute">
            One-off setup £299 · includes account setup, message templates, QR card design, dashboard onboarding
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-6 lg:px-10 py-28">
        <h2 className="font-display text-5xl font-light tracking-tight mb-12">Honest answers.</h2>
        <div className="divide-y divide-ink/10">
          {[
            ['Do I need to connect Google to use this?', 'Not at first. Northstar starts with your public Google review link — that is enough to send requests, track who you asked, and generate AI replies. When you are ready, you can connect Google Business Profile to pull reviews automatically.'],
            ['What happens if a customer leaves a bad review?', 'You get an alert. Then a draft response is waiting for you in the right tone — apologetic but professional, never defensive. Most owners reply inside an hour and find it actually defuses the situation.'],
            ['Will my customers feel spammed?', 'No. The default flow is: one polite ask after their service, one gentle reminder if they have not clicked after three days, and that is it. You control the wording.'],
            ['Can I cancel?', 'Any time. We do not lock you in. If Northstar stops earning its keep, you should leave.'],
          ].map(([q, a], i) => (
            <FAQItem key={i} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-28">
        <div className="bg-ink text-paper rounded-3xl p-10 lg:p-16 grain relative overflow-hidden">
          <div className="absolute top-8 right-8 opacity-10">
            <Star size={200} className="text-honey fill-honey" strokeWidth={0.5} />
          </div>
          <div className="relative max-w-2xl">
            <h2 className="font-display text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
              Your next review is <span className="italic text-honey">already waiting.</span>
            </h2>
            <p className="mt-6 text-paper/70 text-lg">
              Most happy customers never leave one — unless someone politely puts the link in their hand. Northstar is that someone.
            </p>
            <div className="mt-10">
              <Btn onClick={onEnter} variant="honey" icon={ArrowRight} className="!px-8 !py-4 text-base">Open the app</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-ink/10 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-mute">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ink rounded-full flex items-center justify-center">
              <Star size={12} className="text-honey fill-honey" />
            </div>
            <span className="font-display text-lg text-ink">Northstar</span>
            <span>· Reputation infrastructure</span>
          </div>
          <div>© {new Date().getFullYear()} Northstar Studio. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left gap-6">
        <span className="font-display text-xl lg:text-2xl font-medium">{q}</span>
        <ChevronDown size={20} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180 text-honey' : ''}`} />
      </button>
      {open && <p className="mt-4 text-mute leading-relaxed max-w-3xl">{a}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  APP SHELL + DASHBOARD                                                     */
/* -------------------------------------------------------------------------- */

function AppShell({ onExit }) {
  const [tab, setTab] = useState('dashboard');
  const [navOpen, setNavOpen] = useState(false);

  const [business, setBusiness] = useState(SAMPLE_BUSINESS);
  const [customers, setCustomers] = useState(SAMPLE_CUSTOMERS);
  const [reviews, setReviews] = useState(SAMPLE_REVIEWS);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null);

  // Hydrate from storage
  useEffect(() => {
    (async () => {
      const [b, c, r] = await Promise.all([
        loadKey('business', SAMPLE_BUSINESS),
        loadKey('customers', SAMPLE_CUSTOMERS),
        loadKey('reviews', SAMPLE_REVIEWS),
      ]);
      setBusiness(b); setCustomers(c); setReviews(r);
      setHydrated(true);
    })();
  }, []);

  // Persist
  useEffect(() => { if (hydrated) saveKey('business', business); }, [business, hydrated]);
  useEffect(() => { if (hydrated) saveKey('customers', customers); }, [customers, hydrated]);
  useEffect(() => { if (hydrated) saveKey('reviews', reviews); }, [reviews, hydrated]);

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2800);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
    { id: 'aireply', label: 'AI Replies', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const tabProps = { business, setBusiness, customers, setCustomers, reviews, setReviews, showToast, setTab };

  return (
    <div className="bg-paper text-ink min-h-screen font-body flex">
      {/* Sidebar */}
      <aside className={`${navOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-ink text-paper flex flex-col transition-transform duration-300`}>
        <div className="p-6 border-b border-paper/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-paper rounded-full flex items-center justify-center">
                <Star size={16} className="text-honey fill-honey" />
              </div>
              <span className="font-display text-2xl font-medium">Northstar</span>
            </div>
            <button onClick={() => setNavOpen(false)} className="lg:hidden"><X size={20} /></button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setNavOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${tab === item.id ? 'bg-paper text-ink font-medium' : 'text-paper/70 hover:bg-paper/10 hover:text-paper'}`}
            >
              <item.icon size={18} strokeWidth={1.7} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-paper/10">
          <div className="px-4 py-3 bg-paper/5 rounded-xl mb-3">
            <div className="text-xs uppercase tracking-wider text-honey mb-1">Plan</div>
            <div className="font-display text-lg">{business.plan}</div>
            <div className="text-xs text-paper/60 mt-1">£99/month</div>
          </div>
          <button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-paper/70 hover:bg-paper/10 hover:text-paper transition">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-ink/10">
          <div className="px-6 lg:px-10 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setNavOpen(true)} className="lg:hidden"><Menu size={20} /></button>
              <div>
                <div className="text-xs text-mute uppercase tracking-widest">{business.name}</div>
                <div className="font-display text-xl capitalize">{tab === 'qrcode' ? 'QR Code' : tab === 'aireply' ? 'AI Replies' : tab}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-mute">
                <span className="w-2 h-2 bg-olive rounded-full" /> All systems good
              </div>
              <div className="w-9 h-9 bg-honey rounded-full flex items-center justify-center text-ink text-sm font-medium">
                {business.staff?.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10">
          {tab === 'dashboard' && <DashboardTab {...tabProps} />}
          {tab === 'customers' && <CustomersTab {...tabProps} />}
          {tab === 'reviews' && <ReviewsTab {...tabProps} />}
          {tab === 'qrcode' && <QRTab {...tabProps} />}
          {tab === 'aireply' && <AIReplyTab {...tabProps} />}
          {tab === 'settings' && <SettingsTab {...tabProps} />}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rise">
          <div className={`px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm ${toast.kind === 'success' ? 'bg-ink text-paper' : 'bg-coral text-paper'}`}>
            {toast.kind === 'success' ? <CheckCircle2 size={16} className="text-honey" /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        </div>
      )}

      {navOpen && <div onClick={() => setNavOpen(false)} className="fixed inset-0 bg-ink/40 z-30 lg:hidden" />}
    </div>
  );
}

/* -------------------------- DASHBOARD TAB -------------------------- */

function DashboardTab({ customers, reviews, business, setTab }) {
  const stats = useMemo(() => {
    const sent = customers.filter(c => c.requestSent).length;
    const pending = customers.filter(c => !c.requestSent).length;
    const collected = reviews.length;
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;
    const lowAlerts = reviews.filter(r => r.rating <= 3 && !r.reply).length;
    return { sent, pending, collected, avg, lowAlerts };
  }, [customers, reviews]);

  const recentCustomers = [...customers].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const lowReviews = reviews.filter(r => r.rating <= 3);

  return (
    <div className="max-w-6xl space-y-8">
      {/* Greeting */}
      <div>
        <div className="text-xs uppercase tracking-widest text-honey mb-2">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="font-display text-4xl lg:text-5xl font-light tracking-tight">Good to see you, <span className="italic">{business.staff?.split(' ').slice(-1)[0] || 'there'}</span>.</h1>
        <p className="text-mute mt-2">Here is the state of your name today.</p>
      </div>

      {/* Alert banner */}
      {stats.lowAlerts > 0 && (
        <div className="bg-coral/10 border border-coral/30 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coral rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-paper" />
            </div>
            <div>
              <div className="font-medium">Reputation alert</div>
              <div className="text-sm text-mute">{stats.lowAlerts} review{stats.lowAlerts > 1 ? 's' : ''} rated 3 stars or below need a reply within 24 hours.</div>
            </div>
          </div>
          <Btn onClick={() => setTab('reviews')} variant="primary" icon={ArrowRight}>Review</Btn>
        </div>
      )}

      {/* Big metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Average rating" value={stats.avg.toFixed(1)} sub={<StarRow rating={Math.round(stats.avg)} size={14} />} accent="honey" />
        <MetricCard label="Reviews collected" value={stats.collected} sub="across this month" />
        <MetricCard label="Requests sent" value={stats.sent} sub={`${stats.pending} pending`} />
        <MetricCard label="Response time" value="6h" sub="median to reply" />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent customers */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl font-medium">Recent customers</h3>
              <p className="text-sm text-mute">The latest names in your ledger.</p>
            </div>
            <Btn onClick={() => setTab('customers')} variant="ghost" icon={ArrowUpRight}>All customers</Btn>
          </div>
          <div className="divide-y divide-ink/10">
            {recentCustomers.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-sm text-mute truncate">{c.service}</div>
                </div>
                <div>
                  {c.reviewLeft ? <span className="text-xs px-2.5 py-1 rounded-full bg-olive/15 text-olive font-medium">Review left</span>
                  : c.requestSent ? <span className="text-xs px-2.5 py-1 rounded-full bg-honey/20 text-honey font-medium">Asked</span>
                  : <span className="text-xs px-2.5 py-1 rounded-full bg-paper-2 text-mute font-medium">Pending</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent low reviews */}
        <Card className="p-6">
          <h3 className="font-display text-2xl font-medium mb-1">Needs your eyes</h3>
          <p className="text-sm text-mute mb-6">Lower-rated reviews waiting on a reply.</p>
          {lowReviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-mute">
              <CheckCircle2 size={32} className="text-olive mx-auto mb-2" />
              All clear. Nice.
            </div>
          ) : lowReviews.slice(0, 3).map(r => (
            <div key={r.id} className="py-3 border-t border-ink/10 first:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{r.reviewerName}</span>
                <StarRow rating={r.rating} size={12} />
              </div>
              <p className="text-sm text-mute line-clamp-2">{r.text}</p>
            </div>
          ))}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-6 bg-ink text-paper border-0">
        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <h3 className="font-display text-3xl font-light leading-tight">Two minutes, three new reviews.</h3>
            <p className="text-paper/70 mt-2">Send today's pending requests in one go — most replies land within the hour.</p>
          </div>
          <Btn onClick={() => setTab('customers')} variant="honey" icon={Send} className="w-full lg:w-auto justify-self-end">Send pending requests</Btn>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl p-5 ${accent === 'honey' ? 'bg-honey text-ink' : 'bg-paper border border-ink/10'}`}>
      <div className={`text-xs uppercase tracking-widest mb-3 ${accent === 'honey' ? 'text-ink/60' : 'text-mute'}`}>{label}</div>
      <div className="font-display text-4xl font-medium tracking-tight">{value}</div>
      <div className={`text-xs mt-2 ${accent === 'honey' ? 'text-ink/70' : 'text-mute'}`}>{sub}</div>
    </div>
  );
}

/* -------------------------- CUSTOMERS TAB -------------------------- */

function CustomersTab({ customers, setCustomers, business, showToast }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => {
    if (filter === 'pending' && c.requestSent) return false;
    if (filter === 'asked' && (!c.requestSent || c.reviewLeft)) return false;
    if (filter === 'reviewed' && !c.reviewLeft) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.service.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sendRequest = (id) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, requestSent: true, requestSentAt: Date.now() } : c));
    const c = customers.find(x => x.id === id);
    showToast(`Review request sent to ${c?.name?.split(' ')[0]}`);
  };

  const sendAll = () => {
    const pending = customers.filter(c => !c.requestSent);
    if (!pending.length) { showToast('Nothing pending to send', 'success'); return; }
    setCustomers(customers.map(c => c.requestSent ? c : { ...c, requestSent: true, requestSentAt: Date.now() }));
    showToast(`${pending.length} review requests sent`);
  };

  const remove = (id) => setCustomers(customers.filter(c => c.id !== id));

  const addCustomer = (data) => {
    const id = 'c' + Math.random().toString(36).slice(2, 9);
    setCustomers([{ ...data, id, requestSent: false, reviewLeft: false, createdAt: Date.now() }, ...customers]);
    setAdding(false);
    showToast(`${data.name.split(' ')[0]} added`);
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-light">Customer ledger</h1>
          <p className="text-mute mt-1">Who you served. Who you asked. Who you still need to.</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn onClick={sendAll} variant="secondary" icon={Send}>Send all pending</Btn>
          <Btn onClick={() => setAdding(true)} variant="primary" icon={Plus}>Add customer</Btn>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[['all','All'],['pending','Pending'],['asked','Asked'],['reviewed','Reviewed']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition ${filter === k ? 'bg-ink text-paper border-ink' : 'bg-paper border-ink/15 text-ink hover:border-ink/30'}`}>
              {l}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or service..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 rounded-full bg-paper border border-ink/15 text-sm focus:outline-none focus:border-ink w-64 max-w-full"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-mute text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Service</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-mute">No customers match. Try a different filter.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-paper-2/50 transition">
                  <td className="px-5 py-4">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-mute">Added {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  </td>
                  <td className="px-5 py-4 text-mute">{c.service}</td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-xs">{c.email}</div>
                    <div className="text-xs text-mute">{c.phone}</div>
                  </td>
                  <td className="px-5 py-4">
                    {c.reviewLeft ? <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-olive/15 text-olive font-medium"><Check size={12} /> Reviewed</span>
                    : c.requestSent ? <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-honey/20 text-honey font-medium"><Clock size={12} /> Asked</span>
                    : <span className="text-xs px-2.5 py-1 rounded-full bg-paper-2 text-mute font-medium">Pending</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!c.requestSent && (
                        <button onClick={() => sendRequest(c.id)} className="px-3 py-1.5 rounded-full bg-ink text-paper text-xs hover:bg-ink-2 transition inline-flex items-center gap-1">
                          <Send size={12} /> Send
                        </button>
                      )}
                      <button onClick={() => remove(c.id)} className="p-1.5 rounded-full hover:bg-coral/15 text-coral transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {adding && <AddCustomerModal onClose={() => setAdding(false)} onAdd={addCustomer} business={business} />}
    </div>
  );
}

function AddCustomerModal({ onClose, onAdd, business }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '' });
  const valid = form.name.trim() && (form.email.trim() || form.phone.trim()) && form.service.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm rise">
      <div className="bg-paper rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-ink/10 flex items-center justify-between">
          <h3 className="font-display text-2xl">Add a customer</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-paper-2"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Full name" required>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. Sarah Mitchell" className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="sarah@example.com" className="input" />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="07700 900123" className="input" />
            </Field>
          </div>
          <Field label="Service" required>
            <input type="text" value={form.service} onChange={e => setForm({...form, service: e.target.value})}
              placeholder="e.g. Dental hygiene appointment" className="input" />
          </Field>
          <div className="bg-paper-2 rounded-2xl p-4 text-xs text-mute">
            <div className="font-medium text-ink mb-1.5">Preview message</div>
            Hi {form.name?.split(' ')[0] || '[Name]'}, thank you for visiting <strong>{business.name}</strong>. We would really appreciate it if you could leave us a quick Google review here: [link]
          </div>
        </div>
        <div className="p-6 bg-paper-2 flex items-center justify-end gap-3">
          <Btn onClick={onClose} variant="ghost">Cancel</Btn>
          <Btn onClick={() => onAdd(form)} disabled={!valid} variant="primary" icon={Plus}>Add customer</Btn>
        </div>
        <style>{`.input { width: 100%; padding: 10px 14px; border: 1px solid rgba(14,27,20,0.15); border-radius: 12px; background: var(--paper); font-size: 14px; outline: none; transition: border-color 0.15s; }
          .input:focus { border-color: var(--ink); }`}</style>
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-mute mb-1.5 block">
        {label} {required && <span className="text-coral">*</span>}
      </span>
      {children}
    </label>
  );
}

/* -------------------------- REVIEWS TAB -------------------------- */

function ReviewsTab({ reviews, setReviews, business, showToast }) {
  const [adding, setAdding] = useState(false);

  const addReview = (data) => {
    const id = 'r' + Math.random().toString(36).slice(2, 9);
    setReviews([{ ...data, id, createdAt: Date.now(), reply: '' }, ...reviews]);
    setAdding(false);
    showToast('Review logged');
  };

  const generateInPlace = (id) => {
    const r = reviews.find(x => x.id === id);
    const reply = generateReply({
      reviewText: r.text, rating: r.rating, tone: 'warm',
      businessName: business.name, reviewerName: r.reviewerName, staff: business.staff,
    });
    setReviews(reviews.map(x => x.id === id ? { ...x, reply } : x));
    showToast('Reply drafted');
  };

  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    showToast('Reply copied to clipboard');
  };

  const remove = (id) => setReviews(reviews.filter(r => r.id !== id));

  const lowReviews = reviews.filter(r => r.rating <= 3);
  const highReviews = reviews.filter(r => r.rating > 3);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-light">Reviews</h1>
          <p className="text-mute mt-1">Logged manually for now — automatic Google sync arrives in the Practice plan.</p>
        </div>
        <Btn onClick={() => setAdding(true)} variant="primary" icon={Plus}>Log a review</Btn>
      </div>

      {lowReviews.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-coral" />
            <h2 className="font-display text-xl">Needs attention</h2>
          </div>
          <div className="space-y-3">
            {lowReviews.map(r => <ReviewCard key={r.id} r={r} onGenerate={generateInPlace} onCopy={copy} onRemove={remove} />)}
          </div>
        </div>
      )}

      {highReviews.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 mt-8">
            <Star size={16} className="text-honey fill-honey" />
            <h2 className="font-display text-xl">Five-star and friends</h2>
          </div>
          <div className="space-y-3">
            {highReviews.map(r => <ReviewCard key={r.id} r={r} onGenerate={generateInPlace} onCopy={copy} onRemove={remove} />)}
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="text-center py-20 text-mute">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          No reviews yet. Log your first one above.
        </div>
      )}

      {adding && <AddReviewModal onClose={() => setAdding(false)} onAdd={addReview} />}
    </div>
  );
}

function ReviewCard({ r, onGenerate, onCopy, onRemove }) {
  const isLow = r.rating <= 3;
  return (
    <div className={`rounded-2xl p-5 border ${isLow ? 'bg-coral/5 border-coral/20' : 'bg-paper border-ink/10'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{r.reviewerName}</span>
            <StarRow rating={r.rating} size={13} />
          </div>
          <div className="text-xs text-mute mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</div>
        </div>
        <button onClick={() => onRemove(r.id)} className="p-1.5 rounded-full hover:bg-coral/15 text-coral transition">
          <Trash2 size={14} />
        </button>
      </div>
      <p className="text-sm leading-relaxed mb-4">{r.text}</p>

      {r.reply ? (
        <div className="bg-ink text-paper rounded-xl p-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-honey">Drafted reply</span>
            <button onClick={() => onCopy(r.reply)} className="text-xs flex items-center gap-1 text-paper/70 hover:text-paper">
              <Copy size={12} /> Copy
            </button>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line">{r.reply}</p>
        </div>
      ) : (
        <Btn onClick={() => onGenerate(r.id)} variant={isLow ? 'danger' : 'primary'} icon={Sparkles}>Draft a reply</Btn>
      )}
    </div>
  );
}

function AddReviewModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ reviewerName: '', rating: 5, text: '' });
  const valid = form.reviewerName.trim() && form.text.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm rise">
      <div className="bg-paper rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-ink/10 flex items-center justify-between">
          <h3 className="font-display text-2xl">Log a review</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-paper-2"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Reviewer name" required>
            <input type="text" value={form.reviewerName} onChange={e => setForm({...form, reviewerName: e.target.value})} className="input" />
          </Field>
          <Field label="Rating">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm({...form, rating: n})}>
                  <Star size={28} strokeWidth={1.5} className={n <= form.rating ? 'fill-current text-honey' : 'text-mute opacity-30'} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Review text" required>
            <textarea rows={4} value={form.text} onChange={e => setForm({...form, text: e.target.value})} className="input resize-none" />
          </Field>
        </div>
        <div className="p-6 bg-paper-2 flex items-center justify-end gap-3">
          <Btn onClick={onClose} variant="ghost">Cancel</Btn>
          <Btn onClick={() => onAdd(form)} disabled={!valid} variant="primary" icon={Plus}>Log review</Btn>
        </div>
        <style>{`.input { width: 100%; padding: 10px 14px; border: 1px solid rgba(14,27,20,0.15); border-radius: 12px; background: var(--paper); font-size: 14px; outline: none; transition: border-color 0.15s; font-family: inherit; }
          .input:focus { border-color: var(--ink); }`}</style>
      </div>
    </div>
  );
}

/* -------------------------- QR TAB -------------------------- */

function QRTab({ business, showToast }) {
  const [size, setSize] = useState('400');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(business.reviewLink)}&color=0E1B14&bgcolor=F4EFE6&margin=10&qzone=2`;

  const downloadQR = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${business.name.replace(/\s+/g,'-').toLowerCase()}-review-qr.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('QR code downloaded');
    } catch (e) {
      showToast('Could not download — try right-click save', 'error');
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(business.reviewLink);
    showToast('Review link copied');
  };

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-4xl font-light">QR code</h1>
      <p className="text-mute mt-1 mb-8">Print it. Stick it. Watch reviews land.</p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* QR preview */}
        <Card className="lg:col-span-3 p-8 bg-ink text-paper">
          <div className="grid sm:grid-cols-2 gap-6 items-center">
            <div className="bg-paper p-4 rounded-2xl flex items-center justify-center aspect-square">
              <img src={qrUrl} alt="Review QR" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-honey mb-3">Scan to review</div>
              <div className="font-display text-3xl font-light leading-tight">{business.name}</div>
              <p className="text-sm text-paper/60 mt-3 mb-6">Point a phone camera at the code. It opens your Google review page in one tap.</p>
              <div className="flex flex-wrap gap-2">
                <Btn onClick={downloadQR} variant="honey" icon={Download}>Download PNG</Btn>
                <Btn onClick={copyLink} variant="secondary" icon={Copy} className="!bg-transparent !text-paper !border-paper/30 hover:!bg-paper hover:!text-ink">Copy link</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Settings + ideas */}
        <Card className="lg:col-span-2 p-6 space-y-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-mute mb-2">Size</div>
            <div className="flex gap-2">
              {[['200','S'],['400','M'],['800','L']].map(([v, l]) => (
                <button key={v} onClick={() => setSize(v)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition ${size === v ? 'bg-ink text-paper border-ink' : 'bg-paper border-ink/15 hover:border-ink/30'}`}>
                  {l} ({v}px)
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-mute mb-2">Where to put it</div>
            <ol className="ol-fancy space-y-2 text-sm">
              <li>Reception desk · table card · price list</li>
              <li>Invoice footer · receipt · delivery note</li>
              <li>Salon mirror sticker · changing room</li>
              <li>Project completion pack · service bag</li>
              <li>Email signature · WhatsApp profile</li>
            </ol>
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6 bg-paper-2 border-0">
        <div className="flex items-start gap-4">
          <Zap size={20} className="text-honey flex-shrink-0 mt-1" />
          <div>
            <div className="font-display text-xl">A small ritual that compounds</div>
            <p className="text-sm text-mute mt-1">Place the QR at the moment of natural happiness — when the haircut is shown in the mirror, when the bill arrives at a good meal, when the work is signed off. Reviews follow good moments, not requests.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------- AI REPLY TAB -------------------------- */

function AIReplyTab({ business, showToast }) {
  const [reviewText, setReviewText] = useState('The whole team was so welcoming. Dr Chen explained everything clearly and the hygienist was incredibly gentle. Best dental experience I have had in years.');
  const [reviewer, setReviewer] = useState('Sarah');
  const [rating, setRating] = useState(5);
  const [tone, setTone] = useState('warm');
  const [reply, setReply] = useState('');
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    // Simulate a tiny delay so it feels considered
    setTimeout(() => {
      const r = generateReply({
        reviewText, rating, tone, businessName: business.name, reviewerName: reviewer, staff: business.staff,
      });
      setReply(r);
      setGenerating(false);
    }, 600);
  };

  const copy = () => {
    navigator.clipboard?.writeText(reply);
    showToast('Reply copied to clipboard');
  };

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-4xl font-light">AI reply generator</h1>
      <p className="text-mute mt-1 mb-8">Three tones, one good draft, every time.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-mute" />
            <span className="text-xs uppercase tracking-widest text-mute">Input</span>
          </div>
          <Field label="Reviewer name">
            <input type="text" value={reviewer} onChange={e => setReviewer(e.target.value)} className="input" />
          </Field>
          <Field label="Rating">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star size={28} strokeWidth={1.5} className={n <= rating ? 'fill-current text-honey' : 'text-mute opacity-30'} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Review text">
            <textarea rows={5} value={reviewText} onChange={e => setReviewText(e.target.value)} className="input resize-none" />
          </Field>
          <Field label="Tone">
            <div className="flex gap-2">
              {[['professional','Professional'],['friendly','Friendly'],['warm','Warm']].map(([k, l]) => (
                <button key={k} onClick={() => setTone(k)}
                  className={`flex-1 py-2 rounded-xl text-sm border transition ${tone === k ? 'bg-ink text-paper border-ink' : 'bg-paper border-ink/15 hover:border-ink/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </Field>
          <Btn onClick={generate} variant="primary" icon={Sparkles} className="w-full" disabled={generating || !reviewText.trim()}>
            {generating ? 'Drafting...' : 'Draft reply'}
          </Btn>
          <style>{`.input { width: 100%; padding: 10px 14px; border: 1px solid rgba(14,27,20,0.15); border-radius: 12px; background: var(--paper); font-size: 14px; outline: none; transition: border-color 0.15s; font-family: inherit; }
          .input:focus { border-color: var(--ink); }`}</style>
        </Card>

        <Card className="p-6 bg-ink text-paper border-0 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-honey" />
              <span className="text-xs uppercase tracking-widest text-honey">Drafted reply</span>
            </div>
            {reply && (
              <button onClick={copy} className="text-xs flex items-center gap-1 text-paper/70 hover:text-paper transition">
                <Copy size={12} /> Copy
              </button>
            )}
          </div>
          {reply ? (
            <div className="flex-1">
              <p className="text-base leading-relaxed whitespace-pre-line font-display font-light">{reply}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Btn onClick={generate} variant="honey" icon={Sparkles}>Try another</Btn>
                <Btn onClick={copy} variant="secondary" icon={Copy} className="!bg-transparent !text-paper !border-paper/30 hover:!bg-paper hover:!text-ink">Copy</Btn>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-paper/40 text-center">
              <div>
                <Sparkles size={32} strokeWidth={1.2} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Your draft will appear here.</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6 bg-paper-2 border-0">
        <div className="flex items-start gap-4">
          <Shield size={20} className="text-olive flex-shrink-0 mt-1" />
          <div>
            <div className="font-display text-xl">A note on tone</div>
            <p className="text-sm text-mute mt-1">Drafts are starting points, never the final word. Always read it through, change a phrase, add the tiny detail that proves a human typed it. That is what readers can feel.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------- SETTINGS TAB -------------------------- */

function SettingsTab({ business, setBusiness, showToast }) {
  const [form, setForm] = useState(business);
  useEffect(() => setForm(business), [business]);

  const save = () => {
    setBusiness(form);
    showToast('Settings saved');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-light">Business profile</h1>
      <p className="text-mute mt-1 mb-8">The details that go on every message you send.</p>

      <Card className="p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Business name" required>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
          </Field>
          <Field label="Industry">
            <input type="text" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="input" />
          </Field>
        </div>
        <Field label="Google review link" required>
          <input type="url" value={form.reviewLink} onChange={e => setForm({...form, reviewLink: e.target.value})}
            placeholder="https://g.page/r/.../review" className="input" />
          <span className="text-xs text-mute mt-1.5 block">Find this in your Google Business Profile dashboard under "Get more reviews".</span>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Contact email">
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
          </Field>
        </div>
        <Field label="Primary staff name">
          <input type="text" value={form.staff} onChange={e => setForm({...form, staff: e.target.value})}
            placeholder="e.g. Dr Chen" className="input" />
          <span className="text-xs text-mute mt-1.5 block">Used in AI reply drafts to make them feel personal.</span>
        </Field>
        <div className="pt-3 flex items-center justify-between">
          <span className="text-xs text-mute">Changes save instantly when you press the button.</span>
          <Btn onClick={save} variant="primary" icon={Check}>Save changes</Btn>
        </div>
        <style>{`.input { width: 100%; padding: 10px 14px; border: 1px solid rgba(14,27,20,0.15); border-radius: 12px; background: var(--paper); font-size: 14px; outline: none; transition: border-color 0.15s; }
          .input:focus { border-color: var(--ink); }`}</style>
      </Card>

      <Card className="mt-6 p-6 bg-ink text-paper border-0">
        <div className="text-xs uppercase tracking-widest text-honey mb-2">Current plan</div>
        <div className="font-display text-3xl">{business.plan}</div>
        <p className="text-paper/60 text-sm mt-2 mb-4">300 email + 50 SMS / month · low-rating alerts · branded request page · monthly report</p>
        <Btn variant="honey" icon={ArrowUpRight}>Manage subscription</Btn>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ROOT                                                                      */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*  Auth screen                                                               */
/* -------------------------------------------------------------------------- */

function Auth({ onBack }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      const code = e?.code || '';
      const msg =
        code === 'auth/invalid-credential' ? 'Email or password is incorrect.' :
        code === 'auth/email-already-in-use' ? 'An account with that email already exists.' :
        code === 'auth/weak-password' ? 'Password must be at least 6 characters.' :
        code === 'auth/invalid-email' ? 'That email address is not valid.' :
        code === 'auth/operation-not-allowed' ? 'Email/Password sign-in is not enabled in Firebase.' :
        e?.message || 'Something went wrong. Try again.';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-paper text-ink min-h-screen font-body grain flex items-center justify-center px-4">
      <GlobalStyles />
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-sm text-mute hover:text-ink mb-6 flex items-center gap-1">
          <ArrowRight size={14} className="rotate-180" /> Back
        </button>
        <div className="bg-white border border-ink/10 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center">
              <Star size={16} className="text-honey fill-honey" />
            </div>
            <span className="font-display text-2xl font-medium">Northstar</span>
          </div>
          <h1 className="font-display text-3xl font-medium mb-1">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-mute mb-6">
            {mode === 'signup'
              ? 'Your customers, reviews and settings stay private to your account.'
              : 'Sign in to access your dashboard.'}
          </p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-mute">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-ink/15 bg-paper focus:outline-none focus:border-ink"
                placeholder="you@business.com"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-mute">Password</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl border border-ink/15 bg-paper focus:outline-none focus:border-ink"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              />
            </div>

            {err && (
              <div className="text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg px-3 py-2 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{err}</span>
              </div>
            )}

            <button
              type="submit" disabled={busy}
              className="w-full bg-ink text-paper rounded-xl py-3 font-medium hover:bg-ink-2 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? 'Please wait…' : (mode === 'signup' ? 'Create account' : 'Sign in')}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-6 text-sm text-mute text-center">
            {mode === 'signup' ? (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setErr(''); }} className="text-ink underline">Sign in</button>
              </>
            ) : (
              <>New to Northstar?{' '}
                <button onClick={() => { setMode('signup'); setErr(''); }} className="text-ink underline">Create an account</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ROOT                                                                      */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'app'
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) setView('app');
    });
    return unsub;
  }, []);

  if (!authReady) {
    return (
      <div className="bg-paper min-h-screen flex items-center justify-center font-body text-mute text-sm">
        <GlobalStyles />
        Loading…
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      {view === 'landing' && (
        <Landing onEnter={() => setView(user ? 'app' : 'auth')} />
      )}
      {view === 'auth' && !user && (
        <Auth onBack={() => setView('landing')} />
      )}
      {view === 'app' && user && (
        <AppShell
          key={user.uid}
          onExit={async () => { await signOut(auth); setView('landing'); }}
        />
      )}
    </>
  );
}
