export const Navbar = ({ onAuthClick }: { onAuthClick: () => void }) => (
  <nav className="fixed top-0 w-full glass z-40 border-b border-slate-800 px-8 py-4 flex justify-between items-center">
    <h1 className="text-xl font-bold tracking-tight text-white">
      House<span className="text-teal-500">Padi</span>
    </h1>
    <button onClick={onAuthClick} className="btn-teal">Sign In</button>
  </nav>
);