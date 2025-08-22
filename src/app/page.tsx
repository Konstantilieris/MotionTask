"use client";

import { Button } from "@heroui/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import BlurText from "@/components/shared/Text/Blur";
import GridItem from "@/components/shared/Cards/GridItem";
import DarkVeil from "@/components/shared/Effects/DarkVeil/DarkVeil";

export default function Home() {
  const { data: session, status } = useSession();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 1.2, // Wait for BlurText animation to finish
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
      },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 3.8, // After buttons appear
      },
    },
  };

  const gridItemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-black to-neutral-800 flex flex-col ">
      <div className="absolute inset-0">
        <DarkVeil />
      </div>

      {/* Header Content */}
      <div className="container mx-auto px-4 pt-16 z-[999] flex-shrink-0">
        <div className="text-center space-y-8 w-full flex flex-col items-center">
          <BlurText
            text="Welcome to Motion Task"
            delay={150}
            animateBy="words"
            direction="top"
            className="text-4xl mb-8 text-center z-[9999] text-low-contrast select-none"
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 flex flex-col items-center"
          >
            <motion.p
              variants={itemVariants}
              className="text-2xl text-gray-300 max-w-2xl mx-auto z-[9999] select-none"
            >
              A modern task management application with secure authentication
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 z-[9999]"
            >
              {status === "loading" ? (
                <div>Loading...</div>
              ) : session ? (
                <Button
                  as={Link}
                  href="/main"
                  color="primary"
                  size="lg"
                  startContent={<Icon icon="solar:dashboard-square-linear" />}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    as={Link}
                    href="/auth/signin"
                    color="primary"
                    size="lg"
                    startContent={<Icon icon="solar:login-2-linear" />}
                  >
                    Sign In
                  </Button>
                  <Button
                    as={Link}
                    href="/auth/signup"
                    variant="bordered"
                    size="lg"
                    startContent={<Icon icon="solar:user-plus-linear" />}
                    className="text-low-contrast "
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Cards Section - Takes remaining height */}
      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex items-center justify-center px-4 pb-16 pt-8"
      >
        <motion.ul className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl w-full h-full max-h-[600px]">
          <motion.div variants={gridItemVariants} className="h-full">
            <GridItem
              area="h-full"
              icon={
                <Icon
                  icon="solar:shield-check-bold"
                  className="w-8 h-8 text-green-500"
                />
              }
              title="Secure Authentication"
              description="JWT-based authentication with refresh tokens for enhanced security and seamless user experience across all devices."
            />
          </motion.div>

          <motion.div variants={gridItemVariants} className="h-full">
            <GridItem
              area="h-full"
              icon={
                <Icon
                  icon="solar:sidebar-minimalistic-bold"
                  className="w-8 h-8 text-blue-500"
                />
              }
              title="Modern UI"
              description="Beautiful and responsive interface built with <strong>Hero UI</strong> components, featuring dark mode and smooth animations."
            />
          </motion.div>

          <motion.div variants={gridItemVariants} className="h-full">
            <GridItem
              area="h-full"
              icon={
                <Icon
                  icon="solar:graph-new-bold"
                  className="w-8 h-8 text-purple-500"
                />
              }
              title="Task Management"
              description="Efficiently organize and track your tasks with intuitive tools, team collaboration, and <strong>real-time updates</strong>."
            />
          </motion.div>
        </motion.ul>
      </motion.div>
    </div>
  );
}
