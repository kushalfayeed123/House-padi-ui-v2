"use client";
import { useState, useEffect } from "react";
import { PublicLanding } from "./component/PublicLandingPage";
import { Footer } from "./component/ui/Footer";
import { Header } from "./component/ui/Header";
import { AuthModal } from "./component/AuthModal";

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const handleOpenAuth = () => setShowAuthModal(true);
    window.addEventListener("open-auth-modal", handleOpenAuth);
    return () => window.removeEventListener("open-auth-modal", handleOpenAuth);
  }, []);

  return (
    <main className="min-h-screen bg-(--ink) flex flex-col relative">
      <Header />
      <div className="flex-1">
        <PublicLanding />
      </div>
      <Footer />
      {/* <ChatWidget /> */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </main>
  );
}