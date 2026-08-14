"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Wallet,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { apiClient } from "../lib/api-client";
import { GlobalChat } from "./chat/GlobalChat";
import { PropertyCard } from "./ui/PropertyCard";

const STORAGE_KEY_RESULTS = "housepadi_ai_results";

export function PublicLanding() {
  const [properties, setProperties] = useState([]);

  const openAgent = useCallback((message?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-agent-chat", {
        detail: {
          prefill: message,
        },
      })
    );
  }, []);

  const [aiResults, setAiResults] = useState<any[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (aiResults && aiResults.length > 0) {
        localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(aiResults));
      } else {
        localStorage.removeItem(STORAGE_KEY_RESULTS);
      }
    }
  }, [aiResults]);

  useEffect(() => {
    apiClient.get("/api/property/featured")
      .then(res => setProperties(res.data || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (aiResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [aiResults]);

  useEffect(() => {
    const handleResultsEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setAiResults(detail as any[]);
      }
    };

    window.addEventListener("agent-results", handleResultsEvent);
    return () => {
      window.removeEventListener("agent-results", handleResultsEvent);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white pb-32 selection:bg-[var(--amber)] selection:text-[var(--ink)] relative overflow-hidden">
      
      {/* COSMIC ANIMATED BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#0b0f19] to-[#030712]" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-900/20 via-[var(--amber)]/10 to-transparent blur-[120px] animate-[floatOrb1_15s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-45 w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-blue-900/20 via-indigo-600/10 to-transparent blur-[140px] animate-[floatOrb2_20s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[var(--amber)]/5 via-orange-500/5 to-transparent blur-[100px] animate-[floatOrb3_18s_ease-in-out_infinite]" />
        <div className="absolute inset-0 blueprint-grid opacity-30 animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      <style jsx global>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, 50px) scale(1.1); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, -40px) scale(1.15); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }
      `}</style>

      {/* SECTION 1: HERO */}
      <section className="relative z-10 pt-40 pb-24 px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 font-mono-num text-[11px] tracking-[0.2em] text-[var(--amber)] uppercase mb-6 border border-[var(--amber)]/30 rounded-full px-4 py-1.5 bg-[var(--amber)]/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--verified)] motion-safe:animate-pulse" />
            HousePadi Neural Agent v2.4 Online
          </span>

          <h1 className="font-display text-5xl md:text-7xl font-semibold mb-6 tracking-tight leading-[1.05]">
            Tell it what home
            <br />
            you&apos;re looking for.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Eliminate endless filtering. Describe your exact budget, preferred neighborhood, commute requirements, and non-negotiables — our AI agent matches verified listings and replies instantly on page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              type="button"
              onClick={() => openAgent("Hello! I want to find a home.")}
              className="inline-flex items-center gap-2.5 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-semibold text-sm px-7 py-4 rounded-2xl transition-all shadow-xl shadow-[var(--amber)]/20 hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles size={16} />
              Ask the AI Agent
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => openAgent("Show me all verified properties in your directory")}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white font-semibold text-sm px-7 py-4 rounded-2xl transition-colors cursor-pointer"
            >
              Browse verified directory
            </button>
          </div>

          {/* Prompt Chips */}
          <div className="max-w-2xl mx-auto bg-[var(--ink-soft)]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-left shadow-2xl">
            <div className="text-xs font-mono-num text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-[var(--amber)]" /> Click any command to send to chat:
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "3-bed in Lekki Phase 1 under ₦6M with solar inverter",
                "Furnished 2-bed apartment in Victoria Island with 24/7 security",
                "Serviced office space in Yaba under ₦3M annual rent",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openAgent(prompt)}
                  className="text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-[var(--amber)]">“</span>
                  {prompt}
                  <span className="text-[var(--amber)]">”</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1b: WHY HOUSEPADI */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 mb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Engineered for modern renting
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Traditional property hunting in Nigeria is plagued by fake listings, unreliable agents, and cumbersome payments. HousePadi rebuilds the entire stack.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            [ShieldCheck, "KYC & Ownership Verified", "Every property is legally vetted and title-checked before going live to eliminate scammers."],
            [Search, "Semantic AI Matching", "Describe your dream home in natural conversational language and get accurate property results instantly."],
            [Wallet, "Secure Escrow Payments", "Rent and security deposits are held securely in bank-grade escrow until keys are handed over."],
            [Building2, "End-to-End Landlord Tools", "List properties, review credit-checked applications, and receive rent payouts seamlessly."],
          ].map(([Icon, title, copy], i) => {
            const IconComp = Icon as React.ComponentType<{ size?: number; className?: string }>;
            return (
              <div
                key={String(title)}
                className="bg-[var(--ink-soft)]/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-[var(--amber)]/45 transition-all group flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[var(--amber)]/15 text-[var(--amber)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <IconComp size={22} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{title as string}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{copy as string}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-mono-num text-[var(--amber)] cursor-pointer" onClick={() => openAgent(`Tell me more about ${title}`)}>
                  Learn more <ArrowRight size={12} className="ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: DYNAMIC AGENT RESULTS */}
      <div ref={resultsRef} />
      {aiResults && aiResults.length > 0 && (
        <section className="relative z-10 max-w-7xl mx-auto px-6 mb-24">
          <div className="flex items-baseline justify-between mb-8 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono-num text-[var(--amber)] uppercase tracking-widest">Live Agent Output</span>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mt-1">
                Your AI Search Results
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setAiResults(null);
                  localStorage.removeItem(STORAGE_KEY_RESULTS);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4 cursor-pointer bg-transparent border-none"
              >
                Clear Results
              </button>
              <span className="font-mono-num text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {aiResults.length} match{aiResults.length === 1 ? "" : "es"} found
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiResults.map((p, i) => (
              <ResultTicket key={p.id || i} property={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: TRUST METRICS */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
        {[
          ["10k+", "Verified Listings", "Across Lagos, Abuja & Port Harcourt"],
          ["99.4%", "Matching Accuracy", "Based on renter preference criteria"],
          ["< 24h", "Average Lease Close", "From agent prompt to signed lease"],
          ["₦2.4B+", "Secured Escrow", "Processed safely via bank integration"],
        ].map(([val, label, sub]) => (
          <div key={label} className="bg-[var(--ink-soft)]/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 border-t-2 border-t-[var(--amber)]/80 flex flex-col justify-between shadow-xl">
            <div>
              <div className="font-mono-num text-3xl md:text-4xl font-bold text-[var(--amber)] mb-2">{val}</div>
              <div className="text-sm font-semibold text-white mb-1">{label}</div>
              <div className="text-xs text-slate-400">{sub}</div>
            </div>
          </div>
        ))}
      </section>

      {/* SECTION 4: MARKET SNAPSHOT */}
      <section id="market-insights" className="relative z-10 py-16 px-6 max-w-7xl mx-auto bg-[var(--ink-soft)]/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 mb-24 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4 relative z-10">
          <div>
            <span className="text-xs font-mono-num text-[var(--amber)] uppercase tracking-widest">Real-time Analytics</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-1">Lagos Market Snapshot</h2>
          </div>
          <span className="font-mono-num text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
            Updated Live · Q3 2026
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {[
            { area: "Lekki Phase 1", type: "Residential Hub", price: "₦6.5M / yr", trend: "+18% search volume", yield: "8.4% ROI" },
            { area: "Victoria Island", type: "Commercial & Luxury", price: "₦12.0M / yr", trend: "+12% demand", yield: "9.1% ROI" },
            { area: "Yaba Tech District", type: "Co-living & Studios", price: "₦2.8M / yr", trend: "+34% inquiry rate", yield: "10.5% ROI" },
            { area: "Ikoyi", type: "Ultra Prime", price: "₦25.0M / yr", trend: "+8% volume", yield: "7.2% ROI" },
            { area: "Ikeja GRA", type: "Family & Executive", price: "₦5.5M / yr", trend: "+15% demand", yield: "8.9% ROI" },
            { area: "Ajah / Sangotedo", type: "High Growth Suburbs", price: "₦2.2M / yr", trend: "+42% volume", yield: "11.2% ROI" },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => openAgent(`Show me properties in ${item.area}`)}
              className="bg-[var(--ink)]/80 p-6 rounded-2xl border border-white/10 hover:border-[var(--amber)]/50 transition-all cursor-pointer group shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] font-mono-num text-slate-500 uppercase tracking-wider">{item.type}</span>
                  <h3 className="font-display text-xl font-medium text-white group-hover:text-[var(--amber)] transition-colors">{item.area}</h3>
                </div>
                <span className="text-xs font-mono-num text-[var(--verified)] bg-[var(--verified)]/10 px-2 py-0.5 rounded border border-[var(--verified)]/20">
                  {item.yield}
                </span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-white/5">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Avg. Rent</div>
                  <div className="font-mono-num font-semibold text-white">{item.price}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Trend</div>
                  <div className="font-mono-num text-xs text-[var(--amber)]">{item.trend}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: FEATURED PROPERTIES */}
      <section className="relative z-10 py-12 px-6 max-w-7xl mx-auto mb-24">
        <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="text-xs font-mono-num text-[var(--amber)] uppercase tracking-widest">Handpicked Directory</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-1">Featured verified properties</h2>
          </div>
          <button
            type="button"
            onClick={() => openAgent("Show me all featured property listings")}
            className="text-sm font-medium text-[var(--amber)] hover:text-[var(--amber-soft)] inline-flex items-center gap-1.5 bg-[var(--amber)]/10 px-4 py-2 rounded-xl border border-[var(--amber)]/25 transition-colors cursor-pointer"
          >
            Browse directory via chat <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-96 motion-safe:animate-pulse bg-white/5 rounded-3xl" />)}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.map((p: any, i) => <ResultTicket key={p.id} property={p} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-[var(--ink-soft)]/50 backdrop-blur-sm">
            <p className="text-slate-400 text-sm">No featured listings available right now — chat with our AI agent to explore our complete directory.</p>
            <button
              type="button"
              onClick={() => openAgent("Show me all available properties")}
              className="mt-4 inline-block text-xs text-[var(--amber)] underline bg-transparent border-none cursor-pointer"
            >
              Browse all properties via agent
            </button>
          </div>
        )}
      </section>

      {/* SECTION 6: LANDLORD CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--amber)]/30 bg-gradient-to-br from-[var(--ink-soft)] via-[var(--ink)] to-black p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-mono-num text-[var(--amber)] uppercase tracking-widest mb-3 block">For Property Owners & Landlords</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4 leading-tight">
              List your property. Screen tenants automatically. Get paid securely.
            </h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              Skip traditional agency hassles, rent defaults, and endless phone calls. HousePadi connects your vacancy directly with pre-screened, credit-verified professionals in minutes.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--verified)]" /> 0% fraudulent tenants
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--verified)]" /> Instant KYC checks
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--verified)]" /> Automated lease generator
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--verified)]" /> Guaranteed escrow payouts
              </div>
            </div>
          </div>
          <div className="relative z-10 shrink-0 flex flex-col gap-4 w-full md:w-auto">
            <Link
              href="/landlord/properties/new"
              className="inline-flex items-center justify-center gap-2 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-semibold text-sm px-8 py-4 rounded-2xl transition-colors shadow-lg shadow-[var(--amber)]/20"
            >
              List your property now <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/landlord"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-8 py-4 rounded-2xl transition-colors"
            >
              Explore landlord dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7: WORKFLOW */}
      <section className="relative z-10 py-20 px-6 bg-[var(--ink-soft)]/80 backdrop-blur-xl mb-24 border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono-num text-[var(--amber)] uppercase tracking-widest">Seamless 3-Step Flow</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-1">How HousePadi AI works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Talk to the Neural Agent",
                copy: "Describe your ideal home specifications in plain human language. Specify budget caps, preferred streets, solar power requirements, or pet policies without struggling with dropdown filters.",
                icon: MessageSquare,
              },
              {
                step: "02",
                title: "Review Verified Matches",
                copy: "Our AI evaluates verified database listings against your prompt, presenting curated property cards with verified ownership badges, pricing transparency, and high-res tours.",
                icon: Search,
              },
              {
                step: "03",
                title: "Close via Secure Escrow",
                copy: "Schedule virtual or physical tours, sign standardized digital tenancy agreements, and deposit rent securely into escrow until keys are handed over.",
                icon: Lock,
              },
            ].map((item, i) => {
              const IconComp = item.icon;
              return (
                <div key={i} className="bg-[var(--ink)] p-8 rounded-3xl border border-white/10 relative flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--amber)]/10 text-[var(--amber)] flex items-center justify-center font-mono-num font-bold text-lg">
                        {item.step}
                      </div>
                      <IconComp size={20} className="text-slate-500" />
                    </div>
                    <h3 className="font-display text-xl font-medium mb-3 text-white">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.copy}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5 text-xs font-mono-num text-slate-500">
                    Step {i + 1} of 3 in HousePadi Protocol
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 8: FAQ */}
      <section id="faq" className="relative z-10 max-w-5xl mx-auto px-6 mb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono-num text-[var(--amber)] uppercase tracking-widest flex items-center justify-center gap-1.5">
            <HelpCircle size={14} /> Got Questions?
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-1">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "How does the AI agent find properties?",
              a: "Our AI agent uses advanced natural language processing and vector search to match your conversational prompt against our verified database of real-time property listings, checking criteria like exact location, budget limits, amenities, and lease terms instantly.",
            },
            {
              q: "Are all listings on HousePadi verified?",
              a: "Yes. Every single property undergoes rigorous KYC screening, physical inspection, and land title verification before being published with our 'VERIFIED' badge.",
            },
            {
              q: "How does the escrow payment system protect me?",
              a: "When you pay rent or security deposits through HousePadi, funds are held securely in a bank-grade escrow account. The landlord only receives payout after you confirm physical inspection and key handover.",
            },
            {
              q: "How do I list my property as a landlord?",
              a: "Simply click 'List your property', enter your property details and ownership documents, complete our fast KYC verification, and your listing will be live and searchable by thousands of verified renters.",
            },
          ].map((faq, i) => (
            <div key={i} className="bg-[var(--ink-soft)]/80 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/10 shadow-lg">
              <h3 className="font-display text-lg font-medium text-white mb-2 flex items-start gap-3">
                <span className="text-[var(--amber)] font-mono-num text-sm mt-0.5">Q.</span>
                {faq.q}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}

const ResultTicket = ({ property, index }: { property: any; index: number }) => (
  <div className="ticket-stub relative bg-[var(--ink-soft)]/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-[var(--amber)]/50 transition-all shadow-xl">
    <div className="absolute top-4 right-4 z-10 -rotate-6 border-2 border-dashed border-[var(--amber)] text-[var(--amber)] text-[10px] font-mono-num font-semibold tracking-widest px-2.5 py-1 rounded-full bg-[var(--ink-soft)]/95 shadow-md">
      VERIFIED
    </div>
    <PropertyCard property={property} />
    <div className="border-t border-dashed border-white/10 mx-5" />
    <div className="px-5 py-3.5 flex justify-between items-center text-[10px] font-mono-num text-slate-400 tracking-wider">
      <span>REF #{String(property.id ?? index).slice(0, 8).toUpperCase()}</span>
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--verified)]" />
        HOUSEPADI NEURAL
      </span>
    </div>
  </div>
);