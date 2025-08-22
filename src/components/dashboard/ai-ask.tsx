"use client";

import React, { useState } from "react";
import {
  Input,
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Card,
  CardBody,
  Avatar,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AiAsk() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you with project management, finding issues, creating reports, and answering questions about your workspace. What would you like to know?",
      timestamp: new Date(),
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Mock AI response - replace with actual AI integration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateMockResponse(userMessage.content),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI request failed:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (
      input.includes("issue") ||
      input.includes("bug") ||
      input.includes("task")
    ) {
      return "I can help you with issues! Here are some things I can do:\n\n• Find issues by status, assignee, or priority\n• Show overdue or upcoming issues\n• Create new issues with smart defaults\n• Analyze issue patterns and bottlenecks\n\nWhat specific aspect of issue management would you like help with?";
    }

    if (input.includes("sprint") || input.includes("velocity")) {
      return "For sprint management, I can:\n\n• Show current sprint progress and burndown\n• Calculate team velocity trends\n• Identify sprint scope changes\n• Suggest sprint planning improvements\n\nWould you like me to pull up your current sprint metrics?";
    }

    if (input.includes("report") || input.includes("analytics")) {
      return "I can generate various reports for you:\n\n• Sprint retrospective summaries\n• Team performance analytics\n• Issue trend analysis\n• Time tracking reports\n\nWhat type of report would be most helpful right now?";
    }

    if (input.includes("team") || input.includes("member")) {
      return "For team management, I can:\n\n• Show team workload distribution\n• Identify blockers affecting team members\n• Suggest optimal task assignments\n• Track team collaboration patterns\n\nWhat would you like to know about your team?";
    }

    return "That's an interesting question! I can help you with:\n\n• Finding and managing issues\n• Sprint planning and tracking\n• Team analytics and reports\n• Project insights and recommendations\n\nCould you be more specific about what you'd like assistance with?";
  };

  const quickActions = [
    {
      label: "Show my overdue issues",
      icon: "solar:danger-bold",
      color: "danger" as const,
      action: () => setInput("Show me all my overdue issues"),
    },
    {
      label: "Current sprint status",
      icon: "solar:calendar-bold",
      color: "primary" as const,
      action: () => setInput("What's the status of our current sprint?"),
    },
    {
      label: "Team performance this week",
      icon: "solar:chart-bold",
      color: "success" as const,
      action: () => setInput("Show me team performance metrics for this week"),
    },
    {
      label: "Create issue summary",
      icon: "solar:document-add-bold",
      color: "secondary" as const,
      action: () => setInput("Create a summary of recent issues"),
    },
  ];

  return (
    <>
      <div className="relative">
        <Input
          placeholder="Ask AI anything..."
          startContent={
            <Icon
              icon="solar:magic-stick-3-bold"
              className="w-4 h-4 text-purple-500"
            />
          }
          endContent={
            <Button isIconOnly size="sm" variant="light" onPress={onOpen}>
              <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
            </Button>
          }
          className="w-full max-w-sm"
          classNames={{
            input: "text-white",
            inputWrapper: "bg-neutral-800/50 border-neutral-700",
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              onOpen();
            }
          }}
        />
      </div>

      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement="right"
        size="lg"
        classNames={{
          base: "bg-neutral-900 border-l border-neutral-700",
          header: "border-b border-neutral-700",
          body: "p-0",
        }}
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Icon
                  icon="solar:magic-stick-3-bold"
                  className="w-4 h-4 text-white"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <p className="text-sm text-neutral-400">
                  Ask me anything about your workspace
                </p>
              </div>
            </div>
          </DrawerHeader>
          <DrawerBody className="flex flex-col h-full">
            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="p-4 border-b border-neutral-700">
                <p className="text-sm font-medium text-neutral-300 mb-3">
                  Quick Actions
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="bordered"
                      className="justify-start h-auto p-3 border-neutral-700"
                      startContent={
                        <Icon icon={action.icon} className="w-4 h-4" />
                      }
                      onPress={() => {
                        action.action();
                        const syntheticEvent = {
                          preventDefault: () => {},
                        } as React.FormEvent;
                        handleSubmit(syntheticEvent);
                      }}
                    >
                      <span className="text-left text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar
                    size="sm"
                    src={
                      message.type === "user"
                        ? "https://i.pravatar.cc/40?u=user"
                        : undefined
                    }
                    fallback={
                      message.type === "assistant" ? (
                        <Icon
                          icon="solar:magic-stick-3-bold"
                          className="w-4 h-4"
                        />
                      ) : undefined
                    }
                    className={
                      message.type === "assistant"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : ""
                    }
                  />
                  <Card
                    className={`max-w-[80%] ${
                      message.type === "user"
                        ? "bg-primary-500"
                        : "bg-neutral-800"
                    }`}
                  >
                    <CardBody className="p-3">
                      <p className="text-sm whitespace-pre-wrap text-white">
                        {message.content}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </CardBody>
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar
                    size="sm"
                    fallback={
                      <Icon
                        icon="solar:magic-stick-3-bold"
                        className="w-4 h-4"
                      />
                    }
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                  <Card className="bg-neutral-800">
                    <CardBody className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:loading-bold"
                          className="w-4 h-4 animate-spin"
                        />
                        <span className="text-sm text-neutral-400">
                          Thinking...
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-700">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-neutral-800 border-neutral-600",
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  color="primary"
                  isIconOnly
                  isLoading={isLoading}
                  isDisabled={!input.trim()}
                >
                  <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
