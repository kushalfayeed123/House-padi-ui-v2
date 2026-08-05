"use client";

import { usePathname } from "next/navigation";
import { ChatBox } from "./ChatBox";

export const GlobalChat = () => {
  const pathname = usePathname();

  const isAuthRoute =
    pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/");

  const handleResults = (data: Array<Record<string, unknown>>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("agent-results", { detail: data }));
    }
  };

  if (isAuthRoute) {
    return null;
  }

  return <ChatBox onResults={handleResults} />;
};
