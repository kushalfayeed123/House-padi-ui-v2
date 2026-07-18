export const Footer = () => (
  <footer className="border-t border-white/10 bg-slate-950 pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
      <div className="col-span-1 md:col-span-2">
        <span className="text-2xl font-bold text-white tracking-tight mb-4 block">House<span className="text-teal-500">Padi</span></span>
        <p className="text-slate-400 max-w-sm mb-6 leading-relaxed">
          The enterprise real estate AI platform. Connecting premium tenants with verified landlords through intelligent semantic search.
        </p>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Product</h4>
        <ul className="space-y-3 text-sm text-slate-400">
          <li><a href="#" className="hover:text-teal-400 transition-colors">AI Concierge</a></li>
          <li><a href="#" className="hover:text-teal-400 transition-colors">Property Search</a></li>
          <li><a href="#" className="hover:text-teal-400 transition-colors">Landlord Portal</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-4">Company</h4>
        <ul className="space-y-3 text-sm text-slate-400">
          <li><a href="#" className="hover:text-teal-400 transition-colors">About Us</a></li>
          <li><a href="#" className="hover:text-teal-400 transition-colors">Security</a></li>
          <li><a href="#" className="hover:text-teal-400 transition-colors">Contact</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
      <p>© 2026 HousePadi Inc. All rights reserved.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a href="#" className="hover:text-white">Privacy Policy</a>
        <a href="#" className="hover:text-white">Terms of Service</a>
      </div>
    </div>
  </footer>
);