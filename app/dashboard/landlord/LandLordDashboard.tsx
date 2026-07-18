/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "../../component/auth/AuthGuard";
import { apiClient } from "@/app/lib/api-client";
import Link from "next/link";
import Image from "next/image";
import { CreatePropertyModal } from "@/app/component/modals/CreatePropertyModal";
import { Header } from "@/app/component/ui/Header";

export const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState("properties");
  const tabs = ["properties", "tours", "applications"];

  // TanStack Query handles caching, loading, and error states automatically
  const { data, isLoading, isError } = useQuery({
    queryKey: ["landlord", activeTab],
    queryFn: async () => {
      const res = await apiClient.get(
        `/api/${activeTab == "properties" ? "property" : activeTab}/landlord/listings`,
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <AuthGuard allowedRole="landlord">
      <Header />

      <div className="max-w-7xl mx-auto p-8 space-y-10 mt-12">
        <CreatePropertyModal />

        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Landlord Portal
            </h1>
            <p className="text-slate-400 mt-1">
              Manage your properties, schedule tours, and track applications.
            </p>
          </div>
          <Link
            href="/dashboard/landlord/create-property"
            className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-teal-900/20"
          >
            + New Listing
          </Link>
        </header>

        <nav className="flex gap-1 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 capitalize font-medium transition-all relative ${activeTab === tab ? "text-teal-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
              )}
            </button>
          ))}
        </nav>

        <div className="min-h-100">
          {isLoading ? (
            <div className="text-slate-500 animate-pulse">
              Loading {activeTab}...
            </div>
          ) : isError ? (
            <div className="text-red-400">
              Error loading {activeTab}. Please try again.
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl text-slate-500">
              No {activeTab} found.
            </div>
          ) : (
            <RenderContent tab={activeTab} items={data} />
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

const RenderContent = ({ tab, items }: { tab: string; items: any[] }) => {
  if (tab === "properties") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <div
            key={p.id}
            className="group bg-slate-900 rounded-2xl border border-white/10 overflow-hidden hover:border-teal-500/50 transition-all"
          >
            {/* 1. Add 'relative' and a fixed height (e.g., h-48) to the container */}
            <div className="relative h-48 w-full bg-slate-800">
              <Image
                src={p.images?.[0] || "/placeholder.jpg"}
                alt={p.title || "Property"}
                fill
                // 2. Use object-cover to crop the image nicely within the 48px height
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg text-white truncate">
                {p.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">
                {p.address_full}
              </p>

              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Price</span>
                <span className="text-white font-medium">
                  {p.currency} {p.price?.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <Link
                  href={`/properties/${p.id}`}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View
                </Link>
                <button className="text-sm text-red-400 hover:text-red-300">
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <div className="text-slate-400">View for {tab} coming soon.</div>;
};
