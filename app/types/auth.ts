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
  role: "renter" | "landlord" | "admin";
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "renter" | "landlord";
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      role: "renter" | "landlord";
    };
  };
}
