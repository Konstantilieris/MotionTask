import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import User from "@/models/User";
import Project from "@/models/Project";

interface AuthenticatedRequest extends NextRequest {
  user?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface AuthOptions {
  requireAuth?: boolean;
  roles?: string[];
  projectPermission?: "view" | "edit" | "admin";
}

interface JWTPayload {
  userId: string;
  [key: string]: unknown;
}

/**
 * Authentication and authorization middleware
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authorization = req.headers.get("authorization");
      const token = authorization?.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

      // Check if authentication is required
      if (options.requireAuth !== false && !token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      let user = null;
      if (token) {
        try {
          // Verify JWT token
          const payload = verify(token, process.env.JWT_SECRET!) as JWTPayload;

          // Get user from database
          const userData = await User.findById(payload.userId).select(
            "_id email name role"
          );
          if (!userData) {
            return NextResponse.json(
              { error: "Invalid token" },
              { status: 401 }
            );
          }

          user = {
            _id: (userData._id as { toString: () => string }).toString(),
            email: userData.email,
            name: userData.name,
            role: (userData.role || "member").toString(),
          };
        } catch {
          if (options.requireAuth !== false) {
            return NextResponse.json(
              { error: "Invalid token" },
              { status: 401 }
            );
          }
        }
      }

      // Check role requirements
      if (options.roles && user) {
        if (!options.roles.includes(user.role)) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Check project-level permissions
      if (options.projectPermission && user) {
        const projectId =
          req.nextUrl.searchParams.get("projectId") ||
          extractProjectIdFromPath(req.nextUrl.pathname);

        if (projectId) {
          const hasPermission = await checkProjectPermission(
            user._id,
            projectId,
            options.projectPermission
          );

          if (!hasPermission) {
            return NextResponse.json(
              { error: "Insufficient project permissions" },
              { status: 403 }
            );
          }
        }
      }

      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user || undefined;

      // Call the handler
      return await handler(authenticatedReq);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Extract project ID from URL path
 */
function extractProjectIdFromPath(pathname: string): string | null {
  // Match patterns like /api/projects/:id or /api/issues (with project query)
  const projectMatch = pathname.match(/\/api\/projects\/([^\/]+)/);
  return projectMatch ? projectMatch[1] : null;
}

/**
 * Check if user has permission to access project
 */
async function checkProjectPermission(
  userId: string,
  projectId: string,
  requiredPermission: "view" | "edit" | "admin"
): Promise<boolean> {
  try {
    const project = await Project.findById(projectId)
      .select("members owner isPublic")
      .lean();

    if (!project) {
      return false;
    }

    // Owner has all permissions
    if (project.owner?.toString() === userId) {
      return true;
    }

    // Check if project is public for view permission
    if (requiredPermission === "view" && project.isPublic) {
      return true;
    }

    // Check member permissions
    const member = project.members?.find(
      (m: { user?: unknown; role?: string }) => m.user?.toString() === userId
    );
    if (!member) {
      return false;
    }

    const memberRole = member.role || "viewer";

    // Permission hierarchy: admin > member > viewer
    switch (requiredPermission) {
      case "view":
        return ["viewer", "member", "admin"].includes(memberRole);
      case "edit":
        return ["member", "admin"].includes(memberRole);
      case "admin":
        return memberRole === "admin";
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking project permission:", error);
    return false;
  }
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { requests: number; windowMs: number } = {
    requests: 100,
    windowMs: 60000,
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      // Reset window
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
    } else {
      // Increment count
      current.count++;

      if (current.count > options.requests) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(
                (current.resetTime - now) / 1000
              ).toString(),
            },
          }
        );
      }
    }

    return await handler(req);
  };
}

/**
 * Combined auth and rate limiting middleware
 */
export function withMiddleware(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  authOptions: AuthOptions = {},
  rateLimitOptions?: { requests: number; windowMs: number }
) {
  let wrappedHandler = withAuth(handler, authOptions);

  if (rateLimitOptions) {
    wrappedHandler = withRateLimit(wrappedHandler, rateLimitOptions);
  }

  return wrappedHandler;
}

export type { AuthenticatedRequest, AuthOptions };
