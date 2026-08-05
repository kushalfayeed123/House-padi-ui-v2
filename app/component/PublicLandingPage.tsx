"use client";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/app/lib/api-client";
import { PropertyCard } from "./ui/PropertyCard";

const STORAGE_KEY_RESULTS = "housepadi_ai_results";

export const PublicLanding = () => {
  const [properties, setProperties] = useState([]);
  
  // Initialize aiResults from localStorage so it persists across page navigations
  const [aiResults, setAiResults] = useState<any[] | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(STORAGE_KEY_RESULTS);
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync aiResults to localStorage whenever it updates
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
    return () => window.removeEventListener("agent-results", handleResultsEvent);
  }, []);

  const openAgent = () => {
    window.dispatchEvent(new CustomEvent("open-agent-chat"));
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white pb-32 selection:bg-[var(--amber)] selection:text-[var(--ink)]">

      {/* SECTION 1: HERO */}
      <section className="relative pt-40 pb-28 px-6 overflow-hidden">
        <div
          className="absolute inset-0 blueprint-grid opacity-40"
          style={{ maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black, transparent)", WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black, transparent)" }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 font-mono-num text-[11px] tracking-[0.2em] text-[var(--amber)] uppercase mb-6 border border-[var(--amber)]/30 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--verified)] motion-safe:animate-pulse" />
            Agent online
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-semibold mb-6 tracking-tight leading-[1.05]">
            Tell it what home
            <br />
            you&apos;re looking for.
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            No filters to fight with. Describe your budget, your neighborhood,
            your must-haves — our agent searches verified listings and replies
            right here on the page.
          </p>
          <button
            onClick={openAgent}
            className="inline-flex items-center gap-2 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-semibold text-sm px-6 py-3.5 rounded-2xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            Ask the agent
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      {/* SECTION 2: DYNAMIC AGENT RESULTS */}
      <div ref={resultsRef} />
      {aiResults && aiResults.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex items-baseline justify-between mb-8 border-b border-white/10 pb-4">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--amber)]">
              Agent results
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setAiResults(null);
                  localStorage.removeItem(STORAGE_KEY_RESULTS);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4"
              >
                Clear Results
              </button>
              <span className="font-mono-num text-xs text-slate-500">
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
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {[["10k+", "Verified"], ["99%", "Accuracy"], ["< 24h", "Closing"], ["Bank", "Secure"]].map(([val, label]) => (
          <div key={label} className="bg-[var(--ink-soft)] p-8 rounded-3xl border border-white/5 border-t-2 border-t-[var(--amber)]/40">
            <div className="font-mono-num text-3xl font-semibold text-[var(--amber)] mb-1">{val}</div>
            <div className="text-sm text-slate-400 uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </section>

      {/* SECTION 4: MARKET SNAPSHOT */}
      <section className="py-14 px-6 max-w-7xl mx-auto bg-[var(--ink-soft)] rounded-[2rem] border border-white/5 mb-20">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">Market snapshot</h2>
          <span className="font-mono-num text-xs text-slate-500 uppercase tracking-widest">Lagos · Updated live</span>
        </div>
        <div className="divide-y divide-white/5">
          {[
            ["Rising demand", "Lekki Phase 1", "+18% search volume"],
            ["Highest yield", "Yaba", "9.2% avg ROI"],
            ["Fastest close", "Ikoyi", "3.4 days avg"],
          ].map(([label, place, stat]) => (
            <div key={place} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-1">
              <div>
                <span className="text-xs uppercase tracking-widest text-slate-500">{label}</span>
                <h3 className="font-display text-xl font-medium">{place}</h3>
              </div>
              <span className="font-mono-num text-[var(--verified)] text-sm">{stat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: FEATURED PROPERTIES */}
      <section className="py-12 px-6 max-w-7xl mx-auto mb-20">
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-12">Featured properties</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-96 motion-safe:animate-pulse bg-white/5 rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.map((p: any, i) => <ResultTicket key={p.id} property={p} index={i} />)}
          </div>
        )}
      </section>

      {/* SECTION 6: HOW IT WORKS */}
      <section className="py-20 px-6 bg-[var(--ink-soft)] mb-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-16 text-center">Seamless workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              ["Talk to the agent", "Describe what you need in plain language — no forms."],
              ["Get verified matches", "Every listing carries KYC-checked ownership and pricing."],
              ["Close safely", "Sign, pay, and move in through one escrowed flow."],
            ].map(([step, copy], i) => (
              <div key={step} className="text-center relative">
                <div className="w-14 h-14 mx-auto mb-6 rounded-full border-2 border-dashed border-[var(--amber)] flex items-center justify-center font-mono-num font-semibold text-[var(--amber)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-display text-xl font-medium mb-3">{step}</h3>
                <p className="text-slate-400 leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: TESTIMONIALS */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-16">Trusted by 10,000+ users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {[
            ["The AI found me a home in 2 hours.", "A."],
            ["Finally, a transparent search process.", "T."],
          ].map(([quote, initial], i) => (
            <div
              key={i}
              className="relative bg-[var(--ink-soft)] p-8 rounded-2xl rounded-bl-sm border border-white/5 text-left"
            >
              <span className="font-display text-4xl text-[var(--amber)]/40 leading-none block mb-2">&quot;</span>
              <p className="italic text-slate-200 mb-4">{quote}</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--amber)]/20 border border-[var(--amber)]/40 flex items-center justify-center text-xs font-mono-num text-[var(--amber)]">
                  {initial}
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-widest">Verified renter</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

const ResultTicket = ({ property, index }: { property: any; index: number }) => (
  <div className="ticket-stub relative bg-[var(--ink-soft)] rounded-2xl border border-white/5 overflow-hidden">
    <div className="absolute top-4 right-4 z-10 -rotate-6 border-2 border-dashed border-[var(--amber)] text-[var(--amber)] text-[10px] font-mono-num font-semibold tracking-widest px-2.5 py-1 rounded-full bg-[var(--ink-soft)]/90">
      VERIFIED
    </div>
    <PropertyCard property={property} />
    <div className="border-t border-dashed border-white/10 mx-5" />
    <div className="px-5 py-3 flex justify-between items-center text-[10px] font-mono-num text-slate-500 tracking-wider">
      <span>REF #{String(property.id ?? index).slice(0, 8).toUpperCase()}</span>
      <span className="flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-[var(--verified)]" />
        HOUSEPADI
      </span>
    </div>
  </div>
);