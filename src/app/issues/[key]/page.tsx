import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getIssueByKeyServer } from "@/lib/api/issues-server";
import {
  IssueHeader,
  Properties,
  Description,
  Subtasks,
  LinkedIssues,
  ActivityFeed,
  Attachments,
} from "./_components";
import ReviewsBanner from "./_components/ReviewsBanner";
import Comments from "./_components/Comments";
import ReviewsPanel from "./_components/ReviewsPanel";
import { generateMetadata } from "./metadata";
import ToastContainer from "@/components/shared/Toast";
import BackButton from "./_components/BackButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { generateMetadata };

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function IssuePage({ params }: PageProps) {
  const resolvedParams = await params;
  let issue;
  console.log("Fetching issue with key:", resolvedParams.key);
  try {
    issue = await getIssueByKeyServer(resolvedParams.key);
  } catch {
    return notFound();
  }

  if (!issue) {
    return notFound();
  }

  return (
    <div className="h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <div className="h-full max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="px-6 pt-4">
          <BackButton />
        </div>

        <div className="grid grid-cols-12 gap-6 p-6 h-full">
          <main className="col-span-8 space-y-6 overflow-y-auto h-full pr-2 custom-scrollbar">
            {/* Reviews Banner */}
            <ReviewsBanner issueId={issue._id} />

            <Suspense
              fallback={
                <div className="h-20 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
              }
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <IssueHeader issue={issue} />
              </div>
            </Suspense>

            <div className="rounded-xl border border-gray-700/50 p-6 bg-gray-900/50 backdrop-blur-sm">
              <Suspense
                fallback={
                  <div className="h-40 bg-gray-800/50 animate-pulse rounded-lg" />
                }
              >
                <Description issue={issue} />
              </Suspense>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Suspense
                fallback={
                  <div className="h-60 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
                }
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <Subtasks issueId={issue._id} />
                </div>
              </Suspense>
              <Suspense
                fallback={
                  <div className="h-60 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
                }
              >
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                  <LinkedIssues issueId={issue._id} />
                </div>
              </Suspense>
            </div>

            <Suspense
              fallback={
                <div className="h-40 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
              }
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <Attachments issueId={issue._id} />
              </div>
            </Suspense>

            {/* Comments Section */}
            <Comments issueId={issue._id} />

            {/* Reviews Panel */}
            <ReviewsPanel issueId={issue._id} />

            <Suspense
              fallback={
                <div className="h-80 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
              }
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                <ActivityFeed issueKey={issue.key} />
              </div>
            </Suspense>

            {/* Bottom spacing for scroll */}
            <div className="h-8"></div>
          </main>

          <aside className="col-span-4 space-y-4 overflow-y-auto h-full pl-2 custom-scrollbar">
            <Suspense
              fallback={
                <div className="h-96 bg-gray-800/50 animate-pulse rounded-xl border border-gray-700/50" />
              }
            >
              <Properties issue={issue} />
            </Suspense>

            {/* Bottom spacing for scroll */}
            <div className="h-8"></div>
          </aside>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
