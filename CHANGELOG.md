# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-11-15

### Added

- Git workflow and change management process
- GitHub Actions CI/CD workflows
- Pre-commit hooks with Husky
- Commit message validation
- PR and issue templates
- Security scanning workflows
- Comprehensive QA checks for PRs (lint, type-check, test, build, E2E)
- Test coverage enforcement (80% minimum threshold)
- PR title and branch naming validation
- GitHub Actions usage limits documentation

### Changed

- Optimized GitHub Actions workflows for free tier accounts
- Removed paid GitHub Advanced Security features (Dependency Review, CodeQL)
- Added timeouts to all CI/CD jobs to prevent infinite hangs
- Optimized E2E tests to only install Chromium browser
- Made Codecov upload optional (only if token exists)

### Fixed

- Fixed E2E test homepage title assertion
- Fixed package-lock.json sync issues
- Fixed Jest DOM types for TypeScript
- Fixed CI workflow database service configuration
- Fixed workflow permissions and scopes

## [0.1.0] - 2024-01-01

### Added

- Initial project setup
- Next.js 14 with App Router
- Authentication with NextAuth.js
- Database with Prisma and PostgreSQL
- UI components and design system
- Testing setup (Jest, Playwright)
- Docker configuration

[Unreleased]: https://github.com/your-org/sample-app/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-org/sample-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/sample-app/releases/tag/v0.1.0
