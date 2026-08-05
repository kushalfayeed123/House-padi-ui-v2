"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Property } from "../types/property";
import { EditPropertyModal } from "./modals/EditPropertyModal";
import { ChevronLeft, ChevronRight, MapPin, ArrowLeft, Building, LayoutGrid, CalendarDays, FileCheck } from "lucide-react";
import { apiClient } from "../lib/api-client";

interface PropertyDetailsViewProps {
  property: Property;
  isLandlord: boolean;
  isRenter: boolean;
}

export const PropertyDetailsView = ({
  property,
  isLandlord,
  isRenter,
}: PropertyDetailsViewProps) => {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tourSelection, setTourSelection] = useState<{ date: string; time: string }>({ date: "", time: "" });
  const [tourStatus, setTourStatus] = useState<string | null>(null);
  const [isSubmittingTour, setIsSubmittingTour] = useState(false);

  const nextImage = () => setCurrentIdx((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setCurrentIdx((prev) => (prev - 1 + property.images.length) % property.images.length);

  const handleTourSubmit = async () => {
    if (!tourSelection.date || !tourSelection.time) return;

    setIsSubmittingTour(true);
    setTourStatus(null);

    try {
      const { data } = await apiClient.post("/api/chat", {
        message: `Please book a tour for ${tourSelection.date} at ${tourSelection.time} for this property. title=${property.title} | location=${property.location} | full_address=${property.address_full}`,
        property_id: property.id,
      });

      setTourStatus(data?.content || data?.response || "Tour request submitted successfully.");
      setTourSelection({ date: "", time: "" });
    } catch {
      setTourStatus("Sorry, I couldn’t submit the tour request right now.");
    } finally {
      setIsSubmittingTour(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--ink) text-slate-100 antialiased">
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* 1. Header with Back Button */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-(--ink-soft)/60 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/5 rounded-xl transition mt-1"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-(--amber)/10 text-(--amber) text-xs font-semibold uppercase tracking-wider border border-(--amber)/20">
                  {property.status}
                </span>
                <span className="text-xs text-slate-500 font-mono-num">ID: {property.id.slice(0, 8)}</span>
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-white">{property.title}</h1>
              <p className="text-slate-400 flex items-center gap-1.5 text-xs">
                <MapPin size={14} className="text-slate-500" /> {property.address_full}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLandlord && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2 bg-(--ink-soft) hover:bg-white/5 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition"
              >
                Edit Listing
              </button>
            )}
            <button className="px-4 py-2 bg-(--amber) hover:bg-(--amber-soft) text-(--ink) rounded-xl text-xs font-semibold transition shadow-lg shadow-black/30">
              View Analytics
            </button>
          </div>
        </div>

        {/* 2. Core Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-8 space-y-6">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-[var(--ink-soft)] group shadow-2xl">
              <Image
                src={property.images[currentIdx]}
                alt={property.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 850px"
                className="object-cover"
              />
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-(--ink)/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-(--ink-soft) transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-(--ink)/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-(--ink-soft) transition">
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-4 right-4 bg-[var(--ink)]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-[10px] font-mono-num tracking-wider text-slate-400">
                {currentIdx + 1} / {property.images.length}
              </div>
            </div>

            <div className="bg-[var(--ink-soft)]/40 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <LayoutGrid size={16} className="text-[var(--amber)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Property Details</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--ink)]/60 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Price</span>
                  <div className="font-mono-num text-base font-semibold text-[var(--amber)]">{property.currency}{property.price.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-[var(--ink)]/60 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Listing Status</span>
                  <div className="text-base font-bold text-white capitalize">{property.status}</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-2">{property.description}</p>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            {isRenter && (
              <div className="bg-[var(--ink-soft)]/40 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <Building size={16} className="text-[var(--amber)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenant Actions</h3>
                </div>
                <div className="rounded-2xl border border-[var(--amber)]/20 bg-[var(--amber)]/10 p-4 space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--amber)]">
                    Select tour date & time
                  </div>
                  <input
                    type="date"
                    value={tourSelection.date}
                    onChange={(e) => setTourSelection((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[var(--ink)]/70 px-3 py-2 text-sm text-white"
                  />
                  <input
                    type="time"
                    value={tourSelection.time}
                    onChange={(e) => setTourSelection((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[var(--ink)]/70 px-3 py-2 text-sm text-white"
                  />
                  <button
                    onClick={handleTourSubmit}
                    disabled={!tourSelection.date || !tourSelection.time || isSubmittingTour}
                    className="w-full py-3 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CalendarDays size={16} /> {isSubmittingTour ? "Submitting..." : "Schedule Viewing"}
                  </button>
                  {tourStatus && (
                    <p className="text-xs text-slate-300">{tourStatus}</p>
                  )}
                </div>
                <button className="w-full py-3 bg-[var(--ink)] hover:bg-white/5 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                  <FileCheck size={16} /> Apply for Lease
                </button>
              </div>
            )}

            {/* Verification section — the ticket-stub signature is most at home here,
                since this card's entire job is showing trust/verification status. */}
            <div className="ticket-stub relative bg-[var(--ink-soft)]/40 border border-white/10 rounded-2xl p-6 space-y-4 overflow-hidden">
              <div className="absolute top-4 right-4 -rotate-6 border-2 border-dashed border-[var(--verified)] text-[var(--verified)] text-[9px] font-mono-num font-semibold tracking-widest px-2 py-0.5 rounded-full">
                VERIFIED
              </div>
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <FileCheck size={16} className="text-[var(--amber)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Listing Verification</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--verified)]" />
                  Standard rental agreement available
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--verified)]" />
                  Property ownership verified
                </li>
              </ul>
              <div className="border-t border-dashed border-white/10 pt-3 flex justify-between items-center text-[10px] font-mono-num text-slate-500 tracking-wider">
                <span>REF #{property.id.slice(0, 8).toUpperCase()}</span>
                <span>HOUSEPADI</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isLandlord && (
        <EditPropertyModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} property={property} />
      )}
    </div>
  );
};