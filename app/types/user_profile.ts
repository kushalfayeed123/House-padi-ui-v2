export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  phone_number?: string;
  kyc_status?: "pending" | "verified" | "rejected";
  role: "renter" | "owner";
  created_at: string;
}