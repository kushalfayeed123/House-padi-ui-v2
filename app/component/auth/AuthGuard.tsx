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
    } else if (user.role !== allowedRole) {
      // Role mismatch: redirect to their respective dashboard or home
      router.push(user.role === 'owner' ? '/landlord/dashboard' : '/dashboard/renter');
    }
  }, [user, allowedRole, router, pathname]);

  return <>{user?.role === allowedRole ? children : null}</>;
};