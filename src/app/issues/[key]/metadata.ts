import { Metadata } from "next";
import { getIssueByKeyServer } from "@/lib/api/issues-server";

interface MetadataProps {
  params: { key: string };
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const issue = await getIssueByKeyServer(resolvedParams.key);

    if (!issue) {
      return {
        title: "Issue Not Found",
        description: "The requested issue could not be found.",
      };
    }

    return {
      title: `${issue.key}: ${issue.title}`,
      description: issue.description || `${issue.type} issue in Motion Task`,
      openGraph: {
        title: `${issue.key}: ${issue.title}`,
        description: issue.description || `${issue.type} issue in Motion Task`,
        type: "article",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Issue - Motion Task",
      description: "View and manage project issues in Motion Task",
    };
  }
}
