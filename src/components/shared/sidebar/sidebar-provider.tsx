"use client";
import React from "react";

import { Avatar, Button, ScrollShadow, Spacer, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@heroui/react";
import { useModalStore } from "@/lib/stores/modal-store";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import TeamManagementSidebar from "@/components/teams/team-management-sidebar";

import Sidebar, { type SidebarItem } from "./sidebar";

import { getSidebarItems } from "./sidebar-items";
const SidebarProvider = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { openModal } = useModalStore();
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { user: currentUser } = useCurrentUser();
  const { user } = useAuth(); // For basic user info display

  // Determine selected key based on current path
  const getSelectedKey = React.useCallback(() => {
    if (pathname.startsWith("/projects")) {
      return "projects";
    }
    if (pathname.startsWith("/main")) {
      return "dashboard";
    }
    if (pathname.startsWith("/admin/users")) {
      return "user-management";
    }
    if (pathname.startsWith("/admin/teams")) {
      return "team-management";
    }
    return "dashboard"; // default
  }, [pathname]);

  // Get sidebar items based on user role
  const sidebarItems = React.useMemo(() => {
    return getSidebarItems(currentUser?.role);
  }, [currentUser?.role]);

  React.useEffect(() => {
    const handleOpenProjectModal = () => {
      openModal("project-create");
    };

    window.addEventListener("openProjectModal", handleOpenProjectModal);

    return () => {
      window.removeEventListener("openProjectModal", handleOpenProjectModal);
    };
  }, [openModal]);

  const isCompact = isCollapsed || isMobile;

  const onToggle = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleSelect = React.useCallback(
    (key: string) => {
      // Find the item with this key
      const findItemByKey = (
        items: SidebarItem[],
        targetKey: string
      ): SidebarItem | null => {
        for (const item of items) {
          if (item.key === targetKey) {
            return item;
          }
          if (item.items) {
            const found = findItemByKey(item.items, targetKey);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedItem = findItemByKey(sidebarItems, key);
      if (selectedItem?.href && selectedItem.href !== "#") {
        router.push(selectedItem.href);
      }
    },
    [router, sidebarItems]
  );
  return (
    <div
      className={cn(
        "relative flex h-[100vh] w-72 flex-col !border-r border-neutral-800/50 py-8 transition-width rounded-none bg-neutral-950/80 backdrop-blur-sm font-display px-4",
        {
          "w-16 items-center px-2 py-6": isCompact,
        }
      )}
    >
      <div
        className={cn("flex items-center gap-3 px-2", {
          "justify-center gap-0": isCompact,
        })}
      >
        <div className="flex h-8 w-8 items-center justify-center text-neutral-400">
          <Icon icon="solar:widget-2-outline" width={24} />
        </div>
        <span
          className={cn("text-sm font-medium text-neutral-300 opacity-100", {
            "w-0 opacity-0": isCompact,
          })}
        >
          Motion Task
        </span>
        {!isMobile && (
          <Button
            isIconOnly
            className="ml-auto hover:bg-neutral-800/50"
            size="sm"
            variant="light"
            onPress={onToggle}
          >
            <Icon
              className={cn(
                "text-neutral-500 transition-transform hover:text-neutral-300",
                {
                  "rotate-180": isCollapsed,
                }
              )}
              icon="solar:double-alt-arrow-left-bold-duotone"
              width={14}
            />
          </Button>
        )}
      </div>
      <Spacer y={6} />
      <div className="flex items-center gap-3 px-2">
        <Avatar
          className="flex-none border-neutral-700"
          size="sm"
          src={user?.image || undefined}
          name={user?.name || "User"}
        />
        <div className={cn("flex max-w-full flex-col", { hidden: isCompact })}>
          <p className="truncate text-sm font-medium text-neutral-300">
            {user?.name || "Guest User"}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {user?.email || "Not signed in"}
          </p>
        </div>
      </div>
      <ScrollShadow className="-mr-4 h-full max-h-full py-4 pr-4">
        <Sidebar
          defaultSelectedKey="dashboard"
          selectedKey={getSelectedKey()}
          isCompact={isCompact}
          items={sidebarItems}
          onSelect={handleSelect}
        />

        {/* Team Management for Admin Users */}
        {currentUser?.role === "admin" && !isCompact && (
          <div className="mt-6">
            <TeamManagementSidebar />
          </div>
        )}
      </ScrollShadow>
      <Spacer y={2} />
      <div
        className={cn("mt-auto flex flex-col", {
          "items-center": isCompact,
        })}
      >
        <Tooltip
          content="Help & Feedback"
          isDisabled={!isCompact}
          placement="right"
        >
          <Button
            fullWidth
            className={cn(
              "justify-start truncate text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 flex",
              {
                "justify-center": isCompact,
              }
            )}
            isIconOnly={isCompact}
            startContent={
              isCompact ? null : (
                <Icon
                  className="flex-none text-neutral-500"
                  icon="solar:info-circle-line-duotone"
                  width={20}
                />
              )
            }
            variant="light"
          >
            {isCompact ? (
              <Icon
                className="text-neutral-500"
                icon="solar:info-circle-line-duotone"
                width={20}
              />
            ) : (
              "Help & Information"
            )}
          </Button>
        </Tooltip>
        <Tooltip content="Log Out" isDisabled={!isCompact} placement="right">
          <Button
            className={cn(
              "justify-start flex text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30",
              {
                "justify-center": isCompact,
              }
            )}
            isIconOnly={isCompact}
            startContent={
              isCompact ? null : (
                <Icon
                  className="flex-none text-neutral-500"
                  icon="solar:logout-2-outline"
                  width={20}
                />
              )
            }
            variant="light"
            onPress={signOut}
          >
            {isCompact ? (
              <Icon
                className="text-neutral-500"
                icon="solar:logout-2-outline"
                width={20}
              />
            ) : (
              "Log Out"
            )}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default SidebarProvider;
