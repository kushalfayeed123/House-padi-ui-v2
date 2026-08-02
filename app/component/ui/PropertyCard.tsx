import Link from "next/link";
import Image from "next/image";
import { Property } from "@/app/types/property";

export const PropertyCard = ({ property }: { property: Property }) => (
  <div className="glass-card rounded-2xl overflow-hidden group cursor-pointer flex flex-col h-full">
    <div className="relative h-56 w-full overflow-hidden bg-(--ink-soft)">
      <Image
        src={
          property.images?.[0] ||
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
        }
        alt={property.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
      />
      <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide uppercase text-(--amber)">
        {property.status === "active" ? "Available" : "New"}
      </div>
    </div>

    <div className="p-6 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2 gap-3">
          <h3 className="font-display font-medium text-lg text-white leading-tight group-hover:text-(--amber) transition-colors">
            {property.title || "Premium Residence"}
          </h3>
          <p className="font-mono-num font-semibold text-lg text-white text-right shrink-0">
            ${property.price?.toLocaleString() || "4,500"}
            <span className="text-slate-500 text-xs font-normal block">
              /mo
            </span>
          </p>
        </div>
        <p className="text-slate-400 text-sm flex items-center gap-1">
          <svg
            className="w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {property.location || ""}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm text-slate-400">
        <div className="flex gap-4">
          <span>{property.features?.bedrooms || 0} Beds</span>
          <span>{property.features?.amenities || 'Amenities not specified'}</span>
        </div>
        <Link
          href={`/properties/${property.id}`}
          className="text-(--amber) font-medium group-hover:translate-x-1 transition-transform inline-block"
        >
          Details →
        </Link>
      </div>
    </div>
  </div>
);