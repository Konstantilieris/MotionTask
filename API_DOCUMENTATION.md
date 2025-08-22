# API Routes Documentation

This document outlines all the available API routes for the Motion Task management system.

## Authentication

### POST /api/auth/signup

Register a new user account.

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "member",
    "team": "team-id"
  }
}
```

### NextAuth.js Routes

- `POST/GET /api/auth/[...nextauth]` - NextAuth.js authentication endpoints

## Users

### GET /api/users

Get all users (admin only).

**Response:**

```json
{
  "users": [
    {
      "_id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "team": {
        "name": "Development Team"
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/users

Create a new user (admin only).

**Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "teamId": "optional-team-id"
}
```

### GET /api/users/[id]

Get user by ID. Users can view their own profile, admins can view any.

### PUT /api/users/[id]

Update user profile. Users can update their own, admins can update any.

**Body:**

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### DELETE /api/users/[id]

Delete user (admin only, cannot delete self).

## Teams

### GET /api/teams

Get all teams (admin) or user's team (regular users).

**Response:**

```json
{
  "teams": [
    {
      "_id": "team-id",
      "name": "Development Team",
      "slug": "development-team",
      "description": "Main development team",
      "members": [
        {
          "_id": "user-id",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "member"
        }
      ]
    }
  ]
}
```

### POST /api/teams

Create a new team (admin only).

**Body:**

```json
{
  "name": "Development Team",
  "description": "Main development team"
}
```

### GET /api/teams/[id]

Get team by ID. Users can view their own team, admins can view any.

### PUT /api/teams/[id]

Update team (admin only).

**Body:**

```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "defaultRole": "member"
}
```

### DELETE /api/teams/[id]

Delete team (admin only, cannot delete default team).

### POST /api/teams/[id]/members

Add member to team (admin only).

**Body:**

```json
{
  "userId": "user-id-to-add"
}
```

### DELETE /api/teams/[id]/members

Remove member from team (admin only).

**Body:**

```json
{
  "userId": "user-id-to-remove"
}
```

## Projects

### GET /api/projects

Get all projects filtered by team access.

**Response:**

```json
{
  "projects": [
    {
      "_id": "project-id",
      "name": "Website Redesign",
      "key": "WR",
      "description": "Complete redesign of company website",
      "status": "in-progress",
      "priority": "high",
      "team": {
        "_id": "team-id",
        "name": "Development Team",
        "slug": "development-team"
      },
      "createdBy": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/projects

Create a new project (admin and members only).

**Body:**

```json
{
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "status": "planning",
  "priority": "high"
}
```

**Response:**

```json
{
  "message": "Project created successfully",
  "project": {
    "_id": "project-id",
    "name": "Website Redesign",
    "key": "WR",
    "description": "Complete redesign of company website",
    "status": "planning",
    "priority": "high",
    "team": {
      "name": "Development Team",
      "slug": "development-team"
    },
    "createdBy": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### GET /api/projects/[id]

Get project by ID (team access required).

### PUT /api/projects/[id]

Update project (admin and members only).

**Body:**

```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium"
}
```

### DELETE /api/projects/[id]

Delete project (admin and members only).

## Issues

### GET /api/issues

Get all issues with optional filters.

**Query Parameters:**

- `project` - Filter by project ID
- `status` - Filter by status (backlog, todo, in-progress, done)
- `priority` - Filter by priority (low, medium, high, critical)
- `assignee` - Filter by assignee user ID

**Response:**

```json
{
  "issues": [
    {
      "_id": "issue-id",
      "title": "Fix login bug",
      "key": "WR-123",
      "description": "Users cannot log in with email",
      "type": "bug",
      "status": "todo",
      "priority": "high",
      "position": 0,
      "storyPoints": 3,
      "issueNumber": 123,
      "project": {
        "_id": "project-id",
        "name": "Website Redesign",
        "key": "WR"
      },
      "assignee": {
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "reporter": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "labels": ["frontend", "urgent"],
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/issues

Create a new issue (admin and members only).

**Body:**

```json
{
  "title": "Fix login bug",
  "description": "Users cannot log in with email",
  "type": "bug",
  "status": "todo",
  "priority": "high",
  "projectId": "project-id",
  "assigneeId": "user-id",
  "storyPoints": 3,
  "labels": ["frontend", "urgent"]
}
```

**Response:**

```json
{
  "message": "Issue created successfully",
  "issue": {
    "_id": "issue-id",
    "title": "Fix login bug",
    "key": "WR-123",
    "description": "Users cannot log in with email",
    "type": "bug",
    "status": "todo",
    "priority": "high",
    "issueNumber": 123,
    "project": {
      "name": "Website Redesign",
      "key": "WR"
    },
    "assignee": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "reporter": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### GET /api/issues/[id]

Get issue by ID (team access required).

### PUT /api/issues/[id]

Update issue (admin and members only).

**Body:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium",
  "assignee": "new-assignee-id",
  "storyPoints": 5,
  "labels": ["backend"],
  "position": 2
}
```

### DELETE /api/issues/[id]

Delete issue (admin and members only).

## Comments

### GET /api/comments

Get comments for an issue.

**Query Parameters:**

- `issue` - Issue ID (required)

**Response:**

```json
{
  "comments": [
    {
      "_id": "comment-id",
      "body": "This looks good to me!",
      "issue": "issue-id",
      "author": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "parent": null,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/comments

Create a new comment (admin and members only).

**Body:**

```json
{
  "body": "This looks good to me!",
  "issueId": "issue-id",
  "parentId": "optional-parent-comment-id"
}
```

### GET /api/comments/[id]

Get comment by ID (team access required).

### PUT /api/comments/[id]

Update comment (author or admin only).

**Body:**

```json
{
  "body": "Updated comment text"
}
```

### DELETE /api/comments/[id]

Delete comment (author or admin only).

## Role-Based Access Control

### Admin

- Full access to all resources across all teams
- Can manage users, teams, projects, issues, and comments
- Can create and delete teams
- Can assign users to teams
- Can view and modify any project or issue

### Member

- Can view and manage their team's projects and issues
- Can create projects, issues, and comments within their team
- Can update their own profile
- Cannot manage users or teams
- Cannot access other teams' data

### Viewer

- Read-only access to their team's projects and issues
- Can view comments but cannot create them
- Can update their own profile
- Cannot create or modify projects or issues
- Cannot access other teams' data

## Data Models

### Issue Statuses

- `backlog` - Issue is in the backlog
- `todo` - Issue is ready to be worked on
- `in-progress` - Issue is currently being worked on
- `done` - Issue is completed

### Issue Types

- `task` - General task
- `bug` - Bug report
- `story` - User story
- `epic` - Large feature or collection of stories

### Issue Priorities

- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `critical` - Critical priority

### Project Statuses

- `planning` - Project is in planning phase
- `in-progress` - Project is actively being worked on
- `completed` - Project is completed
- `on-hold` - Project is temporarily paused

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:

- `400` - Bad Request (missing or invalid data)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Authentication

Most endpoints require authentication via NextAuth.js session. Include the session cookie in requests.

For API testing, you can:

1. Sign in through the web interface at `/auth/signin`
2. Use the session cookie for API requests
3. Or implement API key authentication for server-to-server communication

## Rate Limiting

Currently no rate limiting is implemented, but consider adding it for production use.

## WebSocket Support

For real-time updates (like live kanban board changes), consider implementing WebSocket support using libraries like Pusher or Socket.io.

## File Uploads

File upload endpoints for issue attachments can be added using services like AWS S3 or Cloudinary.

## Search

Advanced search capabilities can be implemented using:

- Database full-text search
- Elasticsearch for complex queries
- Simple text matching for basic search
