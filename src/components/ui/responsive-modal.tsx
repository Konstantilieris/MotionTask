"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { ReactNode } from "react";

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  className?: string;
  placement?: "auto" | "top" | "center" | "bottom";
  backdrop?: "transparent" | "opaque" | "blur";
  scrollBehavior?: "inside" | "outside";
  maxWidth?: string;
}

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "lg",
  className = "",
  placement = "center",
  backdrop = "blur",
  scrollBehavior = "inside",
  maxWidth = "max-w-4xl",
}: ResponsiveModalProps) {
  const sizeMapping = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
    "4xl": "max-w-6xl",
    "5xl": "max-w-7xl",
    full: "max-w-full",
  };

  const responsiveMaxWidth = sizeMapping[size] || maxWidth;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      backdrop={backdrop}
      scrollBehavior={scrollBehavior}
      placement={placement}
      className={`font-sans ${className}`}
      classNames={{
        base: `mx-2 my-2 sm:mx-4 sm:my-4 ${responsiveMaxWidth}`,
        wrapper: "items-start sm:items-center justify-center px-2 sm:px-4",
        body: "p-4 sm:p-6 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto",
        header: "p-4 sm:p-6 pb-2 sm:pb-3 flex-shrink-0",
        footer: "p-4 sm:p-6 pt-2 sm:pt-3 flex-shrink-0",
      }}
    >
      <ModalContent>
        {title && (
          <ModalHeader className="flex flex-col gap-1">
            {typeof title === "string" ? (
              <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
            ) : (
              title
            )}
          </ModalHeader>
        )}
        <ModalBody className="gap-4">{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </Modal>
  );
}

// Utility hook for responsive form layouts
export const useResponsiveLayout = () => {
  return {
    // Classes for responsive flex containers
    flexResponsive: "flex flex-col sm:flex-row gap-4",

    // Classes for responsive grid containers
    gridResponsive: "grid grid-cols-1 sm:grid-cols-2 gap-4",
    gridResponsive3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",

    // Classes for responsive text areas
    textareaHeights: {
      small: "h-24 sm:h-32",
      medium: "h-32 sm:h-48 md:h-60",
      large: "h-48 sm:h-60 md:h-80",
    },

    // Classes for responsive inputs
    inputSpacing: "gap-3 sm:gap-4",

    // Classes for responsive buttons
    buttonLayout:
      "flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end",
  };
};
