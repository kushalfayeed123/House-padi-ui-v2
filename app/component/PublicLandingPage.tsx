"use client";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/app/lib/api-client";
import { ChatBox } from "./chat/ChatBox";
import { PropertyCard } from "./ui/PropertyCard";

export const PublicLanding = () => {
  const [properties, setProperties] = useState([]);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get("/api/property/featured")
      .then(res => setProperties(res.data || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (aiResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [aiResults]);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32">
      {/* SECTION 1: HERO */}
      <section className="pt-32 pb-20 px-6 text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">Your AI Property Agent.</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Stop searching, start finding. Our intelligent agent curates the market based on your lifestyle.</p>
      </section>

      {/* SECTION 2: DYNAMIC AGENT RESULTS */}
      <div ref={resultsRef} />
      {aiResults && (
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <h2 className="text-3xl font-bold mb-8 text-teal-400">Agent Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiResults.map((p, i) => <PropertyCard key={p.id || i} property={p} />)}
          </div>
        </section>
      )}

      {/* SECTION 3: TRUST METRICS (Existing) */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
        {[["10k+", "Verified"], ["99%", "Accuracy"], ["< 24h", "Closing"], ["Bank", "Secure"]].map(([val, label]) => (
          <div key={label} className="bg-slate-900 p-8 rounded-3xl border border-white/5">
            <div className="text-3xl font-bold text-teal-500 mb-1">{val}</div>
            <div className="text-sm text-slate-400 uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </section>

      {/* NEW SECTION 4: MARKET TRENDS */}
      <section className="py-12 px-6 max-w-7xl mx-auto bg-slate-900/50 rounded-[3rem] border border-white/5 mb-24">
        <h2 className="text-4xl font-bold mb-12 text-center">Market Snapshot 2026</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {["Rising Demand in Lekki", "High Yield ROI", "Top Neighborhoods"].map((trend) => (
            <div key={trend} className="p-6 border-l-2 border-teal-500">
              <h3 className="text-xl font-bold mb-2">{trend}</h3>
              <p className="text-slate-400">Our AI analyzes thousands of data points to predict market shifts in real-time.</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: FEATURED PROPERTIES */}
      <section className="py-12 px-6 max-w-7xl mx-auto mb-24">
        <h2 className="text-4xl font-bold mb-12">Featured Properties</h2>
        {loading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-96 animate-pulse bg-white/5 rounded-3xl" />)}</div> 
         : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{properties.map((p: any) => <PropertyCard key={p.id} property={p} />)}</div>}
      </section>

      {/* NEW SECTION 6: HOW IT WORKS */}
      <section className="py-24 px-6 bg-teal-900/10 mb-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-16 text-center">Seamless Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {["Talk to AI", "Get Verified Matches", "Close Safely"].map((step, i) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-black font-bold text-2xl mx-auto mb-6">{i + 1}</div>
                <h3 className="text-xl font-bold mb-4">{step}</h3>
                <p className="text-slate-400">An end-to-end process designed to remove friction from your search.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW SECTION 7: TESTIMONIALS */}
      <section className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-16">Trusted by 10,000+ Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {["The AI found me a home in 2 hours.", "Finally, a transparent search process!"].map((quote, i) => (
            <div key={i} className="bg-slate-900 p-10 rounded-3xl border border-white/5 italic">
              "{quote}"
              <div className="mt-4 font-bold not-italic text-teal-500">— Satisfied Client</div>
            </div>
          ))}
        </div>
      </section>

      {/* FIXED AGENT DOCK */}
      <ChatBox onResults={setAiResults} />
    </div>
  );
};