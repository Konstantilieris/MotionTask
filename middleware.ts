import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user has a valid token
        if (token) return true;

        // Allow access to auth pages
        if (req.nextUrl.pathname.startsWith("/auth/")) return true;

        // Deny access to protected routes
        return false;
      },
    },
  }
);

export const config = {
  matcher: [
    // Protect dashboard routes
    "/dashboard/:path*",
    // Add other protected routes here
  ],
};
