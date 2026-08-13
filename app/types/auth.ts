import { UserProfile } from "./user_profile";

export interface LoginCredentials {
  email: string;
  password: string;
}


export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "renter" | "owner" | "admin";
}



export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  return_url?: string | null;
  redirect_url?: string | null;
  user: {
    user_metadata: any;
    id: string;
    email: string;
    profile: UserProfile;
  };
}

