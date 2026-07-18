"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useParams } from "next/navigation";
import { Property } from "@/app/types/property";

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export const EditPropertyModal = ({
  isOpen,
  onClose,
  property,
}: EditPropertyModalProps) => {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: property.title || "",
    price: property.price || 0,
    description: property.description || "",
    address_full: property.address_full || "",
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.patch(`/api/property/${id}`, formData);

      // Refresh the property data to show updated details
      queryClient.invalidateQueries({ queryKey: ["property", id] });
      onClose();
    } catch (err) {
      console.error("Failed to update property:", err);
      alert("Error updating property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Property</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              className="w-full bg-slate-800 border border-white/5 p-3 rounded-lg text-white focus:border-teal-500 outline-none"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Price ({property.currency})
            </label>
            <input
              type="number"
              className="w-full bg-slate-800 border border-white/5 p-3 rounded-lg text-white focus:border-teal-500 outline-none"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Description
            </label>
            <textarea
              className="w-full bg-slate-800 border border-white/5 p-3 rounded-lg text-white focus:border-teal-500 outline-none h-24"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-semibold transition-all"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
