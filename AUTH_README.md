# Motion Task - NextAuth.js Setup

This project has been configured with NextAuth.js for authentication using JWT strategy with refresh tokens.

## Features

- ✅ NextAuth.js with JWT strategy
- ✅ Refresh token implementation
- ✅ Custom sign-in and sign-up pages
- ✅ Route protection middleware
- ✅ Session management
- ✅ Error handling
- ✅ Modern UI with Hero UI components

## Setup Instructions

1. **Install dependencies** (already done):

   ```bash
   npm install next-auth
   ```

2. **Environment variables**:
   Copy the `.env.example` to `.env.local` and update the values:

   ```bash
   cp .env.example .env.local
   ```

   Generate a secure secret:

   ```bash
   openssl rand -base64 32
   ```

   Update `.env.local`:

   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-generated-secret-here
   ```

3. **Test credentials** (for development):
   - Email: `user@example.com`
   - Password: `password`

## Authentication Flow

### Pages

- **Sign In**: `/auth/signin`
- **Sign Up**: `/auth/signup` (demo only, redirects to sign-in)
- **Error**: `/auth/error`

### Protected Routes

- All `/dashboard/*` routes are protected
- Unauthenticated users are redirected to sign-in

### JWT Configuration

- **Access Token**: 15 minutes expiry
- **Refresh Token**: 30 days expiry
- **Session Strategy**: JWT
- **Automatic Token Refresh**: Implemented in callbacks

## File Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth API route
│   ├── auth/
│   │   ├── signin/page.tsx              # Custom sign-in page
│   │   ├── signup/page.tsx              # Custom sign-up page
│   │   └── error/page.tsx               # Error page
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # Protected layout
│   │   └── main/page.tsx                # Dashboard main page
│   └── page.tsx                         # Home page
├── components/
│   └── providers.tsx                    # Session provider
├── lib/
│   └── auth.ts                          # NextAuth configuration
├── hooks/
│   └── useAuth.ts                       # Authentication hooks
├── types/
│   └── next-auth.d.ts                   # TypeScript declarations
└── middleware.ts                        # Route protection
```

## Usage Examples

### Using Authentication in Components

```tsx
import { useAuth } from "@/hooks/useAuth";

export default function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protecting Pages

```tsx
import { useRequireAuth } from "@/hooks/useAuth";

export default function ProtectedPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;

  return <div>Protected content</div>;
}
```

### Server-side Session Access

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ServerComponent() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return <div>Hello, {session.user.name}!</div>;
}
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Production Considerations

1. **Environment Variables**: Use secure, randomly generated secrets
2. **Database Integration**: Replace the in-memory user store with a real database
3. **Password Hashing**: Implement proper password hashing (bcrypt, etc.)
4. **Refresh Token Storage**: Consider storing refresh tokens in httpOnly cookies
5. **Rate Limiting**: Add rate limiting for authentication endpoints
6. **HTTPS**: Ensure HTTPS in production
7. **Session Security**: Configure secure session settings

## Customization

### Adding New Providers

Edit `src/lib/auth.ts` to add additional providers:

```tsx
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    // ... existing providers
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ... rest of config
};
```

### Customizing Token Refresh

Modify the `refreshAccessToken` function in `src/lib/auth.ts` to integrate with your backend token refresh endpoint.

### Custom Error Messages

Update the `errorMessages` object in `src/app/auth/error/page.tsx` to customize error handling.
