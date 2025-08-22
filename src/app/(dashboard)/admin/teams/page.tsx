"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Session } from "next-auth";

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-800/50 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            Team Management
          </h1>
          <p className="text-sm text-neutral-400">
            Manage teams, members, and permissions
          </p>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-neutral-400">
            <h3 className="text-lg font-medium mb-2">Team Management</h3>
            <p>Team management interface coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
