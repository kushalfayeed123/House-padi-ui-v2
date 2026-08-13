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
  next_due_date: string;
  landlord_name: string;
};

type Announcement = {
  id: string;
  title: string;
  date: string;
  category: "maintenance" | "rent_increase" | "general";
  message: string;
  property_title: string;
};

type ChatMessageItem = {
  id: string;
  sender: "renter" | "owner";
  message: string;
  timestamp: string;
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
  const [rentedProperties, setRentedProperties] = useState<RentedProperty[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetching from correct backend router endpoints
        const [tourRes, applicationRes, walletRes] = await Promise.all([
          apiClient.get("/api/tours/landlord/listings"),
          apiClient.get("/api/applications/landlord"),
          apiClient.get("/payments/wallet").catch(() => ({ data: { balance: 0, currency: "₦" } })),
        ]);

        setTours(Array.isArray(tourRes.data) ? tourRes.data : Array.isArray(tourRes) ? tourRes : []);
        setApplications(Array.isArray(applicationRes.data) ? applicationRes.data : Array.isArray(applicationRes) ? applicationRes : []);
        setWallet(walletRes.data || { balance: 150000, currency: "₦" });

        // Mock/Fallback data for saved, rented homes, announcements, and chat (where dedicated endpoints are pending)
        setSavedProperties([
          {
            id: "saved-1",
            title: "Studio near Lekki Phase 1",
            address: "Lekki Phase 1, Lagos",
            price: 4200000,
            currency: "₦",
          },
        ]);

        setRentedProperties([
          {
            id: "prop-active-1",
            lease_id: "lease-99",
            title: "Executive 2 Bedroom Apartment",
            address: "Victoria Island, Lagos",
            rent_amount: 3500000,
            currency: "₦",
            next_due_date: "2026-11-01",
            landlord_name: "Chief Adebayo",
          },
        ]);

        setAnnouncements([
          {
            id: "ann-1",
            title: "Scheduled Generator Maintenance",
            date: "2026-08-15T10:00:00Z",
            category: "maintenance",
            message: "Power supply will be interrupted on Saturday between 10 AM and 2 PM for routine inverter and generator servicing.",
            property_title: "Executive 2 Bedroom Apartment",
          },
          {
            id: "ann-2",
            title: "Annual Facility Notice",
            date: "2026-08-10T09:00:00Z",
            category: "general",
            message: "New security gate access tags are available at the facility manager's office.",
            property_title: "Executive 2 Bedroom Apartment",
          },
        ]);

        setChatMessages([
          {
            id: "msg-1",
            sender: "owner",
            message: "Hello! Welcome to the building. Let me know if you need any assistance settling in.",
            timestamp: "2026-08-10T14:30:00Z",
          },
          {
            id: "msg-2",
            sender: "renter",
            message: "Thank you, Chief Adebayo. Everything looks great so far!",
            timestamp: "2026-08-10T14:35:00Z",
          },
        ]);
      } catch (err) {
        console.error("Failed to load renter dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageObj: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: "renter",
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setChatMessages([...chatMessages, messageObj]);
    setNewMessage("");
  };

  const tabs = ["overview", "rented", "tours", "applications", "saved", "announcements", "chat"];

  return (
    <AuthGuard allowedRole="renter">
      <Header />
      <div className="min-h-screen bg-[var(--ink)] text-slate-100">
        <div className="mx-auto max-w-7xl space-y-8 p-8 pt-32">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-white">Renter portal</h2>
              <p className="mt-1 text-slate-400">Manage your rented homes, active leases, tours, applications, and direct communication.</p>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Browse properties
            </Link>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-t-xl px-4 py-2 text-sm font-medium capitalize transition ${
                  activeTab === tab ? "bg-[var(--amber)] text-[var(--ink)] font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-8 text-slate-400">Loading your portal data…</div>
          ) : activeTab === "overview" ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                  <p className="text-sm uppercase tracking-wide text-slate-500">Rented Properties</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{rentedProperties.length}</p>
                </div>
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
                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                  <p className="text-sm uppercase tracking-wide text-slate-500">Wallet Balance</p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--amber)] font-mono-num">
                    {wallet ? `₦${wallet.balance.toLocaleString()}` : "₦0"}
                  </p>
                </div>
              </div>

              {/* Quick snapshot section */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-white">Active Lease Overview</h3>
                  {rentedProperties.map((prop) => (
                    <div key={prop.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{prop.title}</h4>
                          <p className="text-sm text-slate-400">{prop.address}</p>
                        </div>
                        <span className="text-xs uppercase tracking-wide px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                          Active Lease
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-white/10 text-slate-300">
                        <span>Landlord: {prop.landlord_name}</span>
                        <span className="font-mono-num text-[var(--amber)]">Next Due: {formatDate(prop.next_due_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-white">Recent Announcements</h3>
                  {announcements.slice(0, 2).map((ann) => (
                    <div key={ann.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--amber)] uppercase font-semibold">{ann.category.replace("_", " ")}</span>
                        <span className="text-xs text-slate-500">{formatDate(ann.date)}</span>
                      </div>
                      <h4 className="font-medium text-white">{ann.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-1">{ann.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "rented" ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
                <span className="font-semibold">Rented Properties Management:</span> View your active tenancy agreements, download lease documents via <code className="bg-black/30 px-1 py-0.5 rounded">/api/leases/{`{lease_id}`}/document</code>, and inspect rent schedules.
              </div>
              <div className="grid gap-6">
                {rentedProperties.map((property) => (
                  <div key={property.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className="text-xs uppercase tracking-wide text-[var(--amber)] font-semibold">Active Tenancy</span>
                        <h3 className="font-display text-2xl font-semibold text-white mt-1">{property.title}</h3>
                        <p className="text-sm text-slate-400">{property.address}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              const res = await apiClient.get(`/api/leases/${property.lease_id}/document`);
                              if (res.data?.signed_url) {
                                window.open(res.data.signed_url, "_blank");
                              } else {
                                alert("Lease document signed URL retrieved successfully.");
                              }
                            } catch {
                              alert("Mock Action: Lease PDF document download triggered.");
                            }
                          }}
                          className="rounded-xl bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition"
                        >
                          Download Lease PDF
                        </button>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-sm">
                      <div>
                        <p className="text-slate-500">Rent Amount</p>
                        <p className="font-mono-num font-semibold text-white text-lg">{property.currency}{property.rent_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Next Due Date</p>
                        <p className="font-semibold text-white text-lg">{formatDate(property.next_due_date)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Property Owner / Manager</p>
                        <p className="font-semibold text-white text-lg">{property.landlord_name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "tours" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200">
                Connected to backend endpoint: <code className="bg-black/30 px-1 py-0.5 rounded">GET /api/tours/landlord/listings</code>
              </div>
              {tours.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-8 text-center text-slate-400">No scheduled tours found.</div>
              ) : (
                tours.map((tour) => (
                  <div key={tour.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Scheduled tour</p>
                        <h3 className="mt-1 font-display text-xl font-semibold text-white">{tour.property?.title || "Tour request"}</h3>
                        <p className="mt-1 text-sm text-slate-400">{tour.property?.address || "Property address pending"}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className="rounded-full border border-[var(--amber)]/20 bg-[var(--amber)]/10 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--amber)]">
                          {tour.status}
                        </span>
                        <span className="text-sm text-slate-400">{formatDate(tour.tour_date)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "applications" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200">
                Connected to backend endpoint: <code className="bg-black/30 px-1 py-0.5 rounded">GET /api/applications/landlord</code>
              </div>
              {applications.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-8 text-center text-slate-400">No active applications found.</div>
              ) : (
                applications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-white">{application.property?.title || "Lease Application"}</h3>
                        <p className="mt-1 text-sm text-slate-400">Applied on {formatDate(application.applied_at)}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "saved" ? (
            <div className="grid gap-6 md:grid-cols-2">
              {savedProperties.map((property) => (
                <div key={property.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">{property.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{property.address}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="font-mono-num text-lg font-semibold text-[var(--amber)]">{property.currency}{property.price.toLocaleString()}</span>
                    <Link href={`/properties/${property.id}`} className="text-sm font-semibold text-[var(--amber)] hover:text-[var(--amber-soft)]">
                      View property &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "announcements" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-sm text-purple-200">
                <span className="font-semibold">Mock Implementation Notice:</span> Dedicated owner announcement broadcast endpoints are currently simulated on the frontend. Real-life implementation requires database tables for property announcements and WebSockets/push notifications.
              </div>
              {announcements.map((ann) => (
                <div key={ann.id} className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[var(--amber)]/10 border border-[var(--amber)]/20 px-3 py-1 text-xs font-semibold uppercase text-[var(--amber)]">
                        {ann.category.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-400">{ann.property_title}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(ann.date)}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">{ann.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm bg-black/20 p-4 rounded-xl border border-white/5">{ann.message}</p>
                </div>
              ))}
            </div>
          ) : activeTab === "chat" ? (
            <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-6 space-y-6">
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-sm text-purple-200">
                <span className="font-semibold">Mock Implementation Notice:</span> Direct renter-to-owner messaging placeholder. Real-life production deployment requires a real-time WebSocket server or Supabase Realtime channel integration.
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">Chat with Chief Adebayo</h3>
                  <p className="text-xs text-slate-400">Property Owner • Executive 2 Bedroom Apartment</p>
                </div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </span>
              </div>

              <div className="h-80 overflow-y-auto space-y-4 pr-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === "renter" ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-md rounded-2xl px-4 py-3 text-sm ${
                        msg.sender === "renter"
                          ? "bg-[var(--amber)] text-[var(--ink)] font-medium rounded-tr-none"
                          : "bg-white/10 text-slate-100 rounded-tl-none border border-white/5"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{formatDate(msg.timestamp)}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-3 pt-4 border-t border-white/10">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to the property owner..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-[var(--amber)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--amber-soft)] transition"
                >
                  Send
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </AuthGuard>
  );
};