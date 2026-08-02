export const Footer = () => (
  <footer className="bg-(--paper) text-(--ink) pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
      <div className="col-span-1 md:col-span-2">
        <span className="font-display text-2xl font-semibold tracking-tight mb-4 block">
          House<span className="text-(--amber)">Padi</span>
        </span>
        <p className="text-(--ink)/60 max-w-sm mb-6 leading-relaxed">
          The AI real estate agent for Lagos. Verified listings, verified
          people, one conversation away from a signed lease.
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest text-(--ink)/50">Product</h4>
        <ul className="space-y-3 text-sm text-(--ink)/70">
          <li><a href="#" className="hover:text-(--amber) transition-colors">AI concierge</a></li>
          <li><a href="#" className="hover:text-(--amber) transition-colors">Property search</a></li>
          <li><a href="#" className="hover:text-(--amber) transition-colors">Landlord portal</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-widest text-(--ink)/50">Company</h4>
        <ul className="space-y-3 text-sm text-(--ink)/70">
          <li><a href="#" className="hover:text-(--amber) transition-colors">About us</a></li>
          <li><a href="#" className="hover:text-(--amber) transition-colors">Security</a></li>
          <li><a href="#" className="hover:text-(--amber) transition-colors">Contact</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 border-t border-dashed border-(--ink)/15 pt-8 flex flex-col md:flex-row items-center justify-between font-mono-num text-[11px] text-(--ink)/45 tracking-wide">
      <p>© 2026 HOUSEPADI INC — ALL RIGHTS RESERVED</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a href="#" className="hover:text-(--ink) transition-colors">Privacy policy</a>
        <a href="#" className="hover:text-(--ink) transition-colors">Terms of service</a>
      </div>
    </div>
  </footer>
);