"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AmbientColor } from "@/components/ui/ambient-color";
import { StaggeringText } from "@/components/shared/Effects/StaggeringText/source";

export default function SignIn() {
  return (
    <div className="relative w-full overflow-hidden">
      <AmbientColor />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailVisible, setIsEmailVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      toast.loading("Signing you in...");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.dismiss();
        const errorMsg = "Invalid credentials. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const session = await getSession();
        if (session) {
          // Update last login timestamp
          try {
            await fetch("/api/auth/last-login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });
          } catch (error) {
            console.error("Failed to update last login:", error);
            // Don't show this error to user as it's not critical
          }

          toast.dismiss();
          toast.success("Welcome back!");
          router.push("/main");
        }
      }
    } catch {
      toast.dismiss();
      const errorMsg = "An error occurred. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!isEmailVisible) {
      setIsEmailVisible(true);
      return;
    }

    if (!isPasswordVisible && email) {
      setIsPasswordVisible(true);
      return;
    }

    if (email && password) {
      const syntheticEvent = {
        ...e,
        preventDefault: () => {},
        currentTarget: e.currentTarget,
        target: e.target,
      } as React.FormEvent;
      handleSubmit(syntheticEvent);
    }
  };

  return (
    <section className="w-full bg-gradient-to-br from-neutral-900 via-black to-neutral-800 font-sans">
      <form
        onSubmit={handleSubmit}
        onFocus={() => setIsFormFocused(true)}
        onBlur={() => setIsFormFocused(false)}
        className="mx-auto flex h-screen max-w-lg flex-col items-center justify-center px-4 "
      >
        <Logo isFormFocused={isFormFocused} />

        <h1 className="my-4 text-center text-xl font-bold text-low-contrast md:text-4xl tracking-wide select-none">
          Sign in to your account
        </h1>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
          >
            {message}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg  p-3 text-sm  bg-red-900/20 text-red-400 tracking-wide"
          >
            {error}
          </motion.div>
        )}

        <div className="my-6 h-px w-full bg-neutral-100 dark:bg-neutral-800" />

        {/* Email Input */}
        <motion.input
          initial={{ height: "0px", opacity: 0, marginBottom: "0px" }}
          animate={{
            height: isEmailVisible ? "40px" : "0px",
            opacity: isEmailVisible ? 1 : 0,
            marginBottom: isEmailVisible ? "10px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="shadow-input block h-10 w-full rounded-md border-0  px-4 py-1.5  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm sm:leading-6 bg-neutral-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Password Input */}
        <motion.div
          initial={{ height: "0px", opacity: 0, marginBottom: "0px" }}
          animate={{
            height: isPasswordVisible ? "40px" : "0px",
            opacity: isPasswordVisible ? 1 : 0,
            marginBottom: isPasswordVisible ? "10px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full"
        >
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="shadow-input block h-10 w-full rounded-md border-0 px-4 py-1.5 pr-10 bg-neutral-900 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm sm:leading-6 dark:bg-neutral-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isPasswordVisible && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </motion.div>

        <button
          onClick={handleContinueClick}
          disabled={isLoading || (isPasswordVisible && (!email || !password))}
          className="group/btn relative w-full rounded-lg  px-4 py-3  transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-gray2 leading-2 bg-pink12"
        >
          <div className="absolute inset-0 h-full w-full transform opacity-0 transition duration-200 group-hover/btn:opacity-100">
            <div className="absolute -left-px -top-px h-4 w-4 rounded-tl-lg border-l-2 border-t-2  bg-transparent transition-all duration-200 group-hover/btn:-left-4 group-hover/btn:-top-4 border-white"></div>
            <div className="absolute -right-px -top-px h-4 w-4 rounded-tr-lg border-r-2 border-t-2  bg-transparent transition-all duration-200 group-hover/btn:-right-4 group-hover/btn:-top-4 border-white"></div>
            <div className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-lg border-b-2 border-l-2  bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-left-4 border-white"></div>
            <div className="absolute -bottom-px -right-px h-4 w-4 rounded-br-lg border-b-2 border-r-2  bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-right-4 border-white"></div>
          </div>
          <span className="text-sm flex items-center justify-center">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {isLoading
              ? "Signing in..."
              : !isEmailVisible
              ? "Continue with Email"
              : !isPasswordVisible
              ? "Continue"
              : "Sign In"}
          </span>
        </button>

        <div className="mt-6 text-center text-sm text-neutral-400 ">
          Don&apos;t have an account?{" "}
          {isLoading ? (
            <span className="font-medium text-gray-500 cursor-not-allowed">
              Sign up
            </span>
          ) : (
            <Link
              href="/auth/signup"
              className="font-medium text-gray-200 underline hover:no-underline dark:text-white"
            >
              Sign up
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}

const Logo = ({ isFormFocused }: { isFormFocused: boolean }) => {
  return (
    <Link
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black select-none"
    >
      <StaggeringText hover={!isFormFocused}>MotionHellas</StaggeringText>
    </Link>
  );
};
