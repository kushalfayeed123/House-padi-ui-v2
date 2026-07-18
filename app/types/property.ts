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
  status: 'draft' | 'active' | 'archived';
  created_at: string;
}