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

      // 1. Upload Images First (with timestamp to prevent conflicts)
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

      // 2. Create Property Record
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

  return (
    <AuthGuard allowedRole="landlord">
      <main className="min-h-screen bg-slate-950 pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-slate-400 flex items-center gap-2 mb-8 hover:text-white"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <div className="bg-slate-900 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">
              List a New Property
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  required
                  placeholder="Property Title"
                  className="w-full p-4 bg-slate-800 rounded-xl text-white"
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Price (Monthly)"
                  className="w-full p-4 bg-slate-800 rounded-xl text-white"
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
                className="w-full p-4 bg-slate-800 rounded-xl text-white"
                onChange={(e) =>
                  setFormData({ ...formData, address_full: e.target.value })
                }
              />

              <div className="grid grid-cols-2 gap-6">
                <input
                  required
                  placeholder="Location"
                  className="p-4 bg-slate-800 rounded-xl text-white"
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Bedrooms"
                  className="p-4 bg-slate-800 rounded-xl text-white"
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
                className="w-full p-4 bg-slate-800 rounded-xl text-white"
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
                  className="w-full p-4 bg-slate-800 rounded-xl text-white"
                />
              </div>

              <input
                placeholder="Amenities (e.g. pool, wifi, parking)"
                className="w-full p-4 bg-slate-800 rounded-xl text-white"
                onChange={(e) =>
                  setFormData({ ...formData, amenities: e.target.value })
                }
              />

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-teal-600 py-4 rounded-xl text-white font-bold text-lg hover:bg-teal-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? "Publishing Listing..." : "Publish Property"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
