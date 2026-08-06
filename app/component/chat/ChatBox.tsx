"use client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  Send,
  Bot,
  Loader2,
  X,
  Calendar,
  Eye,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  PenTool,
  CreditCard,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";

const STORAGE_KEY_MESSAGES = "housepadi_chat_messages";
const STORAGE_KEY_THREAD = "housepadi_thread_id";
const STORAGE_KEY_OPEN = "housepadi_chat_open";
const STORAGE_KEY_MINIMIZED = "housepadi_chat_minimized";

type SearchProperty = {
  id?: string;
  title?: string;
  address?: string;
  address_full?: string;
  price?: number;
  currency?: string;
  [key: string]: unknown;
};

type LeaseUiState = {
  ui_component: "application_form" | "signature_pad" | "payment_gateway" | "lease_completed";
  lease_id?: string;
  property_id?: string;
  amount?: number;
  status?: string;
  message?: string;
};

type TourUiState = {
  ui_component?: string;
  action?: string;
  property_id?: string;
  status?: string;
  message?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  properties?: SearchProperty[];
  redirectUrl?: string;
  tourUi?: TourUiState;
  leaseUi?: LeaseUiState;
};

const getActionLoaderText = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.includes("tour") || lower.includes("schedule") || lower.includes("visit")) return "Scheduling tour...";
  if (lower.includes("lease") || lower.includes("sign") || lower.includes("apply") || lower.includes("agreement")) return "Processing lease details...";
  if (lower.includes("pay") || lower.includes("wallet") || lower.includes("deposit")) return "Preparing payment request...";
  if (lower.includes("kyc") || lower.includes("verify") || lower.includes("identity")) return "Verifying identity status...";
  if (lower.includes("search") || lower.includes("find") || lower.includes("rent") || lower.includes("house") || lower.includes("apartment")) return "Searching property listings...";
  return "HousePadi Agent is thinking...";
};

const renderMessageContent = (content: string): ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const fragments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(content)) !== null) {
    const start = match.index;
    const rawUrl = match[0];
    if (start > lastIndex) fragments.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, start)}</span>);
    const href = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
    fragments.push(
      <a key={`link-${start}`} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[var(--amber)] underline underline-offset-2 break-all hover:text-[var(--amber-soft)]">
        <span>{rawUrl}</span>
        <span className="text-[10px]">↗</span>
      </a>
    );
    lastIndex = start + rawUrl.length;
  }

  if (lastIndex < content.length) fragments.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
  return fragments.length > 0 ? fragments : [<span key="empty">{content}</span>];
};

export const ChatBox = ({
  onResults,
  loaderText: customLoaderText,
}: {
  onResults?: (data: SearchProperty[]) => void;
  loaderText?: string;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEY_OPEN);
    return saved ? JSON.parse(saved) : false;
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEY_MINIMIZED);
    return saved ? JSON.parse(saved) : false;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    return saved ? JSON.parse(saved) : [];
  });

  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY_THREAD);
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLoaderText, setActiveLoaderText] = useState("Agent is thinking...");

  // Interactive Form States inside Chat
  const [tourSelection, setTourSelection] = useState<{ date: string; time: string }>({ date: "", time: "" });
  const [leaseForm, setLeaseForm] = useState({ moveInDate: "", income: "", guarantor: "" });
  const [signature, setSignature] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const resetConversation = () => {
    setMessages([]);
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY_MESSAGES);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_OPEN, JSON.stringify(isOpen));
      localStorage.setItem(STORAGE_KEY_MINIMIZED, JSON.stringify(isMinimized));
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
      if (threadId) localStorage.setItem(STORAGE_KEY_THREAD, threadId);
    }
  }, [isOpen, isMinimized, messages, threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, isOpen]);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { prefill?: string } | undefined;
      setIsOpen(true);
      setIsMinimized(false);
      if (detail?.prefill) setInput(detail.prefill);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("open-agent-chat", handleOpen);
    return () => window.removeEventListener("open-agent-chat", handleOpen);
  }, []);

  const handleSend = async (textToSend?: string, requestMeta?: { propertyId?: string }) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: messageText }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setActiveLoaderText(customLoaderText || getActionLoaderText(messageText));
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat", {
        message: messageText,
        thread_id: threadId,
        ...(requestMeta?.propertyId ? { property_id: requestMeta.propertyId } : {}),
      });
      const apiResponse = response.data;

      const nextThreadId = apiResponse?.thread_id || null;
      if (nextThreadId && nextThreadId !== threadId) {
        if (threadId && nextThreadId !== threadId) resetConversation();
        setThreadId(nextThreadId);
      }

      const propertiesPayload = apiResponse?.data?.properties ?? apiResponse?.data;
      const properties = Array.isArray(propertiesPayload) ? propertiesPayload : [];

      const nestedBookTour = apiResponse?.data?.book_tour;
      const nestedLeaseUi = apiResponse?.data?.lease_ui;

      const assistantMessage: ChatMessage = {
        role: "assistant" as const,
        content: apiResponse?.content || apiResponse?.response || "I have updated your request.",
        properties: properties.length > 0 ? properties : undefined,
        redirectUrl: apiResponse.redirect_url || undefined,
        tourUi: nestedBookTour?.ui_component
          ? {
              ui_component: nestedBookTour.ui_component,
              action: nestedBookTour.status || "awaiting_datetime",
              property_id: nestedBookTour.property_id,
              status: nestedBookTour.status,
              message: nestedBookTour.message,
            }
          : apiResponse?.data?.tour_ui || undefined,
        leaseUi: nestedLeaseUi || undefined,
      };

      setMessages([...newMessages, assistantMessage]);
      if (properties.length > 0 && onResults) onResults(properties);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I encountered an error connecting to the agent." }]);
    } finally {
      setLoading(false);
    }
  };

  const submitTourSelection = async () => {
    if (!tourSelection.date || !tourSelection.time) return;
    const messageText = `Please book a tour for ${tourSelection.date} at ${tourSelection.time}`;
    await handleSend(messageText);
    setTourSelection({ date: "", time: "" });
  };

  const handleActionClick = (actionType: "tour" | "view", property: SearchProperty) => {
    if (actionType === "tour") {
      const propertyContext = [
        `title=${property.title ?? "unknown"}`,
        `location=${property.address ?? "unknown"}`,
        `full_address=${property.address_full ?? property.address ?? "unknown"}`,
      ].join(" | ");
      handleSend(`I want to schedule a tour for this property. ${propertyContext}`, {
        propertyId: property.id,
      });
    } else {
      router.push(`/properties/${property.id}`);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          aria-label="Open agent chat"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--ink-soft)]/90 px-3.5 py-2.5 text-sm font-medium text-slate-100 shadow-xl backdrop-blur transition-all hover:border-[var(--amber)]/40 hover:bg-[var(--ink-soft)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/15 text-[var(--amber)]">
            <Bot size={16} />
          </div>
          <span className="hidden sm:inline">Ask HousePadi</span>
        </button>
      )}

      {isOpen && isMinimized && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[var(--ink-soft)]/95 px-3 py-2 shadow-xl backdrop-blur">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/15 text-[var(--amber)]">
              <Bot size={16} />
            </div>
            <span className="text-sm font-medium text-slate-100">HousePadi Agent</span>
            <button
              onClick={() => setIsMinimized(false)}
              aria-label="Expand chat"
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {isOpen && !isMinimized && (
        <div className="fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[420px] max-w-full">
          <div className="bg-[var(--ink-soft)] border border-[var(--amber)]/25 rounded-3xl overflow-hidden shadow-2xl flex flex-col" style={{ height: "min(75vh, 650px)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[var(--amber)]/15 border border-[var(--amber)]/30 flex items-center justify-center">
                  <Bot size={13} className="text-[var(--amber)]" />
                </div>
                <span className="text-sm font-medium text-white">HousePadi Agent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setIsMinimized(true)} className="rounded-full p-1 text-slate-500 hover:text-white">
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="rounded-full p-1 text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Message Stream */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-black/20">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-8 space-y-2">
                  <p className="font-semibold text-white">How can I assist you today?</p>
                  <p>Ask me to find apartments, schedule viewings, or start your lease application directly!</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[85%] ${m.role === "user" ? "bg-[var(--amber)] text-[var(--ink)] font-medium" : "bg-white/5 text-slate-100"}`}>
                    {renderMessageContent(m.content)}
                  </div>

                  {/* 1. PROPERTY CARDS & ACTION BUTTONS */}
                  {m.role === "assistant" && m.properties && m.properties.length > 0 && (
                    <div className="w-full max-w-[90%] space-y-2 pt-1">
                      {m.properties.map((prop, idx) => (
                        <div key={prop.id || idx} className="bg-black/40 border border-white/10 rounded-2xl p-3 text-xs space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold text-white">{prop.title || "Property Listing"}</p>
                              {prop.address && (
                                <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                                  <MapPin size={10} /> {prop.address}
                                </p>
                              )}
                            </div>
                            {prop.price && (
                              <span className="text-[var(--amber)] font-bold text-xs shrink-0">
                                ₦{prop.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1 border-t border-white/5">
                            <button
                              onClick={() => handleActionClick("tour", prop)}
                              className="flex-1 py-1.5 px-2 bg-[var(--amber)]/15 border border-[var(--amber)]/30 rounded-xl text-[var(--amber)] font-medium text-[11px] hover:bg-[var(--amber)]/25 transition flex items-center justify-center gap-1"
                            >
                              <Calendar size={12} /> Book Tour
                            </button>
                            {prop.id && (
                              <button
                                onClick={() => handleActionClick("view", prop)}
                                className="py-1.5 px-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-medium text-[11px] hover:bg-white/10 transition flex items-center justify-center gap-1"
                              >
                                <Eye size={12} /> View
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. REDIRECT URL ACTION BUTTON */}
                  {m.role === "assistant" && m.redirectUrl && (
                    <div className="pl-1 pt-1">
                      <button
                        onClick={() => router.push(m.redirectUrl!)}
                        className="text-xs font-bold text-[var(--amber)] bg-[var(--amber)]/10 border border-[var(--amber)]/30 px-3 py-1.5 rounded-xl hover:bg-[var(--amber)]/20 transition flex items-center gap-1.5"
                      >
                        <span>Navigate to Page</span> <ExternalLink size={12} />
                      </button>
                    </div>
                  )}

                  {/* 3. TOUR CALENDAR SELECTION WIDGET */}
                  {m.role === "assistant" && (m.tourUi?.ui_component === "calendar" || m.tourUi?.action === "awaiting_datetime") && (
                    <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                      <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} /> Schedule Viewing Date & Time
                      </p>
                      <input
                        type="date"
                        value={tourSelection.date}
                        onChange={(e) => setTourSelection({ ...tourSelection, date: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                      <input
                        type="time"
                        value={tourSelection.time}
                        onChange={(e) => setTourSelection({ ...tourSelection, time: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                      <button
                        onClick={submitTourSelection}
                        disabled={!tourSelection.date || !tourSelection.time}
                        className="w-full py-2.5 bg-[var(--amber)] font-bold text-[var(--ink)] rounded-xl disabled:opacity-50"
                      >
                        Confirm Tour Request
                      </button>
                    </div>
                  )}

                  {/* 4. LEASE APPLICATION FORM WIDGET */}
                  {m.role === "assistant" && m.leaseUi?.ui_component === "application_form" && (
                    <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                      <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} /> Lease Application Details
                      </p>
                      <input
                        type="date"
                        value={leaseForm.moveInDate}
                        onChange={(e) => setLeaseForm({ ...leaseForm, moveInDate: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                      <input
                        type="number"
                        placeholder="Monthly Income"
                        value={leaseForm.income}
                        onChange={(e) => setLeaseForm({ ...leaseForm, income: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Guarantor Name"
                        value={leaseForm.guarantor}
                        onChange={(e) => setLeaseForm({ ...leaseForm, guarantor: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                      <button
                        onClick={() => handleSend(`Submit application: Move-in=${leaseForm.moveInDate}, Income=${leaseForm.income}, Guarantor=${leaseForm.guarantor}`)}
                        className="w-full py-2.5 bg-[var(--amber)] font-bold text-[var(--ink)] rounded-xl"
                      >
                        Submit Application
                      </button>
                    </div>
                  )}

                  {/* 5. SIGNATURE PAD WIDGET */}
                  {m.role === "assistant" && m.leaseUi?.ui_component === "signature_pad" && (
                    <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                      <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                        <PenTool size={14} /> Digital Signature
                      </p>
                      <input
                        type="text"
                        placeholder="Type Legal Name to Sign"
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-serif italic"
                      />
                      <button
                        onClick={() => handleSend(`Sign lease agreement: signature=${signature}`)}
                        disabled={!signature.trim()}
                        className="w-full py-2.5 bg-[var(--amber)] font-bold text-[var(--ink)] rounded-xl disabled:opacity-50"
                      >
                        Sign Agreement
                      </button>
                    </div>
                  )}

                  {/* 6. PAYMENT GATEWAY WIDGET */}
                  {m.role === "assistant" && m.leaseUi?.ui_component === "payment_gateway" && (
                    <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                      <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={14} /> Pay Initial Rent & Security Deposit
                      </p>
                      <p className="text-slate-400">Total Due: <strong className="text-white">₦{m.leaseUi.amount?.toLocaleString()}</strong></p>
                      <button
                        onClick={() => handleSend(`Complete payment for lease ${m.leaseUi?.lease_id}`)}
                        className="w-full py-2.5 bg-emerald-500 font-bold text-black rounded-xl"
                      >
                        Authorize Payment
                      </button>
                    </div>
                  )}

                  {/* 7. INTELLIGENT NUDGE TRIGGER */}
                  {m.role === "assistant" && m.properties && m.properties.length > 0 && (
                    <div className="pl-2 pt-1 flex gap-2">
                      <button
                        onClick={() => handleSend(`I want to start the lease application for this property`)}
                        className="text-[11px] font-bold text-[var(--amber)] bg-[var(--amber)]/10 border border-[var(--amber)]/20 px-3 py-1.5 rounded-full hover:bg-[var(--amber)]/20 transition flex items-center gap-1"
                      >
                        <FileText size={12} /> Apply for Lease Now
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2 size={14} className="animate-spin text-[var(--amber)]" />
                  <span>{activeLoaderText}</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-[var(--ink)] border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message or ask to apply..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[var(--amber)]/50"
                />
                <button onClick={() => handleSend()} className="p-2.5 bg-[var(--amber)] text-[var(--ink)] rounded-2xl font-bold hover:bg-[var(--amber-soft)]">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};