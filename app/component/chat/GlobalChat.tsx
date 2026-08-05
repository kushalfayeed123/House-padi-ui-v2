"use client";

import { usePathname } from "next/navigation";
import { ChatBox } from "./ChatBox";

export const GlobalChat = () => {
  const pathname = usePathname();

  const isAuthRoute =
    pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/");

  if (isAuthRoute) {
    return null;
  }

  return <ChatBox onResults={() => undefined} />;
};
