"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Property } from "../types/property";
import { EditPropertyModal } from "./modals/EditPropertyModal";
import { ChevronLeft, ChevronRight, MapPin, ArrowLeft, Building, LayoutGrid, CalendarDays, FileCheck } from "lucide-react";

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

  const nextImage = () => setCurrentIdx((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setCurrentIdx((prev) => (prev - 1 + property.images.length) % property.images.length);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* 1. Header with Back Button */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-800 rounded-xl transition mt-1"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-400 text-xs font-semibold uppercase tracking-wider border border-teal-500/20">
                  {property.status}
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {property.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{property.title}</h1>
              <p className="text-slate-400 flex items-center gap-1.5 text-xs">
                <MapPin size={14} className="text-slate-500" /> {property.address_full}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isLandlord && (
              <button 
                onClick={() => setIsEditOpen(true)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Edit Listing
              </button>
            )}
            <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-teal-950/50">
              View Analytics
            </button>
          </div>
        </div>

        {/* 2. Core Operational Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-2xl">
              <Image 
                src={property.images[currentIdx]} 
                alt={property.title} 
                fill 
                priority
                sizes="(max-width: 1024px) 100vw, 850px"
                className="object-cover" 
              />
              <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-950/60 backdrop-blur-md border border-white/5 rounded-xl text-white hover:bg-slate-900 transition">
                <ChevronLeft size={16}/>
              </button>
              <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-950/60 backdrop-blur-md border border-white/5 rounded-xl text-white hover:bg-slate-900 transition">
                <ChevronRight size={16}/>
              </button>
              <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/5 px-3 py-1 rounded-lg text-[10px] font-mono tracking-wider text-slate-400">
                {currentIdx + 1} / {property.images.length}
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
                <LayoutGrid size={16} className="text-teal-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Property Details</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800/40 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Monthly Rent</span>
                  <div className="text-base font-bold text-teal-400">{property.currency}{property.price.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-slate-900/60 border border-slate-800/40 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Listing Status</span>
                  <div className="text-base font-bold text-white">{property.status}</div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pt-2">{property.description}</p>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            {isRenter && (
              <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
                  <Building size={16} className="text-teal-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenant Actions</h3>
                </div>
                <button className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                  <CalendarDays size={16} /> Schedule Viewing
                </button>
                <button className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                  <FileCheck size={16} /> Apply for Lease
                </button>
              </div>
            )}

            <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800/60">
                <FileCheck size={16} className="text-teal-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Listing Verification</h3>
              </div>
              <ul className="text-xs text-slate-400 space-y-3 pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Standard rental agreement available
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Property ownership verified
                </li>
              </ul>
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