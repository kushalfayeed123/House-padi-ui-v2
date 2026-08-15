/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AuthGuard } from "../../component/auth/AuthGuard";
import { Header } from "@/app/component/ui/Header";
import { apiClient } from "@/app/lib/api-client";
import { LeaseFlowModal } from "@/app/component/modals/LeaseFlowModal";
import { useAuth } from "@/app/context/AuthContext";

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
  lease_id?: string | null;
  property?: { title: string; address?: string };
};

type SavedProperty = {
  id: string;
  title: string;
  address: string;
  price: number;
  currency: string;
};

type RentedProperty = {
  id: string;
  lease_id: string;
  title: string;
  address: string;
  rent_amount: number;
  currency: string;
};

type Announcement = {
  id: string;
  title: string;
  date: string;
  category: string;
  message: string;
  property_title?: string;
};

// "checking": request in flight. "available": the feature actually works —
// real data, not a placeholder. "unavailable": nothing to show yet, either
// because there's no data or the endpoint doesn't exist — the person sees
// the same friendly empty state either way; that distinction is only
// interesting in the debug tab below.
type FeatureStatus = "checking" | "available" | "unavailable";

type EndpointCheckDef = {
  key: string;
  label: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  live: boolean; // whether we actually fire this one (GET-only, side-effect-free)
};

type EndpointCheck = EndpointCheckDef & {
  status: FeatureStatus | "not_tested";
  detail?: string;
};

// Endpoints the renter portal will eventually need but that don't exist on
// the backend yet. GET requests are tested live; mutating requests are
// listed but never fired blind. /api/renter/overview is intentionally NOT
// listed here anymore — it's implemented and used below, not pending.
const PENDING_ENDPOINTS: EndpointCheckDef[] = [
  {
    key: "saved_get",
    label: "View saved/favorited properties",
    method: "GET",
    path: "/api/profile/saved-properties",
    live: true,
  },
  {
    key: "saved_post",
    label: "Save a property",
    method: "POST",
    path: "/api/profile/saved-properties/{property_id}",
    live: false,
  },
  {
    key: "saved_delete",
    label: "Remove a saved property",
    method: "DELETE",
    path: "/api/profile/saved-properties/{property_id}",
    live: false,
  },
  {
    key: "announcements_get",
    label: "View landlord notices",
    method: "GET",
    path: "/api/renter/announcements",
    live: true,
  },
  {
    key: "threads_get",
    label: "List direct message threads",
    method: "GET",
    path: "/api/chat/threads",
    live: true,
  },
  {
    key: "thread_messages_get",
    label: "View messages in a thread",
    method: "GET",
    path: "/api/chat/threads/{thread_id}/messages",
    live: false,
  },
  {
    key: "thread_messages_post",
    label: "Send a direct message",
    method: "POST",
    path: "/api/chat/threads/{thread_id}/messages",
    live: false,
  },
  {
    key: "kyc_status_get",
    label: "View identity verification status",
    method: "GET",
    path: "/api/kyc/status",
    live: true,
  },
  {
    key: "wallet_history_get",
    label: "View wallet transaction history",
    method: "GET",
    path: "/payments/wallet/transactions",
    live: true,
  },
];

// These three are fetched once by loadOptionalFeatures (they're real
// feature checks, not just debug scaffolding) — the debug effect only
// covers the remaining two so nothing gets fetched twice.
const DEBUG_ONLY_LIVE_KEYS = new Set(["kyc_status_get", "wallet_history_get"]);

// Only ever true outside production, or with an explicit opt-in — never
// shown to a real renter by accident.
const isDebugMode =
  process.env.NEXT_PUBLIC_DEBUG_MODE === "true" ||
  process.env.NODE_ENV !== "production";

const TAB_KEYS = [
  "overview",
  "rented",
  "tours",
  "applications",
  "saved",
  "announcements",
  "messages",
  ...(isDebugMode ? ["pending"] : []),
] as const;

const TAB_LABELS: Record<string, string> = {
  overview: "Overview",
  rented: "Rented",
  tours: "Tours",
  applications: "Applications",
  saved: "Saved",
  announcements: "Notices",
  messages: "Messages",
  pending: "Pending Endpoints",
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

const formatPrice = (amount?: number, currency?: string): string => {
  if (amount === undefined || amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `"₦"${amount.toLocaleString()}`;
  }
};

// Defined at module scope (not inside the component) so these never get
// recreated on every render — a cheap but real win given how often the
// dashboard re-renders on state updates.
const MetricCard = ({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: ReactNode;
  sublabel?: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
    <p className="text-sm uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
  </div>
);

const EmptyState = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) => (
  <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-10 text-center space-y-3">
    <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
    <p className="text-sm text-slate-400 max-w-md mx-auto">{body}</p>
    {action}
  </div>
);

const ErrorNotice = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-300">
    {message}
  </div>
);

const openAssistant = () => {
  window.dispatchEvent(new CustomEvent("open-agent-chat"));
};

// Shared helper for turning a Promise.allSettled result into a debug-table
// status + detail pair — used by both the optional-features effect (for
// the three keys it already fetches) and the dedicated debug effect (for
// the two keys nothing else covers).
const statusAndDetail = (
  res: PromiseSettledResult<any>,
): [FeatureStatus, string] => {
  if (res.status === "fulfilled") return ["available", "responded 2xx"];
  const httpStatus = (res.reason as any)?.response?.status;
  return ["unavailable", httpStatus ? `HTTP ${httpStatus}` : "no response"];
};

export const RenterDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState(true);

  const [tours, setTours] = useState<RenterTour[]>([]);
  const [toursError, setToursError] = useState(false);

  const [applications, setApplications] = useState<RenterApplication[]>([]);
  const [applicationsError, setApplicationsError] = useState(false);

  const [rentedProperties, setRentedProperties] = useState<RentedProperty[]>(
    [],
  );
  const [rentedError, setRentedError] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [wallet, setWallet] = useState<{
    balance: number;
    currency: string;
  } | null>(null);
  const [walletError, setWalletError] = useState(false);

  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [savedStatus, setSavedStatus] = useState<FeatureStatus>("checking");

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsStatus, setAnnouncementsStatus] =
    useState<FeatureStatus>("checking");

  const [messagingStatus, setMessagingStatus] =
    useState<FeatureStatus>("checking");

  const [endpointChecks, setEndpointChecks] = useState<EndpointCheck[]>(
    PENDING_ENDPOINTS.map((ep) => ({
      ...ep,
      status: ep.live ? "checking" : "not_tested",
    })),
  );

  const { user } = useAuth();

  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [checkingAppId, setCheckingAppId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Function to check status and launch modal if approved
  const handleCheckLandlordResponse = async (application: any) => {
    setCheckingAppId(application.id);
    setStatusMessage(null);

    try {
      const response = await apiClient.get(
        `/api/applications/${application.id}`,
      );
      const resData = response.data?.data || response.data;
      const currentStatus = resData.status;

      // Update local application status if needed or open modal directly
      if (
        currentStatus === "approved_pending_payment" ||
        currentStatus === "completed" ||
        currentStatus === "active"
      ) {
        setSelectedApplication({
          ...application,
          status: currentStatus,
        });
        setIsLeaseModalOpen(true);
      } else {
        setStatusMessage(
          "Application is still pending landlord review. Please check back shortly.",
        );
      }
    } catch (err: any) {
      setStatusMessage(
        err.response?.data?.detail || "Failed to fetch application status.",
      );
    } finally {
      setCheckingAppId(null);
    }
  };

  // Guards against every effect below firing twice — once from React 18
  // Strict Mode's double-invoke in development, and previously also from
  // two independent effects hitting the same three endpoints for
  // different reasons. Each effect now owns its endpoints exclusively and
  // runs at most once per mount.
  const coreDataFetchedRef = useRef(false);
  const optionalFeaturesFetchedRef = useRef(false);
  const debugChecksFetchedRef = useRef(false);

  // --- Core portal data: one aggregate call instead of three-plus-N
  // (previously: tours + applications + wallet, then a per-property fetch
  // for every active lease to build the "rented" tab). The backend now
  // does that assembly server-side in /api/renter/overview. ---
  useEffect(() => {
    if (coreDataFetchedRef.current) return;
    coreDataFetchedRef.current = true;

    const loadCoreData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/api/renter/overview");
        const payload = res.data || {};
        const data = payload.data || {};
        const metrics = payload.metrics || {};

        setTours(Array.isArray(data.tours) ? data.tours : []);
        setApplications(
          Array.isArray(data.applications) ? data.applications : [],
        );

        const rentedRaw = Array.isArray(data.rented_properties)
          ? data.rented_properties
          : [];
        setRentedProperties(
          rentedRaw
            .filter((r: any) => r.property)
            .map((r: any) => ({
              id: r.property.id,
              lease_id: r.lease_id,
              title: r.property.title || "Rented property",
              address: r.property.address_full || "Address unavailable",
              rent_amount: r.property.price ?? 0,
              currency: r.property.currency || "NGN",
            })),
        );

        setWallet({
          balance: metrics.wallet_balance ?? 0,
          currency: metrics.wallet_currency || "NGN",
        });
      } catch {
        // One aggregate call means one failure blanks every section here
        // instead of degrading independently per-section — an accepted
        // trade-off for fewer round trips on a page that loads all four
        // together anyway.
        setToursError(true);
        setApplicationsError(true);
        setWalletError(true);
        setRentedError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCoreData();
  }, []);

  // --- Features with no backend endpoint yet: attempt, fail gracefully.
  // Also feeds the debug table for these same three keys, so they're
  // fetched exactly once — not once here and again for the debug view. ---
  useEffect(() => {
    if (optionalFeaturesFetchedRef.current) return;
    optionalFeaturesFetchedRef.current = true;

    const loadOptionalFeatures = async () => {
      const [savedRes, announcementsRes, threadsRes] = await Promise.allSettled(
        [
          apiClient.get("/api/profile/saved-properties"),
          apiClient.get("/api/renter/announcements"),
          apiClient.get("/api/chat/threads"),
        ],
      );

      if (
        savedRes.status === "fulfilled" &&
        Array.isArray(savedRes.value.data)
      ) {
        setSavedProperties(savedRes.value.data);
        setSavedStatus("available");
      } else {
        setSavedStatus("unavailable");
      }

      if (
        announcementsRes.status === "fulfilled" &&
        Array.isArray(announcementsRes.value.data)
      ) {
        setAnnouncements(announcementsRes.value.data);
        setAnnouncementsStatus("available");
      } else {
        setAnnouncementsStatus("unavailable");
      }

      setMessagingStatus(
        threadsRes.status === "fulfilled" ? "available" : "unavailable",
      );

      if (isDebugMode) {
        const byKey: Record<string, [FeatureStatus, string]> = {
          saved_get: statusAndDetail(savedRes),
          announcements_get: statusAndDetail(announcementsRes),
          threads_get: statusAndDetail(threadsRes),
        };

        setEndpointChecks((prev) =>
          prev.map((ep) =>
            byKey[ep.key]
              ? { ...ep, status: byKey[ep.key][0], detail: byKey[ep.key][1] }
              : ep,
          ),
        );
      }
    };

    loadOptionalFeatures();
  }, []);

  // --- Debug-only: live-check the two endpoints not already covered above
  // (kyc status, wallet history). Keyed matching, not positional — each
  // result is paired with its endpoint by `key`, so a future edit to
  // PENDING_ENDPOINTS or DEBUG_ONLY_LIVE_KEYS can never desync an index
  // into the wrong entry. ---
  useEffect(() => {
    if (!isDebugMode) return;
    if (debugChecksFetchedRef.current) return;
    debugChecksFetchedRef.current = true;

    const runChecks = async () => {
      const liveEndpoints = PENDING_ENDPOINTS.filter(
        (ep) => ep.live && DEBUG_ONLY_LIVE_KEYS.has(ep.key),
      );

      const settled = await Promise.allSettled(
        liveEndpoints.map((ep) => apiClient.get(ep.path)),
      );
      const resultByKey = new Map(
        liveEndpoints.map((ep, idx) => [ep.key, settled[idx]]),
      );

      setEndpointChecks((prev) =>
        prev.map((ep) => {
          const result = resultByKey.get(ep.key);
          if (!result) return ep;
          const [status, detail] = statusAndDetail(result);
          return { ...ep, status, detail };
        }),
      );
    };

    runChecks();
  }, []);

  const handleDownloadLease = async (leaseId: string) => {
    setDownloadError(null);
    try {
      const res = await apiClient.get(`/api/leases/${leaseId}/document`);
      if (res.data?.signed_url) {
        window.open(res.data.signed_url, "_blank");
      } else {
        setDownloadError(
          "The lease document isn't ready yet — please try again shortly.",
        );
      }
    } catch {
      setDownloadError(
        "We couldn't open your lease document right now. Please try again shortly.",
      );
    }
  };

  return (
    <AuthGuard allowedRole="renter">
      <Header />
      <div className="min-h-screen bg-[var(--ink)] text-slate-100">
        <div className="mx-auto max-w-7xl space-y-8 p-8 pt-32">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-white">
                Renter portal
              </h2>
              <p className="mt-1 text-slate-400">
                Manage your rented homes, active leases, tours, applications,
                and direct communication.
              </p>
            </div>
            {/* <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Browse properties
            </Link> */}
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
            {TAB_KEYS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-t-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-[var(--amber)] text-[var(--ink)] font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {TAB_LABELS[tab] ?? tab}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-8 text-slate-400">
              Loading your portal data…
            </div>
          ) : activeTab === "overview" ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                  label="Rented properties"
                  value={rentedProperties.length}
                />
                <MetricCard label="Upcoming tours" value={tours.length} />
                <MetricCard label="Applications" value={applications.length} />
                <MetricCard
                  label="Saved homes"
                  value={
                    savedStatus === "available" ? savedProperties.length : "—"
                  }
                  sublabel={
                    savedStatus === "unavailable" ? "Coming soon" : undefined
                  }
                />
                <MetricCard
                  label="Wallet balance"
                  value={
                    walletError ? (
                      "—"
                    ) : (
                      <span className="font-mono-num">
                        {formatPrice(
                          wallet?.balance || 0 < 0 ? 0 : wallet?.balance,
                          wallet?.currency,
                        )}
                      </span>
                    )
                  }
                  sublabel={walletError ? "Couldn't load right now" : undefined}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-white">
                    Your active leases
                  </h3>
                  {rentedProperties.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Nothing here yet — once a lease is signed, it&apos;ll show
                      up here.
                    </p>
                  ) : (
                    rentedProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white">
                              {prop.title}
                            </h4>
                            <p className="text-sm text-slate-400">
                              {prop.address}
                            </p>
                          </div>
                          <span className="text-xs uppercase tracking-wide px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10 text-slate-300">
                          <span>Yearly rent</span>
                          <span className="font-mono-num text-[var(--amber)]">
                            {formatPrice(prop.rent_amount, prop.currency)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-white">
                    Recent notices
                  </h3>
                  {announcementsStatus === "available" &&
                  announcements.length > 0 ? (
                    announcements.slice(0, 2).map((ann) => (
                      <div
                        key={ann.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--amber)] uppercase font-semibold">
                            {ann.category.replace("_", " ")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(ann.date)}
                          </span>
                        </div>
                        <h4 className="font-medium text-white">{ann.title}</h4>
                        <p className="text-sm text-slate-400 line-clamp-1">
                          {ann.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      We&apos;ll show building notices here once your landlord
                      starts posting them.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "rented" ? (
            <div className="space-y-6">
              {downloadError && <ErrorNotice message={downloadError} />}
              {rentedError && rentedProperties.length === 0 ? (
                <ErrorNotice message="We couldn't load your rented properties right now. Please try refreshing." />
              ) : rentedProperties.length === 0 ? (
                <EmptyState
                  title="No active leases yet"
                  body="Once your application is approved and your lease is signed, it'll appear here with a link to your rent details and signed document."
                  // action={
                  //   <Link
                  //     href="/properties"
                  //     className="inline-block rounded-xl bg-[var(--amber)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition"
                  //   >
                  //     Browse properties
                  //   </Link>
                  // }
                />
              ) : (
                <div className="grid gap-6">
                  {rentedProperties.map((property) => (
                    <div
                      key={property.id}
                      className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <span className="text-xs uppercase tracking-wide text-[var(--amber)] font-semibold">
                            Active lease
                          </span>
                          <h3 className="font-display text-2xl font-semibold text-white mt-1">
                            {property.title}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {property.address}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={openAssistant}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                          >
                            Message property manager
                          </button>
                          <button
                            onClick={() =>
                              handleDownloadLease(property.lease_id)
                            }
                            className="rounded-xl bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition"
                          >
                            Download lease PDF
                          </button>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
                        <div>
                          <p className="text-slate-500">Monthly rent</p>
                          <p className="font-mono-num font-semibold text-white text-lg">
                            {formatPrice(
                              property.rent_amount,
                              property.currency,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Lease reference</p>
                          <p className="font-mono-num font-semibold text-white text-sm">
                            {property.lease_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "tours" ? (
            <div className="space-y-4">
              {toursError ? (
                <ErrorNotice message="We couldn't load your tours right now. Please try refreshing." />
              ) : tours.length === 0 ? (
                <EmptyState
                  title="No tours scheduled"
                  body="When you book a viewing through the assistant, it'll show up here with the date and time."
                  action={
                    <button
                      onClick={openAssistant}
                      className="inline-block rounded-xl bg-[var(--amber)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition"
                    >
                      Find a home to tour
                    </button>
                  }
                />
              ) : (
                tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          Scheduled tour
                        </p>
                        <h3 className="mt-1 font-display text-xl font-semibold text-white">
                          {tour.property?.title || "Tour request"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {tour.property?.address || "Property address pending"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className="rounded-full border border-[var(--amber)]/20 bg-[var(--amber)]/10 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--amber)]">
                          {tour.status}
                        </span>
                        <span className="text-sm text-slate-400">
                          {formatDate(tour.tour_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "applications" ? (
            <div className="space-y-4">
              {statusMessage && (
                <div className="p-3 bg-[var(--ink-soft)] border border-[var(--amber)]/30 rounded-xl text-xs text-[var(--amber)]">
                  {statusMessage}
                </div>
              )}
              {applicationsError ? (
                <ErrorNotice message="We couldn't load your applications right now. Please try refreshing." />
              ) : applications.length === 0 ? (
                <EmptyState
                  title="No applications yet"
                  body="Once you apply to lease a property, you can track its status here — from submitted, to approved, to signed."
                />
              ) : (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-white">
                          {application.property?.title || "Lease application"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Applied on {formatDate(application.applied_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                          {application.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Action bar for checking status / opening lease signing flow */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                      {(application.status === "pending_landlord_approval" ||
                        application.status === "pending_approval") && (
                        <button
                          onClick={() =>
                            handleCheckLandlordResponse(application)
                          }
                          disabled={checkingAppId === application.id}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {checkingAppId === application.id ? (
                            <>Checking...</>
                          ) : (
                            <>Check Approval Status</>
                          )}
                        </button>
                      )}

                      {(application.status === "approved_pending_payment" ||
                        application.status === "completed" ||
                        application.status === "active") && (
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsLeaseModalOpen(true);
                          }}
                          className="px-4 py-2 bg-(--amber) hover:bg-(--amber-soft) text-(--ink) rounded-xl text-xs font-bold transition"
                        >
                          {application.status === "approved_pending_payment"
                            ? "Proceed to Payment"
                            : "View Lease / Document"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
              {/* Lease Flow Modal Integration */}
              {isLeaseModalOpen && selectedApplication && (
                <LeaseFlowModal
                  isOpen={isLeaseModalOpen}
                  onClose={() => setIsLeaseModalOpen(false)}
                  propertyId={
                    selectedApplication.property_id ||
                    selectedApplication.property?.id
                  }
                  initialAmount={selectedApplication.property?.price || 500000}
                  leaseUi={{
                    step:
                      selectedApplication.status === "approved_pending_payment"
                        ? 2
                        : selectedApplication.status === "completed"
                          ? 3
                          : 1,
                    applicationId: selectedApplication.id,
                    lease_id: selectedApplication.lease_id,
                    status: selectedApplication.status,
                    startDate: selectedApplication.start_date,
                    renterSignature: selectedApplication.renter_signature,
                  }}
                  onStateChange={(updated) => {
                    // Sync state updates back to your application list if needed
                  }}
                  userId={user?.id || ""}
                />
              )}
              
            </div>
          ) : activeTab === "saved" ? (
            savedStatus === "available" && savedProperties.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {savedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-display text-lg font-semibold text-white">
                        {property.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">
                        {property.address}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="font-mono-num text-lg font-semibold text-[var(--amber)]">
                        {formatPrice(property.price, property.currency)}
                      </span>
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-sm font-semibold text-[var(--amber)] hover:text-[var(--amber-soft)]"
                      >
                        View property &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Saving homes is coming soon"
                body="You'll soon be able to bookmark listings you like and find them all here. For now, browse listings and the assistant can help you keep track of favorites."
                // action={
                //   <Link
                //     href="/properties"
                //     className="inline-block rounded-xl bg-[var(--amber)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition"
                //   >
                //     Browse properties
                //   </Link>
                // }
              />
            )
          ) : activeTab === "announcements" ? (
            announcementsStatus === "available" && announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/20 px-3 py-1 text-xs font-semibold uppercase text-[var(--amber)]">
                          {ann.category.replace("_", " ")}
                        </span>
                        {ann.property_title && (
                          <span className="text-xs text-slate-400">
                            {ann.property_title}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(ann.date)}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white">
                      {ann.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                      {ann.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No notices yet"
                body="Your landlord hasn't posted any building notices yet. When they do — maintenance updates, access changes, and general announcements — you'll see them here."
              />
            )
          ) : activeTab === "messages" ? (
            messagingStatus === "available" ? (
              <EmptyState
                title="Messages"
                body="Your conversation threads will appear here."
              />
            ) : (
              <EmptyState
                title="Direct messaging is on its way"
                body="A dedicated inbox for messaging your landlord is coming soon. In the meantime, the assistant in the corner can pass along questions, schedule tours, and help with your application."
                action={
                  <button
                    onClick={openAssistant}
                    className="inline-block rounded-xl bg-(--amber) px-5 py-2.5 text-sm font-semibold text-(--ink) hover:bg-(--amber-soft) transition"
                  >
                    Chat with the assistant
                  </button>
                }
              />
            )
          ) : activeTab === "pending" && isDebugMode ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200">
                Debug view — visible only outside production. GET requests below
                were tested live against the API on this page load; mutating
                requests are listed but never fired automatically.
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3">Feature</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Path</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {endpointChecks.map((ep) => (
                      <tr key={ep.key}>
                        <td className="px-4 py-3 text-slate-200">{ep.label}</td>
                        <td className="px-4 py-3 font-mono-num text-xs text-slate-400">
                          {ep.method}
                        </td>
                        <td className="px-4 py-3 font-mono-num text-xs text-slate-400">
                          {ep.path}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border ${
                              ep.status === "available"
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                : ep.status === "checking"
                                  ? "border-slate-500/30 text-slate-400 bg-slate-500/10"
                                  : ep.status === "not_tested"
                                    ? "border-slate-500/30 text-slate-500 bg-slate-500/5"
                                    : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {ep.status === "available"
                              ? "Now live!"
                              : ep.status === "checking"
                                ? "Checking…"
                                : ep.status === "not_tested"
                                  ? "Not tested (mutating)"
                                  : "Not implemented"}
                          </span>
                          {ep.detail && (
                            <span className="ml-2 text-[10px] text-slate-500">
                              {ep.detail}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
};
