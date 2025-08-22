import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthUtils } from "@/lib/auth-utils";
import TeamsManagementPage from "@/components/teams/teams-management-page";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const currentUser = await AuthUtils.getUserById(session.user.id);
  if (!currentUser) {
    redirect("/auth/signin");
  }

  // Only admin users can access teams management
  if (currentUser.role !== "admin") {
    redirect("/main");
  }

  return <TeamsManagementPage />;
}
