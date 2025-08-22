"use client";

import SidebarProvider from "@/components/shared/sidebar/sidebar-provider";
import CreateProjectModal from "@/components/projects/create-project-modal";
import "../globals.css";
import { useRequireAuth } from "@/hooks/useAuth";
import { LoaderOne } from "@/components/ui/loader";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-100">
        <LoaderOne />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useRequireAuth will redirect to sign in
  }

  return (
    <main className="flex h-screen w-full bg-dark-100 ">
      <SidebarProvider />
      <section className="w-full h-full overflow-hidden">{children}</section>
      <CreateProjectModal />
    </main>
  );
}
