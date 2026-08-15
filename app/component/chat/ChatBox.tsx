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
  ChevronDown,
  ChevronUp,
  FileText,
  PenTool,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Download,
  Trash2,
  ArrowDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";
import { useAuth } from "../../context/AuthContext";

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
  ui_component:
    | "application_form"
    | "signature_pad"
    | "payment_gateway"
    | "lease_completed"
    | "lease_application_signer";
  lease_id?: string;
  property_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  message?: string;
  action?: string;
  step?: 1 | 2 | 3;
  startDate?: string;
  renterSignature?: string;
  applicationId?: string;
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

type SimpleLeaseFormState = {
  moveInDate: string;
  income: string;
  guarantor: string;
  signature: string;
};

const EMPTY_FORM_STATE: SimpleLeaseFormState = {
  moveInDate: "",
  income: "",
  guarantor: "",
  signature: "",
};

const CALENDAR_UI = "calendar_picker";
const LEASE_UI_COMPONENTS = new Set([
  "application_form",
  "signature_pad",
  "payment_gateway",
  "lease_completed",
  "lease_application_signer",
]);

/**
 * Scans every value under the response's `data` object for one shaped like
 * a UI signal (i.e. it has a `ui_component` field) and routes it to the
 * right widget by that field's value — never by which key it landed under.
 *
 * Backend tools currently surface these under at least three different key
 * shapes depending on which code path produced them (a tool's own direct
 * return, like book_tour_worker's calendar prompt; the synthetic
 * TOOL_UI_FALLBACKS path; or a bare tour_ui/lease_ui key) — chasing each
 * one's derived key name by hand is fragile. This makes the frontend
 * independent of that naming entirely.
 */
const extractUiSignal = (
  data: unknown,
): { tourUi?: TourUiState; leaseUi?: LeaseUiState } => {
  if (!data || typeof data !== "object") return {};

  for (const value of Object.values(data as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const candidate = value as Record<string, unknown>;
    const uiComponent = candidate.ui_component;
    if (typeof uiComponent !== "string") continue;

    if (uiComponent === CALENDAR_UI) {
      return {
        tourUi: {
          ui_component: uiComponent,
          action:
            (candidate.status as string) ||
            (candidate.action as string) ||
            "awaiting_datetime",
          property_id: candidate.property_id as string | undefined,
          status: candidate.status as string | undefined,
          message: candidate.message as string | undefined,
        },
      };
    }

    if (LEASE_UI_COMPONENTS.has(uiComponent)) {
      return {
        leaseUi: {
          ...(candidate as unknown as LeaseUiState),
          ui_component: uiComponent as LeaseUiState["ui_component"],
        },
      };
    }
  }

  return {};
};

const formatPrice = (amount?: number, currency?: string): string => {
  if (amount === undefined || amount === null) return "";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || "₦"}${amount.toLocaleString()}`;
  }
};

const getActionLoaderText = (text: string): string => {
  const lower = text.toLowerCase();
  if (
    lower.includes("tour") ||
    lower.includes("schedule") ||
    lower.includes("visit")
  )
    return "Scheduling tour...";
  if (
    lower.includes("lease") ||
    lower.includes("sign") ||
    lower.includes("apply") ||
    lower.includes("agreement")
  )
    return "Processing lease details...";
  if (
    lower.includes("pay") ||
    lower.includes("wallet") ||
    lower.includes("deposit")
  )
    return "Preparing payment request...";
  if (
    lower.includes("kyc") ||
    lower.includes("verify") ||
    lower.includes("identity")
  )
    return "Verifying identity status...";
  if (
    lower.includes("search") ||
    lower.includes("find") ||
    lower.includes("rent") ||
    lower.includes("house") ||
    lower.includes("apartment")
  )
    return "Searching property listings...";
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
    if (start > lastIndex)
      fragments.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex, start)}
        </span>,
      );
    const href =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;

    fragments.push(
      <a
        key={`link-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-[var(--amber)] underline underline-offset-2 break-all hover:text-[var(--amber-soft)]"
      >
        <span>{rawUrl}</span>
        <span className="text-[10px]">↗</span>
      </a>,
    );
    lastIndex = start + rawUrl.length;
  }

  if (lastIndex < content.length)
    fragments.push(
      <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>,
    );
  return fragments.length > 0
    ? fragments
    : [<span key="empty">{content}</span>];
};

const InlineLeaseWidget = ({
  propertyId,
  initialAmount = 500000,
  currency = "NGN",
  leaseUi,
  onStateChange,
  userId,
}: {
  propertyId: string;
  initialAmount?: number;
  currency?: string;
  leaseUi?: LeaseUiState;
  onStateChange: (updated: Partial<LeaseUiState>) => void;
  userId: string;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(leaseUi?.step || 1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(leaseUi?.startDate || "");
  const [renterSignature, setRenterSignature] = useState(
    leaseUi?.renterSignature || "",
  );
  const [applicationId, setApplicationId] = useState<string | null>(
    leaseUi?.applicationId || null,
  );
  const [leaseId, setLeaseId] = useState<string | undefined>(
    leaseUi?.lease_id || undefined,
  );
  const [applicationStatus, setApplicationStatus] = useState<string>(
    leaseUi?.status || "pending_approval",
  );

  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const totalPayment = initialAmount;

  const handleApplyAndSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.post(
        `/api/applications/properties/${propertyId}/apply`,
        {
          renter_signature: renterSignature,
          start_date: startDate,
        },
      );

      const responseData = response.data?.data || response.data;
      const returnedLeaseId = responseData.lease_id;
      const returnedAppId = responseData.application_id;

      setLeaseId(returnedLeaseId);
      setApplicationId(returnedAppId);
      setApplicationStatus("pending_approval");

      onStateChange({
        step: 1,
        startDate,
        renterSignature,
        applicationId: returnedAppId,
        lease_id: returnedLeaseId,
        status: "pending_approval",
      });
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || "Failed to submit application.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckApprovalStatus = async () => {
    if (!applicationId && !leaseId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.get(
        `/api/applications/${applicationId}`,
      );

      const resData = response.data?.data || response.data;
      const currentStatus = resData.status;

      setApplicationStatus(currentStatus);

      if (currentStatus === "approved_pending_payment") {
        setStep(2);
        onStateChange({
          step: 2,
          status: "approved_pending_payment",
        });
      } else if (currentStatus === "completed" || currentStatus === "active") {
        setStep(3);
        onStateChange({
          step: 3,
          status: "completed",
        });
      } else {
        setErrorMsg(
          "Application is still pending landlord review. Please check back shortly.",
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || "Failed to fetch application status.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInitializePayment = async () => {
    if (!leaseId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post("/payments/initialize", {
        lease_id: leaseId,
        amount: totalPayment,
      });

      setPaymentInitialized(true);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail || "Payment initialization failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!leaseId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await apiClient.post(`/payments/webhook`, {
        event: "charge.success",
        data: {
          reference: `sim_ref_${Date.now()}`,
          amount: totalPayment * 100,
          channel: "card",
          metadata: {
            lease_id: leaseId,
            user_id: userId,
          },
          status: "success",
        },
      });

      setStep(3);
      onStateChange({
        step: 3,
        status: "completed",
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Webhook simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDocument = async () => {
    if (!leaseId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/leases/${leaseId}/document`);
      if (response.data?.signed_url) {
        window.open(response.data.signed_url, "_blank");
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          "Document not yet available. Waiting for final processing.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[95%] bg-black/50 border border-[var(--amber)]/40 rounded-2xl p-4 space-y-4 text-xs text-slate-200 shadow-xl my-2">
      <div className="flex justify-between items-center pb-2 border-b border-white/10">
        <span className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} /> Lease Application & Signing
        </span>
        <span className="text-[10px] bg-[var(--amber)]/10 text-[var(--amber)] px-2 py-0.5 rounded-full font-mono">
          {applicationStatus === "pending_approval"
            ? "Awaiting Review"
            : `Step ${step} of 3`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold">
        <div
          className={`py-1.5 rounded-lg border ${step === 1 && applicationStatus === "pending_approval" ? "bg-[var(--amber)]/15 border-[var(--amber)] text-[var(--amber)]" : "bg-white/5 border-emerald-500/30 text-emerald-400"}`}
        >
          1. Apply & Sign
        </div>
        <div
          className={`py-1.5 rounded-lg border ${step === 2 ? "bg-[var(--amber)]/15 border-[var(--amber)] text-[var(--amber)]" : step > 2 ? "bg-white/5 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-slate-500"}`}
        >
          2. Payment
        </div>
        <div
          className={`py-1.5 rounded-lg border ${step === 3 ? "bg-[var(--amber)]/15 border-[var(--amber)] text-[var(--amber)]" : "bg-white/5 border-white/5 text-slate-500"}`}
        >
          3. Confirm
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {errorMsg}
        </div>
      )}

      {step === 1 && !applicationId && (
        <form onSubmit={handleApplyAndSign} className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="text-slate-300 font-medium">
                Proposed Start Date
              </label>
              <span className="text-[var(--amber)] font-mono">
                Rent: {formatPrice(totalPayment, currency)}
              </span>
            </div>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                onStateChange({ startDate: e.target.value });
              }}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-[var(--amber)] outline-none"
            />
          </div>

          <div className="max-h-28 overflow-y-auto p-2.5 bg-black/40 border border-white/10 rounded-xl text-[11px] text-slate-300 leading-relaxed">
            <p className="font-bold text-white mb-1">
              Residential Tenancy Terms
            </p>
            By signing below, you commit to leasing this property starting from{" "}
            {startDate || "the specified date"} for the total amount of{" "}
            {formatPrice(totalPayment, currency)}.
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <PenTool size={12} className="text-[var(--amber)]" /> Type Full
              Legal Name (Signature)
            </label>
            <input
              type="text"
              required
              placeholder="John Doe"
              value={renterSignature}
              onChange={(e) => {
                setRenterSignature(e.target.value);
                onStateChange({ renterSignature: e.target.value });
              }}
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-[var(--amber)] outline-none font-serif italic"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !renterSignature.trim() || !startDate}
            className="w-full py-2.5 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                Submit Application & Sign <ShieldCheck size={14} />
              </>
            )}
          </button>
        </form>
      )}

      {step === 1 &&
        applicationId &&
        applicationStatus === "pending_approval" && (
          <div className="space-y-3 text-center py-2">
            <div className="w-10 h-10 rounded-full bg-[var(--amber)]/20 text-[var(--amber)] flex items-center justify-center mx-auto border border-[var(--amber)]/30">
              <Loader2 size={20} className="animate-spin" />
            </div>
            <p className="text-xs font-bold text-white">
              Application Submitted Successfully
            </p>
            <p className="text-[11px] text-slate-400">
              Your application is awaiting landlord approval. Click below to
              check status.
            </p>
            <button
              onClick={handleCheckApprovalStatus}
              disabled={loading}
              className="w-full py-2.5 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>Check Approval Status</>
              )}
            </button>
          </div>
        )}

      {step === 2 && (
        <div className="space-y-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Status</span>
              <span className="text-emerald-400 font-mono">
                Landlord Approved
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Property Rent</span>
              <span className="text-white font-mono">
                {formatPrice(totalPayment, currency)}
              </span>
            </div>
          </div>

          {!paymentInitialized ? (
            <button
              onClick={handleInitializePayment}
              disabled={loading}
              className="w-full py-2.5 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={14} /> 1. Initialize Payment Metadata
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSimulateWebhook}
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} /> 2. Simulate Payment Completed
                  (Webhook)
                </>
              )}
            </button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 text-center py-1">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-xs font-bold text-white">
            Payment Completed & Lease Active
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Lease ID: <span className="text-[var(--amber)]">{leaseId}</span>
          </p>
          <button
            onClick={handleFetchDocument}
            disabled={loading}
            className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>
                <Download size={12} /> View Signed Lease PDF
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export const ChatBox = ({
  onResults,
  loaderText: customLoaderText,
}: {
  onResults?: (data: SearchProperty[]) => void;
  loaderText?: string;
}) => {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Smart Scroll states
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeLoaderText, setActiveLoaderText] = useState(
    "Agent is thinking...",
  );

  const [tourSelection, setTourSelection] = useState<{
    date: string;
    time: string;
  }>({ date: "", time: "" });

  const [formStatesByMessage, setFormStatesByMessage] = useState<
    Record<number, SimpleLeaseFormState>
  >({});

  const getFormState = (index: number): SimpleLeaseFormState =>
    formStatesByMessage[index] || EMPTY_FORM_STATE;

  const updateFormState = (
    index: number,
    updated: Partial<SimpleLeaseFormState>,
  ) => {
    setFormStatesByMessage((prev) => ({
      ...prev,
      [index]: { ...getFormState(index), ...updated },
    }));
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const resetConversation = () => {
    setMessages([]);
    setThreadId(null);
    setFormStatesByMessage({});
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      localStorage.removeItem(STORAGE_KEY_THREAD);
    }
  };

  const handleSend = async (
    textToSend?: string,
    requestMeta?: { propertyId?: string },
  ) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const newMessages = [
      ...messages,
      { role: "user" as const, content: messageText },
    ];
    setMessages(newMessages);
    if (!textToSend) setInput("");
    setActiveLoaderText(customLoaderText || getActionLoaderText(messageText));
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat", {
        message: messageText,
        thread_id: threadId,
        ...(requestMeta?.propertyId
          ? { property_id: requestMeta.propertyId }
          : {}),
      });
      const apiResponse = response.data;

      const nextThreadId = apiResponse?.thread_id || null;
      if (nextThreadId && nextThreadId !== threadId) {
        if (threadId && nextThreadId !== threadId) resetConversation();
        setThreadId(nextThreadId);
      }

      const propertiesPayload =
        apiResponse?.data?.properties ?? apiResponse?.data;
      const properties = Array.isArray(propertiesPayload)
        ? propertiesPayload
        : [];

      const uiSignal = extractUiSignal(apiResponse?.data);

      const assistantMessage: ChatMessage = {
        role: "assistant" as const,
        content:
          apiResponse?.content ||
          apiResponse?.response ||
          "I have updated your request.",
        properties: properties.length > 0 ? properties : undefined,
        redirectUrl: apiResponse.redirect_url || undefined,
        tourUi: uiSignal.tourUi,
        leaseUi: uiSignal.leaseUi,
      };

      setMessages([...newMessages, assistantMessage]);
      if (properties.length > 0 && onResults) onResults(properties);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error connecting to the agent.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const savedOpen = localStorage.getItem(STORAGE_KEY_OPEN);
      if (savedOpen) setIsOpen(JSON.parse(savedOpen));

      const savedMinimized = localStorage.getItem(STORAGE_KEY_MINIMIZED);
      if (savedMinimized) setIsMinimized(JSON.parse(savedMinimized));

      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (savedMessages) setMessages(JSON.parse(savedMessages));

      const savedThread = localStorage.getItem(STORAGE_KEY_THREAD);
      if (savedThread) setThreadId(savedThread);
    }

    const handleOpenAgent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const prefillMessage =
        detail?.prefill || detail?.message || detail?.text || detail?.query;
      setIsOpen(true);
      setIsMinimized(false);
      if (prefillMessage) {
        setTimeout(() => {
          handleSend(prefillMessage);
        }, 200);
      }
    };

    window.addEventListener("open-agent-chat", handleOpenAgent);
    return () => {
      window.removeEventListener("open-agent-chat", handleOpenAgent);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_OPEN, JSON.stringify(isOpen));
      localStorage.setItem(STORAGE_KEY_MINIMIZED, JSON.stringify(isMinimized));
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
      if (threadId) localStorage.setItem(STORAGE_KEY_THREAD, threadId);
    }
  }, [isOpen, isMinimized, messages, threadId, isMounted]);

  // Scroll handler to detect if the user scrolled up
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    const atBottom = distanceToBottom < 80;

    setIsAtBottom(atBottom);
    if (atBottom) {
      setShowScrollBottom(false);
      setUnreadCount(0);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollBottom(false);
    setUnreadCount(0);
    setIsAtBottom(true);
  };

  // Smart auto-scroll effect: only scroll down on new messages if user was already at bottom or sent it
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;

    if (last.role === "user") {
      scrollToBottom("smooth");
    } else if (isAtBottom) {
      scrollToBottom("smooth");
    } else {
      // User is scrolled up and received an assistant reply
      setShowScrollBottom(true);
      setUnreadCount((prev) => prev + 1);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && (!isOpen || isMinimized)) {
      setHasUnread(true);
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnread(false);
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  }, [isOpen, isMinimized]);

  if (!isMounted) {
    return null;
  }

  const updateMessageLeaseState = (
    messageIndex: number,
    updatedFields: Partial<LeaseUiState>,
  ) => {
    setMessages((prev) => {
      const next = [...prev];
      if (next[messageIndex] && next[messageIndex].leaseUi) {
        next[messageIndex] = {
          ...next[messageIndex],
          leaseUi: {
            ...next[messageIndex].leaseUi!,
            ...updatedFields,
          },
        };
      }
      return next;
    });
  };

  const submitTourSelection = async () => {
    if (!tourSelection.date || !tourSelection.time) return;
    const messageText = `Please book a tour for ${tourSelection.date} at ${tourSelection.time}`;
    await handleSend(messageText);
    setTourSelection({ date: "", time: "" });
  };

  const handleActionClick = (
    actionType: "tour" | "view" | "apply",
    property: SearchProperty,
  ) => {
    if (actionType === "tour") {
      const propertyContext = [
        `title=${property.title ?? "unknown"}`,
        `location=${property.address ?? "unknown"}`,
        `full_address=${property.address_full ?? property.address ?? "unknown"}`,
      ].join(" | ");
      handleSend(
        `I want to schedule a tour for this property. ${propertyContext}`,
        {
          propertyId: property.id,
        },
      );
    } else if (actionType === "apply") {
      const propertyContext = [
        `title=${property.title ?? "unknown"}`,
        `location=${property.address ?? "unknown"}`,
        `property_id=${property.id ?? "unknown"}`,
      ].join(" | ");
      handleSend(
        `I want to start the lease application and signing process for this property. ${propertyContext}`,
        {
          propertyId: property.id,
        },
      );
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
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/15 text-[var(--amber)]">
            <Bot size={16} />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[var(--ink-soft)]" />
            )}
          </div>
          <span className="hidden sm:inline">Ask HousePadi</span>
        </button>
      )}

      {isOpen && isMinimized && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[var(--ink-soft)]/95 px-3 py-2 shadow-xl backdrop-blur">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--amber)]/15 text-[var(--amber)]">
              <Bot size={16} />
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[var(--ink-soft)]" />
              )}
            </div>
            <span className="text-sm font-medium text-slate-100">
              HousePadi Agent
            </span>
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
          <div
            className="bg-[var(--ink-soft)] border border-[var(--amber)]/25 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
            style={{ height: "min(75vh, 650px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[var(--amber)]/15 border border-[var(--amber)]/30 flex items-center justify-center">
                  <Bot size={13} className="text-[var(--amber)]" />
                </div>
                <span className="text-sm font-medium text-white">
                  HousePadi Agent
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 &&
                  (isConfirming ? (
                    <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md border border-slate-700 text-xs shadow-lg animate-in fade-in duration-150">
                      <span className="text-slate-300 whitespace-nowrap">
                        Clear chat?
                      </span>
                      <button
                        onClick={() => {
                          resetConversation();
                          setIsConfirming(false);
                        }}
                        className="px-2 py-0.5 bg-red-600 text-white font-medium rounded hover:bg-red-500 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setIsConfirming(false)}
                        className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsConfirming(true)}
                      aria-label="Clear conversation"
                      title="Clear conversation"
                      className="rounded-full p-1 text-slate-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  ))}
                <button
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimize chat"
                  className="rounded-full p-1 text-slate-500 hover:text-white"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="rounded-full p-1 text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scroll-to-Bottom Floating Indicator */}
            {showScrollBottom && (
              <button
                onClick={() => scrollToBottom("smooth")}
                className="absolute bottom-20 right-6 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--ink)]/95 border border-[var(--amber)]/40 text-[var(--amber)] text-xs font-medium shadow-xl backdrop-blur hover:bg-[var(--ink-soft)] transition-all animate-bounce"
                aria-label="Scroll to latest messages"
              >
                <ArrowDown size={14} />
                <span>New messages</span>
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[var(--amber)] text-[var(--ink)] font-bold text-[10px] flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Scrollable Message Stream */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-black/20"
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-8 space-y-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--amber)]/15 text-[var(--amber)] flex items-center justify-center mx-auto border border-[var(--amber)]/30">
                    <Bot size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-white text-sm">
                      How can I assist you today?
                    </p>
                    <p className="text-slate-400">
                      Ask me to find apartments, schedule viewings, or start
                      your lease application!
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                    {[
                      "Find 2-bedroom apartments",
                      "What documents do I need to rent an apartment?",
                      "How do I apply for a lease?",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSend(suggestion)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:border-[var(--amber)]/40 hover:text-[var(--amber)] transition text-[11px]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[85%] ${m.role === "user" ? "bg-[var(--amber)] text-[var(--ink)] font-medium" : "bg-white/5 text-slate-100"}`}
                  >
                    {renderMessageContent(m.content)}
                  </div>

                  {m.role === "assistant" &&
                    m.properties &&
                    m.properties.length > 0 && (
                      <div className="w-full max-w-[90%] space-y-2.5 pt-1">
                        {m.properties.map((prop, idx) => (
                          <div
                            key={prop.id || idx}
                            className="bg-black/40 border border-white/10 rounded-2xl p-3 text-xs space-y-2.5"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-semibold text-white">
                                  {prop.title || "Property Listing"}
                                </p>
                                {prop.address && (
                                  <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} /> {prop.address}
                                  </p>
                                )}
                              </div>
                              {prop.price !== undefined && (
                                <span className="text-[var(--amber)] font-bold text-xs shrink-0">
                                  {formatPrice(prop.price, prop.currency)}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1.5 pt-1 border-t border-white/5">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleActionClick("tour", prop)
                                  }
                                  className="flex-1 py-1.5 px-2 bg-[var(--amber)]/15 border border-[var(--amber)]/30 rounded-xl text-[var(--amber)] font-medium text-[11px] hover:bg-[var(--amber)]/25 transition flex items-center justify-center gap-1"
                                >
                                  <Calendar size={12} /> Book Tour
                                </button>
                                {prop.id && (
                                  <button
                                    onClick={() =>
                                      handleActionClick("view", prop)
                                    }
                                    className="py-1.5 px-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-medium text-[11px] hover:bg-white/10 transition flex items-center justify-center gap-1"
                                  >
                                    <Eye size={12} /> View
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => handleActionClick("apply", prop)}
                                className="w-full py-1.5 px-3 bg-[var(--amber)]/10 border border-[var(--amber)]/30 rounded-xl text-[var(--amber)] font-bold text-[11px] hover:bg-[var(--amber)]/20 transition flex items-center justify-center gap-1.5"
                              >
                                <FileText size={12} /> Apply for Lease Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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

                  {m.role === "assistant" &&
                    (m.tourUi?.ui_component === "calendar_picker" ||
                      m.tourUi?.status === "awaiting_datetime") && (
                      <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                        <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar size={14} /> Schedule Viewing Date & Time
                        </p>
                        <input
                          type="date"
                          value={tourSelection.date}
                          onChange={(e) =>
                            setTourSelection({
                              ...tourSelection,
                              date: e.target.value,
                            })
                          }
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="time"
                          value={tourSelection.time}
                          onChange={(e) =>
                            setTourSelection({
                              ...tourSelection,
                              time: e.target.value,
                            })
                          }
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                        />
                        <button
                          onClick={submitTourSelection}
                          disabled={
                            !tourSelection.date ||
                            !tourSelection.time ||
                            loading
                          }
                          className="w-full py-2.5 bg-[var(--amber)] font-bold text-[var(--ink)] rounded-xl disabled:opacity-50"
                        >
                          Confirm Tour Request
                        </button>
                      </div>
                    )}

                  {m.role === "assistant" &&
                    m.leaseUi?.ui_component === "application_form" && (
                      <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                        <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={14} /> Lease Application Details
                        </p>
                        <input
                          type="date"
                          value={getFormState(i).moveInDate}
                          onChange={(e) =>
                            updateFormState(i, { moveInDate: e.target.value })
                          }
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Monthly Income"
                          value={getFormState(i).income}
                          onChange={(e) =>
                            updateFormState(i, { income: e.target.value })
                          }
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Guarantor Name"
                          value={getFormState(i).guarantor}
                          onChange={(e) =>
                            updateFormState(i, { guarantor: e.target.value })
                          }
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white"
                        />
                        <button
                          disabled={loading}
                          onClick={() =>
                            handleSend(
                              `Submit application: Move-in=${getFormState(i).moveInDate}, Income=${getFormState(i).income}, Guarantor=${getFormState(i).guarantor}`,
                            )
                          }
                          className="w-full py-2.5 bg-[var(--amber)] font-bold text-[var(--ink)] rounded-xl disabled:opacity-50"
                        >
                          Submit Application
                        </button>
                      </div>
                    )}

                  {m.role === "assistant" &&
                    m.leaseUi?.ui_component === "signature_pad" && (
                      <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                        <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                          <PenTool size={14} /> Digital Signature
                        </p>
                        <input
                          type="text"
                          placeholder="Type Legal Name to Sign"
                          value={getFormState(i).signature}
                          onChange={(e) =>
                            updateFormState(i, { signature: e.target.value })
                          }
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white font-serif italic"
                        />
                        <button
                          onClick={() =>
                            handleSend(
                              `Sign lease agreement: signature=${getFormState(i).signature}`,
                            )
                          }
                          disabled={
                            !getFormState(i).signature.trim() || loading
                          }
                          className="w-full py-2.5 bg-[var(--amber)] font-bold text-[var(--ink)] rounded-xl disabled:opacity-50"
                        >
                          Sign Agreement
                        </button>
                      </div>
                    )}

                  {m.role === "assistant" &&
                    m.leaseUi?.ui_component === "payment_gateway" && (
                      <div className="w-full max-w-[90%] bg-black/40 border border-[var(--amber)]/30 rounded-2xl p-4 space-y-3 text-xs text-slate-200">
                        <p className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard size={14} /> Pay Initial Rent & Security
                          Deposit
                        </p>
                        <p className="text-slate-400">
                          Total Due:{" "}
                          <strong className="text-white">
                            {formatPrice(m.leaseUi.amount, m.leaseUi.currency)}
                          </strong>
                        </p>
                        <button
                          onClick={() =>
                            handleSend(
                              `Complete payment for lease ${m.leaseUi?.lease_id}`,
                            )
                          }
                          disabled={loading}
                          className="w-full py-2.5 bg-emerald-500 font-bold text-black rounded-xl disabled:opacity-50"
                        >
                          Authorize Payment
                        </button>
                      </div>
                    )}

                  {m.role === "assistant" &&
                    m.leaseUi?.ui_component === "lease_application_signer" &&
                    m.leaseUi?.property_id && (
                      <InlineLeaseWidget
                        propertyId={m.leaseUi.property_id}
                        initialAmount={
                          m.leaseUi.amount ||
                          messages
                            .flatMap((msg) => msg.properties || [])
                            .find((p) => p.id === m.leaseUi?.property_id)
                            ?.price ||
                          500000
                        }
                        currency={
                          m.leaseUi.currency ||
                          messages
                            .flatMap((msg) => msg.properties || [])
                            .find((p) => p.id === m.leaseUi?.property_id)
                            ?.currency ||
                          "NGN"
                        }
                        leaseUi={m.leaseUi}
                        onStateChange={(updatedFields) =>
                          updateMessageLeaseState(i, updatedFields)
                        }
                        userId={user?.id || ""}
                      />
                    )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Loader2
                    size={14}
                    className="animate-spin text-[var(--amber)]"
                  />
                  <span>{activeLoaderText}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-[var(--ink)] border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !loading && handleSend()
                  }
                  placeholder="Type a message or ask to apply..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-[var(--amber)]/50 disabled:opacity-60"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="p-2.5 bg-[var(--amber)] text-[var(--ink)] rounded-2xl font-bold hover:bg-[var(--amber-soft)] disabled:opacity-50 disabled:hover:bg-[var(--amber)]"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
