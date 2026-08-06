"use client";

import { useState } from "react";
import { X, CheckCircle2, ShieldCheck, CreditCard, PenTool, FileText, ArrowRight, Loader2, Download, ExternalLink } from "lucide-react";
import { Property } from "@/app/types/property";
import { apiClient } from "@/app/lib/api-client";

interface LeaseFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export const LeaseFlowModal = ({
  isOpen,
  onClose,
  property,
}: LeaseFlowModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states matching backend schemas
  const [startDate, setStartDate] = useState("");
  const [renterSignature, setRenterSignature] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Payment checkout response metadata
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [signedDocUrl, setSignedDocUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPayment = property.price + property.price * 0.1; // Rent + Caution Deposit

  // Step 1: Submit Application + Renter Signature
  const handleApplyAndSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.post(
        `api/applications/properties/${property.id}/apply`,
        {
          renter_signature: renterSignature,
          start_date: startDate,
        }
      );

      // Extract lease/application identifier from response message or payload
      const returnedId = response.data?.lease_id || response.data?.application_id || "APP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setApplicationId(returnedId);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Initialize Lease Payment Checkout
  const handleInitializePayment = async () => {
    if (!applicationId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.post("/payments/initialize", {
        lease_id: applicationId,
        amount: totalPayment,
      });

      setCheckoutData(response.data?.checkout_metadata || response.data);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Payment initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  // Optional: Fetch Active Signed Document
  const handleFetchDocument = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`api/leases/${applicationId}/document`);
      if (response.data?.signed_url) {
        setSignedDocUrl(response.data.signed_url);
        window.open(response.data.signed_url, "_blank");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Document not yet available. Waiting for landlord approval/activation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[var(--ink-soft)] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="text-[var(--amber)]" size={20} />
              Lease Application & Signing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{property.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
          <div className={`py-2 rounded-xl border ${step === 1 ? "bg-[var(--amber)]/10 border-[var(--amber)] text-[var(--amber)]" : "bg-white/5 border-emerald-500/30 text-emerald-400"}`}>
            1. Apply & Sign
          </div>
          <div className={`py-2 rounded-xl border ${step === 2 ? "bg-[var(--amber)]/10 border-[var(--amber)] text-[var(--amber)]" : step > 2 ? "bg-white/5 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/5 text-slate-500"}`}>
            2. Payment Setup
          </div>
          <div className={`py-2 rounded-xl border ${step === 3 ? "bg-[var(--amber)]/10 border-[var(--amber)] text-[var(--amber)]" : "bg-white/5 border-white/5 text-slate-500"}`}>
            3. Confirmation
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: APPLY & SIGN */}
        {step === 1 && (
          <form onSubmit={handleApplyAndSign} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Proposed Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-[var(--amber)] outline-none"
              />
            </div>

            <div className="max-h-36 overflow-y-auto p-3.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-slate-300 space-y-1.5 leading-relaxed">
              <h4 className="font-bold text-white uppercase text-[10px]">Residential Tenancy Terms</h4>
              <p>By executing this signature, you commit to leasing <strong>{property.title}</strong> starting from {startDate || "the specified date"}. Rent: {property.currency}{property.price.toLocaleString()} annually.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <PenTool size={14} className="text-[var(--amber)]" /> Type Full Legal Name (Renter Signature)
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={renterSignature}
                onChange={(e) => setRenterSignature(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white focus:border-[var(--amber)] outline-none font-serif italic text-base"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !renterSignature.trim() || !startDate}
              className="w-full py-3 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Submit Application & Execute Signature <ShieldCheck size={16} /></>}
            </button>
          </form>
        )}

        {/* STEP 2: INITIALIZE PAYMENT */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Annual Rent</span>
                <span className="text-white font-mono">{property.currency}{property.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Caution Deposit (10%)</span>
                <span className="text-white font-mono">{property.currency}{(property.price * 0.1).toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-sm text-[var(--amber)] font-mono">
                <span>Total Due</span>
                <span>{property.currency}{totalPayment.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleInitializePayment}
              disabled={loading}
              className="w-full py-3 bg-[var(--amber)] hover:bg-[var(--amber-soft)] text-[var(--ink)] font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><CreditCard size={16} /> Initialize Gateway Checkout</>}
            </button>
          </div>
        )}

        {/* STEP 3: CHECKOUT READY & CONTRACT LINK */}
        {step === 3 && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Application Submitted Successfully</h3>
              <p className="text-xs text-slate-400">
                Proceed to completed payment or view your generated lease agreement when active.
              </p>
            </div>

            {checkoutData && (
              <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-left space-y-1 font-mono text-xs">
                <p className="text-slate-400">Lease ID: <span className="text-[var(--amber)]">{applicationId}</span></p>
                <p className="text-slate-400">Payer Email: <span className="text-white">{checkoutData.email || "N/A"}</span></p>
                <p className="text-slate-400">Amount: <span className="text-emerald-400">{property.currency}{checkoutData.amount?.toLocaleString()}</span></p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleFetchDocument}
                disabled={loading}
                className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <><Download size={14} /> View Signed Lease PDF (/leases/document)</>}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[var(--amber)] text-[var(--ink)] font-bold rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};