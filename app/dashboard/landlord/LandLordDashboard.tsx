/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "../../component/auth/AuthGuard";
import { apiClient } from "@/app/lib/api-client";
import Link from "next/link";
import Image from "next/image";
import { CreatePropertyModal } from "@/app/component/modals/CreatePropertyModal";
import { Header } from "@/app/component/ui/Header";
import { 
  Home, 
  Calendar, 
  FileText, 
  Wrench, 
  Bell, 
  MessageSquare, 
  Check, 
  X, 
  PenTool, 
  Loader2, 
  Trash2, 
  Users, 
  Building,
  AlertCircle,
  Wallet,
  ArrowUpRight
} from "lucide-react";

type LandlordTour = {
  id: string;
  property_id: string;
  tour_date: string;
  status: string;
  visitor_name: string;
  visitor_contact: string;
  directions_link?: string;
  property?: {
    title: string;
    address_full?: string;
    address?: string;
  };
};

type LandlordApplication = {
  id: string;
  property_id: string;
  renter_name?: string;
  applicant_name?: string;
  status: string;
  applied_at: string;
  renter_signature?: string;
  property?: {
    title: string;
  };
};

const formatDateTime = (value: string) => {
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

const formatStatus = (status: string) =>
  status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [subTab, setSubTab] = useState<"pending" | "approved" | "denied">("pending");
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const tabs = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "properties", label: "Properties", icon: Building },
    { id: "tours", label: "Tours", icon: Calendar },
    { id: "applications", label: "Applications", icon: FileText },
    { id: "tenants", label: "Tenants & Leases", icon: Users },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "announcements", label: "Announcements", icon: Bell },
    { id: "chat", label: "Tenant Messages", icon: MessageSquare },
  ];

  // Endpoint mapping matching the backend FastAPI router structure
  const getTabEndpoint = (tab: string) => {
    switch (tab) {
      case "overview":
        return "/api/landlord/overview";
      case "properties":
        return "/api/landlord/properties";
      case "tours":
        return "/api/landlord/tours";
      case "applications":
        return "/api/landlord/applications";
      default:
        return `/api/landlord/${tab}`;
    }
  };

  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ["landlord", activeTab],
    queryFn: async () => {
      try {
        const res = await apiClient.get(getTabEndpoint(activeTab));
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 500 || err.code === "ERR_NETWORK") {
          return { items: [], metrics: null, unImplemented: true };
        }
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  const isUnimplemented = queryData?.unImplemented || false;

  const handleTourDecision = async (tourId: string, decision: "approve" | "deny") => {
    setActionLoadingId(tourId);
    setFeedback(null);

    try {
      await apiClient.post(`/api/tours/${tourId}/${decision}`);
      setFeedback({
        msg: `Tour ${decision === "approve" ? "approved" : "denied"} successfully.`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["landlord", "tours"] });
      queryClient.invalidateQueries({ queryKey: ["landlord", "overview"] });
    } catch (err: any) {
      setFeedback({
        msg: err.response?.data?.detail || "Failed to update tour status.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchiveProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to archive this property?")) return;
    setActionLoadingId(propertyId);
    try {
      await apiClient.delete(`/api/property/${propertyId}`);
      setFeedback({ msg: "Property archived successfully.", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["landlord", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["landlord", "overview"] });
    } catch (err: any) {
      setFeedback({
        msg: err.response?.data?.detail || "Failed to archive property.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AuthGuard allowedRole="owner">
      <Header />

      <div className="min-h-screen bg-[var(--ink)] text-slate-100">
        <div className="max-w-7xl mx-auto p-8 space-y-10 pt-32">
          <CreatePropertyModal />

          <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--amber)]/10 text-[var(--amber)] border border-[var(--amber)]/20 text-xs font-semibold mb-3">
                Landlord & Property Manager Portal
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white">
                Landlord dashboard
              </h1>
              <p className="text-slate-400 mt-1">
                Manage your real estate portfolio, tour requests, lease applications, and tenant communications.
              </p>
            </div>
            <Link
              href="/dashboard/landlord/create-property"
              className="bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-black/30 text-center"
            >
              + New listing
            </Link>
          </header>

          {/* Main Navigation Tabs */}
          <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSubTab("pending");
                    setFeedback(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-[var(--amber)] text-[var(--ink)] font-semibold shadow"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <IconComp size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Secondary Sub-Tabs for Tours and Applications */}
          {["tours", "applications"].includes(activeTab) && (
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
              {(["pending", "approved", "denied"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSubTab(st)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    subTab === st
                      ? "bg-[var(--amber)] text-[var(--ink)] shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold border ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {feedback.msg}
            </div>
          )}

          <div className="min-h-[400px] pb-20">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                <Loader2 size={32} className="animate-spin text-[var(--amber)]" />
                <p className="text-sm">Fetching landlord records...</p>
              </div>
            ) : isError || isUnimplemented ? (
              <EmptyState tab={activeTab} isUnimplemented={isUnimplemented} />
            ) : (
              <RenderContent
                tab={activeTab}
                queryData={queryData}
                subTab={subTab}
                onTourDecision={handleTourDecision}
                onArchiveProperty={handleArchiveProperty}
                actionLoadingId={actionLoadingId}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

const EmptyState = ({ tab, isUnimplemented }: { tab: string; isUnimplemented: boolean }) => {
  const titles: Record<string, string> = {
    overview: "No Overview Data Available",
    properties: "No Properties Listed Yet",
    tours: "No Tour Requests Found",
    applications: "No Lease Applications Received",
    tenants: "No Active Leases or Tenants",
    maintenance: "No Maintenance Requests",
    announcements: "No Active Announcements",
    chat: "No Tenant Messages",
  };

  const descriptions: Record<string, string> = {
    overview: "We couldn't aggregate your portfolio metrics at the moment.",
    properties: "Get started by creating your first property listing to attract renters.",
    tours: "When prospective renters schedule property visits, they will appear here.",
    applications: "Rental applications submitted by prospective tenants will show up here for your review.",
    tenants: "Active tenant leases and contract agreements will be listed here once finalized.",
    maintenance: "Tenant maintenance tickets and repair requests will appear here.",
    announcements: "Broadcast messages sent to your properties will be shown here.",
    chat: "Active conversation threads with your tenants will appear here.",
  };

  return (
    <div className="text-center py-20 border-2 border-dashed border-[var(--amber)]/20 rounded-2xl bg-white/[0.02] p-8 space-y-4">
      <div className="inline-flex p-3 rounded-full bg-[var(--amber)]/10 text-[var(--amber)]">
        {isUnimplemented ? <AlertCircle size={28} /> : <Building size={28} />}
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="font-display text-lg font-semibold text-white">
          {titles[tab] || "No Data Available"}
        </h3>
        <p className="text-sm text-slate-400">
          {isUnimplemented 
            ? `The endpoint for this module is currently unavailable or not configured.` 
            : descriptions[tab] || "There is currently no data available in this section."}
        </p>
      </div>
      {tab === "properties" && (
        <div className="pt-2">
          <Link
            href="/dashboard/landlord/create-property"
            className="inline-flex items-center gap-2 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow"
          >
            + Create First Listing
          </Link>
        </div>
      )}
    </div>
  );
};

const RenderContent = ({
  tab,
  queryData,
  subTab,
  onTourDecision,
  onArchiveProperty,
  actionLoadingId,
  setActiveTab,
}: {
  tab: string;
  queryData: any;
  subTab: "pending" | "approved" | "denied";
  onTourDecision: (tourId: string, decision: "approve" | "deny") => void;
  onArchiveProperty: (propertyId: string) => void;
  actionLoadingId: string | null;
  setActiveTab: (tab: string) => void;
}) => {
  // 1. OVERVIEW TAB
  if (tab === "overview") {
    const metrics = queryData?.metrics || {
      total_properties: 0,
      active_listings: 0,
      total_tours: 0,
      pending_tours: 0,
      total_applications: 0,
      pending_applications: 0,
      wallet_balance: 0,
    };

    const properties = queryData?.data?.properties || [];

    return (
      <div className="space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--ink-soft)] border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Wallet Balance</span>
              <Wallet size={18} className="text-[var(--amber)]" />
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              ₦{metrics.wallet_balance?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-500">Available earnings</p>
          </div>

          <div className="bg-[var(--ink-soft)] border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Properties</span>
              <Building size={18} className="text-[var(--amber)]" />
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              {metrics.active_listings} <span className="text-sm font-normal text-slate-400">/ {metrics.total_properties} active</span>
            </div>
            <button 
              onClick={() => setActiveTab("properties")} 
              className="text-xs text-[var(--amber)] hover:underline flex items-center gap-1 font-medium pt-1"
            >
              View portfolio <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="bg-[var(--ink-soft)] border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Tours</span>
              <Calendar size={18} className="text-[var(--amber)]" />
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              {metrics.pending_tours} <span className="text-sm font-normal text-slate-400">pending</span>
            </div>
            <button 
              onClick={() => setActiveTab("tours")} 
              className="text-xs text-[var(--amber)] hover:underline flex items-center gap-1 font-medium pt-1"
            >
              Review requests ({metrics.total_tours} total) <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="bg-[var(--ink-soft)] border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Applications</span>
              <FileText size={18} className="text-[var(--amber)]" />
            </div>
            <div className="font-mono text-3xl font-bold text-white">
              {metrics.pending_applications} <span className="text-sm font-normal text-slate-400">pending</span>
            </div>
            <button 
              onClick={() => setActiveTab("applications")} 
              className="text-xs text-[var(--amber)] hover:underline flex items-center gap-1 font-medium pt-1"
            >
              Manage applications ({metrics.total_applications} total) <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Quick Preview of Recent Properties */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-white">Recent Listings Overview</h3>
            <button 
              onClick={() => setActiveTab("properties")}
              className="text-xs font-semibold text-[var(--amber)] hover:underline"
            >
              View All Properties &rarr;
            </button>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 border border-white/10 rounded-2xl bg-white/[0.01]">
              <p className="text-sm text-slate-400 mb-3">No properties listed yet.</p>
              <Link
                href="/dashboard/landlord/create-property"
                className="inline-block bg-[var(--amber)] text-[var(--ink)] px-4 py-2 rounded-xl text-xs font-semibold"
              >
                + Add Property
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {properties.slice(0, 3).map((p: any) => (
                <div key={p.id} className="bg-[var(--ink-soft)] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="relative h-36 w-full bg-black/20">
                    <Image
                      src={p.images?.[0] || "/placeholder.jpg"}
                      alt={p.title || "Property"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-display font-medium text-white truncate">{p.title}</h4>
                    <p className="text-slate-400 text-xs truncate">{p.address_full}</p>
                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="font-mono text-[var(--amber)] font-medium">
                        {p.currency || "₦"} {p.price?.toLocaleString()}
                      </span>
                      <Link href={`/properties/${p.id}`} className="text-slate-300 hover:text-white underline">
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. PROPERTIES TAB
  if (tab === "properties") {
    const items = Array.isArray(queryData) ? queryData : queryData?.items || [];

    if (items.length === 0) {
      return <EmptyState tab="properties" isUnimplemented={false} />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p: any) => (
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
              <h3 className="font-display font-medium text-lg text-white truncate">{p.title}</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4 truncate">{p.address_full || p.address}</p>

              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Price</span>
                <span className="font-mono text-white font-medium">
                  {p.currency || "₦"} {p.price?.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <Link
                  href={`/properties/${p.id}`}
                  className="text-sm text-[var(--amber)] hover:text-[var(--amber-soft)] transition-colors font-semibold"
                >
                  View Details
                </Link>
                <button
                  onClick={() => onArchiveProperty(p.id)}
                  disabled={actionLoadingId === p.id}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {actionLoadingId === p.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={14} /> Archive
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. TOURS TAB
  if (tab === "tours") {
    const items = Array.isArray(queryData) ? queryData : queryData?.items || [];
    const filteredTours = items.filter((tour: any) => {
      const status = (tour.status || "").toLowerCase();
      if (subTab === "pending") return status.includes("pending");
      if (subTab === "approved") return status.includes("approve") && !status.includes("pending");
      if (subTab === "denied") return status.includes("denied") || status.includes("reject");
      return true;
    }) as LandlordTour[];

    if (filteredTours.length === 0) {
      return (
        <div className="text-center py-16 border border-white/10 rounded-2xl bg-white/[0.01] space-y-3">
          <Calendar size={28} className="mx-auto text-slate-500" />
          <p className="text-sm text-slate-400">No {subTab} tour requests found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredTours.map((tour) => (
          <div
            key={tour.id}
            className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 shadow-lg shadow-black/20"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--amber)]/20 bg-[var(--amber)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--amber)]">
                    {formatStatus(tour.status)}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(tour.tour_date)}</span>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {tour.property?.title || "Tour Request"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">{tour.property?.address_full || tour.property?.address || "Property address pending"}</p>
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
                {tour.directions_link && (
                  <a
                    href={tour.directions_link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Open Directions
                  </a>
                )}

                <Link
                  href={`/properties/${tour.property_id}`}
                  className="rounded-xl bg-[var(--amber)] px-4 py-2 text-center text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--amber-soft)]"
                >
                  View Property
                </Link>

                {tour.status.toLowerCase().includes("pending") && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onTourDecision(tour.id, "approve")}
                      disabled={actionLoadingId === tour.id}
                      className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {actionLoadingId === tour.id ? <Loader2 size={14} className="animate-spin" /> : "Approve"}
                    </button>
                    <button
                      onClick={() => onTourDecision(tour.id, "deny")}
                      disabled={actionLoadingId === tour.id}
                      className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {actionLoadingId === tour.id ? <Loader2 size={14} className="animate-spin" /> : "Deny"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 4. APPLICATIONS TAB
  if (tab === "applications") {
    const items = Array.isArray(queryData) ? queryData : queryData?.items || [];
    const filteredApps = items.filter((app: any) => {
      const status = (app.status || "").toLowerCase();
      if (subTab === "pending") return status.includes("pending");
      if (subTab === "approved") return status.includes("approve") && !status.includes("pending");
      if (subTab === "denied") return status.includes("denied") || status.includes("reject");
      return true;
    }) as LandlordApplication[];

    if (filteredApps.length === 0) {
      return (
        <div className="text-center py-16 border border-white/10 rounded-2xl bg-white/[0.01] space-y-3">
          <FileText size={28} className="mx-auto text-slate-500" />
          <p className="text-sm text-slate-400">No {subTab} lease applications found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredApps.map((app) => (
          <LandlordApplicationCard key={app.id} application={app} />
        ))}
      </div>
    );
  }

  return <EmptyState tab={tab} isUnimplemented={false} />;
};

const LandlordApplicationCard = ({ application }: { application: LandlordApplication }) => {
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleApprove = async () => {
    if (!signature.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post(`/api/applications/${application.id}/approve`, {
        landlord_signature: signature,
      });
      queryClient.invalidateQueries({ queryKey: ["landlord", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["landlord", "overview"] });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to approve application.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post(`/api/applications/${application.id}/reject`);
      queryClient.invalidateQueries({ queryKey: ["landlord", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["landlord", "overview"] });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to reject application.");
    } finally {
      setLoading(false);
    }
  };

  const isPending = application.status.toLowerCase().includes("pending");

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">
            {application.property?.title || "Lease Application"}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Applicant: <span className="text-white font-medium">{application.applicant_name || application.renter_name || "N/A"}</span>
          </p>
          {application.renter_signature && (
            <p className="text-xs text-slate-500 italic mt-0.5">
              Renter Signed: &quot;{application.renter_signature}&quot;
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-400 font-medium">
            {formatStatus(application.status)}
          </span>
          <Link
            href={`/properties/${application.property_id}`}
            className="text-sm font-semibold text-[var(--amber)] hover:text-[var(--amber-soft)]"
          >
            View Property
          </Link>
        </div>
      </div>

      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

      {isPending && (
        <div className="pt-4 border-t border-white/5 grid gap-3 sm:grid-cols-3 items-end">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-slate-300 flex items-center gap-1 font-medium">
              <PenTool size={12} className="text-[var(--amber)]" /> Type Full Signature to Execute Contract
            </label>
            <input
              type="text"
              placeholder="Landlord Legal Signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white focus:border-[var(--amber)] outline-none font-serif italic"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={loading || !signature.trim()}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Approve</>}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="py-2.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-xs rounded-xl transition flex items-center justify-center"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};