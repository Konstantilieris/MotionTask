"use client";

import { memo } from "react";
import { Chip } from "@heroui/react";
import { Hash, GitBranch, User, Layers3 } from "lucide-react";
import { SwimlaneType } from "@/types/board/types";

interface SwimlaneGroupHeaderProps {
  group: {
    groupKey: string;
    title: string;
    color?: string;
  };
  swimlane: SwimlaneType;
}

const GroupIcon = memo(({ type }: { type: SwimlaneType }) => {
  switch (type) {
    case "epic":
      return <Hash className="h-4 w-4" />;
    case "parent":
      return <GitBranch className="h-4 w-4" />;
    case "assignee":
      return <User className="h-4 w-4" />;
    default:
      return <Layers3 className="h-4 w-4" />;
  }
});

GroupIcon.displayName = "GroupIcon";

export const SwimlaneGroupHeader = memo<SwimlaneGroupHeaderProps>(
  ({ group, swimlane }) => {
    return (
      <div className="py-2 px-3 bg-neutral-800 rounded-lg border border-neutral-700 sticky top-0 z-10">
        <Chip
          size="sm"
          variant="flat"
          color="primary"
          startContent={<GroupIcon type={swimlane} />}
          className="text-xs font-medium"
        >
          {group.title}
        </Chip>
      </div>
    );
  }
);

SwimlaneGroupHeader.displayName = "SwimlaneGroupHeader";

export default SwimlaneGroupHeader;
