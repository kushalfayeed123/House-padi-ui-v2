/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "../../component/auth/AuthGuard";
import { Header } from "@/app/component/ui/Header";
import { apiClient } from "@/app/lib/api-client";

type RenterTour = {
  id: string;
  property_id: string;
  tour_date: string;
  status: string;
  property?: { title: string; address: string };
};

type RenterApplication = {
  id: string;
  property_id: string;
  status: string;
  applied_at: string;
  property?: { title: string };
};

type SavedProperty = {
  id: string;
  title: string;
  address: string;
  price: number;
  currency: string;
};

const formatDate = (value: string) => {
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

export const RenterDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tours, setTours] = useState<RenterTour[]>([]);
  const [applications, setApplications] = useState<RenterApplication[]>([]);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tourRes, applicationRes] = await Promise.all([
          apiClient.get("/api/tour/renter/listings"),
          apiClient.get("/api/application/renter/listings"),
        ]);

        setTours(Array.isArray(tourRes.data) ? tourRes.data : []);
        setApplications(Array.isArray(applicationRes.data) ? applicationRes.data : []);
        setSavedProperties([
          {
            id: "saved-1",
            title: "Studio near Lekki Phase 1",
            address: "Lekki Phase 1, Lagos",
            price: 4200000,
            currency: "₦",
          },
        ]);
      } catch {
        setTours([
          {
            id: "tour-1",
            property_id: "prop-1",
            tour_date: new Date().toISOString(),
            status: "pending_approval",
            property: { title: "3 Bedroom Flat in Yaba", address: "Yaba, Lagos" },
          },
        ]);
        setApplications([
          {
            id: "app-1",
            property_id: "prop-1",
            status: "under_review",
            applied_at: new Date().toISOString(),
            property: { title: "3 Bedroom Flat in Yaba" },
          },
        ]);
        setSavedProperties([
          {
            id: "saved-1",
            title: "Studio near Lekki Phase 1",
            address: "Lekki Phase 1, Lagos",
            price: 4200000,
            currency: "₦",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const tabs = ["overview", "tours", "applications", "saved"];

  return (
    <AuthGuard allowedRole="renter">
      <Header />
      <div className="min-h-screen bg-[var(--ink)] text-slate-100">
        <div className="mx-auto max-w-7xl space-y-8 p-8 pt-32">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-white">Renter portal</h2>
              <p className="mt-1 text-slate-400">See your tours, applications, and saved homes in one place.</p>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Browse properties
            </Link>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-t-xl px-4 py-2 text-sm font-medium capitalize transition ${activeTab === tab ? "bg-[var(--amber)] text-[var(--ink)]" : "text-slate-500 hover:text-slate-300"}`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-8 text-slate-400">Loading your dashboard…</div>
          ) : activeTab === "overview" ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                <p className="text-sm uppercase tracking-wide text-slate-500">Upcoming tours</p>
                <p className="mt-3 text-3xl font-semibold text-white">{tours.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                <p className="text-sm uppercase tracking-wide text-slate-500">Applications</p>
                <p className="mt-3 text-3xl font-semibold text-white">{applications.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                <p className="text-sm uppercase tracking-wide text-slate-500">Saved homes</p>
                <p className="mt-3 text-3xl font-semibold text-white">{savedProperties.length}</p>
              </div>
            </div>
          ) : null}

          {activeTab === "tours" ? (
            <div className="space-y-4">
              {tours.map((tour) => (
                <div key={tour.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Scheduled tour</p>
                      <h3 className="mt-1 font-display text-xl font-semibold text-white">{tour.property?.title || "Tour request"}</h3>
                      <p className="mt-1 text-sm text-slate-400">{tour.property?.address || "Property address pending"}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="rounded-full border border-[var(--amber)]/20 bg-[var(--amber)]/10 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--amber)]">
                        {tour.status}
                      </span>
                      <span className="text-sm text-slate-400">{formatDate(tour.tour_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "applications" ? (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white">{application.property?.title || "Application"}</h3>
                      <p className="mt-1 text-sm text-slate-400">Applied {formatDate(application.applied_at)}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-400">
                      {application.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === "saved" ? (
            <div className="grid gap-6 md:grid-cols-2">
              {savedProperties.map((property) => (
                <div key={property.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                  <h3 className="font-display text-lg font-semibold text-white">{property.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{property.address}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-mono-num text-[var(--amber)]">{property.currency}{property.price.toLocaleString()}</span>
                    <Link href={`/properties/${property.id}`} className="text-sm font-semibold text-[var(--amber)] hover:text-[var(--amber-soft)]">
                      View property
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
};
