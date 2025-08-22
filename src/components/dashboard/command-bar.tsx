"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Kbd,
  Chip,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/react";

interface SearchResult {
  type: "issue" | "sprint" | "project" | "user" | "doc";
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  url: string;
  avatar?: string;
  status?: string;
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandBar = ({ isOpen, onClose }: CommandBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Search function
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Mock search results - in real app, this would call your search API
      const mockResults: SearchResult[] = [
        {
          type: "issue" as const,
          id: "PROJ-123",
          title: "Implement user authentication",
          subtitle: "In Progress • High Priority",
          icon: "solar:bug-bold",
          url: "/issues/PROJ-123",
          status: "In Progress",
        },
        {
          type: "project" as const,
          id: "proj-1",
          title: "Motion Task Management",
          subtitle: "12 active issues",
          icon: "solar:folder-bold",
          url: "/projects/proj-1",
        },
        {
          type: "sprint" as const,
          id: "sprint-1",
          title: "Sprint 2024-01",
          subtitle: "Active • 5 days remaining",
          icon: "solar:calendar-bold",
          url: "/sprints/sprint-1",
        },
        {
          type: "user" as const,
          id: "user-1",
          title: "John Doe",
          subtitle: "Frontend Developer",
          icon: "solar:user-bold",
          url: "/users/user-1",
          avatar: "https://i.pravatar.cc/40?u=john",
        },
      ].filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            router.push(searchResults[selectedIndex].url);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, router, onClose]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "issue":
        return "primary";
      case "project":
        return "secondary";
      case "sprint":
        return "success";
      case "user":
        return "warning";
      case "doc":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="top"
      classNames={{
        backdrop: "bg-black/50",
        base: "bg-neutral-900 border border-neutral-700",
        header: "border-b border-neutral-700",
        body: "p-0",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:search-bold"
              className="w-5 h-5 text-neutral-400"
            />
            <Input
              placeholder="Search issues, sprints, projects, people, docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="bordered"
              classNames={{
                input: "text-white",
                inputWrapper: "border-transparent bg-transparent shadow-none",
              }}
              autoFocus
            />
            <div className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span className="text-xs text-neutral-400">to navigate</span>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon
                icon="solar:loading-bold"
                className="w-6 h-6 animate-spin text-neutral-400"
              />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-neutral-700">
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-neutral-700"
                      : "hover:bg-neutral-800"
                  }`}
                  onClick={() => {
                    router.push(result.url);
                    onClose();
                  }}
                >
                  {result.type === "user" && result.avatar ? (
                    <Avatar src={result.avatar} size="sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center">
                      <Icon
                        icon={result.icon}
                        className="w-4 h-4 text-neutral-300"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {result.title}
                      </span>
                      <Chip
                        size="sm"
                        color={getTypeColor(result.type)}
                        variant="flat"
                        className="capitalize"
                      >
                        {result.type}
                      </Chip>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-neutral-400 truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>

                  <Icon
                    icon="solar:arrow-right-bold"
                    className="w-4 h-4 text-neutral-500"
                  />
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
              <Icon icon="solar:search-bold" className="w-8 h-8 mb-2" />
              <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Icon icon="solar:history-bold" className="w-4 h-4" />
                <span>Recent searches</span>
              </div>
              <div className="space-y-1">
                {[
                  "authentication bug",
                  "sprint planning",
                  "user dashboard",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer"
                    onClick={() => setSearchQuery(item)}
                  >
                    <Icon
                      icon="solar:clock-bold"
                      className="w-4 h-4 text-neutral-500"
                    />
                    <span className="text-sm text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export function GlobalCommandBar() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);

  return (
    <>
      <Button
        variant="bordered"
        className="w-full max-w-md justify-start gap-2 text-neutral-400 border-neutral-700 bg-neutral-800/50"
        onPress={onOpen}
      >
        <Icon icon="solar:search-bold" className="w-4 h-4" />
        <span>Search everything...</span>
        <div className="ml-auto flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </Button>

      <CommandBar isOpen={isOpen} onClose={onClose} />
    </>
  );
}
