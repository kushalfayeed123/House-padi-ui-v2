"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export const AuthGuard = ({ children, allowedRole }: { children: React.ReactNode, allowedRole: 'renter' | 'owner' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      window.dispatchEvent(new Event('open-auth-modal'));
      router.push('/');
      return;
    }

    if (user.role !== allowedRole) {
      const fallbackPath = user.role === 'owner' ? '/dashboard/landlord' : '/dashboard/renter';
      if (pathname !== fallbackPath) {
        router.replace(fallbackPath);
      }
    }
  }, [user, allowedRole, router, pathname]);

  return <>{user?.role === allowedRole ? children : null}</>;
};