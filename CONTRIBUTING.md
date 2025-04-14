
# Contributing to CatchAttack

Thank you for considering contributing to CatchAttack! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/catchattack-beta.git`
3. Set up the development environment as described in the README.md
4. Create a new branch for your changes

## Development Process

### Branching Strategy

We use a simplified Git workflow:

- `main`: The production branch. Always stable.
- `develop`: Development branch where features are integrated.
- Feature branches: Created from `develop` for new features or fixes.

Name your branches with prefixes:
- `feature/` for new features
- `fix/` for bug fixes
- `refactor/` for code refactoring
- `docs/` for documentation changes

Example: `feature/siem-integration` or `fix/rule-validation`

### Commit Messages

Write clear, concise commit messages following these guidelines:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

Example:
```
Add SIEM connection validation

This adds validation for SIEM platform connections to prevent failed deployments.
Fixes #123
```

### Pull Requests

1. Update your feature branch with the latest changes from `develop`
2. Push your branch to your fork
3. Create a pull request from your branch to the `develop` branch
4. Fill in the PR template with relevant information
5. Request a review from maintainers
6. Address any feedback from reviews

## Coding Standards

- **TypeScript**: Follow TypeScript best practices
- **React**: Use functional components with hooks
- **ESLint/Prettier**: Ensure your code passes linting checks

Key guidelines:
- Use meaningful variable and function names
- Document complex functions with JSDoc comments
- Keep components small and focused
- Follow the project's existing patterns and conventions
- Use proper types and avoid `any` whenever possible

## Testing

All new features and bug fixes should include tests:

- Unit tests for utilities and services
- Component tests for UI components
- Integration tests for complex workflows

Run tests before submitting a PR:
```bash
npm test
```

## Documentation

Update documentation when adding or modifying features:

- Update relevant README sections
- Add JSDoc comments to functions and components
- Create or update documentation files in the `docs` folder
- Include examples for new features

## Issue Reporting

When reporting issues:

1. Check existing issues to avoid duplicates
2. Use the issue template provided
3. Include detailed steps to reproduce the issue
4. Include relevant environment information
5. Add screenshots or examples when possible

Thank you for contributing to CatchAttack!
