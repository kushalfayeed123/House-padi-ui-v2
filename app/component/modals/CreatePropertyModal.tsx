"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/app/lib/api-client";
import { Loader2, X } from "lucide-react";

export const CreatePropertyModal = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get("create_property") === "true";

  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    address_full: "",
    location: "",
    price: 0,
    description: "",
    bedroom_count: 1,
    amenities: "" 
  });

  if (!isOpen) return null;

  const close = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("create_property");
    router.replace(`?${newParams.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const uploadedUrls: string[] = [];

      // 1. Handle Image Uploads
      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const fileData = new FormData();
          fileData.append("file", selectedFiles[i]);
          
          const uploadRes = await apiClient.post("/api/property/upload-image", fileData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          uploadedUrls.push(uploadRes.data.url);
        }
      }

      // 2. Create Property Record
      const payload = {
        ...formData,
        images: uploadedUrls,
        features: {
            bedrooms: formData.bedroom_count,
            amenities: formData.amenities.split(",").map((s) => s.trim())
        },
        latitude: 0.0,
        longitude: 0.0,
      };

      await apiClient.post("/api/property/create", payload);
      
      close();
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to publish property. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">List New Property</h2>
          <button onClick={close} className="text-slate-500 hover:text-white"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Property Title" className="w-full p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, title: e.target.value})} />
          <input required placeholder="Full Address" className="w-full p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, address_full: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Location" className="p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, location: e.target.value})} />
            <input required type="number" placeholder="Bedrooms" className="p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, bedroom_count: parseInt(e.target.value)})} />
          </div>

          <input required type="number" placeholder="Price" className="w-full p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})} />
          <textarea placeholder="Description" className="w-full p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, description: e.target.value})} />
          
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Upload Property Images</label>
            <input type="file" multiple onChange={(e) => setSelectedFiles(e.target.files)} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
          </div>

          <input placeholder="Amenities (comma-separated: pool, wifi, gym)" className="w-full p-3 bg-slate-800 rounded-xl text-white" onChange={(e) => setFormData({...formData, amenities: e.target.value})} />
          
          <div className="flex gap-4 justify-end mt-6">
            <button type="button" onClick={close} className="text-slate-400">Cancel</button>
            <button 
                disabled={loading}
                type="submit" 
                className="bg-teal-600 px-6 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-teal-500 disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={16}/>}
              {loading ? "Publishing..." : "Publish Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};