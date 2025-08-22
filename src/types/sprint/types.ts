import { Types } from "mongoose";

export interface Sprint {
  _id: string;
  name: string;
  description?: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: "planned" | "active" | "completed";
  project: {
    _id: string;
    name: string;
    key: string;
  };
  team: {
    _id: string;
    name: string;
  };
  capacity?: number;
  velocity?: number;
  issues: string[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueHierarchy {
  epic: {
    _id: string;
    key: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignee?: {
      _id: string;
      name: string;
      email: string;
    };
    reporter: {
      _id: string;
      name: string;
      email: string;
    };
    storyPoints?: number;
    createdAt: Date;
    updatedAt: Date;
  };
  stories: Array<{
    _id: string;
    key: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    type: "story" | "task" | "bug";
    assignee?: {
      _id: string;
      name: string;
      email: string;
    };
    reporter: {
      _id: string;
      name: string;
      email: string;
    };
    storyPoints?: number;
    subtasks: Array<{
      _id: string;
      key: string;
      title: string;
      status: string;
      priority: string;
      type: string;
      assignee?: {
        _id: string;
        name: string;
        email: string;
      };
    }>;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface CreateSprintData {
  name: string;
  description?: string;
  goal?: string;
  startDate: string;
  endDate: string;
  project: string;
  capacity?: number;
}

export interface UpdateSprintData {
  name?: string;
  description?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status?: "planned" | "active" | "completed";
  capacity?: number;
}
