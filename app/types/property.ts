export interface Property {
  id: string;
  owner_id: string;
  title: string;
  address_full: string;
  location: string;
  price: number;
  currency: string;
  description: string;
  images: string[];
  features: {
    bedrooms: number;
    amenities: string[];
  };
  renter: {
    first_name: string;
    last_name: string;
    email:string;
    phone_number:string;
    kyc_status: string;
  };
  status: 'draft' | 'active' | 'archived';
  created_at: string;
}