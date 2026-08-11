/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthGuard } from "../../component/auth/AuthGuard";
import { apiClient } from "@/app/lib/api-client";
import Link from "next/link";
import Image from "next/image";
import { CreatePropertyModal } from "@/app/component/modals/CreatePropertyModal";
import { Header } from "@/app/component/ui/Header";
import { Check, X, PenTool, Loader2, Trash2 } from "lucide-react";

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
    address: string;
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

const formatStatus = (status: string) =>
  status
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const LandlordDashboard = () => {
  const [activeTab, setActiveTab] = useState("properties");
  const [subTab, setSubTab] = useState<"pending" | "approved" | "denied">("pending");
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const tabs = ["properties", "tours", "applications"];
  const subTabs: Array<"pending" | "approved" | "denied"> = ["pending", "approved", "denied"];

  // Map tabs to clean backend API endpoints
  const getTabEndpoint = (tab: string) => {
    switch (tab) {
      case "properties":
        return "/property/landlord/listings";
      case "tours":
        return "/tours/landlord/listings";
      case "applications":
        return "/applications/landlord";
      default:
        return `/property/landlord/listings`;
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["landlord", activeTab],
    queryFn: async () => {
      const res = await apiClient.get(`api${getTabEndpoint(activeTab)}`);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (data) {
      setDashboardData(Array.isArray(data) ? data : data.items || []);
    }
  }, [data]);

  // Handle Tour Decision (Approve / Deny)
  const handleTourDecision = async (tourId: string, decision: "approve" | "deny") => {
    setActionLoadingId(tourId);
    setFeedback(null);

    try {
      await apiClient.post(`api/tours/${tourId}/${decision}`);
      setFeedback({
        msg: `Tour ${decision === "approve" ? "approved" : "denied"} successfully.`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["landlord", "tours"] });
    } catch (err: any) {
      setFeedback({
        msg: err.response?.data?.detail || `Failed to update tour status.`,
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Property Archive/Delete
  const handleArchiveProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to archive this property?")) return;
    setActionLoadingId(propertyId);
    try {
      await apiClient.delete(`api/property/${propertyId}`);
      setFeedback({ msg: "Property archived successfully.", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["landlord", "properties"] });
    } catch (err: any) {
      setFeedback({
        msg: err.response?.data?.detail || "Failed to archive property.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter items based on selected sub-tab for tours and applications
  const filteredData = dashboardData.filter((item) => {
    if (activeTab === "properties") return true;

    const status = (item.status || "").toLowerCase();
    if (subTab === "pending") return status.includes("pending");
    if (subTab === "approved") return status.includes("approve");
    if (subTab === "denied") return status.includes("denied") || status.includes("reject");

    return true;
  });

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

          {/* Main Navigation Tabs */}
          <nav className="flex gap-1 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSubTab("pending"); // Reset subtab when main tab changes
                  setFeedback(null);
                }}
                className={`px-6 py-3 capitalize font-medium transition-colors relative ${
                  activeTab === tab ? "text-[var(--amber)]" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--amber)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Secondary Sub-Tabs for Tours and Applications */}
          {activeTab !== "properties" && (
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
              {subTabs.map((st) => (
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

          <div className="min-h-100 pb-20">
            {isLoading ? (
              <div className="text-slate-500 motion-safe:animate-pulse">
                Loading {activeTab}...
              </div>
            ) : isError ? (
              <div className="text-red-400">
                Error loading {activeTab}. Please try again.
              </div>
            ) : !filteredData || filteredData.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-[var(--amber)]/20 rounded-2xl text-slate-500">
                No {activeTab !== "properties" ? `${subTab} ` : ""}{activeTab} found.
              </div>
            ) : (
              <RenderContent
                tab={activeTab}
                items={filteredData}
                onTourDecision={handleTourDecision}
                onArchiveProperty={handleArchiveProperty}
                actionLoadingId={actionLoadingId}
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
  onArchiveProperty,
  actionLoadingId,
}: {
  tab: string;
  items: any[];
  onTourDecision: (tourId: string, decision: "approve" | "deny") => void;
  onArchiveProperty: (propertyId: string) => void;
  actionLoadingId: string | null;
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
              <p className="text-slate-400 text-sm mt-1 mb-4 truncate">
                {p.address_full || p.address}
              </p>

              <div className="flex justify-between text-sm mb-4">
                <span className="text-slate-500">Price</span>
                <span className="font-mono text-white font-medium">
                  {p.currency} {p.price?.toLocaleString()}
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

  if (tab === "tours") {
    const tours = items as LandlordTour[];

    return (
      <div className="space-y-4">
        {tours.map((tour) => (
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
                  <span className="text-xs text-slate-500">
                    {formatTourDate(tour.tour_date)}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {tour.property?.title || "Tour Request"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {tour.property?.address || "Property address pending"}
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Visitor
                    </p>
                    <p className="font-medium text-white">{tour.visitor_name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Contact
                    </p>
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
                      {actionLoadingId === tour.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </button>
                    <button
                      onClick={() => onTourDecision(tour.id, "deny")}
                      disabled={actionLoadingId === tour.id}
                      className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60 flex items-center justify-center gap-1"
                    >
                      {actionLoadingId === tour.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Deny"
                      )}
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

  if (tab === "applications") {
    const applications = items as LandlordApplication[];

    return (
      <div className="space-y-4">
        {applications.map((app) => (
          <LandlordApplicationCard key={app.id} application={app} />
        ))}
      </div>
    );
  }

  return <div className="text-slate-400">View for {tab} coming soon.</div>;
};

// Subcomponent to handle signature input and application approval/rejection logic
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
      await apiClient.post(`/applications/${application.id}/reject`);
      queryClient.invalidateQueries({ queryKey: ["landlord", "applications"] });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to reject application.");
    } finally {
      setLoading(false);
    }
  };

  const isPending = application.status.toLowerCase() === "pending_landlord_approval";

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

      {/* Approve Form for Pending Applications */}
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