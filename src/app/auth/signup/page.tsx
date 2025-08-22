"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AmbientColor } from "@/components/ui/ambient-color";

export default function SignUp() {
  return (
    <div className="relative w-full overflow-hidden">
      <AmbientColor />
      <SignUpForm />
    </div>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    try {
      toast.loading("Creating your account...");

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      toast.dismiss();
      toast.success("Account created successfully!");

      // Redirect to sign in page with success message
      router.push(
        "/auth/signin?message=Account created successfully. Please sign in."
      );
    } catch (error: unknown) {
      toast.dismiss();
      const errorMsg =
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1 && name) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2 && email) {
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3 && password && confirmPassword) {
      const syntheticEvent = {
        ...e,
        preventDefault: () => {},
        currentTarget: e.currentTarget,
        target: e.target,
      } as React.FormEvent;
      handleSubmit(syntheticEvent);
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Creating account...";
    if (currentStep === 0) return "Continue with Email";
    if (currentStep === 1) return "Continue";
    if (currentStep === 2) return "Continue";
    return "Create Account";
  };

  const canProceed = () => {
    if (currentStep === 0) return true;
    if (currentStep === 1) return name.length > 0;
    if (currentStep === 2) return email.length > 0;
    if (currentStep === 3)
      return password.length > 0 && confirmPassword.length > 0;
    return false;
  };

  return (
    <section className="relative flex h-screen w-full items-center justify-center bg-gradient-to-br from-neutral-900 via-black to-neutral-800">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex h-screen max-w-xl min-w-lg flex-col items-center justify-center px-4 font-sans tracking-wide "
      >
        <Logo />

        <h1 className="my-4 text-center text-xl font-bold  md:text-4xl text-neutral-100">
          Create your account
        </h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg  p-3 text-sm  bg-red-900/20 text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="my-6 h-px w-full  bg-neutral-800" />

        {/* Name Input */}
        <motion.input
          initial={{ height: "0px", opacity: 0, marginBottom: "0px" }}
          animate={{
            height: currentStep >= 1 ? "40px" : "0px",
            opacity: currentStep >= 1 ? 1 : 0,
            marginBottom: currentStep >= 1 ? "10px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="shadow-input block h-10 w-full rounded-md border-0  px-4 py-1.5  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm sm:leading-6 bg-neutral-900 text-white"
        />

        {/* Email Input */}
        <motion.input
          initial={{ height: "0px", opacity: 0, marginBottom: "0px" }}
          animate={{
            height: currentStep >= 2 ? "40px" : "0px",
            opacity: currentStep >= 2 ? 1 : 0,
            marginBottom: currentStep >= 2 ? "10px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="shadow-input block h-10 w-full rounded-md border-0 px-4 py-1.5  placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm sm:leading-6 bg-neutral-900 text-white"
        />

        {/* Password Input */}
        <motion.div
          initial={{ height: "0px", opacity: 0, marginBottom: "0px" }}
          animate={{
            height: currentStep >= 3 ? "40px" : "0px",
            opacity: currentStep >= 3 ? 1 : 0,
            marginBottom: currentStep >= 3 ? "10px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full"
        >
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow-input block h-10 w-full rounded-md border-0 px-4 py-1.5 pr-10 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm sm:leading-6 bg-neutral-900 text-white"
          />
          {currentStep >= 3 && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </motion.div>

        {/* Confirm Password Input */}
        <motion.div
          initial={{ height: "0px", opacity: 0, marginBottom: "0px" }}
          animate={{
            height: currentStep >= 3 ? "40px" : "0px",
            opacity: currentStep >= 3 ? 1 : 0,
            marginBottom: currentStep >= 3 ? "10px" : "0px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full"
        >
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="shadow-input block h-10 w-full rounded-md border-0 px-4 py-1.5 pr-10 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 sm:text-sm sm:leading-6 bg-neutral-900 text-white"
          />
          {currentStep >= 3 && (
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </motion.div>

        <button
          onClick={handleContinueClick}
          disabled={isLoading || !canProceed()}
          className="group/btn relative w-full rounded-lg  px-4 py-3  transition-opacity disabled:opacity-50 bg-white text-black"
        >
          <div className="absolute inset-0 h-full w-full transform opacity-0 transition duration-200 group-hover/btn:opacity-100">
            <div className="absolute -left-px -top-px h-4 w-4 rounded-tl-lg border-l-2 border-t-2  bg-transparent transition-all duration-200 group-hover/btn:-left-4 group-hover/btn:-top-4 border-white"></div>
            <div className="absolute -right-px -top-px h-4 w-4 rounded-tr-lg border-r-2 border-t-2  bg-transparent transition-all duration-200 group-hover/btn:-right-4 group-hover/btn:-top-4 border-white"></div>
            <div className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-lg border-b-2 border-l-2  bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-left-4 border-white"></div>
            <div className="absolute -bottom-px -right-px h-4 w-4 rounded-br-lg border-b-2 border-r-2  bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-right-4 border-white"></div>
          </div>
          <span className="text-sm">{getButtonText()}</span>
        </button>

        <div className="mt-6 text-center text-sm  text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-mediumunderline hover:no-underline text-white"
          >
            Sign in
          </Link>
        </div>
      </form>
    </section>
  );
}

const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black tracking-widest"
    >
      <span className="font-medium  text-white">MotionHellas</span>
    </Link>
  );
};
