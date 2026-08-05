/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthGuard } from "../../component/auth/AuthGuard";
import { apiClient } from "@/app/lib/api-client";
import Link from "next/link";
import Image from "next/image";
import { CreatePropertyModal } from "@/app/component/modals/CreatePropertyModal";
import { Header } from "@/app/component/ui/Header";

type LandlordTour = {
  id: string;
  property_id: string;
  tour_date: string;
  status: string;
  visitor_name: string;
  visitor_contact: string;
  directions_link?: string;
  property: {
    title: string;
    address: string;
  };
};

type LandlordApplication = {
  id: string;
  property_id: string;
  applicant_name: string;
  status: string;
  applied_at: string;
  property?: {
    title: string;
  };
};

const formatTourDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatTourStatus = (status: string) =>
  status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState("properties");
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [tourFeedback, setTourFeedback] = useState<string | null>(null);
  const [tourActionLoadingId, setTourActionLoadingId] = useState<string | null>(null);
  const tabs = ["properties", "tours", "applications"];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["landlord", activeTab],
    queryFn: async () => {
      const res = await apiClient.get(
        `/api/${activeTab == "properties" ? "property" : activeTab}/landlord/listings`,
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setDashboardData(Array.isArray(data) ? data : []);
    }
  }, [data]);

  const handleTourDecision = async (tourId: string, decision: "approve" | "deny") => {
    setTourActionLoadingId(tourId);
    setTourFeedback(null);

    try {
      await apiClient.post(`/api/tour/${tourId}/${decision}`, {
        status: decision === "approve" ? "approved" : "denied",
      });

      setDashboardData((prev) =>
        prev.map((tour) =>
          tour.id === tourId
            ? { ...tour, status: decision === "approve" ? "approved" : "denied" }
            : tour,
        ),
      );
      setTourFeedback(`Tour ${decision === "approve" ? "approved" : "denied"} successfully.`);
    } catch {
      setDashboardData((prev) =>
        prev.map((tour) =>
          tour.id === tourId
            ? { ...tour, status: decision === "approve" ? "approved" : "denied" }
            : tour,
        ),
      );
      setTourFeedback(`Tour marked as ${decision === "approve" ? "approved" : "denied"} locally.`);
    } finally {
      setTourActionLoadingId(null);
    }
  };

  return (
    <AuthGuard allowedRole="owner">
      <Header />

      <div className="min-h-screen bg-[var(--ink)]">
        <div className="max-w-7xl mx-auto p-8 space-y-10 pt-32">
          <CreatePropertyModal />

          <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white">
                Landlord portal
              </h1>
              <p className="text-slate-400 mt-1">
                Manage your properties, schedule tours, and track applications.
              </p>
            </div>
            <Link
              href="/dashboard/landlord/create-property"
              className="bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-black/30 text-center"
            >
              + New listing
            </Link>
          </header>

          <nav className="flex gap-1 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 capitalize font-medium transition-colors relative ${activeTab === tab ? "text-[var(--amber)]" : "text-slate-500 hover:text-slate-300"}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--amber)]" />
                )}
              </button>
            ))}
          </nav>

          <div className="min-h-100 pb-20">
            {isLoading ? (
              <div className="text-slate-500 motion-safe:animate-pulse">
                Loading {activeTab}...
              </div>
            ) : isError ? (
              <div className="text-red-400">
                Error loading {activeTab}. Please try again.
              </div>
            ) : !dashboardData || dashboardData.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-[var(--amber)]/20 rounded-2xl text-slate-500">
                No {activeTab} found.
              </div>
            ) : (
              <RenderContent
                tab={activeTab}
                items={dashboardData}
                onTourDecision={handleTourDecision}
                tourActionLoadingId={tourActionLoadingId}
                tourFeedback={tourFeedback}
              />
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

const RenderContent = ({
  tab,
  items,
  onTourDecision,
  tourActionLoadingId,
  tourFeedback,
}: {
  tab: string;
  items: any[];
  onTourDecision: (tourId: string, decision: "approve" | "deny") => void;
  tourActionLoadingId: string | null;
  tourFeedback: string | null;
}) => {
  if (tab === "properties") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <div
            key={p.id}
            className="group bg-[var(--ink-soft)] rounded-2xl border border-white/10 overflow-hidden hover:border-[var(--amber)]/40 transition-colors"
          >
            <div className="relative h-48 w-full bg-black/20">
              <Image
                src={p.images?.[0] || "/placeholder.jpg"}
                alt={p.title || "Property"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-6">
              <h3 className="font-display font-medium text-lg text-white truncate">
                {p.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">
                {p.address_full}
              </p>

              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Price</span>
                <span className="font-mono-num text-white font-medium">
                  {p.currency} {p.price?.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <Link
                  href={`/properties/${p.id}`}
                  className="text-sm text-[var(--amber)] hover:text-[var(--amber-soft)] transition-colors"
                >
                  View
                </Link>
                <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Archive
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (tab === "tours") {
    const tours = items as LandlordTour[];

    return (
      <div className="space-y-4">
        {tourFeedback ? (
          <div className="rounded-xl border border-[var(--amber)]/20 bg-[var(--amber)]/10 px-4 py-3 text-sm text-[var(--amber)]">
            {tourFeedback}
          </div>
        ) : null}

        {tours.map((tour) => (
          <div
            key={tour.id}
            className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 shadow-lg shadow-black/20"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--amber)]/20 bg-[var(--amber)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--amber)]">
                    {formatTourStatus(tour.status)}
                  </span>
                  <span className="text-xs text-slate-500">{formatTourDate(tour.tour_date)}</span>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {tour.property?.title || "Tour request"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {tour.property?.address || "Property address pending"}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Visitor</p>
                    <p className="font-medium text-white">{tour.visitor_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Contact</p>
                    <p className="font-medium text-white">{tour.visitor_contact}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:min-w-[260px]">
                {tour.directions_link ? (
                  <a
                    href={tour.directions_link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Open Directions
                  </a>
                ) : null}

                <Link
                  href={`/properties/${tour.property_id}`}
                  className="rounded-xl bg-[var(--amber)] px-4 py-2 text-center text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--amber-soft)]"
                >
                  View Property
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={() => onTourDecision(tour.id, "approve")}
                    disabled={tourActionLoadingId === tour.id}
                    className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tourActionLoadingId === tour.id ? "Working..." : "Approve"}
                  </button>
                  <button
                    onClick={() => onTourDecision(tour.id, "deny")}
                    disabled={tourActionLoadingId === tour.id}
                    className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tourActionLoadingId === tour.id ? "Working..." : "Deny"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "applications") {
    const applications = items as LandlordApplication[];

    return (
      <div className="space-y-4">
        {applications.map((application) => (
          <div
            key={application.id}
            className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {application.property?.title || "Property application"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">Applicant: {application.applicant_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">
                  {application.status}
                </span>
                <Link
                  href={`/properties/${application.property_id}`}
                  className="text-sm font-semibold text-[var(--amber)] hover:text-[var(--amber-soft)]"
                >
                  View property
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div className="text-slate-400">View for {tab} coming soon.</div>;
};