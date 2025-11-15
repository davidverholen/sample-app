# Next.js SaaS Application

A modern, production-ready Next.js SaaS application built with TypeScript, Prisma, and NextAuth.js.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js / Auth.js
- **State Management**: Zustand / React Context
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your database URL and NextAuth secret:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sample_app?schema=public"
NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or create a migration (production)
npm run db:migrate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API routes
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── features/          # Feature-specific components
├── lib/                   # Utility functions and configurations
│   ├── prisma.ts          # Prisma client instance
│   ├── auth.ts            # NextAuth configuration
│   └── utils.ts           # Helper functions
├── prisma/                # Prisma schema and migrations
│   └── schema.prisma      # Database schema
├── e2e/                   # End-to-end tests (Playwright)
├── __tests__/             # Unit and integration tests
└── public/                # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run format` - Format code with Prettier

## Development Guidelines

### Git Workflow

This project follows a strict Git workflow with automated enforcement. See the [Git Workflow Documentation](./docs/GIT_WORKFLOW.md) for complete details.

**Quick Reference**:
- **Branching**: `main` (production), `develop` (staging), `feature/*`, `bugfix/*`, `hotfix/*`, `release/*`
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/) format
- **PRs**: Required for all changes, must pass CI checks
- **Releases**: Semantic versioning with automated release workflow

**Setup**:
```bash
npm install  # Installs Husky git hooks
git config commit.template .gitmessage  # Configure commit template
```

See [Git Setup Guide](./docs/GIT_SETUP.md) for detailed setup instructions.

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for code formatting
- Conventional commits for git messages (enforced via git hooks)

### Testing

- Minimum 80% code coverage required
- Unit tests for utilities and components
- Integration tests for API routes and Server Actions
- E2E tests for critical user flows

### Architecture

- Server Components by default
- Client Components only when needed (use `"use client"`)
- Server Actions for mutations
- API routes for external integrations
- Prisma for type-safe database access

## Next Steps

1. Set up authentication with NextAuth.js
2. Create your database models in `prisma/schema.prisma`
3. Build your UI components in `components/ui/`
4. Implement your features following the App Router patterns
5. Add tests for your features
6. Deploy to Vercel or your preferred platform

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

