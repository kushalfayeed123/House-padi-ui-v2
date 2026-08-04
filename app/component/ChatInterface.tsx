"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { apiClient } from "../lib/api-client";

export const ChatInterface = ({ sessionId }: { sessionId: string }) => {
  const [messages, setMessages] = useState<
    { role: "user" | "agent"; text: string; redirectUrl?: string }[]
  >([]);
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");

    const { data } = await apiClient.post("/api/chat", {
      text: msg,
      session_id: sessionId,
    });
    setMessages((prev) => [...prev, { role: "agent", text: data.response, redirectUrl: data.redirect_url }]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50">
      <div className="p-4 border-b border-slate-800 text-sm font-medium text-slate-400">
        AI Concierge
      </div>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div
                className={`p-4 rounded-2xl text-sm ${m.role === "user" ? "bg-teal-600" : "bg-slate-800"}`}
              >
                {m.text}
              </div>
              {m.role === "agent" && m.redirectUrl && (
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
                  className="inline-flex items-center gap-1.5 self-start rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-500/20"
                >
                  Open page
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800">
        <input
          className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-sm"
          placeholder="Ask about properties..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
      </div>
    </div>
  );
};
