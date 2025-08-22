"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();

  const signOut = async () => {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/auth/signin" });
  };

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    user: session?.user,
    signOut,
  };
}

export function useRequireAuth() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  return useAuth();
}
