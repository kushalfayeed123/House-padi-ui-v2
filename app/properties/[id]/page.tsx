"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";
import { PropertyDetailsView } from "@/app/component/PropertyDetailView";
import { useAuth } from "@/app/context/AuthContext";

export default function PropertyPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/property/${id}`);
      return res.data; // Expected format: { property: {...}, isLandlord: boolean, isRenter: boolean }
    },
  });

  if (isLoading) return <div className="text-white p-8">Loading...</div>;
  if (isError || !data) return <div className="text-white p-8">Property not found.</div>;

  const isLandlord = user?.role === "landlord" || user?.id === data.owner_id;
  const isRenter = user?.role === "renter";

  return (
    <PropertyDetailsView 
      property={data} 
      isLandlord={isLandlord}
      isRenter={isRenter}
    />
  );
}