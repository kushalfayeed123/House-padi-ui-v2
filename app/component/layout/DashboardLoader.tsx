"use client";

import { useAuth } from "@/app/context/AuthContext";
import { LandlordDashboard } from "../../dashboard/landlord/LandLordDashboard";
import { PublicLanding } from "../PublicLandingPage";
import { RenterDashboard } from "../../dashboard/renter/RenterDashboard";

export const DashboardLoader = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-10">Loading...</div>;
  if (!user) return <PublicLanding />;

  return user.role === "landlord" ? <LandlordDashboard /> : <RenterDashboard />;
};
