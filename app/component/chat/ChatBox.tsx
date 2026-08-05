"use client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { Send, Bot, Loader2, X, Calendar, Eye, MapPin, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { apiClient } from "@/app/lib/api-client";
import { useRouter } from "next/navigation";

const STORAGE_KEY_MESSAGES = "housepadi_chat_messages";
const STORAGE_KEY_THREAD = "housepadi_thread_id";
const STORAGE_KEY_OPEN = "housepadi_chat_open";
const STORAGE_KEY_MINIMIZED = "housepadi_chat_minimized";

type SearchProperty = {
  id?: string;
  title?: string;
  address?: string;
  price?: number;
  [key: string]: unknown;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  properties?: SearchProperty[];
  redirectUrl?: string;
  tourUi?: {
    ui_component?: string;
    action?: string;
    property_id?: string;
    status?: string;
    message?: string;
  };
};

const renderMessageContent = (content: string): ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const fragments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(content)) !== null) {
    const start = match.index;
    const rawUrl = match[0];

    if (start > lastIndex) {
      fragments.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, start)}</span>);
    }

    const href = rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
      ? rawUrl
      : `https://${rawUrl}`;

    fragments.push(
      <a
        key={`link-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-[var(--amber)] underline decoration-[var(--amber)]/60 underline-offset-2 break-all hover:text-[var(--amber-soft)]"
      >
        <span>{rawUrl}</span>
        <span className="text-[10px]">↗</span>
      </a>
    );

    lastIndex = start + rawUrl.length;
  }

  if (lastIndex < content.length) {
    fragments.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
  }

  return fragments.length > 0 ? fragments : [<span key="empty">{content}</span>];
};

export const ChatBox = ({
  onResults,
}: {
  onResults: (data: SearchProperty[]) => void;
}) => {
  // Initialize isOpen state from localStorage to preserve open/closed state across navigations
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

  const resetConversation = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
    }
  };

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tourSelection, setTourSelection] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Save open/closed state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_OPEN, JSON.stringify(isOpen));
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MINIMIZED, JSON.stringify(isMinimized));
    }
  }, [isMinimized]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && threadId) {
      localStorage.setItem(STORAGE_KEY_THREAD, threadId);
    }
  }, [threadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

  const submitTourSelection = async () => {
    if (!tourSelection.date || !tourSelection.time) return;

    const messageText = `Please book a tour for ${tourSelection.date} at ${tourSelection.time}`;
    const newMessages = [...messages, { role: "user" as const, content: messageText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat", {
        message: messageText,
        thread_id: threadId,
      });
      const apiResponse = response.data;

      const nextThreadId = apiResponse?.thread_id || null;
      if (nextThreadId && nextThreadId !== threadId) {
        if (threadId && nextThreadId !== threadId) {
          resetConversation();
        }
        setThreadId(nextThreadId);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_THREAD, nextThreadId);
        }
      }

      const propertiesPayload = apiResponse?.data?.properties ?? apiResponse?.data;
      const properties = Array.isArray(propertiesPayload) ? propertiesPayload : [];

      const nestedBookTour = apiResponse?.data?.book_tour;
      const assistantMessage = {
        role: "assistant" as const,
        content: apiResponse?.content || apiResponse?.response || "Thanks! I’ve noted your tour request.",
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
      };

      setMessages([...newMessages, assistantMessage]);
      setTourSelection({ date: "", time: "" });
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I wasn’t able to submit the tour request." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (textToSend?: string, requestMeta?: { propertyId?: string }) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: messageText }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
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
        if (threadId && nextThreadId !== threadId) {
          resetConversation();
        }
        setThreadId(nextThreadId);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_THREAD, nextThreadId);
        }
      }

      const propertiesPayload = apiResponse?.data?.properties ?? apiResponse?.data;
      const properties = Array.isArray(propertiesPayload) ? propertiesPayload : [];

      const nestedBookTour = apiResponse?.data?.book_tour;
      const assistantMessage = {
        role: "assistant" as const,
        content: apiResponse?.content || apiResponse?.response || "Here are the properties matching your criteria:",
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
      };

      setMessages([...newMessages, assistantMessage]);

      if (properties.length > 0) {
        onResults(properties);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error connecting to the agent." },
      ]);
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Open agent chat"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--ink-soft)]/90 px-3.5 py-2.5 text-sm font-medium text-slate-100 shadow-xl shadow-black/30 backdrop-blur transition-all hover:border-[var(--amber)]/40 hover:bg-[var(--ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/15 text-[var(--amber)]">
          <Bot size={16} />
        </div>
        <span className="hidden sm:inline">Ask HousePadi</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[var(--ink-soft)]/95 px-3 py-2 shadow-xl shadow-black/30 backdrop-blur">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/15 text-[var(--amber)]">
            <Bot size={16} />
          </div>
          <span className="text-sm font-medium text-slate-100">HousePadi Agent</span>
          <button
            onClick={() => setIsMinimized(false)}
            aria-label="Expand chat"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setIsMinimized(false);
            }}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[420px] max-w-full">
      <div
        className="bg-[var(--ink-soft)] border border-[var(--amber)]/25 rounded-3xl overflow-hidden shadow-2xl shadow-black/40 flex flex-col"
        style={{ height: "min(75vh, 650px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[var(--amber)]/15 border border-[var(--amber)]/30 flex items-center justify-center">
              <Bot size={13} className="text-[var(--amber)]" />
            </div>
            <span className="text-sm font-medium text-white">HousePadi Agent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize chat"
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              aria-label="Close chat"
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-black/20"
        >
          {messages.length === 0 && (
            <p className="text-center text-slate-500 text-sm pt-6">
              Ask about a property, tour, or lease — I&apos;ll search live listings.
            </p>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--amber)]/15 border border-[var(--amber)]/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={12} className="text-[var(--amber)]" />
                  </div>
                )}
                <div className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"} max-w-[85%] min-w-0`}>
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere ${
                      m.role === "user"
                        ? "bg-[var(--amber)] text-[var(--ink)] font-medium rounded-br-sm"
                        : "bg-white/5 text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {renderMessageContent(m.content)}
                  </div>

                  {m.role === "assistant" && m.redirectUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = m.redirectUrl!.trim();
                        if (target.startsWith("http://") || target.startsWith("https://")) {
                          window.location.assign(target);
                        } else {
                          const normalizedTarget = target.startsWith("/") ? target : `/${target}`;
                          router.push(normalizedTarget);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--amber)]/30 bg-[var(--amber)]/10 px-3 py-1.5 text-[11px] font-semibold text-[var(--amber)] transition-colors hover:bg-[var(--amber)]/20"
                    >
                      Open page
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {m.role === "assistant" && m.tourUi?.ui_component === "calendar_picker" && (
                    <div className="w-full rounded-2xl border border-[var(--amber)]/25 bg-[var(--amber)]/10 p-3 text-sm text-slate-100">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--amber)]">
                        Select tour date & time
                      </p>
                      <div className="flex flex-col gap-3">
                        <input
                          type="date"
                          value={tourSelection.date}
                          onChange={(e) => setTourSelection((prev) => ({ ...prev, date: e.target.value }))}
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="time"
                          value={tourSelection.time}
                          onChange={(e) => setTourSelection((prev) => ({ ...prev, time: e.target.value }))}
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                        />
                        <button
                          type="button"
                          onClick={submitTourSelection}
                          disabled={!tourSelection.date || !tourSelection.time || loading}
                          className="rounded-xl bg-[var(--amber)] px-3 py-2 text-sm font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Confirm tour slot
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {m.properties && m.properties.length > 0 && (
                <div className="w-full pl-10 space-y-2.5 pt-1">
                  {m.properties?.map((prop: SearchProperty) => (
                    <div
                      key={prop.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 hover:border-[var(--amber)]/40 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-semibold text-xs text-white">{prop.title}</h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-[var(--amber)] shrink-0" />
                            {prop.address}
                          </p>
                        </div>
                        <span className="font-mono-num text-xs font-semibold text-[var(--amber)] whitespace-nowrap">
                          ₦{Number(prop.price).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          onClick={() => handleActionClick("view", prop)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-200 transition-colors"
                        >
                          <Eye size={12} /> View Details
                        </button>
                        <button
                          onClick={() => handleActionClick("tour", prop)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--amber)]/20 hover:bg-[var(--amber)]/30 text-xs text-[var(--amber)] font-medium transition-colors"
                        >
                          <Calendar size={12} /> Book Tour
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-[var(--amber)] text-xs flex gap-2 items-center pl-10">
              <Loader2 className="animate-spin" size={14} /> Agent is searching listings...
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 flex items-center gap-2 border-t border-white/5 shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent px-2 py-2 text-white focus:outline-none placeholder-slate-500 text-sm"
            placeholder="Describe your dream home..."
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="bg-[var(--amber)] hover:bg-[var(--amber-soft)] disabled:opacity-50 p-2.5 rounded-xl text-[var(--ink)] transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};