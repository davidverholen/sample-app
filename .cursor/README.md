# Cursor AI Agent Team Configuration

This directory contains the configuration for a comprehensive team of AI agents specialized in building complex Next.js SaaS applications.

## Team Overview

The team consists of **11 specialized AI agents** organized into two levels:

### Leadership Level (Strategic & Planning)
1. **Requirements Engineering Expert** - Gathers, analyzes, and structures requirements. Breaks down features into actionable tasks
2. **Solution Architecture Expert** - Designs high-level system architecture and technical solutions
3. **Technical Lead / Engineering Manager** - Coordinates development efforts, makes technical decisions, ensures code quality

### Development Level (Implementation)
4. **Next.js Frontend Expert** - App Router, Server/Client Components
5. **Backend/API Expert** - API routes, Server Actions, middleware
6. **Database & Schema Expert** - Prisma, migrations, data modeling
7. **Security Expert** - Authentication, authorization, data protection
8. **Testing & QA Expert** - Unit, integration, E2E testing
9. **DevOps & Infrastructure Expert** - Deployment, CI/CD, infrastructure
10. **UI/UX Design System Expert** - Design system, accessibility, UX
11. **Performance Optimization Expert** - Bundle optimization, Core Web Vitals

## Configuration Files

- `team-config.json` - Main team configuration and agent definitions
- `rules/` - Individual agent rule files (`.mdc` format)

## Agent Rule Files

Each agent has a corresponding rule file in the `rules/` directory:

### Leadership Agents
- `requirements-engineering-expert.mdc` - Requirements gathering, task breakdown, delegation
- `solution-architecture-expert.mdc` - System architecture, technical solutions, design patterns
- `technical-lead-expert.mdc` - Technical leadership, code review, team coordination

### Development Agents
- `nextjs-frontend-expert.mdc` - Next.js and React best practices
- `backend-api-expert.mdc` - API routes and Server Actions
- `database-expert.mdc` - Database design and Prisma
- `security-expert.mdc` - Security and authentication
- `testing-qa-expert.mdc` - Testing strategies and QA
- `devops-infrastructure-expert.mdc` - Deployment and infrastructure
- `ui-ux-expert.mdc` - Design system and accessibility
- `performance-expert.mdc` - Performance optimization

## Usage

These agent configurations are automatically applied when working in this project. Each agent provides specialized guidance based on their domain expertise.

### Agent Collaboration & Workflow

**Leadership → Development Flow**:
1. **Requirements Engineering Expert** gathers requirements and breaks down features into tasks
2. **Solution Architecture Expert** designs the technical solution and architecture
3. **Technical Lead** coordinates implementation, assigns tasks to development experts
4. **Development Experts** implement their assigned tasks
5. **Technical Lead** reviews and approves all work

**Cross-Domain Collaboration**:
- Security Expert reviews all authentication flows
- Performance Expert reviews optimization opportunities
- Testing Expert ensures comprehensive test coverage
- UI/UX Expert ensures design system consistency
- All experts collaborate when features span multiple domains

### Priority Rules

- **Technical Lead** has final authority on technical decisions
- **Solution Architecture Expert** has authority on architectural decisions
- Security and Performance experts have priority in their respective domains
- All agents review code changes in their domain before merging
- Conflicts are resolved by Technical Lead with input from relevant experts

## Tech Stack

This configuration is optimized for:
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js / Auth.js
- **Testing**: Jest, React Testing Library, Playwright
- **Deployment**: Vercel / AWS / Docker

## Standards

- **Code Style**: TypeScript strict mode, ESLint, Prettier
- **Git Workflow**: Conventional commits, feature branches, PR reviews
- **Documentation**: JSDoc for functions, README for features
- **Testing**: Minimum 80% code coverage
- **Accessibility**: WCAG 2.1 AA compliance

## Getting Started

1. Ensure Cursor IDE is installed and configured
2. The agent rules are automatically applied based on the `alwaysApply` flag
3. Each agent will provide specialized guidance in their domain
4. Review agent suggestions and collaborate across domains as needed

## Customization

To customize agent behavior:
1. Edit the corresponding `.mdc` file in `rules/`
2. Modify `team-config.json` to adjust agent settings
3. Add or remove agents as needed for your project

## Best Practices

- Let agents collaborate naturally when features span domains
- Review agent suggestions before implementing
- Maintain consistency with established patterns
- Update agent rules as project evolves
- Document any project-specific deviations

