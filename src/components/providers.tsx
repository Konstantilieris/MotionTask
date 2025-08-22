"use client";

import { SessionProvider } from "next-auth/react";
import { ToasterProvider } from "@/components/ui/toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ToasterProvider />
    </SessionProvider>
  );
}
