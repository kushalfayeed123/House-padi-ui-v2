"use client";

import type { FormEvent } from "react";

// Shared direct-message UI used by both the renter portal and the landlord
// dashboard (the backend serves /api/chat/threads to either role). Field names
// are read defensively (`title ?? subject`, `content ?? message`) so the panel
// keeps working whichever alias the backend returns.
export type ChatThread = {
  id: string;
  title?: string;
  subject?: string;
  property_title?: string;
  last_message?: string;
  updated_at?: string;
  created_at?: string;
};

export type ThreadMessage = {
  id: string;
  sender_id?: string;
  sender_role?: string;
  content?: string;
  message?: string;
  created_at?: string;
};

export const threadTitle = (thread: ChatThread): string =>
  thread.title || thread.subject || thread.property_title || "Conversation";

export const threadTimestamp = (thread: ChatThread): string =>
  thread.updated_at || thread.created_at || "";

export const messageBody = (message: ThreadMessage): string =>
  message.content || message.message || "";

export const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

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

type MessageThreadsPanelProps = {
  threads: ChatThread[];
  activeThreadId: string | null;
  messages: ThreadMessage[];
  loading: boolean;
  error: string | null;
  replyText: string;
  sendingReply: boolean;
  userId?: string;
  /** Which sender_role counts as "me" — "renter" or "owner". */
  myRole: "renter" | "owner";
  messagingAvailable: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  onSelectThread: (threadId: string) => void;
  onReplyChange: (value: string) => void;
  onSendReply: (e: FormEvent) => void;
  onOpenAssistant: () => void;
};

const PanelEmptyState = ({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] p-10 text-center space-y-3">
    <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
    <p className="text-sm text-slate-400 max-w-md mx-auto">{body}</p>
    {action}
  </div>
);

const PanelError = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
    {message}
  </div>
);

export const MessageThreadsPanel = ({
  threads,
  activeThreadId,
  messages,
  loading,
  error,
  replyText,
  sendingReply,
  userId,
  myRole,
  messagingAvailable,
  emptyTitle = "No conversations yet",
  emptyBody = "Once a conversation starts about a property, it will appear here.",
  onSelectThread,
  onReplyChange,
  onSendReply,
  onOpenAssistant,
}: MessageThreadsPanelProps) => {
  if (!messagingAvailable) {
    return (
      <PanelEmptyState
        title="Direct messaging is on its way"
        body="A dedicated inbox for messaging about your properties is coming soon. In the meantime, the assistant in the corner can pass along questions, schedule tours, and help with applications."
        action={
          <button
            onClick={onOpenAssistant}
            className="inline-block rounded-xl bg-(--amber) px-5 py-2.5 text-sm font-semibold text-(--ink) hover:bg-(--amber-soft) transition"
          >
            Chat with the assistant
          </button>
        }
      />
    );
  }

  if (threads.length === 0) {
    return (
      <PanelEmptyState
        title={emptyTitle}
        body={emptyBody}
        action={
          <button
            onClick={onOpenAssistant}
            className="inline-block rounded-xl bg-(--amber) px-5 py-2.5 text-sm font-semibold text-(--ink) hover:bg-(--amber-soft) transition"
          >
            Chat with the assistant
          </button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="space-y-2">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              activeThreadId === thread.id
                ? "border-[var(--amber)]/50 bg-[var(--amber)]/10"
                : "border-white/10 bg-[var(--ink-soft)] hover:bg-white/5"
            }`}
          >
            <span className="block truncate text-sm font-semibold text-white">
              {threadTitle(thread)}
            </span>
            {thread.last_message && (
              <span className="mt-1 block truncate text-xs text-slate-400">
                {thread.last_message}
              </span>
            )}
            {threadTimestamp(thread) && (
              <span className="mt-1 block text-[10px] text-slate-500">
                {formatDate(threadTimestamp(thread))}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex min-h-[320px] flex-col rounded-2xl border border-white/10 bg-[var(--ink-soft)]">
        {!activeThreadId ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-400">
            Select a conversation to read and reply.
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {error && <PanelError message={error} />}
              {loading ? (
                <p className="text-sm text-slate-400">Loading conversation…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No messages in this conversation yet.
                </p>
              ) : (
                messages.map((msg) => {
                  const mine =
                    msg.sender_role === myRole || msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          mine
                            ? "bg-[var(--amber)] text-[var(--ink)]"
                            : "border border-white/10 bg-white/5 text-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{messageBody(msg)}</p>
                        {msg.created_at && (
                          <p className="mt-1 text-[10px] opacity-70">
                            {formatDate(msg.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form
              onSubmit={onSendReply}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                value={replyText}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="rounded-xl bg-[var(--amber)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--amber-soft)] disabled:opacity-50"
              >
                {sendingReply ? "Sending…" : "Send"}
              </button>
            </form>
          </>
        )}
      </div>

    </div>
  );
};
