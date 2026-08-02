"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, X } from "lucide-react";
import { apiClient } from "@/app/lib/api-client";
import { useRouter } from "next/navigation";

export const ChatBox = ({
  onResults,
}: {
  onResults: (data: any[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat", { message: userMsg });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);

      if (response.data.redirect_url) {
        router.push(response.data.redirect_url);
        return;
      }

      if (response.data.results) onResults(response.data.results);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error." },
      ]);
    } finally {
      setLoading(false);
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
    <div className="fixed z-50 inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] max-w-full">
      <div
        className="bg-[var(--ink-soft)] border border-[var(--amber)]/25 rounded-3xl overflow-hidden shadow-2xl shadow-black/40 flex flex-col"
        style={{ height: "min(70vh, 600px)" }}
      >
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

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-black/20"
        >
          {messages.length === 0 && (
            <p className="text-center text-slate-500 text-sm pt-6">
              Ask about a property, tour, or lease — I&apos;ll search the live listings.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[var(--amber)]/15 border border-[var(--amber)]/30 flex items-center justify-center shrink-0">
                  <Bot size={12} className="text-[var(--amber)]" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[var(--amber)] text-[var(--ink)] font-medium rounded-br-sm"
                    : "bg-white/5 text-slate-100 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-[var(--amber)] text-xs flex gap-2 items-center pl-10">
              <Loader2 className="animate-spin" size={14} /> Agent is thinking...
            </div>
          )}
        </div>

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
            onClick={handleSend}
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