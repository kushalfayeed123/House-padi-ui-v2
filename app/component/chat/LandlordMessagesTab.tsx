"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useAuth } from "@/app/context/AuthContext";
import {
  MessageThreadsPanel,
  asArray,
  type ChatThread,
  type ThreadMessage,
} from "./MessageThreadsPanel";

/**
 * Landlord-side inbox. The thread list itself is fetched by the dashboard's
 * tab query (GET /api/chat/threads is role-agnostic), so this component only
 * owns the selected conversation and the reply box.
 */
export const LandlordMessagesTab = ({
  initialThreads,
}: {
  initialThreads: ChatThread[];
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const openThread = useCallback(async (threadId: string) => {
    setActiveThreadId(threadId);
    setLoading(true);
    setError(null);
    setMessages([]);

    try {
      const res = await apiClient.get(`/api/chat/threads/${threadId}/messages`);
      const payload: unknown = res.data?.data ?? res.data;
      setMessages(
        Array.isArray(payload)
          ? asArray<ThreadMessage>(payload)
          : asArray<ThreadMessage>(
              (payload as { messages?: unknown } | null)?.messages,
            ),
      );
    } catch {
      setError("We couldn't load this conversation right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const body = replyText.trim();
      if (!activeThreadId || !body) return;

      setSendingReply(true);
      setError(null);

      try {
        const res = await apiClient.post(
          `/api/chat/threads/${activeThreadId}/messages`,
          { content: body },
        );
        const created: unknown = res.data?.data ?? res.data;
        setMessages((prev) => [
          ...prev,
          created && typeof created === "object" && "id" in created
            ? (created as ThreadMessage)
            : {
                id: `local-${Date.now()}`,
                content: body,
                sender_role: "owner",
                sender_id: user?.id,
                created_at: new Date().toISOString(),
              },
        ]);
        setReplyText("");
        queryClient.invalidateQueries({ queryKey: ["landlord", "chat"] });
      } catch {
        setError(
          "We couldn't send that message right now. Please try again.",
        );
      } finally {
        setSendingReply(false);
      }
    },
    [activeThreadId, queryClient, replyText, user?.id],
  );

  return (
    <MessageThreadsPanel
      threads={initialThreads}
      activeThreadId={activeThreadId}
      messages={messages}
      loading={loading}
      error={error}
      replyText={replyText}
      sendingReply={sendingReply}
      userId={user?.id}
      myRole="owner"
      messagingAvailable
      emptyTitle="No tenant conversations yet"
      emptyBody="When a renter messages you about one of your properties, the conversation will appear here."
      onSelectThread={openThread}
      onReplyChange={setReplyText}
      onSendReply={handleSendReply}
      onOpenAssistant={() =>
        window.dispatchEvent(new CustomEvent("open-agent-chat"))
      }
    />
  );
};
