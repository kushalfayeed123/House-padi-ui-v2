"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/app/component/auth/AuthGuard";

export default function CreatePropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    address_full: "",
    location: "",
    price: 0,
    description: "",
    bedroom_count: 1,
    amenities: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileData = new FormData();
          fileData.append("file", file);

          const uploadRes = await apiClient.post(
            "/api/property/upload-image",
            fileData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          uploadedUrls.push(uploadRes.data.url);
        }
      }

      const payload = {
        ...formData,
        images: uploadedUrls,
        features: {
          bedrooms: formData.bedroom_count,
          amenities: formData.amenities.split(",").map((s: string) => s.trim()),
        },
        latitude: 0.0,
        longitude: 0.0,
      };

      await apiClient.post("/api/property/create", payload);
      router.push("/dashboard/landlord");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to publish property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--amber)]/50 transition-colors";

  return (
    <AuthGuard allowedRole="owner">
      <main className="min-h-screen bg-[var(--ink)] pt-32 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/dashboard/landlord')}
            className="text-slate-400 flex items-center gap-2 mb-8 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} /> Back to dashboard
          </button>

          <div className="bg-[var(--ink-soft)]/60 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
            <h1 className="font-display text-3xl font-semibold text-white mb-8">
              List a new property
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  required
                  placeholder="Property Title"
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Price (Monthly)"
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <input
                required
                placeholder="Full Address"
                className={inputClass}
                onChange={(e) =>
                  setFormData({ ...formData, address_full: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-6">
                <input
                  required
                  placeholder="Location"
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Bedrooms"
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bedroom_count: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <textarea
                placeholder="Property Description"
                rows={4}
                className={inputClass}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-medium">
                  Property Images
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className={inputClass}
                />
              </div>

              <input
                placeholder="Amenities (e.g. pool, wifi, parking)"
                className={inputClass}
                onChange={(e) =>
                  setFormData({ ...formData, amenities: e.target.value })
                }
              />

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-[var(--amber)] hover:bg-[var(--amber-soft)] py-4 rounded-xl text-[var(--ink)] font-semibold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? "Publishing listing..." : "Publish property"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}