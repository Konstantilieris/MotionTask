"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Session } from "next-auth";
import TeamsManagementPage from "@/components/teams/teams-management-page";

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string;
  };
}

export default function TeamManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const extendedSession = session as unknown as ExtendedSession;
    if (extendedSession.user?.role !== "admin") {
      router.push("/main");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  const extendedSession = session as unknown as ExtendedSession;
  if (!session || extendedSession.user?.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return <TeamsManagementPage />;
}
