import { AuthGuard } from "../../component/auth/AuthGuard";

export const RenterDashboard = () => {
  return (
    <AuthGuard allowedRole="renter">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Renter Dashboard</h2>
        <div className="glass p-8 rounded-2xl border border-white/5">
          <h3 className="font-bold mb-4">Active Leases</h3>
          <p className="text-slate-400">No active leases found.</p>
          <button className="mt-4 bg-teal-600 px-4 py-2 rounded-lg text-sm">
            Browse Properties
          </button>
        </div>
      </div>
    </AuthGuard>
  );
};
