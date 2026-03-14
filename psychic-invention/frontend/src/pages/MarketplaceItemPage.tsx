/**
 * MarketplaceItemPage — Individual menu item detail page
 *
 * Tabs:
 *   1. Overview
 *   2. Feature Breakdown
 *   3. Significance in Quant Finance
 *   4. Formulas Applied
 *   5. Register (data collection form)
 *
 * Route: /marketplace/:menuId
 */
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMenuItem, REGISTRATION_ROLES } from '@/data/marketplaceData';
import { MathBlock } from '@/components/ui/Math';

type TabId = 'overview' | 'features' | 'significance' | 'formulas' | 'register';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'features',     label: 'Feature Breakdown' },
  { id: 'significance', label: 'Significance in Quant Finance' },
  { id: 'formulas',     label: 'Formulas Applied' },
  { id: 'register',     label: 'Register Interest' },
];

const accentGradient: Record<string, string> = {
  blue:   'from-blue-600 to-blue-400',
  indigo: 'from-indigo-600 to-indigo-400',
  emerald:'from-emerald-600 to-emerald-400',
  violet: 'from-violet-600 to-violet-400',
  cyan:   'from-cyan-600 to-cyan-400',
  amber:  'from-amber-600 to-amber-400',
  rose:   'from-rose-600 to-rose-400',
  slate:  'from-slate-500 to-slate-400',
};

const accentText: Record<string, string> = {
  blue: 'text-blue-300', indigo: 'text-indigo-300', emerald: 'text-emerald-300',
  violet: 'text-violet-300', cyan: 'text-cyan-300', amber: 'text-amber-300',
  rose: 'text-rose-300', slate: 'text-slate-300',
};

const accentBorder: Record<string, string> = {
  blue: 'border-blue-500/40', indigo: 'border-indigo-500/40', emerald: 'border-emerald-500/40',
  violet: 'border-violet-500/40', cyan: 'border-cyan-500/40', amber: 'border-amber-500/40',
  rose: 'border-rose-500/40', slate: 'border-slate-500/40',
};

const accentBg: Record<string, string> = {
  blue: 'bg-blue-500/10', indigo: 'bg-indigo-500/10', emerald: 'bg-emerald-500/10',
  violet: 'bg-violet-500/10', cyan: 'bg-cyan-500/10', amber: 'bg-amber-500/10',
  rose: 'bg-rose-500/10', slate: 'bg-slate-500/10',
};

interface FormData {
  name: string;
  phone: string;
  email: string;
  role: string;
  organization: string;
}

export const MarketplaceItemPage = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const navigate = useNavigate();
  const item = getMenuItem(menuId ?? '');

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [form, setForm] = useState<FormData>({ name: '', phone: '', email: '', role: '', organization: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
        <p className="text-6xl">404</p>
        <p className="text-xl font-semibold text-white">Module not found</p>
        <Link to="/marketplace" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const color = item.accentColor;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/marketplace/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_id: item.id, ...form }),
      });
      if (!res.ok) throw new Error('Registration failed — please try again.');
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Breadcrumb */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-[65px] z-40">
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/marketplace" className="hover:text-slate-300 transition-colors">Marketplace</Link>
            <span>/</span>
            <span className={accentText[color]}>{item.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className={`absolute inset-0 bg-gradient-to-br ${accentGradient[color]} opacity-5`} />
        <div className="container py-12 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className={`text-5xl p-4 rounded-2xl ${accentBg[color]} border ${accentBorder[color]}`}>
                {item.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${accentBg[color]} ${accentText[color]} ${accentBorder[color]}`}>
                    {item.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-slate-800/60 text-slate-400 border-slate-700">
                    {item.complexity}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2">{item.title}</h1>
                <p className={`text-lg font-medium ${accentText[color]}`}>{item.tagline}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.targetUsers.map(u => (
                    <span key={u} className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800/60 border border-slate-700 text-slate-400">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap lg:flex-nowrap shrink-0">
              <button
                onClick={() => setActiveTab('register')}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border ${accentBg[color]} ${accentText[color]} ${accentBorder[color]} hover:opacity-80`}
              >
                Register Interest
              </button>
              <button
                onClick={() => navigate(item.route)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
              >
                Open Workspace →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? `${accentText[color]} border-b-2 ${accentBorder[color].replace('/40', '')} bg-slate-900/40`
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.id === 'register' ? '✍ Register Interest' : tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="container py-10">

        {/* ── Overview ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">{item.overview.headline}</h2>
              <p className="text-slate-400 leading-relaxed text-base">{item.overview.body}</p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-slate-500 font-semibold mb-4">Key Capabilities</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {item.overview.capabilities.map((cap, i) => (
                  <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${accentBorder[color]} bg-slate-900/50`}>
                    <span className={`${accentText[color]} mt-0.5 shrink-0`}>✓</span>
                    <span className="text-sm text-slate-300">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${accentBorder[color]} ${accentBg[color]}`}>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">Target Users</p>
              <div className="flex flex-wrap gap-2">
                {item.userRoles.map(role => (
                  <span key={role} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${accentBg[color]} ${accentText[color]} ${accentBorder[color]}`}>
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setActiveTab('features')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors">
                Feature Breakdown →
              </button>
              <button onClick={() => setActiveTab('register')}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border ${accentBg[color]} ${accentText[color]} ${accentBorder[color]}`}>
                Register Interest
              </button>
            </div>
          </div>
        )}

        {/* ── Feature Breakdown ────────────────────────────────────────── */}
        {activeTab === 'features' && (
          <div className="space-y-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-6">Feature Breakdown</h2>
            {item.featureBreakdown.map((feat, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${accentBorder[color]} bg-slate-900/50 flex gap-5`}>
                <div className={`text-3xl p-3 rounded-xl ${accentBg[color]} h-fit shrink-0`}>{feat.icon}</div>
                <div>
                  <h3 className={`text-base font-bold ${accentText[color]} mb-2`}>{feat.name}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Significance ─────────────────────────────────────────────── */}
        {activeTab === 'significance' && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-6">Significance in Quantitative Finance</h2>
            {item.significance.map((sig, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-6 h-6 rounded-full ${accentBg[color]} border ${accentBorder[color]} flex items-center justify-center text-xs font-bold ${accentText[color]}`}>
                    {i + 1}
                  </div>
                  <h3 className="text-base font-bold text-white">{sig.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed ml-9">{sig.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Formulas ─────────────────────────────────────────────────── */}
        {activeTab === 'formulas' && (
          <div className="space-y-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-6">Formulas Applied</h2>
            {item.formulas.map((f, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${accentBorder[color]} bg-slate-900/50`}>
                <p className={`text-xs uppercase tracking-widest font-semibold ${accentText[color]} mb-3`}>{f.name}</p>
                <div className={`px-5 py-5 rounded-xl text-white ${accentBg[color]} border ${accentBorder[color]} mb-3 overflow-x-auto`}>
                  <MathBlock latex={f.latex} className="katex-display-override" />
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Register ─────────────────────────────────────────────────── */}
        {activeTab === 'register' && (
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-2">Register Interest</h2>
            <p className="text-slate-400 text-sm mb-8">
              Register your interest in <span className={`font-semibold ${accentText[color]}`}>{item.title}</span>. After registering you can log in and access the full workspace.
            </p>

            {submitted ? (
              <div className={`p-8 rounded-2xl border ${accentBorder[color]} ${accentBg[color]} text-center space-y-4`}>
                <p className="text-4xl">✓</p>
                <h3 className={`text-xl font-bold ${accentText[color]}`}>Registration Received</h3>
                <p className="text-slate-400 text-sm">Thank you! You now have access to the {item.title} workspace.</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button onClick={() => navigate(item.route)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
                    Open Workspace →
                  </button>
                  <button onClick={() => navigate('/transact')}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors">
                    Go to Platform
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Alex Johnson"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email" required
                    placeholder="you@institution.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Professional Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white"
                  >
                    <option value="" className="text-slate-500">Select your role…</option>
                    {REGISTRATION_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Organisation */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1.5">
                    Organisation / Institution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Goldman Sachs, MIT, Self-employed"
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {submitError && (
                  <p className="text-red-400 text-xs">{submitError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !form.name || !form.email || !form.role}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                  >
                    {submitting ? 'Registering…' : 'Register & Access Platform →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(item.route)}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Skip →
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 text-center pt-1">
                  Your information is used only to improve the platform experience. No spam, ever.
                </p>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
