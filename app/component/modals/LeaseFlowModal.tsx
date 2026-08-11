"use client";
import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, PenTool, FileText, Loader2, Download } from "lucide-react";
import { Property } from "@/app/types/property";
import { apiClient } from "@/app/lib/api-client";
interface LeaseFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  initialAmount?: number;
  leaseUi?: any;
  onStateChange: (updated: any) => void;
  userId: string;
}

export const LeaseFlowModal = ({
  isOpen,
  onClose,
  propertyId,
  initialAmount = 500000,
  leaseUi,
  onStateChange,
  userId,
}: LeaseFlowModalProps) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(leaseUi?.step || 1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(leaseUi?.startDate || "");
  const [renterSignature, setRenterSignature] = useState(leaseUi?.renterSignature || "");
  const [applicationId, setApplicationId] = useState<string | null>(leaseUi?.applicationId || null);
  const [leaseId, setLeaseId] = useState<string | undefined>(leaseUi?.lease_id || undefined);
  const [applicationStatus, setApplicationStatus] = useState<string>(leaseUi?.status || "pending_approval");
  
  // Payment states
  const [paymentInitialized, setPaymentInitialized] = useState(false);

  const totalPayment = initialAmount;

  // Step 1: Submit Application & Digital Signature
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
        }
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
      setErrorMsg(err.response?.data?.detail || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  // Check Landlord Approval Status
  const handleCheckApprovalStatus = async () => {
    if (!applicationId && !leaseId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.get(`/api/applications/${applicationId}`);
      
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
        setErrorMsg("Application is still pending landlord review. Please check back shortly.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to fetch application status.");
    } finally {
      setLoading(false);
    }
  };

  // Step A (Payment): Initialize Payment first (/payments/initialize)
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
      setErrorMsg(err.response?.data?.detail || "Payment initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  // Step B (Payment): Simulate Payment Webhook after initialization (/payments/webhook)
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

  // Fetch Final Signed PDF Document
  const handleFetchDocument = async () => {
    if (!leaseId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/leases/${leaseId}/document`);
      if (response.data?.signed_url) {
        window.open(response.data.signed_url, "_blank");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Document not yet available. Waiting for final processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-black/90 border border-[var(--amber)]/40 rounded-2xl p-5 space-y-4 text-xs text-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="flex justify-between items-center pb-3 border-b border-white/10 pr-6">
          <span className="font-bold text-[var(--amber)] uppercase tracking-wider flex items-center gap-1.5 text-sm">
            <FileText size={16} /> Lease Application & Signing
          </span>
          <span className="text-[11px] bg-[var(--amber)]/10 text-[var(--amber)] px-2.5 py-0.5 rounded-full font-mono">
            {applicationStatus === "pending_approval" ? "Awaiting Review" : `Step ${step} of 3`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div className={`py-2 rounded-lg border ${step === 1 && applicationStatus === "pending_approval" ? "bg-[var(--amber)]/15 border-[var(--amber)] text-[var(--amber)]" : "bg-white/5 border-emerald-500/30 text-emerald-400"}`}>
            1. Apply & Sign
          </div>
          <div className={`py-2 rounded-lg border ${step === 2 ? "bg-[var(--amber)]/15 border-[var(--amber)] text-[var(--amber)]" : step > 2 ? "bg-white/5 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-slate-500"}`}>
            2. Payment
          </div>
          <div className={`py-2 rounded-lg border ${step === 3 ? "bg-[var(--amber)]/15 border-[var(--amber)] text-[var(--amber)]" : "bg-white/5 border-white/5 text-slate-500"}`}>
            3. Confirm
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Step 1 Form Submission */}
        {step === 1 && !applicationId && (
          <form onSubmit={handleApplyAndSign} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="text-slate-300 font-medium">Proposed Start Date</label>
                <span className="text-[var(--amber)] font-mono">Rent: ₦{totalPayment.toLocaleString()}</span>
              </div>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  onStateChange({ startDate: e.target.value });
                }}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-[var(--amber)] outline-none"
              />
            </div>

            <div className="max-h-32 overflow-y-auto p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-white mb-1">Residential Tenancy Terms</p>
              By signing below, you commit to leasing this property starting from {startDate || "the specified date"} for the total amount of ₦{totalPayment.toLocaleString()}.
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                <PenTool size={13} className="text-[var(--amber)]" /> Type Full Legal Name (Signature)
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
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs text-white focus:border-[var(--amber)] outline-none font-serif italic"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !renterSignature.trim() || !startDate}
              className="w-full py-3 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <>Submit Application & Sign <ShieldCheck size={15} /></>}
            </button>
          </form>
        )}

        {/* Waiting for Landlord Approval State */}
        {step === 1 && applicationId && applicationStatus === "pending_approval" && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[var(--amber)]/20 text-[var(--amber)] flex items-center justify-center mx-auto border border-[var(--amber)]/30">
              <Loader2 size={22} className="animate-spin" />
            </div>
            <p className="text-xs font-bold text-white">Application Submitted Successfully</p>
            <p className="text-xs text-slate-400">
              Your application is awaiting landlord approval (`approved_pending_payment`). Click below to check status.
            </p>
            <button
              onClick={handleCheckApprovalStatus}
              disabled={loading}
              className="w-full py-3 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <>Check Approval Status</>}
            </button>
          </div>
        )}

        {/* Step 2: Unlocked upon approval — Initialize first, then simulate webhook */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Status</span>
                <span className="text-emerald-400 font-mono">Landlord Approved</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Property Rent</span>
                <span className="text-white font-mono">₦{totalPayment.toLocaleString()}</span>
              </div>
            </div>

            {!paymentInitialized ? (
              <button
                onClick={handleInitializePayment}
                disabled={loading}
                className="w-full py-3 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <><CreditCard size={15} /> 1. Initialize Payment Metadata</>}
              </button>
            ) : (
              <button
                onClick={handleSimulateWebhook}
                disabled={loading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <><CheckCircle2 size={15} /> 2. Simulate Payment Completed (Webhook)</>}
              </button>
            )}
          </div>
        )}

        {/* Step 3: Confirmation / Lease Completed */}
        {step === 3 && (
          <div className="space-y-4 text-center py-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-xs font-bold text-white">Payment Completed & Lease Active</p>
            <p className="text-xs text-slate-400 font-mono">Lease ID: <span className="text-[var(--amber)]">{leaseId}</span></p>
            <button
              onClick={handleFetchDocument}
              disabled={loading}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold rounded-xl transition flex items-center justify-center gap-1.5 text-xs"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} /> View Signed Lease PDF</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};