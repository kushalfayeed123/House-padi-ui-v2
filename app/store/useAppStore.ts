import { create } from 'zustand';

interface AppState {
  currentDashboard: 'renter' | 'landlord' | 'public';
  setDashboard: (d: 'renter' | 'landlord' | 'public') => void;
  // ... auth user sync
}

export const useAppStore = create<AppState>((set) => ({
  currentDashboard: 'public',
  setDashboard: (currentDashboard) => set({ currentDashboard }),
}));