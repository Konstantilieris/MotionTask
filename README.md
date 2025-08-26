# MotionTask

> **Modern Project Management Platform** - A comprehensive task management and team collaboration solution built with Next.js, TypeScript, and MongoDB.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.18-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)

---

## 🚀 Features

### 📊 **Dashboard & Analytics**

- Real-time project metrics and team performance analytics
- Interactive charts and data visualizations with Recharts
- Customizable dashboard widgets and layout
- AI-powered insights and recommendations (coming soon)

### 🎯 **Project Management**

- Multi-project workspace with role-based access control
- Kanban boards with drag-and-drop functionality
- Sprint planning and velocity tracking
- Issue management with custom fields and workflows

### 👥 **Team Collaboration**

- Team management with granular permissions
- Real-time notifications and activity feeds
- Comment system with mentions and threading
- File attachments and document sharing

### 🔐 **Authentication & Security**

- NextAuth.js integration with multiple providers
- Role-based authorization (Admin, Member, Viewer)
- Secure API routes with middleware protection
- Session management and automatic token refresh

### 🎨 **Modern UI/UX**

- Dark mode with glassmorphism effects
- Responsive design for all screen sizes
- HeroUI component library integration
- Smooth animations with Framer Motion

---

## 🛠️ Technology Stack

### **Frontend**

- **Next.js 15.4.5** - React framework with App Router
- **React 19.1.0** - UI component library
- **TypeScript 5.0** - Type-safe development
- **Tailwind CSS 4.0** - Utility-first styling
- **HeroUI** - Premium component library
- **Framer Motion** - Animation library

### **Backend**

- **Next.js API Routes** - Server-side functionality
- **MongoDB 6.18** - NoSQL database
- **Mongoose 8.17** - MongoDB object modeling
- **NextAuth.js 4.24** - Authentication solution
- **Pusher** - Real-time communication

### **Development Tools**

- **ESLint** - Code linting and formatting
- **Zod** - Schema validation
- **React Hook Form** - Form management
- **Zustand** - State management
- **Date-fns** - Date manipulation

---

## 🏃‍♂️ Quick Start

### Prerequisites

- **Node.js** 18.0 or later
- **npm** or **yarn** package manager
- **MongoDB** database (local or cloud)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Konstantilieris/MotionTask.git
   cd MotionTask
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   Create a `.env.local` file in the root directory:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/motiontask

   # NextAuth Configuration
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # Pusher (Real-time features)
   NEXT_PUBLIC_PUSHER_APP_ID=your-pusher-app-id
   NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
   PUSHER_SECRET=your-pusher-secret
   NEXT_PUBLIC_PUSHER_CLUSTER=your-cluster

   # Optional: OAuth Providers
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes (protected)
│   │   ├── admin/         # Admin-only pages
│   │   ├── main/          # Main dashboard
│   │   └── projects/      # Project management
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── projects/      # Project CRUD operations
│   │   ├── issues/        # Issue management
│   │   └── teams/         # Team management
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   ├── shared/            # Shared UI components
│   ├── board/             # Kanban board components
│   └── ui/                # Base UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── api/               # API client functions
│   ├── stores/            # Zustand state stores
│   └── validation/        # Zod schemas
├── models/                # MongoDB/Mongoose models
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:seed      # Seed database with sample data (if available)
npm run db:migrate   # Run database migrations (if available)
```

---

## 📚 API Documentation

The platform provides comprehensive REST API endpoints for all major functionalities:

### **Authentication**

- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### **Projects**

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### **Issues**

- `GET /api/issues` - List issues with filtering
- `POST /api/issues` - Create issue
- `PATCH /api/issues/[id]` - Update issue
- `GET /api/issues/[key]/activities` - Issue activity log

### **Teams**

- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/[id]/members` - Add team member
- `DELETE /api/teams/[id]/members/[memberId]` - Remove member

> 📖 **Complete API documentation** available in [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

---

## 🎨 UI Components

MotionTask uses a modern design system built on top of HeroUI:

### **Dashboard Components**

- **Command Bar** - Quick navigation and search
- **Analytics Cards** - Real-time metrics display
- **Activity Feed** - Team activity timeline
- **Quick Actions** - Contextual action buttons

### **Board Components**

- **Kanban Board** - Drag-and-drop task management
- **Issue Cards** - Rich issue display with metadata
- **Filter System** - Advanced filtering and search
- **Swimlanes** - Grouped issue organization

### **Shared Components**

- **Modal System** - Consistent modal patterns
- **Form Controls** - Validated form inputs
- **Toast Notifications** - User feedback system
- **Loading States** - Skeleton and spinner components

---

## 🔐 Authentication Flow

MotionTask implements a secure authentication system:

1. **Registration/Login** - Users can register or login with email/password
2. **OAuth Integration** - Support for Google, GitHub, and other providers
3. **Role Assignment** - Automatic role assignment based on organization rules
4. **Session Management** - Secure JWT-based session handling
5. **Route Protection** - Middleware-based route protection

### **User Roles**

- **Admin** - Full system access and user management
- **Member** - Project participation and issue management
- **Viewer** - Read-only access to assigned projects

---

## 📊 Database Schema

MotionTask uses MongoDB with Mongoose for data modeling:

### **Core Models**

- **User** - User accounts and profiles
- **Team** - Team organization and membership
- **Project** - Project metadata and settings
- **Issue** - Tasks, bugs, and feature requests
- **Sprint** - Sprint planning and tracking
- **Activity** - Audit log and activity tracking

### **Relationships**

- Users belong to Teams
- Projects are assigned to Teams
- Issues belong to Projects
- Activities track changes across all entities

---

## 🚧 Development Roadmap

### **Phase 1: Core Platform** ✅

- [x] User authentication and authorization
- [x] Project and team management
- [x] Issue tracking and kanban boards
- [x] Basic dashboard and analytics

### **Phase 2: Advanced Features** 🚧

- [ ] Real-time collaboration with Pusher
- [ ] Advanced reporting and analytics
- [ ] File attachments and document management
- [ ] Time tracking and billing

### **Phase 3: AI Integration** 📋

- [ ] AI-powered project insights
- [ ] Automated task prioritization
- [ ] Smart notifications and recommendations
- [ ] Natural language query interface

### **Phase 4: Mobile & Desktop** 📋

- [ ] React Native mobile app
- [ ] Electron desktop application
- [ ] Offline synchronization
- [ ] Push notifications

---

## 🤝 Contributing

We welcome contributions to MotionTask! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Follow the coding standards** - Use TypeScript, ESLint, and Prettier
3. **Write tests** for new features and bug fixes
4. **Update documentation** for API changes
5. **Submit a pull request** with a clear description

### **Development Guidelines**

- Use semantic commit messages (`feat:`, `fix:`, `docs:`, etc.)
- Follow the existing folder structure and naming conventions
- Ensure all TypeScript types are properly defined
- Test your changes across different screen sizes

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Konstantinos Lieris**

- GitHub: [@Konstantilieris](https://github.com/Konstantilieris)
- LinkedIn: [Your LinkedIn Profile]
- Email: [your.email@example.com]

---

## 🙏 Acknowledgments

- **HeroUI** - For the beautiful component library
- **Next.js Team** - For the amazing React framework
- **MongoDB** - For the flexible NoSQL database
- **Vercel** - For seamless deployment and hosting

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

[Report Bug](https://github.com/Konstantilieris/MotionTask/issues) • [Request Feature](https://github.com/Konstantilieris/MotionTask/issues) • [Documentation](./API_DOCUMENTATION.md)

</div>
