"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface UserWithRole {
  _id: string;
  name: string;
  email: string;
  role: string;
  team?: string;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      setIsLoading(false);
    };

    if (status !== "loading") {
      fetchUserRole();
    }
  }, [session, status]);

  return {
    user,
    isLoading: status === "loading" || isLoading,
    isAuthenticated: status === "authenticated",
    session,
  };
}
