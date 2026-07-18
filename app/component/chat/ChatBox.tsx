"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, User } from "lucide-react";
import { apiClient } from "@/app/lib/api-client";
import { useRouter } from "next/navigation"; // 1. Import useRouter

export const ChatBox = ({
  onResults,
}: {
  onResults: (data: any[]) => void;
}) => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // 2. Initialize router

  // Auto-scroll to the bottom of the chat when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    // 1. Add user message to state
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat", { message: userMsg });

      // 2. Add assistant response to state
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response },
      ]);

      // 3. Handle Redirection if URL is present
      if (response.data.redirect_url) {
        router.push(response.data.redirect_url);
        return; // Exit here if we are redirecting
      }

      // 4. Trigger results view if returned
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

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[60vh]">
        {/* Chat Thread Display */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50"
        >
          {messages.length === 0 && (
            <p className="text-center text-slate-500 text-sm">
              Start by asking for a property...
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-teal-900/50 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-teal-500" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl text-sm max-w-[80%] ${m.role === "user" ? "bg-teal-600" : "bg-slate-800"}`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-teal-500 text-xs flex gap-2 items-center">
              <Loader2 className="animate-spin" size={14} /> Agent is
              thinking...
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 flex items-center gap-3 bg-slate-900 border-t border-white/5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent py-2 text-white focus:outline-none placeholder-slate-600"
            placeholder="Describe your dream home..."
          />
          <button
            onClick={handleSend}
            className="bg-teal-600 p-2.5 rounded-xl text-white hover:bg-teal-500 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
