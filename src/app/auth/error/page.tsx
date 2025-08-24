"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  configuration: "There is a problem with the server configuration.",
  accessdenied: "You do not have permission to sign in.",
  verification: "The verification token has expired or has already been used.",
  default: "An error occurred during authentication.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const errorType = searchParams.get("error");
    setError(errorMessages[errorType || "default"] || errorMessages.default);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="rounded-full bg-red-100 p-3">
              <Icon
                icon="solar:danger-triangle-bold"
                className="h-8 w-8 text-red-600"
              />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-red-900">
              Authentication Error
            </h1>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-3">
            <Button
              as={Link}
              href="/auth/signin"
              color="primary"
              className="w-full"
              startContent={<Icon icon="solar:login-2-linear" />}
            >
              Try Sign In Again
            </Button>
            <Button
              as={Link}
              href="/"
              variant="bordered"
              className="w-full"
              startContent={<Icon icon="solar:home-linear" />}
            >
              Go Home
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <Icon
                  icon="solar:danger-triangle-bold"
                  className="h-8 w-8 text-red-600"
                />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-red-900">
                Loading...
              </h1>
            </div>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
