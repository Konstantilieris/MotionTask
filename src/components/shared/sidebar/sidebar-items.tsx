import { Icon } from "@iconify/react";

import { type SidebarItem } from "./sidebar";

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

export const items: SidebarItem[] = [
  {
    key: "dashboard",
    href: "/main",
    icon: "solar:home-2-linear",
    title: "Dashboard",
  },
  {
    key: "projects",
    href: "/projects",
    icon: "solar:widget-2-outline",
    title: "Projects",
    endContent: (
      <Icon
        className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
        icon="solar:add-circle-outline"
        width={18}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // This will be handled by the sidebar
          const event = new CustomEvent("openProjectModal");
          window.dispatchEvent(event);
        }}
      />
    ),
  },
];

// Function to get sidebar items based on user role
export const getSidebarItems = (userRole?: string): SidebarItem[] => {
  const baseItems: SidebarItem[] = [
    {
      key: "overview",
      title: "Overview",
      items: [
        {
          key: "dashboard",
          href: "/main",
          icon: "solar:home-2-linear",
          title: "Dashboard",
        },
        {
          key: "projects",
          href: "/projects",
          icon: "solar:widget-2-outline",
          title: "Projects",
          endContent: (
            <Icon
              className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
              icon="solar:add-circle-outline"
              width={18}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const event = new CustomEvent("openProjectModal");
                window.dispatchEvent(event);
              }}
            />
          ),
        },
      ],
    },
  ];

  // Add admin-specific items
  if (userRole === "admin") {
    baseItems.push({
      key: "administration",
      title: "Administration",
      items: [
        {
          key: "user-management",
          href: "/admin/users",
          icon: "solar:users-group-two-rounded-outline",
          title: "User Management",
        },
        {
          key: "team-management",
          href: "/admin/teams",
          icon: "solar:users-group-rounded-outline",
          title: "Team Management",
        },
      ],
    });
  }

  return baseItems;
};

export const sectionItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Overview",
    items: [
      {
        key: "dashboard",
        href: "/main",
        icon: "solar:home-2-linear",
        title: "Dashboard",
      },
      {
        key: "projects",
        href: "/projects",
        icon: "solar:widget-2-outline",
        title: "Projects",
        endContent: (
          <Icon
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
            icon="solar:add-circle-outline"
            width={18}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const event = new CustomEvent("openProjectModal");
              window.dispatchEvent(event);
            }}
          />
        ),
      },
    ],
  },
];

export const sectionItemsWithTeams: SidebarItem[] = [...sectionItems];

export const brandItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Overview",
    items: [
      {
        key: "dashboard",
        href: "/main",
        icon: "solar:home-2-linear",
        title: "Dashboard",
      },
      {
        key: "projects",
        href: "/projects",
        icon: "solar:widget-2-outline",
        title: "Projects",
        endContent: (
          <Icon
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
            icon="solar:add-circle-outline"
            width={18}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const event = new CustomEvent("openProjectModal");
              window.dispatchEvent(event);
            }}
          />
        ),
      },
    ],
  },
];

export const sectionLongList: SidebarItem[] = [...sectionItems];

export const sectionNestedItems: SidebarItem[] = [
  {
    key: "dashboard",
    href: "/main",
    icon: "solar:home-2-linear",
    title: "Dashboard",
  },
  {
    key: "projects",
    href: "/projects",
    icon: "solar:widget-2-outline",
    title: "Projects",
    endContent: (
      <Icon
        className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
        icon="solar:add-circle-outline"
        width={18}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const event = new CustomEvent("openProjectModal");
          window.dispatchEvent(event);
        }}
      />
    ),
  },
];
