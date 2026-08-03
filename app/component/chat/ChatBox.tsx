"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, X, Calendar, Eye, MapPin } from "lucide-react";
import { apiClient } from "@/app/lib/api-client";
import { useRouter } from "next/navigation";

const STORAGE_KEY_MESSAGES = "housepadi_chat_messages";
const STORAGE_KEY_THREAD = "housepadi_thread_id";
const STORAGE_KEY_OPEN = "housepadi_chat_open";

export const ChatBox = ({
  onResults,
}: {
  onResults: (data: any[]) => void;
}) => {
  // Initialize isOpen state from localStorage to preserve open/closed state across navigations
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(STORAGE_KEY_OPEN);
    return saved ? JSON.parse(saved) : false;
  });

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; properties?: any[] }[]
  >(() => {
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
      if (detail?.prefill) setInput(detail.prefill);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener("open-agent-chat", handleOpen);
    return () => window.removeEventListener("open-agent-chat", handleOpen);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: messageText }];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat", { 
        message: messageText,
        thread_id: threadId 
      });
      const apiResponse = response.data;

      if (apiResponse.thread_id && !threadId) {
        setThreadId(apiResponse.thread_id);
      }

      const assistantMessage = {
        role: "assistant" as const,
        content: apiResponse.response || "Here are the properties matching your criteria:",
        properties: apiResponse.data && apiResponse.data.length > 0 ? apiResponse.data : undefined,
      };

      setMessages([...newMessages, assistantMessage]);

      if (apiResponse.redirect_url) {
        router.push(apiResponse.redirect_url);
        return;
      }

      if (apiResponse.data && apiResponse.data.length > 0) {
        onResults(apiResponse.data);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error connecting to the agent." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionType: "tour" | "view", property: any) => {
    if (actionType === "tour") {
      handleSend(`I want to schedule a tour for "${property.title}" located at ${property.address}.`);
    } else {
      router.push(`/properties/${property.id}`);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Open agent chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--amber)] hover:bg-[var(--amber-soft)] shadow-2xl shadow-black/40 flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
      >
        <Bot size={24} className="text-[var(--ink)]" />
      </button>
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
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
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
                <div
                  className={`p-3.5 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--amber)] text-[var(--ink)] font-medium rounded-br-sm"
                      : "bg-white/5 text-slate-100 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>

              {m.properties && m.properties.length > 0 && (
                <div className="w-full pl-10 space-y-2.5 pt-1">
                  {m.properties.map((prop: any) => (
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